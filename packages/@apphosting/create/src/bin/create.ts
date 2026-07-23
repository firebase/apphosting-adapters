#! /usr/bin/env node
import { program } from "commander";
import { downloadTemplate } from "giget";
import { select, input } from "@inquirer/prompts";
import spawn from "@npmcli/promise-spawn";
import ora from "ora";
import { rm } from "fs/promises";
import { join } from "path";
import chalk from "chalk";

const contextIsNpmCreate = process.env.npm_command === "init";

type Starter = { name: string; value: string; description: string; products: string[] };

const STARTERS: Record<string, Array<Starter>> = {
  angular: [
    {
      name: "Basic",
      value: "basic",
      description: "A basic Angular starter template.",
      products: [],
    },
    {
      name: "AI chatbot",
      value: "ai-chatbot",
      description: "Simple chatbot app that supports multiple chats.",
      products: ["Gemini"],
    },
    {
      name: "AI text editor",
      value: "ai-text-editor",
      description:
        "AI-powered editor that provides text enhancement tools and supports basic formatting.",
      products: ["Gemini"],
    },
    {
      name: "Dashboard",
      value: "dashboard",
      description:
        "Dashboard app with a set of configurable visualization widgets and data sources.",
      products: [],
    },
    {
      name: "Ecommerce",
      value: "ecommerce",
      description:
        "Basic Ecommerce app composed of a landing page, products list and details pages, and a cart.",
      products: [],
    },
    {
      name: "Image Gallery",
      value: "image-gallery",
      description: "Optimized image gallery that supports image previews.",
      products: [],
    },
    {
      name: "Kanban Board",
      value: "kanban",
      description: "Provides the well-known board UI accompanied by draggable cards.",
      products: [],
    },
  ],
  nextjs: [
    {
      name: "Basic",
      value: "basic",
      description: "A basic Next.js starter template.",
      products: [],
    },
    {
      name: "Shopify example",
      value: "shopify-ecommerce",
      description:
        "A headless Shopify ecommerce template built with Next.js, the Shopify Storefront API, and Firebase Data Connect.",
      products: ["Data Connect", "Auth", "Gemini", "Shopify"],
    },
    {
      name: "Firebase ecommerce",
      value: "firebase-ecommerce",
      description:
        "A Firebase-based e-commerce application designed for developers to bootstrap their e-commerce projects.",
      products: ["Data Connect", "Auth", "Gemini", "Stripe"],
    },
  ],
};

// npm/10.1.0 node/v20.9.0 darwin x64 workspaces/false
// pnpm/9.1.0 npm/? node/v20.9.0 darwin x64
// yarn/1.7.0 npm/? node/v8.9.4 darwin x64
const npmUserAgent = process.env.npm_config_user_agent
  ? Object.fromEntries(process.env.npm_config_user_agent.split(" ").map((s) => s.split("/")))
  : {};

program
  .option("--framework <string>")
  .option("--package-manager <string>")
  .argument("[directory]", "path to the project's root directory")
  .action(
    async (
      directory,
      { framework, packageManager }: { framework?: string; packageManager?: string },
    ) => {
      directory ||= await input({
        message: "What directory should we bootstrap the application in?",
        default: ".",
      });
      // TODO DRY up the validation and error handling, move to commander parse
      if (framework) {
        if (!["angular", "nextjs"].includes(framework)) {
          console.error(`Invalid framework: ${framework}, valid choices are angular and nextjs`);
          process.exit(1);
        }
      } else {
        framework = await select({
          message: "Select a framework",
          choices: [
            { name: "Angular", value: "angular" },
            { name: "Next.js", value: "nextjs" },
          ],
        });
      }
      const example = await select({
        message: "Select a starter template",
        choices: STARTERS[framework].map((starter) => ({
          name: chalk.bold(starter.name),
          short: starter.name,
          description: `\n${starter.description}${
            starter.products.length
              ? `\nProducts: ${chalk.italic(starter.products.join(", "))}`
              : ""
          }`,
          value: starter.value,
          default: "basic",
        })),
      });
      // TODO DRY up validation and error message, move to commander parse
      let packageManagerVersion = "*";
      if (packageManager) {
        [packageManager, packageManagerVersion = "*"] = packageManager.split("@");
        if (!["npm", "yarn", "pnpm"].includes(packageManager)) {
          console.error(
            `Invalid package manager: ${packageManager}, valid choices are npm, yarn, and pnpm`,
          );
          process.exit(1);
        }
      } else if (contextIsNpmCreate) {
        packageManager = "npm";
      } else if (npmUserAgent.yarn) {
        packageManager = "yarn";
        packageManagerVersion = npmUserAgent.yarn;
      } else if (npmUserAgent.pnpm) {
        packageManager = "pnpm";
        packageManagerVersion = npmUserAgent.pnpm;
      } else {
        packageManager = await select({
          message: "Select a package manager",
          default: "npm",
          choices: [
            { name: "npm", value: "npm" },
            { name: "yarn", value: "yarn" },
            { name: "pnpm", value: "pnpm" },
          ],
        });
      }
      const cloneSpinner = ora("Cloning template...").start();
      await downloadTemplate(
        `gh:FirebaseExtended/firebase-framework-tools/starters/${framework}/${example}`,
        { dir: directory, force: true },
      );
      cloneSpinner.succeed();
      if (packageManager === "npm") {
        console.log("> npm install");
        await spawn("npm", ["install"], {
          shell: true,
          stdio: "inherit",
          cwd: directory,
        });
      } else {
        await spawn("corepack", ["enable"], {
          shell: true,
          stdio: "inherit",
          cwd: directory,
        });
        await spawn("corepack", ["use", `${packageManager}@${packageManagerVersion}`], {
          shell: true,
          stdio: "inherit",
          cwd: directory,
        });
        await rm(join(directory, "package-lock.json"));
      }
    },
  );

program.parse();
