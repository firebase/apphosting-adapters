import * as assert from "assert";
import { posix } from "path";
import type { OutputBundleConfig } from "../../common/src/index.ts";
import { scenarios } from "./scenarios.ts";
import fsExtra from "fs-extra";
import { parse as parseYaml } from "yaml";

const { readFileSync } = fsExtra;

const scenario = process.env.SCENARIO;
if (!scenario) {
  throw new Error("SCENARIO environment variable expected");
}

const runId = process.env.RUN_ID;
if (!runId) {
  throw new Error("RUN_ID environment variable expected");
}

const bundleYaml = posix.join(process.cwd(), "e2e", "runs", runId, ".apphosting", "bundle.yaml");
describe("supported framework apps", () => {
  it("apps have bundle.yaml correctly generated", () => {
    const bundle: OutputBundleConfig = parseYaml(readFileSync(bundleYaml, "utf8"));

    assert.deepStrictEqual(scenarios.get(scenario).expectedBundleYaml.runConfig, bundle.runConfig);
    assert.deepStrictEqual(
      scenarios.get(scenario).expectedBundleYaml.metadata.adapterPackageName,
      bundle.metadata.adapterPackageName,
    );
  });
});
