import { cp } from "fs/promises";
import promiseSpawn from "@npmcli/promise-spawn";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
import fsExtra from "fs-extra";
import { scenarios } from "./scenarios.js";

const { readFileSync, mkdirp, rmdir } = fsExtra;

const __dirname = dirname(fileURLToPath(import.meta.url));

const errors: any[] = [];

await rmdir(join(__dirname, "runs"), { recursive: true }).catch(() => undefined);

// Run each scenario
for (const [scenarioName, scenario] of scenarios) {
  console.log(
    `\n\n${"=".repeat(80)}\n${" ".repeat(
      5,
    )}RUNNING SCENARIO: ${scenarioName.toUpperCase()}${" ".repeat(5)}\n${"=".repeat(80)}`,
  );

  const runId = `${scenarioName}-${Math.random().toString().split(".")[1]}`;
  const cwd = join(__dirname, "runs", runId);
  await mkdirp(cwd);

  const starterTemplateDir = scenarioName.includes("nextjs")
    ? "../../../starters/nextjs/basic"
    : "../../../starters/angular/basic";
  console.log(`[${runId}] Copying ${starterTemplateDir} to working directory`);
  await cp(starterTemplateDir, cwd, { recursive: true });

  console.log(`[${runId}] > npm ci --silent --no-progress`);
  await promiseSpawn("npm", ["ci", "--silent", "--no-progress"], {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  const buildScript = relative(cwd, join(__dirname, "../dist/bin/localbuild.js"));
  const buildLogPath = join(cwd, "build.log");
  console.log(`[${runId}] > node ${buildScript} (output written to ${buildLogPath})`);

  const packageJson = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"));
  const frameworkVersion = scenarioName.includes("nextjs")
    ? packageJson.dependencies.next.replace("^", "")
    : JSON.parse(
        readFileSync(join(cwd, "node_modules", "@angular", "core", "package.json"), "utf-8"),
      ).version;

  try {
    const result = await promiseSpawn("node", [buildScript, ...scenario.inputs], {
      cwd,
      stdioString: true,
      stdio: "pipe",
      shell: true,
      env: {
        ...process.env,
        FRAMEWORK_VERSION: frameworkVersion,
      },
    });
    // Write stdout and stderr to the log file
    fsExtra.writeFileSync(buildLogPath, result.stdout + result.stderr);

    try {
      // Determine which test files to run
      const testPattern = scenario.tests
        ? scenario.tests.map((test) => `e2e/${test}`).join(" ")
        : "e2e/*.spec.ts";

      console.log(`> SCENARIO=${scenarioName} ts-mocha -p tsconfig.json ${testPattern}`);

      await promiseSpawn("ts-mocha", ["-p", "tsconfig.json", ...testPattern.split(" ")], {
        shell: true,
        stdio: "inherit",
        env: {
          ...process.env,
          SCENARIO: scenarioName,
          RUN_ID: runId,
        },
      });
    } catch (e) {
      errors.push(e);
    }
  } catch (e) {
    console.error(`Error in scenario ${scenarioName}:`, e);
    errors.push(e);
  }
}
if (errors.length) {
  console.error(errors);
  process.exit(1);
}
