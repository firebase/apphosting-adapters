import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as yaml from "yaml";
import adapter, {
  ADAPTER_PACKAGE_NAME,
  ADAPTER_VERSION,
  modifyConfig,
  onBuildComplete,
  parseSemver,
  isSupportedNextVersion,
  getSecurityAdvisoryWarnings,
  validateRepoRelativePath,
  validateContainedSubpath,
  stripMatcherConditions,
  buildNextRoutingManifest,
  type BundleYamlV2,
  type NextRoutingManifest,
  type OnBuildCompleteContext,
} from "./index";

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const key of Object.keys(obj)) {
      const val = (obj as Record<string, unknown>)[key];
      if (val && typeof val === "object" && !Object.isFrozen(val)) {
        deepFreeze(val);
      }
    }
  }
  return obj;
}

function createSyntheticContext(
  repoRoot: string,
  overrides: Partial<OnBuildCompleteContext> = {},
): OnBuildCompleteContext {
  const projectDir = overrides.projectDir ?? repoRoot;
  const distDir = overrides.distDir ?? path.join(projectDir, ".next");
  return {
    repoRoot,
    projectDir,
    distDir,
    nextVersion: "16.4.3",
    buildId: "test-build-id-123",
    config: {
      output: "standalone",
      distDir: ".next",
      basePath: "",
      trailingSlash: false,
      i18n: null,
      outputFileTracingRoot: repoRoot,
      experimental: {
        caseSensitiveRoutes: false,
      },
      ...(overrides.config ?? {}),
    } as OnBuildCompleteContext["config"],
    routing: {
      beforeMiddleware: [],
      middlewareMatchers: [],
      beforeFiles: [],
      afterFiles: [],
      dynamicRoutes: [],
      onMatch: [],
      fallback: [],
      shouldNormalizeNextData: false,
      ...(overrides.routing ?? {}),
    },
    outputs: {
      pages: [],
      pagesApi: [],
      appPages: [],
      appRoutes: [],
      prerenders: [],
      staticFiles: [],
      ...(overrides.outputs ?? {}),
    },
    ...overrides,
  };
}

