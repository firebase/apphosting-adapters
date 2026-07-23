import { cp } from "fs/promises";
import promiseSpawn from "@npmcli/promise-spawn";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";
import { spawn } from "child_process";
import fsExtra from "fs-extra";

const { readFileSync, mkdirp, rmdir } = fsExtra;

const __dirname = dirname(fileURLToPath(import.meta.url));

const starterTemplateDir = "../../../starters/nextjs/basic";

// Define scenarios to test
interface Scenario {
  name: string; // Name of the scenario
  setup?: (cwd: string) => Promise<void>; // Optional setup function before building the app
  tests?: string[]; // List of test files to run
}

// Load test data for config override
const configOverrideTestScenarios = parseYaml(
  readFileSync(join(__dirname, "config-override-test-cases.yaml"), "utf8"),
).tests;

const scenarios: Scenario[] = [
  {
    name: "basic",
    // No setup needed for basic scenario
    tests: ["app.spec.ts"],
  },
  {
    name: "with-middleware",
    setup: async (cwd: string) => {
      // Create a middleware.ts file
      const middlewareContent = `
        import type { NextRequest } from "next/server";

        export function middleware(request: NextRequest) {
          // This is a simple middleware that doesn't modify the request
          console.log("Middleware executed", request.nextUrl.pathname);
        }

        export const config = {
          matcher: ["/ssg", "/ssr"],
        };
      `;

      await fsExtra.writeFile(join(cwd, "src", "middleware.ts"), middlewareContent);
      console.log(`Created middleware.ts file`);
    },
    tests: ["middleware.spec.ts"], // Only run middleware-specific tests
  },
  ...configOverrideTestScenarios.map(
    (scenario: { name: string; config: string; file: string }) => ({
      name: scenario.name,
      setup: async (cwd: string) => {
        const configContent = scenario.config;
        const files = await fsExtra.readdir(cwd);
        const configFiles = files
          .filter((file) => file.startsWith("next.config."))
          .map((file) => join(cwd, file));

        for (const file of configFiles) {
          await fsExtra.remove(file);
          console.log(`Removed existing config file: ${file}`);
        }

        await fsExtra.writeFile(join(cwd, scenario.file), configContent);
        console.log(`Created ${scenario.file} file with ${scenario.name} config`);
      },
      tests: ["config-override.spec.ts"],
    }),
  ),
];

const errors: any[] = [];

await rmdir(join(__dirname, "runs"), { recursive: true }).catch(() => undefined);

// Run each scenario
for (const scenario of scenarios) {
  console.log(
    `\n\n${"=".repeat(80)}\n${" ".repeat(
      5,
    )}RUNNING SCENARIO: ${scenario.name.toUpperCase()}${" ".repeat(5)}\n${"=".repeat(80)}`,
  );

  const runId = `${scenario.name}-${Math.random().toString().split(".")[1]}`;
  const cwd = join(__dirname, "runs", runId);
  await mkdirp(cwd);

  console.log(`[${runId}] Copying ${starterTemplateDir} to working directory`);
  await cp(starterTemplateDir, cwd, { recursive: true });

  // Run scenario-specific setup if provided
  if (scenario.setup) {
    console.log(`[${runId}] Running setup for ${scenario.name}`);
    await scenario.setup(cwd);
  }

  console.log(`[${runId}] > npm ci --silent --no-progress`);
  await promiseSpawn("npm", ["ci", "--silent", "--no-progress"], {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  const buildScript = relative(cwd, join(__dirname, "../dist/bin/build.js"));
  const buildLogPath = join(cwd, "build.log");
  console.log(`[${runId}] > node ${buildScript} (output written to ${buildLogPath})`);

  const packageJson = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"));
  const frameworkVersion = packageJson.dependencies.next.replace("^", "");

  try {
    await promiseSpawn("node", [buildScript], {
      cwd,
      stdioString: true,
      stdio: "pipe",
      shell: true,
      env: {
        ...process.env,
        FRAMEWORK_VERSION: frameworkVersion,
      },
    }).then((result) => {
      // Write stdout and stderr to the log file
      fsExtra.writeFileSync(buildLogPath, result.stdout + result.stderr);
    });

    const bundleYaml = parseYaml(readFileSync(join(cwd, ".apphosting/bundle.yaml")).toString());

    const runCommand = bundleYaml.runConfig.runCommand;

    if (typeof runCommand !== "string") {
      throw new Error("runCommand must be a string");
    }

    const [runScript, ...runArgs] = runCommand.split(" ");
    let resolveHostname: (it: string) => void;
    let rejectHostname: () => void;
    const hostnamePromise = new Promise<string>((resolve, reject) => {
      resolveHostname = resolve;
      rejectHostname = reject;
    });
    const port = 8080 + Math.floor(Math.random() * 1000);
    const runLogPath = join(cwd, "run.log");
    console.log(`[${runId}] > PORT=${port} ${runCommand} (output written to ${runLogPath})`);
    const runLogStream = fsExtra.createWriteStream(runLogPath);

    const run = spawn(runScript, runArgs, {
      cwd,
      shell: true,
      env: {
        NODE_ENV: "production",
        PORT: port.toString(),
        PATH: process.env.PATH,
      },
    });

    run.stderr.on("data", (data) => {
      const output = data.toString();
      runLogStream.write(output);
    });

    run.stdout.on("data", (data) => {
      const output = data.toString();
      runLogStream.write(output);
      // Check for the "Ready in" message to determine when the server is fully started
      if (output.includes(`Ready in`)) {
        // We use 0.0.0.0 instead of localhost to avoid issues when ipv6 is not available (Node 18)
        resolveHostname(`http://0.0.0.0:${port}`);
      }
    });

    run.on("close", (code) => {
      runLogStream.end();
      if (code) {
        rejectHostname();
      }
    });
    const host = await hostnamePromise;

    console.log("\n\n");

    try {
      // Determine which test files to run
      const testPattern = scenario.tests
        ? scenario.tests.map((test) => `e2e/${test}`).join(" ")
        : "e2e/*.spec.ts";

      console.log(
        `> HOST=${host} SCENARIO=${scenario.name} ts-mocha -p tsconfig.json ${testPattern}`,
      );
      await promiseSpawn("ts-mocha", ["-p", "tsconfig.json", ...testPattern.split(" ")], {
        shell: true,
        stdio: "inherit",
        env: {
          ...process.env,
          HOST: host,
          SCENARIO: scenario.name,
          RUN_ID: runId,
        },
      }).finally(() => {
        run.stdin.end();
        run.kill("SIGKILL");
      });
    } catch (e) {
      errors.push(e);
    }
  } catch (e) {
    console.error(`Error in scenario ${scenario.name}:`, e);
    errors.push(e);
  }
}

if (errors.length) {
  console.error(errors);
  process.exit(1);
}

process.exit(0);
