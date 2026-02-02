import fsExtra from "fs-extra";
import semVer from "semver";
import { createRequire } from "node:module";
import { join, dirname, relative, normalize } from "path";
import { fileURLToPath } from "url";
import { stringify as yamlStringify } from "yaml";

import { PHASE_PRODUCTION_BUILD, ROUTES_MANIFEST, MIDDLEWARE_MANIFEST } from "./constants.js";
import {
  OutputBundleOptions,
  RoutesManifest,
  AdapterMetadata,
  MiddlewareManifest,
} from "./interfaces.js";
import { NextConfigComplete } from "next/dist/server/config-shared.js";
import { OutputBundleConfig, updateOrCreateGitignore } from "@apphosting/common";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { copy, exists, writeFile, readJson, readdir, readFileSync, existsSync, ensureDir } =
  fsExtra;
export const { satisfies } = semVer;

const SAFE_NEXTJS_VERSIONS =
  ">=16.1.0 || ~16.0.7 || ~v15.5.7 || ~v15.4.8 || ~v15.3.6 || ~v15.2.6 || ~v15.1.9 || ~v15.0.5 || <14.3.0-canary.77";

export function checkNextJSVersion(version: string | undefined) {
  if (!version) {
    return;
  }
  if (!satisfies(version, SAFE_NEXTJS_VERSIONS)) {
    throw new Error(
      `CVE-2025-55182: Vulnerable Next version ${version} detected. Deployment blocked. Update your app's dependencies to a patched Next.js version and redeploy: https://nextjs.org/blog/CVE-2025-66478#fixed-versions`,
    );
  }
}

// Loads the user's next.config.js file.
export async function loadConfig(root: string, projectRoot: string): Promise<NextConfigComplete> {
  // createRequire() gives us access to Node's CommonJS implementation of require.resolve()
  // (https://nodejs.org/api/module.html#modulecreaterequirefilename).
  // We use the require.resolve() resolution algorithm to get the path to the next config module,
  // which may reside in the node_modules folder at a higher level in the directory structure
  // (e.g. for monorepo projects).
  // Note that ESM has an equivalent (https://nodejs.org/api/esm.html#importmetaresolvespecifier),
  // but the feature is still experimental.
  const require = createRequire(import.meta.url);
  const configPath = require.resolve("next/dist/server/config.js", { paths: [projectRoot] });
  // dynamically load NextJS so this can be used in an NPX context
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { default: nextServerConfig }: { default: typeof import("next/dist/server/config.js") } =
    await import(configPath);

  const loadConfig = nextServerConfig.default;
  return await loadConfig(PHASE_PRODUCTION_BUILD, root);
}

/**
 * Loads the route manifest from the standalone directory.
 * @param standalonePath The path to the standalone directory.
 * @param distDir The path to the dist directory.
 * @return The route manifest.
 */
export function loadRouteManifest(standalonePath: string, distDir: string): RoutesManifest {
  const manifestPath = join(standalonePath, distDir, ROUTES_MANIFEST);
  const json = readFileSync(manifestPath, "utf-8");
  return JSON.parse(json) as RoutesManifest;
}

/**
 * Loads the middleware manifest from the standalone directory.
 * @param standalonePath The path to the standalone directory.
 * @param distDir The path to the dist directory.
 * @return The middleware manifest.
 */
export function loadMiddlewareManifest(
  standalonePath: string,
  distDir: string,
): MiddlewareManifest {
  const manifestPath = join(standalonePath, distDir, `server/${MIDDLEWARE_MANIFEST}`);
  const json = readFileSync(manifestPath, "utf-8");
  return JSON.parse(json) as MiddlewareManifest;
}

/**
 * Writes the route manifest to the standalone directory.
 * @param standalonePath The path to the standalone directory.
 * @param distDir The path to the dist directory.
 * @param customManifest The route manifest to write.
 */
export async function writeRouteManifest(
  standalonePath: string,
  distDir: string,
  customManifest: RoutesManifest,
): Promise<void> {
  const manifestPath = join(standalonePath, distDir, ROUTES_MANIFEST);
  await writeFile(manifestPath, JSON.stringify(customManifest));
}

export const isMain = (meta: ImportMeta): boolean => {
  if (!meta) return false;
  if (!process.argv[1]) return false;
  return process.argv[1] === fileURLToPath(meta.url);
};

/**
 * Provides the paths in the output bundle for the built artifacts.
 * @param rootDir The root directory of the uploaded source code.
 * @param appDir The path to the application source code, relative to the root.
 * @return The output bundle paths.
 */
