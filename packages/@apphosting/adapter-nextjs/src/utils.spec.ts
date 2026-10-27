const importUtils = import("@apphosting/adapter-nextjs/dist/utils.js");
import { describe, it, beforeEach, afterEach } from "mocha";
import assert from "assert";
import fs from "fs";
import path from "path";
import os from "os";
import { RoutesManifest, MiddlewareManifest } from "../src/interfaces.js";

describe("block vulnerable nextjs versions", () => {
  it("check for vulnerable versions", async () => {
    const { checkNextJSVersion } = await importUtils;

    assert.throws(() => {
      checkNextJSVersion("15.0.0");
    });

    assert.doesNotThrow(() => {
      checkNextJSVersion(undefined);
    });

    assert.doesNotThrow(() => {
      checkNextJSVersion("15.0.5");
    });

    assert.throws(() => {
      checkNextJSVersion("15.4.7");
    });

    assert.doesNotThrow(() => {
      checkNextJSVersion("15.4.8");
    });

    assert.doesNotThrow(() => {
      checkNextJSVersion("14.0.12");
    });

    assert.throws(() => {
      checkNextJSVersion("14.3.0-canary.77");
    });

    assert.throws(() => {
      checkNextJSVersion("14.3.0-canary.78");
    });

    assert.doesNotThrow(() => {
      checkNextJSVersion("14.3.0-canary.76");
    });

    assert.throws(() => {
      checkNextJSVersion("15.0.0-canary.2");
    });

    assert.throws(() => {
      checkNextJSVersion("16.0.6");
    });

    assert.doesNotThrow(() => {
      checkNextJSVersion("16.0.7");
    });

    assert.doesNotThrow(() => {
      checkNextJSVersion("16.3.0-preview");
    });

    assert.throws(() => {
      checkNextJSVersion("15.6.0-canary.1");
    });

    assert.throws(() => {
      checkNextJSVersion("16.1.0-canary.1");
    });
  });
});

describe("manifest utils", () => {
  let tmpDir: string;
  let distDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-manifests-"));
    distDir = ".next";
  });

  it("should load routes manifest", async () => {
    const mockRoutesManifest: RoutesManifest = {
      version: 3,
      basePath: "",
      pages404: true,
      staticRoutes: [],
      dynamicRoutes: [],
      dataRoutes: [],
      headers: [],
      rewrites: [],
      redirects: [],
    };

    const manifestPath = path.join(tmpDir, distDir, "routes-manifest.json");
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(mockRoutesManifest));

    const { loadRouteManifest } = await importUtils;
    const result = loadRouteManifest(tmpDir, distDir);

    assert.deepStrictEqual(result, mockRoutesManifest);
  });

  it("should load middleware manifest", async () => {
    const mockMiddleware: MiddlewareManifest = {
      version: 1,
      sortedMiddleware: ["/"],
      functions: {},
      middleware: {
        "/": {
          files: ["middleware.js"],
          name: "middleware",
          page: "/",
          matchers: [
            {
              regexp: "^(?:\\/(_next\\/data\\/[^/]{1,}))?\\/api\\/([^/.]+)(?:\\/(.*))?",
              originalSource: "/api/*",
            },
          ],
        },
      },
    };

    const manifestPath = path.join(tmpDir, distDir, "server/middleware-manifest.json");
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(mockMiddleware));

    const { loadMiddlewareManifest } = await importUtils;
    const result = loadMiddlewareManifest(tmpDir, distDir);

    assert.deepStrictEqual(result, mockMiddleware);
  });

  it("should write route manifest", async () => {
    const mockManifest: RoutesManifest = {
      version: 3,
      basePath: "",
      pages404: true,
      staticRoutes: [],
      dynamicRoutes: [],
      dataRoutes: [],
      headers: [
        {
          source: "/api/*",
          headers: [{ key: "X-Custom", value: "value" }],
          regex: "^(?:\\/(_next\\/data\\/[^/]{1,}))?\\/api\\/([^/.]+)(?:\\/(.*))?",
        },
      ],
      rewrites: [],
      redirects: [],
    };

    const manifestDir = path.join(tmpDir, distDir);
    fs.mkdirSync(manifestDir, { recursive: true });

    const { writeRouteManifest } = await importUtils;
    await writeRouteManifest(tmpDir, distDir, mockManifest);

    const manifestPath = path.join(tmpDir, distDir, "routes-manifest.json");
    const written = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    assert.deepStrictEqual(written, mockManifest);
  });

  it("should throw when loading non-existent route manifest", async () => {
    const { loadRouteManifest } = await importUtils;

    assert.throws(() => {
      loadRouteManifest(tmpDir, distDir);
    });
  });

  it("should throw when loading non-existent middleware manifest", async () => {
    const { loadMiddlewareManifest } = await importUtils;

    assert.throws(() => {
      loadMiddlewareManifest(tmpDir, distDir);
    });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe("loadConfig", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-load-config-"));
  });

  // Installs a stand-in for Next whose config loader reports the TURBOPACK value it ran with.
  function writeApp(nextVersion: string, buildScript: string): void {
    const nextDir = path.join(tmpDir, "node_modules", "next");
    fs.mkdirSync(path.join(nextDir, "dist", "server"), { recursive: true });
    fs.writeFileSync(
      path.join(nextDir, "package.json"),
      JSON.stringify({ name: "next", version: nextVersion }),
    );
    fs.writeFileSync(
      path.join(nextDir, "dist", "server", "config.js"),
      "exports.default = async () => ({ turbopack: process.env.TURBOPACK });",
    );
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ scripts: { build: buildScript } }),
    );
  }

  it("should set TURBOPACK while loading the config of a Next 16 Turbopack build", async () => {
    writeApp("16.0.0", "next build");
    const { loadConfig } = await importUtils;

    assert.deepStrictEqual(await loadConfig(tmpDir, tmpDir), { turbopack: "auto" });
    assert.strictEqual(process.env.TURBOPACK, undefined);
  });

  it("should not set TURBOPACK for a webpack build", async () => {
    writeApp("16.0.0", "next build --webpack");
    const { loadConfig } = await importUtils;

    assert.deepStrictEqual(await loadConfig(tmpDir, tmpDir), { turbopack: undefined });
  });

  it("should not set TURBOPACK before Next 16", async () => {
    writeApp("15.5.0", "next build");
    const { loadConfig } = await importUtils;

    assert.deepStrictEqual(await loadConfig(tmpDir, tmpDir), { turbopack: undefined });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
