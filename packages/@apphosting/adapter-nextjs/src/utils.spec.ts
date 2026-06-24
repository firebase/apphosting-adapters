const importUtils = import("@apphosting/adapter-nextjs/dist/utils.js");
import { describe, it, beforeEach, afterEach } from "mocha";
import assert from "assert";
import fs from "fs";
import path from "path";
import os from "os";
import { RoutesManifest, MiddlewareManifest } from "../src/interfaces.js";

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
