import * as assert from "assert";
import { posix } from "path";
import fsExtra from "fs-extra";

const host = process.env.HOST;
if (!host) {
  throw new Error("HOST environment variable expected");
}

const scenario = process.env.SCENARIO;
if (!scenario) {
  throw new Error("SCENARIO environment variable expected");
}

const runId = process.env.RUN_ID;
if (!runId) {
  throw new Error("RUN_ID environment variable expected");
}

const compiledFilesPath = posix.join(
  process.cwd(),
  "e2e",
  "runs",
  runId,
  ".next",
  "standalone",
  ".next",
);

const standalonePath = posix.join(process.cwd(), "e2e", "runs", runId, ".next", "standalone");

const appPath = posix.join(process.cwd(), "e2e", "runs", runId);

const requiredServerFilePath = posix.join(compiledFilesPath, "required-server-files.json");

describe("next.config override", () => {
  it("Should not overwrite original next config", async function () {
    if (
      scenario.includes("with-empty-config") ||
      scenario.includes("with-images-unoptimized-false") ||
      scenario.includes("with-custom-image-loader")
    ) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }
    const files = await fsExtra.readdir(appPath);
    const configRegex = /^next\.config\..*$/g;
    const configOriginalRegex = /^next\.config\.(?!original).*$/g;
    const configFiles = files.filter((file) => file.match(configRegex));
    assert.strictEqual(configFiles.length, 1);
    assert.ok(
      configFiles[0].match(configOriginalRegex),
      "temporary original config not properly removed",
    );

    const standaloneFiles = await fsExtra.readdir(standalonePath);
    const standaloneConfigFiles = standaloneFiles.filter((file) => file.match(configRegex));
    assert.strictEqual(standaloneConfigFiles.length, 2);
    assert.ok(
      standaloneConfigFiles.some((file) => file.match(configOriginalRegex)),
      "no original config found in standalone",
    );
  });
  it("should have images optimization disabled", async function () {
    if (
      scenario.includes("with-empty-config") ||
      scenario.includes("with-images-unoptimized-false") ||
      scenario.includes("with-custom-image-loader")
    ) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }

    const serverFiles = await fsExtra.readJson(requiredServerFilePath);
    const config = serverFiles.config;

    // Verify that images.unoptimized is set to true
    assert.ok(config.images, "Config should have images property");
    assert.strictEqual(
      config.images.unoptimized,
      true,
      "Images should have unoptimized set to true",
    );
  });

  it("should preserve other user set next configs", async function () {
    if (scenario.includes("with-empty-config")) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }

    // This test checks if the user's original config settings are preserved
    // We'll check for the custom header that was set in the next.config
    const response = await fetch(posix.join(host, "/"));

    assert.ok(response.ok);

    // Check for the custom header that was set in the next.config
    const customHeader = response.headers.get("x-custom-header") ?? "";
    const validValues = ["js-config-value", "ts-config-value", "mjs-config-value"];
    assert.ok(
      validValues.includes(customHeader),
      `Expected header to be one of ${validValues.join(", ")} but got "${customHeader}"`,
    );
  });

  it("should handle function-style config correctly", async function () {
    // Only run this test for scenarios with function-style config
    if (!scenario.includes("function-style")) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }

    // Check for the custom header that indicates function-style config was processed correctly
    const response = await fetch(posix.join(host, "/"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("x-config-type") ?? "", "function");
  });

  it("should handle object-style config correctly", async function () {
    // Only run this test for scenarios with object-style config
    if (!scenario.includes("object-style") && !scenario.includes("with-empty-config")) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }

    // Check for the custom header that indicates object-style config was processed correctly
    const response = await fetch(posix.join(host, "/"));
    assert.ok(response.ok);

    // Empty config doesn't set this header
    if (!scenario.includes("with-empty-config")) {
      assert.equal(response.headers.get("x-config-type") ?? "", "object");
    }
  });

  it("should not override images.unoptimized if user explicitly defines configs", async function () {
    if (
      !scenario.includes("with-images-unoptimized-false") &&
      !scenario.includes("with-custom-image-loader")
    ) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }

    const serverFiles = await fsExtra.readJson(requiredServerFilePath);
    const config = serverFiles.config;

    assert.ok(config.images, "Config should have images property");
    assert.strictEqual(
      config.images.unoptimized,
      false,
      "Images should have unoptimized set to false",
    );
  });
});
