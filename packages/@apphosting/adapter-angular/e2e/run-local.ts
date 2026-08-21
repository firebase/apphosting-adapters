import { cp, readFile, writeFile } from "fs/promises";
import promiseSpawn from "@npmcli/promise-spawn";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";
import { spawn } from "child_process";
import fsExtra from "fs-extra";

const { readFileSync, mkdirp, readJSON, writeJSON, rm } = fsExtra;
const __dirname = dirname(fileURLToPath(import.meta.url));

const starterTemplateDir = "../../../starters/angular/basic";

const errors: any[] = [];

await rm(join(__dirname, "runs"), { recursive: true }).catch(() => undefined);

console.log("\nBuilding and starting test projects in parallel...");

const tests = await Promise.all(
  [
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ].map(async ([enableSSR, enableSSG]) => {
    const runId = Math.random().toString().split(".")[1];
    const cwd = join(__dirname, "runs", runId);
    await mkdirp(cwd);

    console.log(`[${runId}] Copying ${starterTemplateDir} to working directory`);
    await cp(starterTemplateDir, cwd, { recursive: true });

    const packageJSON = await readJSON(join(cwd, "package.json"));
    packageJSON.name = `firebase-app-hosting-angular-${runId}`;
    await writeJSON(join(cwd, "package.json"), packageJSON);

    console.log(`[${runId}] > npm ci --silent --no-progress`);
    await promiseSpawn("npm", ["ci", "--silent", "--no-progress"], {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    const angularJSON = JSON.parse((await readFile(join(cwd, "angular.json"))).toString());

    if (!enableSSR) {
      console.log(`[${runId}] Disabling SSR option in angular.json`);
      angularJSON.projects["firebase-app-hosting-angular"].architect.build.options.ssr = false;
    }
    if (!enableSSG) {
      console.log(`[${runId}] Disabling prerender option in angular.json`);
      angularJSON.projects["firebase-app-hosting-angular"].architect.build.options.prerender =
        false;
    }
    await writeFile(join(cwd, "angular.json"), JSON.stringify(angularJSON, null, 2));

    const buildScript = relative(cwd, join(__dirname, "../dist/bin/build.js"));
    console.log(`[${runId}] > node ${buildScript}`);

    const frameworkVersion = JSON.parse(
      readFileSync(join(cwd, "node_modules", "@angular", "core", "package.json"), "utf-8"),
    ).version;
    await promiseSpawn("node", [buildScript], {
      cwd,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        FRAMEWORK_VERSION: frameworkVersion,
      },
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
    console.log(`[${runId}] > PORT=${port} ${runCommand}`);
    const run = spawn(runScript, runArgs, {
      cwd,
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: port.toString(),
      },
    });
    run.stderr.on("data", (data) => console.error(data.toString()));
    run.stdout.on("data", (data) => {
      console.log(data.toString());
      if (data.toString() === `Node Express server listening on http://localhost:${port}\n`) {
        resolveHostname(`http://localhost:${port}`);
      } else {
        run.stdin.end();
        run.kill("SIGKILL");
      }
    });
    run.on("close", (code) => {
      if (code) {
        rejectHostname();
      }
    });
    const host = await hostnamePromise;

    return [host, run, enableSSR, enableSSG] as const;
  }),
);

console.log("\n\n");

for (const [host, run, enableSSR, enableSSG] of tests) {
  try {
    console.log(
      `> HOST=${host}${enableSSR ? " SSR=1" : ""}${
        enableSSG ? " SSG=1" : ""
      } ts-mocha -p tsconfig.json e2e/*.spec.ts`,
    );
    await promiseSpawn("ts-mocha", ["-p", "tsconfig.json", "e2e/*.spec.ts"], {
      shell: true,
      stdio: "inherit",
      env: {
        ...process.env,
        SSR: enableSSR ? "1" : undefined,
        SSG: enableSSG ? "1" : undefined,
        HOST: host,
      },
    }).finally(() => {
      run.stdin.end();
      run.kill("SIGKILL");
    });
  } catch (e) {
    errors.push(e);
  }
}

if (errors.length) {
  console.error(errors);
  process.exit(1);
}

process.exit(0);