describe("@google-cloud/adapter-nextjs", () => {
  let tempDir: string;
  let origCrashlyticsEnv: string | undefined;
  let warnLogs: string[];
  let infoLogs: string[];
  let origWarn: typeof console.warn;
  let origLog: typeof console.log;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "adapter-nextjs-test-"));
    origCrashlyticsEnv = process.env.CRASHLYTICS_UPLOAD_MAPPING;
    delete process.env.CRASHLYTICS_UPLOAD_MAPPING;
    warnLogs = [];
    infoLogs = [];
    origWarn = console.warn;
    origLog = console.log;
    console.warn = (...args: unknown[]) => {
      warnLogs.push(args.map(String).join(" "));
    };
    console.log = (...args: unknown[]) => {
      infoLogs.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.warn = origWarn;
    console.log = origLog;
    if (origCrashlyticsEnv === undefined) {
      delete process.env.CRASHLYTICS_UPLOAD_MAPPING;
    } else {
      process.env.CRASHLYTICS_UPLOAD_MAPPING = origCrashlyticsEnv;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("package export surface", () => {
    it("exports default NextAdapter with name, modifyConfig, and onBuildComplete", () => {
      assert.strictEqual(adapter.name, "@google-cloud/adapter-nextjs");
      assert.strictEqual(typeof adapter.modifyConfig, "function");
      assert.strictEqual(typeof adapter.onBuildComplete, "function");
      // Verify CJS require compatibility
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cjsLoaded = require("./index");
      assert.strictEqual(cjsLoaded.name, "@google-cloud/adapter-nextjs");
      assert.strictEqual(cjsLoaded.default.name, "@google-cloud/adapter-nextjs");
    });
  });

  describe("semver & version gate", () => {
    it("correctly parses semver strings and enforces >=16.3.5 <17.0.0", () => {
      assert.deepStrictEqual(parseSemver("16.4.3"), {
        major: 16,
        minor: 4,
        patch: 3,
        prerelease: undefined,
      });
      assert.strictEqual(isSupportedNextVersion("15.5.28"), false);
      assert.strictEqual(isSupportedNextVersion("16.2.1"), false);
      assert.strictEqual(isSupportedNextVersion("16.3.4"), false);
      assert.strictEqual(isSupportedNextVersion("16.3.5-canary.0"), false);
      assert.strictEqual(isSupportedNextVersion("16.3.5"), true);
      assert.strictEqual(isSupportedNextVersion("16.3.8"), true);
      assert.strictEqual(isSupportedNextVersion("16.4.3"), true);
      assert.strictEqual(isSupportedNextVersion("16.4.3-canary.1"), true);
      assert.strictEqual(isSupportedNextVersion("17.0.0-canary.0"), false);
      assert.strictEqual(isSupportedNextVersion("17.0.0"), false);
      assert.strictEqual(isSupportedNextVersion("not-a-version"), false);
    });

    it("emits security advisory warnings for 16.3.5 and <16.3.8", () => {
      const w1635 = getSecurityAdvisoryWarnings("16.3.5");
      assert.strictEqual(w1635.length, 2);
      assert.ok(w1635.some((w) => w.includes("GHSA-vcvr-r3jv-pc5j")));
      assert.ok(w1635.some((w) => w.includes("CVE-2026-94483")));

      const w1637 = getSecurityAdvisoryWarnings("16.3.7");
      assert.strictEqual(w1637.length, 1);
      assert.ok(w1637[0].includes("CVE-2026-94483"));

      assert.deepStrictEqual(getSecurityAdvisoryWarnings("16.3.8"), []);
      assert.deepStrictEqual(getSecurityAdvisoryWarnings("16.4.3"), []);
    });
  });

  describe("modifyConfig", () => {
    it("leaves config untouched outside phase-production-build", () => {
      const inputConfig = deepFreeze({ reactStrictMode: true });
      for (const phase of [
        "phase-development-server",
        "phase-production-server",
        "phase-export",
        "phase-test",
      ]) {
        const result = modifyConfig(inputConfig, {
          phase,
          nextVersion: "16.4.3",
          projectDir: tempDir,
        });
        assert.strictEqual(result, inputConfig);
      }
      assert.strictEqual(warnLogs.length, 0);
      assert.strictEqual(infoLogs.length, 0);
    });

    it("warns and leaves config untouched for unsupported Next.js versions", () => {
      const inputConfig = deepFreeze({ reactStrictMode: true });
      for (const ver of ["15.4.0", "16.3.4", "17.0.0"]) {
        warnLogs = [];
        const result = modifyConfig(inputConfig, {
          phase: "phase-production-build",
          nextVersion: ver,
          projectDir: tempDir,
        });
        assert.strictEqual(result, inputConfig);
        assert.ok(warnLogs.some((w) => w.includes("outside the supported range")));
      }
    });

    it('sets output="standalone" and experimental.turbopackFileSystemCacheForBuild=false without mutating input', () => {
      const inputConfig = deepFreeze({
        reactStrictMode: true,
        experimental: { serverActions: { bodySizeLimit: "2mb" as const } },
      });
      const result = modifyConfig(inputConfig, {
        phase: "phase-production-build",
        nextVersion: "16.4.3",
        projectDir: tempDir,
      });
      assert.notStrictEqual(result, inputConfig);
      assert.strictEqual(result.output, "standalone");
      assert.strictEqual(
        (result.experimental as Record<string, unknown>).turbopackFileSystemCacheForBuild,
        false,
      );
      assert.deepStrictEqual(result.experimental?.serverActions, {
        bodySizeLimit: "2mb",
      });
      assert.strictEqual(result.productionBrowserSourceMaps, undefined);
      assert.ok(infoLogs.some((l) => l.includes('Setting NextConfig output to "standalone"')));
      assert.ok(infoLogs.some((l) => l.includes("turbopackFileSystemCacheForBuild=false")));
    });

    it('preserves output="export" and output="standalone"', () => {
      const exportConfig = deepFreeze({ output: "export" as const });
      const exportRes = modifyConfig(exportConfig, {
        phase: "phase-production-build",
        nextVersion: "16.4.3",
        projectDir: tempDir,
      });
      assert.strictEqual(exportRes.output, "export");
      assert.ok(infoLogs.some((l) => l.includes("preserving static export mode")));

      infoLogs = [];
      const standaloneConfig = deepFreeze({ output: "standalone" as const });
      const standaloneRes = modifyConfig(standaloneConfig, {
        phase: "phase-production-build",
        nextVersion: "16.4.3",
        projectDir: tempDir,
      });
      assert.strictEqual(standaloneRes.output, "standalone");
      assert.ok(infoLogs.some((l) => l.includes('already has output: "standalone"; preserving')));
    });

    it("enables productionBrowserSourceMaps only when CRASHLYTICS_UPLOAD_MAPPING=true", () => {
      process.env.CRASHLYTICS_UPLOAD_MAPPING = "true";
      const inputConfig = deepFreeze({});
      const result = modifyConfig(inputConfig, {
        phase: "phase-production-build",
        nextVersion: "16.4.3",
        projectDir: tempDir,
      });
      assert.strictEqual(result.productionBrowserSourceMaps, true);
      assert.ok(
        infoLogs.some((l) => l.includes("Enabling NextConfig productionBrowserSourceMaps=true")),
      );
    });

    it("logs security warnings for 16.3.5 and 16.3.7 without blocking", () => {
      const res1635 = modifyConfig(deepFreeze({}), {
        phase: "phase-production-build",
        nextVersion: "16.3.5",
        projectDir: tempDir,
      });
      assert.strictEqual(res1635.output, "standalone");
      assert.ok(warnLogs.some((w) => w.includes("GHSA-vcvr-r3jv-pc5j")));
      assert.ok(warnLogs.some((w) => w.includes("CVE-2026-94483")));

      warnLogs = [];
      const res1637 = modifyConfig(deepFreeze({}), {
        phase: "phase-production-build",
        nextVersion: "16.3.7",
        projectDir: tempDir,
      });
      assert.strictEqual(res1637.output, "standalone");
      assert.ok(!warnLogs.some((w) => w.includes("GHSA-vcvr-r3jv-pc5j")));
      assert.ok(warnLogs.some((w) => w.includes("CVE-2026-94483")));
    });

    it("catches unexpected errors in modifyConfig and returns config untouched", () => {
      const poisonConfig = {} as Record<string, unknown>;
      Object.defineProperty(poisonConfig, "output", {
        get() {
          throw new Error("simulated config getter failure");
        },
      });
      const result = modifyConfig(poisonConfig, {
        phase: "phase-production-build",
        nextVersion: "16.4.3",
        projectDir: tempDir,
      });
      assert.strictEqual(result, poisonConfig);
      assert.ok(warnLogs.some((w) => w.includes("modifyConfig encountered an unexpected error")));
    });

    it("returns a missing config untouched", () => {
      const ctx = { phase: "phase-production-build", nextVersion: "16.4.3", projectDir: tempDir };
      assert.strictEqual(modifyConfig(null as unknown as Record<string, unknown>, ctx), null);
      assert.strictEqual(
        modifyConfig(undefined as unknown as Record<string, unknown>, ctx),
        undefined,
      );
    });
  });

  describe("onBuildComplete", () => {
    it("generates all 4 .cloudrun files for App Router + Pages Router + proxy.ts and strips has/missing & secrets", async () => {
      const secretPreviewId = "secret-preview-mode-id-99999";
      const ctx = createSyntheticContext(tempDir, {
        config: {
          output: "standalone",
          distDir: ".next",
          basePath: "/docs",
          trailingSlash: false,
          i18n: {
            defaultLocale: "en",
            locales: ["en", "fr"],
            localeDetection: false,
          },
          outputFileTracingRoot: tempDir,
          experimental: {
            caseSensitiveRoutes: true,
          },
        } as OnBuildCompleteContext["config"],
        routing: {
          beforeMiddleware: [
            {
              source: "/old",
              sourceRegex: "^/docs/old$",
              destination: "/docs/new",
              status: 308,
            },
          ],
          middlewareMatchers: [
            {
              source: "/((?!api|_next/static).*)",
              sourceRegex: "^/docs(?:/((?!api|_next/static).*))?$",
              has: [{ type: "header", key: "x-custom-auth", value: "1" }],
              missing: [
                {
                  type: "header",
                  key: "x-prerender-revalidate",
                  value: secretPreviewId,
                },
              ],
            },
          ],
          beforeFiles: [],
          afterFiles: [],
          dynamicRoutes: [
            {
              source: "/blog/[slug]",
              sourceRegex: "^/docs/blog/([^/]+?)(?:/)?$",
              destination: "/docs/blog/[slug]?nxtPslug=$1",
              has: [
                {
                  type: "cookie",
                  key: "__prerender_bypass",
                  value: secretPreviewId,
                },
              ],
            },
            {
              source: "/blog/[slug].rsc",
              sourceRegex: "^/docs/blog/([^/]+?)\\.rsc(?:/)?$",
              destination: "/docs/blog/[slug].rsc?nxtPslug=$1",
            },
          ],
          onMatch: [],
          fallback: [],
          shouldNormalizeNextData: true,
        },
        outputs: {
          pages: [
            {
              pathname: "/docs/legacy",
              type: "PAGES",
              runtime: "nodejs",
              filePath: path.join(tempDir, ".next/server/pages/legacy.js"),
            },
          ],
          pagesApi: [
            {
              pathname: "/docs/api/legacy-api",
              type: "PAGES_API",
              runtime: "nodejs",
              filePath: path.join(tempDir, ".next/server/pages/api/legacy-api.js"),
            },
          ],
          appPages: [
            {
              pathname: "/docs",
              type: "APP_PAGE",
              runtime: "nodejs",
              filePath: path.join(tempDir, ".next/server/app/page.js"),
            },
            {
              pathname: "/docs/index.rsc",
              type: "APP_PAGE",
              runtime: "nodejs",
              filePath: path.join(tempDir, ".next/server/app/page.js"),
            },
            {
              pathname: "/docs/blog/[slug]",
              type: "APP_PAGE",
              runtime: "nodejs",
              filePath: path.join(tempDir, ".next/server/app/blog/[slug]/page.js"),
            },
            {
              pathname: "/docs/blog/[slug].rsc",
              type: "APP_PAGE",
              runtime: "nodejs",
              filePath: path.join(tempDir, ".next/server/app/blog/[slug]/page.js"),
            },
            {
              pathname: "/docs/edge-page",
              type: "APP_PAGE",
              runtime: "edge",
              filePath: path.join(tempDir, ".next/server/app/edge-page/page.js"),
            },
          ],
          appRoutes: [
            {
              pathname: "/docs/api/hello",
              type: "APP_ROUTE",
              runtime: "nodejs",
              filePath: path.join(tempDir, ".next/server/app/api/hello/route.js"),
            },
          ],
          prerenders: [
            {
              pathname: "/docs",
              type: "PRERENDER",
              config: {
                renderingMode: "STATIC",
                bypassToken: secretPreviewId,
              },
              fallback: {
                filePath: path.join(tempDir, ".next/server/app/index.html"),
                initialStatus: 200,
              },
            },
            {
              pathname: "/docs/index.rsc",
              type: "PRERENDER",
              config: {
                renderingMode: "STATIC",
                bypassToken: secretPreviewId,
              },
            },
            {
              pathname: "/docs/index.segments/_tree.segment.rsc",
              type: "PRERENDER",
              config: {
                renderingMode: "STATIC",
                bypassToken: secretPreviewId,
              },
            },
            {
              pathname: "/docs/ppr",
              type: "PRERENDER",
              pprChain: { headers: { "next-resume": "1" } },
              config: {
                renderingMode: "PARTIALLY_STATIC",
                bypassToken: secretPreviewId,
              },
            },
          ],
          staticFiles: [
            {
              pathname: "/docs/_next/static/chunks/main-abc.js",
              type: "STATIC_FILE",
              filePath: path.join(tempDir, ".next/static/chunks/main-abc.js"),
            },
            {
              pathname: "/docs/about",
              type: "STATIC_FILE",
              filePath: path.join(tempDir, ".next/server/pages/about.html"),
            },
          ],
          middleware: {
            pathname: "/_middleware",
            type: "MIDDLEWARE",
            runtime: "nodejs",
            filePath: path.join(tempDir, ".next/server/middleware.js"),
            config: {
              matchers: [
                {
                  source: "/((?!api|_next/static).*)",
                  sourceRegex: "^/docs(?:/((?!api|_next/static).*))?$",
                  has: [{ type: "header", key: "x-custom-auth", value: "1" }],
                  missing: [
                    {
                      type: "header",
                      key: "x-prerender-revalidate",
                      value: secretPreviewId,
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      // Deep-freeze input context to verify onBuildComplete never mutates inputs
      deepFreeze(ctx);

      await onBuildComplete(ctx);

      const cloudrunDir = path.join(tempDir, ".cloudrun");
      const pkgJsonRaw = fs.readFileSync(path.join(cloudrunDir, "package.json"), "utf8");
      const serveJsRaw = fs.readFileSync(path.join(cloudrunDir, "serve.js"), "utf8");
      const routingRaw = fs.readFileSync(path.join(cloudrunDir, "next-routing.json"), "utf8");
      const bundleRaw = fs.readFileSync(path.join(cloudrunDir, "bundle.yaml"), "utf8");

      // Verify no temp files left behind
      const filesInCloudrun = fs.readdirSync(cloudrunDir).sort();
      assert.deepStrictEqual(filesInCloudrun, [
        "bundle.yaml",
        "next-routing.json",
        "package.json",
        "serve.js",
      ]);

      // Verify package.json
      assert.deepStrictEqual(JSON.parse(pkgJsonRaw), { type: "commonjs" });
      assert.ok(serveJsRaw.length > 0);

      // Verify secret previewModeId / bypassToken is completely absent from all generated files
      assert.ok(!routingRaw.includes(secretPreviewId));
      assert.ok(!routingRaw.includes("bypassToken"));
      assert.ok(!routingRaw.includes("x-prerender-revalidate"));
      assert.ok(!bundleRaw.includes(secretPreviewId));

      // Verify bundle.yaml
      const bundle = yaml.parse(bundleRaw) as BundleYamlV2;
      assert.strictEqual(bundle.version, "v2");
      assert.deepStrictEqual(bundle.runConfig, {
        runCommand: "node .cloudrun/serve.js",
        projectRunCommand: "node .cloudrun/serve.js --project",
      });
      assert.deepStrictEqual(bundle.metadata, {
        adapterPackageName: ADAPTER_PACKAGE_NAME,
        adapterVersion: ADAPTER_VERSION,
        framework: "nextjs",
        frameworkVersion: "16.4.3",
        buildId: "test-build-id-123",
        outputMode: "standalone",
        projectDir: ".",
        distDir: ".next",
        serverDir: ".next/standalone",
        runtimeManifest: ".cloudrun/next-routing.json",
      });
      assert.deepStrictEqual(bundle.outputFiles, {
        serverApp: {
          include: [".cloudrun", ".next/standalone"],
          copy: [
            { from: "public", to: ".next/standalone/public" },
            { from: ".next/static", to: ".next/standalone/.next/static" },
          ],
        },
      });

      // Verify next-routing.json
      const manifest = JSON.parse(routingRaw) as NextRoutingManifest;
      assert.strictEqual(manifest.version, 1);
      assert.strictEqual(manifest.nextVersion, "16.4.3");
      assert.strictEqual(manifest.adapterVersion, ADAPTER_VERSION);
      assert.strictEqual(manifest.buildId, "test-build-id-123");
      assert.strictEqual(manifest.outputMode, "standalone");
      assert.strictEqual(manifest.projectDir, ".");
      assert.strictEqual(manifest.distDir, ".next");
      assert.strictEqual(manifest.serverDir, ".next/standalone");
      assert.strictEqual(manifest.basePath, "/docs");
      assert.deepStrictEqual(manifest.i18n, {
        defaultLocale: "en",
        locales: ["en", "fr"],
        localeDetection: false,
      });
      assert.strictEqual(manifest.routing.caseSensitive, true);

      // Verify: all has/missing stripped from middlewareMatchers and middleware.matchers
      assert.deepStrictEqual(manifest.routing.middlewareMatchers, [
        {
          source: "/((?!api|_next/static).*)",
          sourceRegex: "^/docs(?:/((?!api|_next/static).*))?$",
        },
      ]);
      assert.deepStrictEqual(manifest.middleware, {
        runtime: "nodejs",
        matchers: [
          {
            source: "/((?!api|_next/static).*)",
            sourceRegex: "^/docs(?:/((?!api|_next/static).*))?$",
          },
        ],
      });

      // Verify: .rsc and .segments/* duplicates dropped from dynamicRoutes, prerenders, pathnames, and routes
      assert.strictEqual(manifest.routing.dynamicRoutes.length, 1);
      assert.strictEqual(manifest.routing.dynamicRoutes[0].source, "/blog/[slug]");
      assert.strictEqual(manifest.routing.dynamicRoutes[0].has, undefined);

      assert.deepStrictEqual(manifest.prerenders, [
        { pathname: "/docs", renderingMode: "STATIC" },
        { pathname: "/docs/ppr", renderingMode: "PARTIALLY_STATIC" },
      ]);
      assert.ok(!manifest.pathnames.includes("/docs/index.rsc"));
      assert.ok(!manifest.pathnames.some((p) => p.includes(".segments/")));
      assert.ok(manifest.pathnames.includes("/docs"));
      assert.ok(manifest.pathnames.includes("/docs/blog/[slug]"));
      assert.ok(manifest.pathnames.includes("/docs/about"));

      // Verify edgeOutputs
      assert.deepStrictEqual(manifest.edgeOutputs, ["/docs/edge-page"]);
    });

    it("handles monorepo layout with default tracingRoot === repoRoot and custom outputFileTracingRoot !== repoRoot", async () => {
      const appDir = path.join(tempDir, "apps", "web");
      const distDir = path.join(appDir, ".next");
      fs.mkdirSync(appDir, { recursive: true });

      // Case 1: tracingRoot === repoRoot (Next's default with NEXT_PRIVATE_OUTPUT_TRACE_ROOT=/workspace)
      const ctxDefaultRoot = createSyntheticContext(tempDir, {
        projectDir: appDir,
        distDir,
        config: {
          output: "standalone",
          distDir: ".next",
          outputFileTracingRoot: tempDir,
        } as OnBuildCompleteContext["config"],
      });
      await onBuildComplete(ctxDefaultRoot);

      const bundle1 = yaml.parse(
        fs.readFileSync(path.join(tempDir, ".cloudrun/bundle.yaml"), "utf8"),
      ) as BundleYamlV2;
      assert.strictEqual(bundle1.metadata.projectDir, "apps/web");
      assert.strictEqual(bundle1.metadata.distDir, "apps/web/.next");
      assert.strictEqual(bundle1.metadata.serverDir, "apps/web/.next/standalone/apps/web");
      assert.deepStrictEqual(bundle1.outputFiles.serverApp.include, [
        ".cloudrun",
        "apps/web/.next/standalone",
      ]);
      assert.deepStrictEqual(bundle1.outputFiles.serverApp.copy, [
        {
          from: "apps/web/public",
          to: "apps/web/.next/standalone/apps/web/public",
        },
        {
          from: "apps/web/.next/static",
          to: "apps/web/.next/standalone/apps/web/.next/static",
        },
      ]);

      // Case 2: user set outputFileTracingRoot = appDir (tracingRoot === projectDir !== repoRoot)
      const ctxCustomRoot = createSyntheticContext(tempDir, {
        projectDir: appDir,
        distDir,
        config: {
          output: "standalone",
          distDir: ".next",
          outputFileTracingRoot: appDir,
        } as OnBuildCompleteContext["config"],
      });
      await onBuildComplete(ctxCustomRoot);

      const bundle2 = yaml.parse(
        fs.readFileSync(path.join(tempDir, ".cloudrun/bundle.yaml"), "utf8"),
      ) as BundleYamlV2;
      assert.strictEqual(bundle2.metadata.projectDir, "apps/web");
      assert.strictEqual(bundle2.metadata.distDir, "apps/web/.next");
      assert.strictEqual(bundle2.metadata.serverDir, "apps/web/.next/standalone");
      assert.deepStrictEqual(bundle2.outputFiles.serverApp.copy, [
        {
          from: "apps/web/public",
          to: "apps/web/.next/standalone/public",
        },
        {
          from: "apps/web/.next/static",
          to: "apps/web/.next/standalone/.next/static",
        },
      ]);
    });

    it('emits an export manifest when config.output === "export"', async () => {
      const ctx = createSyntheticContext(tempDir, {
        config: {
          output: "export",
          distDir: ".next",
          outputFileTracingRoot: tempDir,
        } as OnBuildCompleteContext["config"],
      });
      await onBuildComplete(ctx);

      const bundle = yaml.parse(
        fs.readFileSync(path.join(tempDir, ".cloudrun/bundle.yaml"), "utf8"),
      ) as BundleYamlV2;
      assert.strictEqual(bundle.version, "v2");
      assert.strictEqual(bundle.runConfig, undefined);
      assert.strictEqual(bundle.metadata.outputMode, "export");
      assert.strictEqual(bundle.metadata.serverDir, "out");
      assert.deepStrictEqual(bundle.outputFiles.serverApp, {
        include: [".cloudrun", "out"],
      });

      const routing = JSON.parse(
        fs.readFileSync(path.join(tempDir, ".cloudrun/next-routing.json"), "utf8"),
      ) as NextRoutingManifest;
      assert.strictEqual(routing.outputMode, "export");
      assert.strictEqual(routing.serverDir, "out");
    });

    it("fails open without throwing and leaves no bundle.yaml on path traversal or exception", async () => {
      // Pre-create a stale bundle.yaml to verify it gets cleaned up on failure
      const cloudrunDir = path.join(tempDir, ".cloudrun");
      fs.mkdirSync(cloudrunDir, { recursive: true });
      const bundlePath = path.join(cloudrunDir, "bundle.yaml");
      fs.writeFileSync(bundlePath, "stale: true\n", "utf8");

      const escapingCtx = createSyntheticContext(tempDir, {
        projectDir: path.resolve(tempDir, "..", "outside-repo"),
      });
      await assert.doesNotReject(async () => {
        await onBuildComplete(escapingCtx);
      });
      assert.strictEqual(fs.existsSync(bundlePath), false);
      assert.ok(warnLogs.some((w) => w.includes("onBuildComplete encountered an error")));
    });

    it("rejects symlinks escaping repoRoot", () => {
      const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "adapter-outside-"));
      try {
        const symlinkPath = path.join(tempDir, "evil-link");
        fs.symlinkSync(outsideDir, symlinkPath);
        assert.throws(() => {
          validateRepoRelativePath(tempDir, path.join(symlinkPath, "file.js"));
        }, /escapes repoRoot/);
      } finally {
        fs.rmSync(outsideDir, { recursive: true, force: true });
      }
    });

    it("normalizes trailing slashes and rejects paths outside the base", () => {
      assert.strictEqual(validateRepoRelativePath(tempDir, "apps/web/"), "apps/web");
      assert.strictEqual(
        validateRepoRelativePath(tempDir, "apps/web" + "/".repeat(50000)),
        "apps/web",
      );
      assert.strictEqual(validateContainedSubpath(tempDir, path.join(tempDir, "a", "b")), "a/b");
      assert.strictEqual(validateContainedSubpath(tempDir, tempDir), "");
      assert.throws(() => validateContainedSubpath(path.join(tempDir, "a"), tempDir), /is outside/);
      assert.throws(() => validateRepoRelativePath(tempDir, "../x"), /escapes repoRoot/);
    });

    it("guards every request when a proxy has no matchers (fail closed)", () => {
      const manifest = buildNextRoutingManifest({
        repoRoot: tempDir,
        nextVersion: "16.4.3",
        buildId: "build-1",
        outputMode: "standalone",
        projectDir: ".",
        distDir: ".next",
        serverDir: ".next/standalone",
        config: {},
        routing: {},
        outputs: { middleware: { pathname: "/_middleware", runtime: "nodejs" } as never },
      });
      assert.deepStrictEqual(manifest.routing.middlewareMatchers, [{ sourceRegex: "^.*$" }]);
      assert.deepStrictEqual(manifest.middleware?.matchers, [{ sourceRegex: "^.*$" }]);
    });

    it("turns a malformed proxy matcher into a match-all matcher (fail closed)", () => {
      assert.deepStrictEqual(stripMatcherConditions(null as never), { sourceRegex: "" });
      assert.deepStrictEqual(
        stripMatcherConditions({
          sourceRegex: "^/dashboard$",
          source: "/dashboard",
          has: [{ type: "cookie", key: "session" }],
        } as never),
        { sourceRegex: "^/dashboard$", source: "/dashboard" },
      );
    });
  });

  const smokeIt = process.env.SMOKE_TEST === "1" ? it : it.skip;
  describe("real Next.js P-1 matrix smoke tests (SMOKE_TEST=1)", () => {
    const distIndexJs = path.resolve(__dirname, "..", "dist", "index.js");
    const scratchBaseDir = path.join(
      process.env.SMOKE_FIXTURE_DIR || os.tmpdir(),
      "smoke-p1-matrix",
    );

    function breakConfigHardlinks(dir: string): void {
      for (const rel of [
        "package.json",
        "tsconfig.json",
        "next-env.d.ts",
        "next.config.js",
        "next.config.mjs",
        "turbo.json",
        "apps/web/package.json",
        "apps/web/tsconfig.json",
        "apps/web/next-env.d.ts",
        "apps/web/next.config.mjs",
      ]) {
        const fullPath = path.join(dir, rel);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath);
          fs.unlinkSync(fullPath);
          fs.writeFileSync(fullPath, content);
        }
      }
    }

    function prepareScratchCopy(sourceDir: string, name: string): string {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { execFileSync } = require("child_process") as typeof import("child_process");
      assert.ok(fs.existsSync(distIndexJs), `Expected compiled adapter at ${distIndexJs}`);
      assert.ok(fs.existsSync(sourceDir), `Expected source fixture at ${sourceDir}`);
      fs.mkdirSync(scratchBaseDir, { recursive: true });
      const targetDir = path.join(scratchBaseDir, name);
      fs.rmSync(targetDir, { recursive: true, force: true });
      execFileSync("cp", ["-al", sourceDir, targetDir]);
      breakConfigHardlinks(targetDir);
      for (const cleanRel of [
        ".cloudrun",
        ".next",
        ".turbo",
        "dumps",
        "apps/web/.cloudrun",
        "apps/web/.next",
        "apps/web/.turbo",
      ]) {
        fs.rmSync(path.join(targetDir, cleanRel), {
          recursive: true,
          force: true,
        });
      }
      return targetDir;
    }

    function assertValidCloudrunOutput(
      repoRoot: string,
      expected: {
        frameworkVersion: string;
        projectDir: string;
        distDir: string;
        serverDir: string;
      },
    ): void {
      const cloudrunDir = path.join(repoRoot, ".cloudrun");
      for (const file of ["package.json", "serve.js", "next-routing.json", "bundle.yaml"]) {
        assert.ok(
          fs.existsSync(path.join(cloudrunDir, file)),
          `Expected .cloudrun/${file} to exist in ${repoRoot}`,
        );
      }

      const pkgJson = JSON.parse(fs.readFileSync(path.join(cloudrunDir, "package.json"), "utf8"));
      assert.deepStrictEqual(pkgJson, { type: "commonjs" });

      const bundleRaw = fs.readFileSync(path.join(cloudrunDir, "bundle.yaml"), "utf8");
      const bundle = yaml.parse(bundleRaw) as BundleYamlV2;
      assert.strictEqual(bundle.version, "v2");
      assert.strictEqual(bundle.metadata.outputMode, "standalone");
      assert.strictEqual(bundle.metadata.frameworkVersion, expected.frameworkVersion);
      assert.strictEqual(bundle.metadata.projectDir, expected.projectDir);
      assert.strictEqual(bundle.metadata.distDir, expected.distDir);
      assert.strictEqual(bundle.metadata.serverDir, expected.serverDir);
      assert.strictEqual(bundle.metadata.runtimeManifest, ".cloudrun/next-routing.json");

      // Assert all bundle.yaml paths point to real paths on disk
      assert.ok(
        fs.statSync(path.join(repoRoot, bundle.metadata.projectDir)).isDirectory(),
        `Expected projectDir ${bundle.metadata.projectDir} to exist`,
      );
      assert.ok(
        fs.statSync(path.join(repoRoot, bundle.metadata.distDir)).isDirectory(),
        `Expected distDir ${bundle.metadata.distDir} to exist`,
      );
      assert.ok(
        fs.statSync(path.join(repoRoot, bundle.metadata.serverDir)).isDirectory(),
        `Expected serverDir ${bundle.metadata.serverDir} to exist`,
      );
      assert.ok(
        fs.statSync(path.join(repoRoot, bundle.metadata.serverDir, "server.js")).isFile(),
        `Expected standalone server.js at ${bundle.metadata.serverDir}/server.js`,
      );
      assert.ok(
        fs.statSync(path.join(repoRoot, bundle.metadata.runtimeManifest)).isFile(),
        `Expected runtimeManifest ${bundle.metadata.runtimeManifest} to exist`,
      );

      for (const inc of bundle.outputFiles.serverApp.include) {
        assert.ok(
          fs.existsSync(path.join(repoRoot, inc)),
          `Expected include path ${inc} to exist in ${repoRoot}`,
        );
      }
      assert.ok(
        Array.isArray(bundle.outputFiles.serverApp.copy) &&
          bundle.outputFiles.serverApp.copy.length > 0,
        "Expected non-empty outputFiles.serverApp.copy",
      );
      for (const cp of bundle.outputFiles.serverApp.copy) {
        assert.ok(
          fs.existsSync(path.join(repoRoot, cp.from)),
          `Expected copy.from path ${cp.from} to exist in ${repoRoot}`,
        );
      }

      // Assert next-routing.json parses cleanly and satisfies +
      const routingRaw = fs.readFileSync(path.join(cloudrunDir, "next-routing.json"), "utf8");
      assert.ok(!routingRaw.includes("bypassToken"));
      assert.ok(!routingRaw.includes("x-prerender-revalidate"));
      const routing = JSON.parse(routingRaw) as NextRoutingManifest;
      assert.strictEqual(routing.version, 1);
      assert.strictEqual(routing.nextVersion, expected.frameworkVersion);
      assert.strictEqual(routing.outputMode, "standalone");
      assert.strictEqual(routing.projectDir, expected.projectDir);
      assert.strictEqual(routing.distDir, expected.distDir);
      assert.strictEqual(routing.serverDir, expected.serverDir);
      for (const m of routing.routing.middlewareMatchers) {
        assert.strictEqual((m as Record<string, unknown>).has, undefined);
        assert.strictEqual((m as Record<string, unknown>).missing, undefined);
      }
      assert.ok(!routing.pathnames.some((p) => p.endsWith(".rsc") || p.includes(".segments/")));
    }

    const singleAppVersions: Array<{ version: string; sourceDir: string }> = [
      {
        version: "16.3.5",
        sourceDir: path.join(process.env.SMOKE_FIXTURE_DIR || os.tmpdir(), "probes", "p1-16.3.5"),
      },
      {
        version: "16.3.8",
        sourceDir: path.join(process.env.SMOKE_FIXTURE_DIR || os.tmpdir(), "probes", "p1-16.3.8"),
      },
      {
        version: "16.4.3",
        sourceDir: path.join(
          process.env.SMOKE_FIXTURE_DIR || os.tmpdir(),
          "fixtures",
          "single-app",
        ),
      },
    ];

    for (const { version, sourceDir } of singleAppVersions) {
      for (const bundler of ["turbopack", "webpack"] as const) {
        smokeIt(
          `single-app Next.js ${version} (${bundler}) produces valid .cloudrun bundle & routing manifest`,
          function (this: Mocha.Context) {
            this.timeout(120000);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { execFileSync } = require("child_process") as typeof import("child_process");
            const fixtureDir = prepareScratchCopy(sourceDir, `single-${version}-${bundler}`);
            const childEnv = { ...process.env };
            delete childEnv.NODE_OPTIONS;
            const args = bundler === "webpack" ? ["build", "--webpack"] : ["build"];
            execFileSync(path.join(fixtureDir, "node_modules", ".bin", "next"), args, {
              cwd: fixtureDir,
              env: {
                ...childEnv,
                NEXT_TELEMETRY_DISABLED: "1",
                NEXT_ADAPTER_PATH: distIndexJs,
                NEXT_PRIVATE_OUTPUT_TRACE_ROOT: fixtureDir,
              },
              stdio: "pipe",
            });
            assertValidCloudrunOutput(fixtureDir, {
              frameworkVersion: version,
              projectDir: ".",
              distDir: ".next",
              serverDir: ".next/standalone",
            });
          },
        );
      }
    }

    for (const bundler of ["turbopack", "webpack"] as const) {
      smokeIt(
        `monorepo-pnpm-turbo Next.js 16.4.3 (${bundler}) with NEXT_PRIVATE_OUTPUT_TRACE_ROOT=<repoRoot> produces valid .cloudrun bundle & routing manifest`,
        function (this: Mocha.Context) {
          this.timeout(120000);
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { execFileSync } = require("child_process") as typeof import("child_process");
          const repoRoot = prepareScratchCopy(
            path.join(
              process.env.SMOKE_FIXTURE_DIR || os.tmpdir(),
              "fixtures",
              "monorepo-pnpm-turbo",
            ),
            `monorepo-pnpm-turbo-${bundler}`,
          );
          const childEnv = { ...process.env };
          delete childEnv.NODE_OPTIONS;

          if (bundler === "turbopack") {
            execFileSync(
              path.join(repoRoot, "node_modules", ".bin", "turbo"),
              ["run", "build", "--force"],
              {
                cwd: repoRoot,
                env: {
                  ...childEnv,
                  NEXT_TELEMETRY_DISABLED: "1",
                  NEXT_ADAPTER_PATH: distIndexJs,
                  NEXT_PRIVATE_OUTPUT_TRACE_ROOT: repoRoot,
                },
                stdio: "pipe",
              },
            );
          } else {
            const appDir = path.join(repoRoot, "apps", "web");
            execFileSync(
              path.join(appDir, "node_modules", ".bin", "next"),
              ["build", "--webpack"],
              {
                cwd: appDir,
                env: {
                  ...childEnv,
                  NEXT_TELEMETRY_DISABLED: "1",
                  NEXT_ADAPTER_PATH: distIndexJs,
                  NEXT_PRIVATE_OUTPUT_TRACE_ROOT: repoRoot,
                },
                stdio: "pipe",
              },
            );
          }

          assertValidCloudrunOutput(repoRoot, {
            frameworkVersion: "16.4.3",
            projectDir: "apps/web",
            distDir: "apps/web/.next",
            serverDir: "apps/web/.next/standalone/apps/web",
          });
        },
      );
    }

    for (const bundler of ["turbopack", "webpack"] as const) {
      smokeIt(
        `esm-root-app ("type": "module") Next.js 16.4.3 (${bundler}) produces valid .cloudrun bundle & routing manifest`,
        function (this: Mocha.Context) {
          this.timeout(120000);
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { execFileSync } = require("child_process") as typeof import("child_process");
          const fixtureDir = prepareScratchCopy(
            path.join(process.env.SMOKE_FIXTURE_DIR || os.tmpdir(), "fixtures", "esm-root-app"),
            `esm-root-app-${bundler}`,
          );
          const rootPkg = JSON.parse(
            fs.readFileSync(path.join(fixtureDir, "package.json"), "utf8"),
          );
          assert.strictEqual(rootPkg.type, "module");

          const childEnv = { ...process.env };
          delete childEnv.NODE_OPTIONS;
          const args = bundler === "webpack" ? ["build", "--webpack"] : ["build"];
          execFileSync(path.join(fixtureDir, "node_modules", ".bin", "next"), args, {
            cwd: fixtureDir,
            env: {
              ...childEnv,
              NEXT_TELEMETRY_DISABLED: "1",
              NEXT_ADAPTER_PATH: distIndexJs,
              NEXT_PRIVATE_OUTPUT_TRACE_ROOT: fixtureDir,
            },
            stdio: "pipe",
          });

          assertValidCloudrunOutput(fixtureDir, {
            frameworkVersion: "16.4.3",
            projectDir: ".",
            distDir: ".next",
            serverDir: ".next/standalone",
          });
        },
      );
    }
  });
});
