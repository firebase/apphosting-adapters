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

describe("validateEnvironment", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should succeed if environment variables are correctly set", async () => {
    const { validateEnvironment } = await importUtils;
    process.env.NG_ALLOWED_HOSTS = "example.com";
    process.env.NG_TRUST_PROXY_HEADERS = "X-Forwarded-Host";
    assert.doesNotThrow(() => validateEnvironment());
  });

  it("should throw an error if NG_ALLOWED_HOSTS is not set", async () => {
    const { validateEnvironment } = await importUtils;
    delete process.env.NG_ALLOWED_HOSTS;
    process.env.NG_TRUST_PROXY_HEADERS = "X-Forwarded-Host";
    assert.throws(
      () => validateEnvironment(),
      /NG_ALLOWED_HOSTS environment variable must be set and not empty/,
    );
  });

  it("should throw an error if NG_ALLOWED_HOSTS is empty", async () => {
    const { validateEnvironment } = await importUtils;
    process.env.NG_ALLOWED_HOSTS = "   ";
    process.env.NG_TRUST_PROXY_HEADERS = "X-Forwarded-Host";
    assert.throws(
      () => validateEnvironment(),
      /NG_ALLOWED_HOSTS environment variable must be set and not empty/,
    );
  });

  it("should throw an error if NG_TRUST_PROXY_HEADERS is not set", async () => {
    const { validateEnvironment } = await importUtils;
    process.env.NG_ALLOWED_HOSTS = "example.com";
    delete process.env.NG_TRUST_PROXY_HEADERS;
    assert.throws(
      () => validateEnvironment(),
      /NG_TRUST_PROXY_HEADERS environment variable must be set to 'X-Forwarded-Host'/,
    );
  });

  it("should throw an error if NG_TRUST_PROXY_HEADERS is not set correctly", async () => {
    const { validateEnvironment } = await importUtils;
    process.env.NG_ALLOWED_HOSTS = "example.com";
    process.env.NG_TRUST_PROXY_HEADERS = "true";
    assert.throws(
      () => validateEnvironment(),
      /NG_TRUST_PROXY_HEADERS environment variable must be set to 'X-Forwarded-Host'/,
    );
  });
});
