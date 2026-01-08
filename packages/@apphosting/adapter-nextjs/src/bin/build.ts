#! /usr/bin/env node
// import { build } from "esbuild";
// import { stringify } from "yaml";
// import { spawn } from "child_process";
// import { join, dirname } from "path";
// import fs from "fs-extra";
// import { fileURLToPath } from "url";
import { generateBuildOutput, loadConfig, populateOutputBundleOptions, validateOutputDirectory } from "../utils.js";
import { getBuildOptions, runBuild } from "@apphosting/common";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// export async function main() {
//   const root = process.cwd();
//   console.log(`🏗️  Starting Adapter Build in ${root}...`);

//   // 1. Run Next.js Build
//   const nextBuild = spawn("npx", ["next", "build"], {
//     stdio: "inherit",
//     cwd: root,
//     shell: true,
//     env: { ...process.env, NODE_ENV: "production" },
//   });

//   await new Promise<void>((resolve, reject) => {
//     nextBuild.on("close", (code) => {
//       if (code === 0) resolve();
//       else reject(new Error(`Next.js build failed with code ${code}`));
//     });
//   });

//   // 2. Move Standalone Output to .apphosting
//   const standaloneDir = join(root, ".next", "standalone");
//   const outputDir = join(root, ".apphosting");

//   // Clean previous build
//   await fs.remove(outputDir);
//   await fs.ensureDir(outputDir);

//   console.log("📦 Copying standalone server to .apphosting...");

//   // Copy the standalone directory content to .apphosting
//   // Note: This includes a 'server.js' and 'node_modules'
//   await fs.copy(standaloneDir, outputDir);

//   // Copy the 'public' folder and '.next/static' (Standalone doesn't include these by default!)
//   await fs
//     .copy(join(root, "public"), join(outputDir, "public"), { dereference: true })
//     .catch(() => {});
//   await fs.copy(join(root, ".next", "static"), join(outputDir, ".next", "static"), {
//     dereference: true,
//   });
//   const configSource = join(root, ".next", "firebase-next-config.json");
//   const configDest = join(outputDir, "firebase-next-config.json");

//   if (await fs.pathExists(configSource)) {
//     console.log("📦 Copying serialized config...");
//     await fs.copy(configSource, configDest);
//   } else {
//     console.warn("⚠️ Could not find firebase-next-config.json. Server may fail to start.");
//   }
//   // 3. Bundle OUR Runtime Server
//   // We put our serve.js *next to* the Next.js server.js
//   console.log("📦 Bundling runtime server...");
//   await build({
//     entryPoints: [join(__dirname, "serve.js")],
//     bundle: true,
//     platform: "node",
//     format: "cjs",
//     outfile: join(outputDir, "adapter-server.js"),
//     external: ["next", "react", "react-dom"],
//   });

//   console.log("📦 Generating bundle.yaml...");

//   const bundle = {
//     version: "v1",
//     runConfig: {
//       // This runs the file we just bundled in step 3
//       runCommand: "node .apphosting/adapter-server.js",

//       concurrency: 80,
//       cpu: 1,
//       memoryMiB: 512,
//       minInstances: 0,
//       maxInstances: 100,
//     },
//     metadata: {
//       adapterPackageName: "wei-nextjs-adapter-test",
//       adapterVersion: "15.0.3",
//       frameworkVersion: "16.0.1",
//       framework: "nextjs",
//     },
//     outputFiles: {
//       serverApp: {
//         include: [".apphosting"],
//       },
//     },
//   };

//   await fs.writeFile(join(outputDir, "bundle.yaml"), stringify(bundle));

//   console.log("✅ Build complete. Artifacts in .apphosting/");
// }

// main().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });

import { join } from "node:path";
// Opt-out sending telemetry to Vercel
process.env.NEXT_TELEMETRY_DISABLED = "1";

process.env.NEXT_ADAPTER_PATH = join(import.meta.dirname, "..", "index.cjs");

await runBuild();

const opts = getBuildOptions();
const root = process.cwd();

const nextConfig = await loadConfig(root, opts.projectDirectory);

const nextBuildDirectory = join(opts.projectDirectory, nextConfig.distDir);
const outputBundleOptions = populateOutputBundleOptions(root,  opts.projectDirectory, nextBuildDirectory,);
await generateBuildOutput(    root,
    opts.projectDirectory,
    outputBundleOptions,
    nextBuildDirectory,);

await validateOutputDirectory(outputBundleOptions, nextBuildDirectory);