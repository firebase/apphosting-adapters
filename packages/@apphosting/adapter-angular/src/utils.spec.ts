const importUtils = import("@apphosting/adapter-angular/dist/utils.js");
import assert from "assert";
import fs from "fs";
import * as path from "path";
import { stringify as yamlStringify } from "yaml";
import os from "os";
import type { OutputBundleConfig } from "@apphosting/common";

function generateTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "test-files"));
}

describe("metaFrameworkOutputBundleExists", () => {
  let bundlePath: string;
  const originalCwd = process.cwd.bind(process);

  beforeEach(() => {
    const tmpDir = generateTmpDir();
    process.cwd = () => tmpDir;
    fs.mkdirSync(path.resolve(tmpDir, ".apphosting"));
    bundlePath = path.resolve(tmpDir, ".apphosting", "bundle.yaml");
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  it("unrecognized bundle", async () => {
    const { metaFrameworkOutputBundleExists } = await importUtils;
    const content = "chicken: bok bok";
    fs.writeFileSync(bundlePath, yamlStringify(content));
    assert(!metaFrameworkOutputBundleExists());
  });

  it("no bundle exists", async () => {
    const { metaFrameworkOutputBundleExists } = await importUtils;
    assert(!metaFrameworkOutputBundleExists());
  });

  it("meta-framework bundle exists", async () => {
    const { metaFrameworkOutputBundleExists } = await importUtils;
    const outputBundle: OutputBundleConfig = {
      version: "v1",
      runConfig: {
        runCommand: `does not matter`,
      },
      metadata: {
        framework: "nitro",
      },
    };
    fs.writeFileSync(bundlePath, yamlStringify(outputBundle));
    assert(metaFrameworkOutputBundleExists());
  });

  it("angular bundle exists", async () => {
    const { metaFrameworkOutputBundleExists } = await importUtils;
    const outputBundle: OutputBundleConfig = {
      version: "v1",
      runConfig: {
        runCommand: `does not matter`,
      },
      metadata: {
        framework: "angular",
      },
    };
    fs.writeFileSync(bundlePath, yamlStringify(outputBundle));
    assert(!metaFrameworkOutputBundleExists());
  });
});

describe("parseOutputBundleOptions", () => {
  const manifestObject = {
    errors: [],
    warnings: ["▲ [WARNING] NG8107\n\n    src/app/app.ts:3:0:\n      3 │ export class App {\n"],
    outputPaths: {
      root: "file:///workspace/dist/app",
      browser: "file:///workspace/dist/app/browser",
      server: "file:///workspace/dist/app/server",
    },
    prerenderedRoutes: { "/": {} },
  };
  const manifest = JSON.stringify(manifestObject, undefined, 2);
  const serverFilePath = "/workspace/dist/app/server/server.mjs";

  it("ignores braces in an npm-echoed build script", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    const output = `
> app@0.0.0 build
> ng build --configuration \${APP_ENV:-development}

${manifest}
`;
    assert.equal(parseOutputBundleOptions(output).serverFilePath, serverFilePath);
  });

  it("ignores logs with braces before and after the manifest", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    const output = [
      "{\n  route: '/',\n  items: [ { id: 1 } ]\n}",
      '{"route":"/about"}',
      "unbalanced {",
      manifest,
      "{\n  prerendered: true\n}",
      JSON.stringify({ route: "/" }, undefined, 2),
      '{"done":true}',
    ].join("\n");
    assert.equal(parseOutputBundleOptions(output).serverFilePath, serverFilePath);
  });

  it("parses a Turbo-prefixed manifest", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    const output = `${manifest}\n`.replace(/^/gm, "web:build: ");
    assert.equal(parseOutputBundleOptions(output).serverFilePath, serverFilePath);
  });

  it("parses a Turbo-prefixed manifest for any package name", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    const output = `${manifest}\n`.replace(/^/gm, "@acme/storefront:build: ");
    assert.equal(parseOutputBundleOptions(output).serverFilePath, serverFilePath);
  });

  it("parses colored Turbo output with CRLF line endings", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    const output = `${manifest}\n`
      .replace(/^/gm, "\x1b[36mweb:build:\x1b[0m ")
      .replace(/\n/g, "\r\n");
    assert.equal(parseOutputBundleOptions(output).serverFilePath, serverFilePath);
  });

  it("parses a manifest that follows a partial line", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    assert.equal(parseOutputBundleOptions(`done${manifest}`).serverFilePath, serverFilePath);
    assert.equal(
      parseOutputBundleOptions(`✔ Building...\r${manifest}`).serverFilePath,
      serverFilePath,
    );
  });

  it("parses a single-line manifest", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    const output = JSON.stringify(manifestObject);
    assert.equal(parseOutputBundleOptions(output).serverFilePath, serverFilePath);
  });

  it("parses a manifest with a string wrapped across lines", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    const output = manifest.replace("NG8107", "NG\n8107");
    assert.equal(parseOutputBundleOptions(output).serverFilePath, serverFilePath);
  });

  it("throws when no build manifest is found", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    assert.throws(
      () => parseOutputBundleOptions("> ng build --configuration ${APP_ENV:-development}"),
      /Failed to find valid JSON object from build output/,
    );
  });

  it("names the invalid field when the manifest fails validation", async () => {
    const { parseOutputBundleOptions } = await importUtils;
    const output = [
      JSON.stringify(
        { errors: [], warnings: [], outputPaths: { root: "file:///workspace/dist/app" } },
        undefined,
        2,
      ),
      JSON.stringify({ route: "/" }, undefined, 2),
    ].join("\n");
    assert.throws(() => parseOutputBundleOptions(output), /"browser"/);
  });
});
