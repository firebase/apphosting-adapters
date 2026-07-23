import { spawn } from "child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// List of apphosting supported frameworks.
export const SupportedFrameworks = ["nextjs", "angular"] as const;
export type Framework = (typeof SupportedFrameworks)[number];

// **** OutputBundleConfig interfaces ****

// Output bundle metadata specifications to be written to bundle.yaml
export interface OutputBundleConfig {
  version: "v1";
  runConfig: RunConfig;
  metadata: Metadata;
  outputFiles?: OutputFiles;
}

// Fields needed to configure the App Hosting server
export interface RunConfig {
  // Command to start the server (e.g. "node dist/index.js"). Assume this command is run from the root dir of the workspace
  runCommand: string;
  // Environment variables set when the app is run
  environmentVariables?: EnvVarConfig[];
  // See https://firebase.google.com/docs/reference/apphosting/rest/v1beta/projects.locations.backends.builds#runconfig for documentation on the next fields
  // The maximum number of concurrent requests that each server instance can receive.
  concurrency?: number;
  // The number of CPUs used in a single server instance.
  cpu?: number;
  // The amount of memory available for a server instance.
  memoryMiB?: number;
  // The limit on the minimum number of function instances that may coexist at a given time.
  minInstances?: number;
  // The limit on the maximum number of function instances that may coexist at a given time.
  maxInstances?: number;
}

// Additonal fields needed for identifying the framework and adapter being used
export interface Metadata {
  // Name of the adapter (this should be the official package name) e.g. "@apphosting/adapter-nextjs"
  adapterPackageName: string;
  // Version of the adapter, e.g. "18.0.1"
  adapterVersion: string;
  // Name of the framework that is being supported, e.g. "angular"
  framework: string;
  // Version of the framework that is being supported, e.g. "18.0.1"
  frameworkVersion?: string;
}

// **** Apphosting Config interfaces ****

export interface ApphostingConfig {
  runconfig?: ApphostingRunConfig;
  env?: EnvVarConfig[];
  scripts?: Script;
  outputFiles?: OutputFiles;
}

export interface ApphostingRunConfig {
  minInstances?: number;
  maxInstances?: number;
  concurrency?: number;
}

export interface Script {
  buildCommand?: string;
  runCommand?: string;
}

// **** Shared interfaces ****

// Optional outputFiles to configure outputFiles and optimize server files + static assets.
// If this is not set then all of the source code will be uploaded
export interface OutputFiles {
  serverApp: ServerApp;
}

// ServerApp holds a list of directories + files relative to the app root dir that frameworks need to deploy to the App Hosting server,
// generally this will be the output/dist directory (e.g. .output or dist). To include all files set this to [“.”]
interface ServerApp {
  include: string[];
}

// Represents a single environment variable.
export interface EnvVarConfig {
  // Name of the variable
  variable: string;
  // Value associated with the variable
  value: string;
  // Where the variable will be available
  availability: Availability[];
}

// Represents where environment variables are made available
export enum Availability {
  // Runtime environment variables are available on the server when the app is run
  Runtime = "RUNTIME",
  Build = "BUILD",
}

// Options to configure the build of a framework application
export interface BuildOptions {
  // command to run build script (e.g. "npm", "nx", etc.)
  buildCommand: string;
  // list of arguments to pass to the build command
  // (e.g. ["--project=my-app", "--configuration=production"])
  buildArgs: string[];
  // path to the project targeted by the build command
  projectDirectory: string;
  // the name of the project to build
  projectName?: string;
}

export interface BuildResult {
  stdout?: string;
  stderr?: string;
}

export const DEFAULT_COMMAND = "npm";

// Run the build command in a spawned child process.
// By default, "npm run build" will be used, or in monorepo cases,
// the monorepo build command (e.g. "nx build").
export async function runBuild(opts: BuildOptions = getBuildOptions()): Promise<BuildResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(opts.buildCommand, [...opts.buildArgs], {
      cwd: process.cwd(),
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    // Re-connect the child process's stdout and stderr to the console so that
    // build messages and errors are still logged in Cloud Build.
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Build process exited with error code ${code}.`));
      }
      resolve({ stdout: stdout, stderr: stderr });
    });
  });
}

// Get a set of default options, derived from the environment variable API
// passed down to the adapter from the buildpacks environment.
export function getBuildOptions(): BuildOptions {
  if (process.env.MONOREPO_COMMAND) {
    return {
      buildCommand: process.env.MONOREPO_COMMAND,
      buildArgs: ["run", "build"].concat(process.env.MONOREPO_BUILD_ARGS?.split(",") || []),
      projectDirectory: process.env.GOOGLE_BUILDABLE || "",
      projectName: process.env.MONOREPO_PROJECT,
    };
  }
  return {
    buildCommand: DEFAULT_COMMAND,
    buildArgs: ["run", "build"],
    projectDirectory: process.cwd(),
  };
}

/**
 * Updates or creates a .gitignore file with the given entries in the given path
 */
export function updateOrCreateGitignore(dirPath: string, entries: string[]) {
  const gitignorePath = path.join(dirPath, ".gitignore");

  if (!fs.existsSync(gitignorePath)) {
    console.log(`creating ${gitignorePath} with entries: ${entries.join("\n")}`);
    fs.writeFileSync(gitignorePath, entries.join("\n"));
    return;
  }

  let content = fs.readFileSync(gitignorePath, "utf-8");
  for (const entry of entries) {
    if (!content.split("\n").includes(entry)) {
      console.log(`adding ${entry} to ${gitignorePath}`);
      content += `\n${entry}`;
    }
  }

  fs.writeFileSync(gitignorePath, content);
}
