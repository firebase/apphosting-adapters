#! /usr/bin/env node
import {
  generateBuildOutput,
  loadConfig,
  populateOutputBundleOptions,
  validateOutputDirectory,
} from "../utils.js";
import { getBuildOptions, runBuild } from "@apphosting/common";

import { join } from "node:path";
// Opt-out sending telemetry to Vercel
process.env.NEXT_TELEMETRY_DISABLED = "1";

process.env.NEXT_ADAPTER_PATH = join(import.meta.dirname, "..", "index.cjs");

await runBuild();

const opts = getBuildOptions();
const root = process.cwd();

const nextConfig = await loadConfig(root, opts.projectDirectory);

const nextBuildDirectory = join(opts.projectDirectory, nextConfig.distDir);
const outputBundleOptions = populateOutputBundleOptions(
  root,
  opts.projectDirectory,
  nextBuildDirectory,
);
await generateBuildOutput(root, opts.projectDirectory, outputBundleOptions, nextBuildDirectory);

await validateOutputDirectory(outputBundleOptions, nextBuildDirectory);