export function populateOutputBundleOptions(
  rootDir: string,
  appDir: string,
  nextBuildDirectory: string,
): OutputBundleOptions {
  const outputBundleDir = join(rootDir, ".apphosting");
  const standaloneDirectory = join(nextBuildDirectory, "standalone");
  // In monorepo setups, the standalone directory structure will mirror the structure of the monorepo.
  // We find the relative path from the root to the app directory to correctly locate server.js.
  const standaloneAppPath = join(
    standaloneDirectory,
    process.env.MONOREPO_COMMAND ? relative(rootDir, appDir) : "",
  );
  return {
    bundleYamlPath: join(outputBundleDir, "bundle.yaml"),
    outputDirectoryBasePath: outputBundleDir,
    outputDirectoryAppPath: standaloneAppPath,
    serverFilePath: join(standaloneAppPath, "server.js"),
    outputPublicDirectoryPath: join(standaloneAppPath, "public"),
    outputStaticDirectoryPath: join(standaloneAppPath, ".next", "static"),
  };
}

/**
 * Copy static assets and other resources into the standlone directory, also generates the bundle.yaml
 * @param rootDir The root directory of the uploaded source code.
 * @param outputBundleOptions The target location of built artifacts in the output bundle.
 * @param nextBuildDirectory The location of the .next directory.
 */
export async function generateBuildOutput(
  rootDir: string,
  appDir: string,
  opts: OutputBundleOptions,
  nextBuildDirectory: string,
  nextVersion: string,
  adapterMetadata: AdapterMetadata,
): Promise<void> {
  const staticDirectory = join(nextBuildDirectory, "static");
  await Promise.all([
    copy(staticDirectory, opts.outputStaticDirectoryPath, { overwrite: true }),
    copyResources(appDir, opts.outputDirectoryAppPath, opts.bundleYamlPath),
    generateBundleYaml(opts, rootDir, nextVersion, adapterMetadata),
  ]);
  // generateBundleYaml creates the output directory (if it does not already exist).
  // We need to make sure it is gitignored.
  const normalizedBundleDir = normalize(relative(rootDir, opts.outputDirectoryBasePath));
  updateOrCreateGitignore(rootDir, [`/${normalizedBundleDir}/`]);
  return;
}

// Copy all files and directories to apphosting output directory.
// Files are skipped if there is already a file with the same name in the output directory
async function copyResources(
  appDir: string,
  outputBundleAppDir: string,
  bundleYamlPath: string,
): Promise<void> {
  const appDirExists = await exists(appDir);
  if (!appDirExists) return;
  const pathsToCopy = await readdir(appDir);
  for (const path of pathsToCopy) {
    const isbundleYamlDir = join(appDir, path) === dirname(bundleYamlPath);
    const existsInOutputBundle = await exists(join(outputBundleAppDir, path));
    // Keep apphosting.yaml files in the root directory still, as later steps expect them to be there
    const isApphostingYaml = path === "apphosting_preprocessed" || path === "apphosting.yaml";
    if (!isbundleYamlDir && !existsInOutputBundle && !isApphostingYaml) {
      await copy(join(appDir, path), join(outputBundleAppDir, path));
    }
  }
  return;
}

export function getAdapterMetadata(): AdapterMetadata {
  const directoryName = dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = `${directoryName}/../package.json`;
  if (!existsSync(packageJsonPath)) {
    throw new Error(`Next.js adapter package.json file does not exist at ${packageJsonPath}`);
  }
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

  return {
    adapterPackageName: packageJson.name,
    adapterVersion: packageJson.version,
  };
}

// generate bundle.yaml
async function generateBundleYaml(
  opts: OutputBundleOptions,
  cwd: string,
  nextVersion: string,
  adapterMetadata: AdapterMetadata,
): Promise<void> {
  await ensureDir(opts.outputDirectoryBasePath);
  const outputBundle: OutputBundleConfig = {
    version: "v1",
    runConfig: {
      runCommand: `node ${normalize(relative(cwd, opts.serverFilePath))}`,
    },
    metadata: {
      ...adapterMetadata,
      framework: "nextjs",
      frameworkVersion: nextVersion,
    },
  };
  // TODO (b/432285470) See if there is a way to also delete files for apps using Nx monorepos
  if (!process.env.MONOREPO_COMMAND) {
    outputBundle.outputFiles = {
      serverApp: {
        include: [normalize(relative(cwd, opts.outputDirectoryAppPath))],
      },
    };
  }

  await writeFile(opts.bundleYamlPath, yamlStringify(outputBundle));
  return;
}

// Validate output directory includes all necessary parts
export async function validateOutputDirectory(
  opts: OutputBundleOptions,
  nextBuildDirectory: string,
): Promise<void> {
  const standaloneDirectory = join(nextBuildDirectory, "standalone");
  if (
    !(await fsExtra.exists(nextBuildDirectory)) ||
    !(await fsExtra.exists(standaloneDirectory)) ||
    !(await fsExtra.exists(opts.bundleYamlPath))
  ) {
    throw new Error("Output directory is not of expected structure");
  }
}
