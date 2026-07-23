import fsExtra from "fs-extra";
import logger from "firebase-functions/logger";

import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { resolve, normalize, relative, dirname, join } from "path";
import { stringify as yamlStringify } from "yaml";
import { OutputBundleOptions, OutputPaths, buildManifestSchema } from "./interface.js";
import { createRequire } from "node:module";
import { parse as parseYaml } from "yaml";
import stripAnsi from "strip-ansi";
import {
  BuildOptions,
  OutputBundleConfig,
  EnvVarConfig,
  Metadata,
  Availability,
  updateOrCreateGitignore,
} from "@apphosting/common";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { writeFile, move, readJson, mkdir, copyFile, readFileSync, existsSync, ensureDir } =
  fsExtra;

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SIMPLE_SERVER_FILE_PATH = join(__dirname, "simple-server", "bundled_server.mjs");

export const ALLOWED_BUILDERS = [
  "@angular-devkit/build-angular:application",
  "@angular/build:application",
  "@analogjs/platform:vite",
];

/**
 * Check if the following build conditions are satisfied for the workspace:
 * - The workspace does not contain multiple angular projects.
 * - The angular project must be using the application builder.
 */
export async function checkBuildConditions(opts: BuildOptions): Promise<void> {
  // Nx uses a project.json file in lieu of an angular.json file, so if the app is in an Nx workspace,
  // we check if Nx's project.json configures the build to use the Angular application builder.
  if (opts.buildCommand === "nx") {
    const output = execSync(`npx nx show project ${opts.projectName}`);
    const projectJson = JSON.parse(output.toString());
    const builder = projectJson.targets.build.executor;
    if (!ALLOWED_BUILDERS.includes(builder)) {
      throw new Error(
        `Currently, only the following builders are supported: ${ALLOWED_BUILDERS.join(",")}.`,
      );
    }
    return;
  }

  let angularBuilder = "";
  // dynamically load Angular so this can be used in an NPX context
  const angularCorePath = require.resolve("@angular/core", { paths: [process.cwd()] });
  try {
    // Note: we assume that the user's app has @angular-devkit/core in their node_modules/
    // because we expect them to have @angular-devkit/build-angular as a dependency which
    // pulls in @angular-devkit/core as a dependency. However this assumption may not hold
    // due to tree shaking.
    const { NodeJsAsyncHost }: typeof import("@angular-devkit/core/node") = await import(
      require.resolve("@angular-devkit/core/node", {
        paths: [process.cwd(), angularCorePath],
      })
    );
    const { workspaces }: typeof import("@angular-devkit/core") = await import(
      require.resolve("@angular-devkit/core", {
        paths: [process.cwd(), angularCorePath],
      })
    );
    const host = workspaces.createWorkspaceHost(new NodeJsAsyncHost());
    const { workspace } = await workspaces.readWorkspace(opts.projectDirectory, host);

    const apps: string[] = [];
    workspace.projects.forEach((value, key) => {
      if (value.extensions.projectType === "application") apps.push(key);
    });
    const project = apps[0];
    if (apps.length > 1 || !project) {
      throw new Error("Unable to determine the application to deploy");
    }

    const workspaceProject = workspace.projects.get(project);
    if (!workspaceProject) {
      throw new Error(`No project ${project} found.`);
    }

    const target = "build";
    if (!workspaceProject.targets.has(target)) throw new Error("Could not find build target.");

    const { builder } = workspaceProject.targets.get(target)!;
    angularBuilder = builder;
  } catch (error) {
    logger.debug("failed to determine angular builder from the workspace api: ", error);
    try {
      const root = process.cwd();
      const angularJSON = JSON.parse(readFileSync(join(root, "angular.json")).toString());
      const apps: string[] = [];
      Object.keys(angularJSON.projects).forEach((projectName) => {
        const project = angularJSON.projects[projectName];
        if (project["projectType"] === "application") apps.push(projectName);
      });
      const project = apps[0];
      if (apps.length > 1 || !project)
        throw new Error("Unable to determine the application to deploy");
      angularBuilder = angularJSON.projects[project].architect.build.builder;
    } catch (error) {
      logger.debug("failed to determine angular builder from parsing angular.json: ", error);
    }
  }

  if (angularBuilder !== "") {
    if (!ALLOWED_BUILDERS.includes(angularBuilder)) {
      throw new Error(
        `Currently, only the following builders are supported: ${ALLOWED_BUILDERS.join(",")}.`,
      );
    }
  }
  // This is just a validation step and our methods for validation are flakey. If we failed to extract
  // the angular builder for validation, the build will continue. It may fail further down the line
  // but the failure reason should be non-ambigious.
}

// Populate file or directory paths we need for generating output directory
export function populateOutputBundleOptions(outputPaths: OutputPaths): OutputBundleOptions {
  const outputBundleDir = resolve(".apphosting");

  const baseDirectory = fileURLToPath(outputPaths["root"]);
  const browserRelativePath = relative(baseDirectory, fileURLToPath(outputPaths["browser"]));
  let serverRelativePath = "server";
  let needsServerGenerated = true;
  if (outputPaths["server"]) {
    serverRelativePath = relative(baseDirectory, fileURLToPath(outputPaths["server"]));
    needsServerGenerated = false;
  }
  return {
    bundleYamlPath: resolve(outputBundleDir, "bundle.yaml"),
    outputDirectoryBasePath: outputBundleDir,
    serverFilePath: resolve(baseDirectory, serverRelativePath, "server.mjs"),
    browserDirectory: resolve(baseDirectory, browserRelativePath),
    needsServerGenerated,
  };
}

