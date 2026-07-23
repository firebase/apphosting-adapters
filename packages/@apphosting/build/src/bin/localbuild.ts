#! /usr/bin/env node
import { localBuild } from "../index.js";
import { program } from "commander";

program
  .argument("<projectRoot>", "path to the project's root directory")
  .option("--framework <framework>")
  .action(async (projectRoot, opts) => {
    await localBuild(projectRoot, opts.framework);
  });

program.parse();