export function parseOutputBundleOptions(buildOutput: string): OutputBundleOptions {
  const strippedManifest = extractManifestOutput(buildOutput);
  // TODO: add functional tests that test this flow
  let parsedManifest;
  try {
    parsedManifest = JSON.parse(strippedManifest.replace(/[\r\n]+/g, "")) as string;
  } catch (error) {
    throw new Error(`Failed to parse build output manifest: ${error}`);
  }
  const manifest = buildManifestSchema.parse(parsedManifest);
  if (manifest["errors"].length > 0) {
    // errors when extracting manifest
    manifest.errors.forEach((error) => {
      logger.error(error);
    });
  }
  if (manifest["warnings"].length > 0) {
    // warnings when extracting manifest
    manifest.warnings.forEach((warning) => {
      logger.info(warning);
    });
  }
  return populateOutputBundleOptions(manifest["outputPaths"]);
}

/**
 * Extracts the build manifest from the build command's console output.
 * N.B. Unfortunately, there is currently no consistent way to suppress extraneous default output from the task
 * runners of monorepo tools such as Nx (i.e. using the --silent flag for npm scripts). As a result, we must
 * temporarily resort to "cleaning" the output of executing the Angular application builder in a monorepo's tooling
 * context, in order to extract the build manifest. This method is a potentially flaky stopgap until we can find a
 * more consistent and resilient strategy for reading the output.
 */
function extractManifestOutput(output: string): string {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1 || start > end) {
    throw new Error(`Failed to find valid JSON object from build output: ${output}`);
  }
  // Clean the raw json string by removing the "web:build:" prefixes for a Turbo build
  const prefixRegex = /\n?web:build:/g;
  const cleanedOutput = output.substring(start, end + 1).replace(prefixRegex, "");
  return stripAnsi(cleanedOutput);
}

/**
 * Create metadata needed for outputting adapter and framework metrics in bundle.yaml.
 */
export function createMetadata(angularVersion: string): Metadata {
  const packageJsonPath = `${__dirname}/../package.json`;
  if (!existsSync(packageJsonPath)) {
    throw new Error(`Angular adapter package.json file does not exist at ${packageJsonPath}`);
  }
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  return {
    adapterPackageName: packageJson.name,
    adapterVersion: packageJson.version,
    framework: "angular",
    frameworkVersion: angularVersion,
  };
}

/**
 * Generate the bundle.yaml
 */
export async function generateBuildOutput(
  cwd: string,
  outputBundleOptions: OutputBundleOptions,
  angularVersion: string,
): Promise<void> {
  if (outputBundleOptions.needsServerGenerated) {
    await generateServer(outputBundleOptions);
  }
  await generateBundleYaml(outputBundleOptions, cwd, angularVersion);
  // generateBundleYaml creates the output directory (if it does not already exist).
  // We need to make sure it is gitignored.
  const normalizedBundleDir = normalize(relative(cwd, outputBundleOptions.outputDirectoryBasePath));
  updateOrCreateGitignore(cwd, [`/${normalizedBundleDir}/`]);
}

// add environment variable to bundle.yaml if needed for specific versions
function generateEnvVars(angularVersion: string): EnvVarConfig[] {
  const runtimeEnvVars: EnvVarConfig[] = [];
  // add env var to solve angular port issue, existing only for Angular v17.3.2 (b/332896115)
  if (angularVersion === "17.3.2") {
    const ssrPortEnvVar: EnvVarConfig = {
      variable: "SSR_PORT",
      value: "8080",
      availability: [Availability.Runtime],
    };
    runtimeEnvVars.push(ssrPortEnvVar);
  }
  return runtimeEnvVars;
}

// Generate bundle.yaml
async function generateBundleYaml(
  opts: OutputBundleOptions,
  cwd: string,
  angularVersion: string,
): Promise<void> {
  await ensureDir(dirname(opts.bundleYamlPath));
  const outputBundle: OutputBundleConfig = {
    version: "v1",
    runConfig: {
      runCommand: `node ${normalize(relative(cwd, opts.serverFilePath))}`,
      environmentVariables: generateEnvVars(angularVersion),
    },
    metadata: createMetadata(angularVersion),
  };
  await writeFile(opts.bundleYamlPath, yamlStringify(outputBundle));
}

// Generate server file for CSR apps
async function generateServer(outputBundleOptions: OutputBundleOptions): Promise<void> {
  await mkdir(dirname(outputBundleOptions.serverFilePath));
  await copyFile(SIMPLE_SERVER_FILE_PATH, outputBundleOptions.serverFilePath);
}

// Validate output directory includes all necessary parts
export async function validateOutputDirectory(
  outputBundleOptions: OutputBundleOptions,
): Promise<void> {
  if (
    !(await fsExtra.exists(outputBundleOptions.browserDirectory)) ||
    !(await fsExtra.exists(outputBundleOptions.serverFilePath)) ||
    !(await fsExtra.exists(outputBundleOptions.bundleYamlPath))
  ) {
    throw new Error("Output directory is not of expected structure");
  }
}

export const isMain = (meta: ImportMeta) => {
  if (!meta) return false;
  if (!process.argv[1]) return false;
  return process.argv[1] === fileURLToPath(meta.url);
};

export const metaFrameworkOutputBundleExists = () => {
  const outputBundleDir = resolve(".apphosting");
  const bundleYamlPath = join(outputBundleDir, "bundle.yaml");
  if (existsSync(bundleYamlPath)) {
    try {
      const bundle = parseYaml(readFileSync(bundleYamlPath, "utf8"));
      if (bundle?.metadata?.framework && bundle.metadata.framework !== "angular") {
        return true;
      }
    } catch (e) {
      logger.debug("Failed to parse bundle.yaml, assuming it can be overwritten", e);
    }
  }
  return false;
};
