import type * as httpTypes from "http";
import type { NextRoutingManifest } from "../contracts";

// Use CJS require() at top-level so Node 22's built-in stripTypeScriptModuleTypes
// + loadCJSModule works seamlessly with both plain `npm test` (ts-mocha) and
// `NODE_OPTIONS=--no-experimental-strip-types`.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const assert = require("assert") as typeof import("assert");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("child_process") as typeof import("child_process");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs") as typeof import("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const http = require("http") as typeof import("http");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const net = require("net") as typeof import("net");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os = require("os") as typeof import("os");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path") as typeof import("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cjsRequire = (require("module") as typeof import("module")).createRequire(__filename);
const serveIndex = cjsRequire("./index") as typeof import("./index");

const { spawn, spawnSync } = childProcess;
const {
  CDN_CACHE_CONTROL_HEADERS,
  checkVulnerableNextVersion,
  createGuardedRequestListener,
  isGuarded,
  isValidManifestShape,
  NO_STORE_CACHE_CONTROL,
  parseKeepAliveTimeout,
  parsePort,
  rewriteCacheControl,
  rewriteHeadersArray,
  rewriteHeadersObject,
  validateRoutingManifest,
} = serveIndex;

function createBaseManifest(overrides: Partial<NextRoutingManifest> = {}): NextRoutingManifest {
  const base: NextRoutingManifest = {
    version: 1,
    nextVersion: "16.4.3",
    adapterVersion: "0.1.0",
    buildId: "test-build-id",
    outputMode: "standalone",
    projectDir: ".",
    distDir: ".next",
    serverDir: ".next/standalone",
    basePath: "",
    i18n: null,
    routing: {
      caseSensitive: false,
      beforeMiddleware: [
        {
          sourceRegex: "^(?:/((?!\\.well-known(?:/.*)?)(?:[^/]+/)*[^/]+\\.rsc))/?$",
          destination: "/$1",
          has: [{ type: "header", key: "rsc", value: "1" }],
        },
        {
          sourceRegex: "^/((?!\\.well-known(?:/.*)?)(?:[^/]+/)*[^/\\.]+)\\.rsc/?$",
          destination: "/$1",
          has: [{ type: "header", key: "rsc", value: "1" }],
        },
        {
          sourceRegex: "^/((?:[^/]+/)*[^/\\.]+)\\.prefetch\\.rsc/?$",
          destination: "/$1",
          has: [{ type: "header", key: "rsc", value: "1" }],
        },
      ],
      middlewareMatchers: [
        {
          source: "/dashboard/:path*",
          sourceRegex:
            "^(?:/(_next/data/[^/]{1,}))?/dashboard(?:/((?:[^/#?]+?)(?:/(?:[^/#?]+?))*))?(\\.json|\\.rsc|\\.segments/.+\\.segment\\.rsc)?[/#?]?$",
        },
        {
          source: "/x",
          sourceRegex: "^/x$",
        },
      ],
      beforeFiles: [
        {
          sourceRegex: "^/old-before$",
          destination: "/dashboard",
        },
      ],
      afterFiles: [
        {
          sourceRegex: "^/old$",
          destination: "/dashboard",
        },
      ],
      dynamicRoutes: [],
      onMatch: [],
      fallback: [],
      shouldNormalizeNextData: true,
    },
    pathnames: ["/", "/about", "/blog/[slug]", "/dashboard", "/x"],
    middleware: {
      runtime: "nodejs",
      matchers: [
        {
          source: "/dashboard/:path*",
          sourceRegex:
            "^(?:/(_next/data/[^/]{1,}))?/dashboard(?:/((?:[^/#?]+?)(?:/(?:[^/#?]+?))*))?(\\.json|\\.rsc|\\.segments/.+\\.segment\\.rsc)?[/#?]?$",
        },
        {
          source: "/x",
          sourceRegex: "^/x$",
        },
      ],
    },
    routes: [],
    prerenders: [],
    edgeOutputs: [],
  };

  return {
    ...base,
    ...overrides,
    routing: {
      ...base.routing,
      ...(overrides.routing ?? {}),
    },
  };
}

function httpGet(
  port: number,
  reqPath: string,
  headers: Record<string, string> = {},
): Promise<{
  statusCode: number;
  statusMessage: string;
  headers: httpTypes.IncomingHttpHeaders;
  rawHeaders: string[];
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: reqPath,
        method: "GET",
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            statusMessage: res.statusMessage ?? "",
            headers: res.headers,
            rawHeaders: res.rawHeaders,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
    srv.on("error", reject);
  });
}

describe("serve.js — (a) isGuarded URL corpus", () => {
  const manifest = createBaseManifest();

  it("guards direct matches and subpaths", async () => {
    assert.strictEqual(await isGuarded({ url: "/dashboard" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/dashboard/settings/profile" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/x" }, manifest), true);
  });

  it("leaves unguarded routes unguarded", async () => {
    assert.strictEqual(await isGuarded({ url: "/" }, manifest), false);
    assert.strictEqual(await isGuarded({ url: "/about" }, manifest), false);
    assert.strictEqual(await isGuarded({ url: "/blog/post-1" }, manifest), false);
  });

  it("handles case-insensitive matching by default and respects caseSensitive: true", async () => {
    assert.strictEqual(await isGuarded({ url: "/Dashboard" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/DASHBOARD/Settings" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/X" }, manifest), true);

    const caseSensitiveManifest = createBaseManifest({
      routing: {
        ...manifest.routing,
        caseSensitive: true,
      },
    });
    assert.strictEqual(await isGuarded({ url: "/dashboard" }, caseSensitiveManifest), true);
    assert.strictEqual(await isGuarded({ url: "/Dashboard" }, caseSensitiveManifest), false);
  });

  it("handles percent-encoded paths and fails closed on invalid or dangerous encodings", async () => {
    // %62 = 'b', %64 = 'd', %73 = 's'
    assert.strictEqual(await isGuarded({ url: "/dash%62oard" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/%64ashboard/secret" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/dashboard/%73ettings" }, manifest), true);
    // Unguarded percent-encoded path (%6f = 'o')
    assert.strictEqual(await isGuarded({ url: "/ab%6fut" }, manifest), false);

    // Encoded double-slash, backslash, null byte, and malformed % sequences -> guarded (fail closed)
    assert.strictEqual(await isGuarded({ url: "/%2fdashboard" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/%5cdashboard" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/about%00" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/%E0%A4%A" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/%ZZ" }, manifest), true);
  });

  it("guards /_next/data/<buildId>/...json data URLs for both Next-compiled and simple matchers", async () => {
    // Next-compiled matcher on /dashboard and simple matcher ^/x$ on /x
    assert.strictEqual(
      await isGuarded({ url: "/_next/data/test-build-id/dashboard.json" }, manifest),
      true,
    );
    assert.strictEqual(
      await isGuarded({ url: "/_next/data/test-build-id/dashboard/settings.json" }, manifest),
      true,
    );
    assert.strictEqual(
      await isGuarded({ url: "/_next/data/test-build-id/x.json" }, manifest),
      true,
    );
    assert.strictEqual(
      await isGuarded({ url: "/_next/data/test-build-id/about.json" }, manifest),
      false,
    );
  });

  it("guards RSC requests with ?_rsc query and RSC: 1 header", async () => {
    assert.strictEqual(
      await isGuarded({ url: "/dashboard?_rsc=1x2y", headers: { rsc: "1" } }, manifest),
      true,
    );
    assert.strictEqual(
      await isGuarded({ url: "/dashboard.rsc?_rsc=1x2y", headers: { rsc: "1" } }, manifest),
      true,
    );
    assert.strictEqual(
      await isGuarded({ url: "/dashboard.prefetch.rsc", headers: { rsc: "1" } }, manifest),
      true,
    );
    assert.strictEqual(
      await isGuarded({ url: "/about?_rsc=1x2y", headers: { rsc: "1" } }, manifest),
      false,
    );
  });

  it("handles basePath + i18n locales for both Next-compiled and unprefixed matchers", async () => {
    // 1. Unprefixed matcher (as in Tab 2 Appendix B table)
    const i18nUnprefixedManifest = createBaseManifest({
      basePath: "/docs",
      i18n: {
        locales: ["en", "fr"],
        defaultLocale: "en",
      },
      routing: {
        ...manifest.routing,
        middlewareMatchers: [
          {
            source: "/dashboard/:path*",
            sourceRegex: "^/dashboard(?:/.*)?$",
          },
        ],
      },
    });

    assert.strictEqual(
      await isGuarded({ url: "/docs/fr/dashboard" }, i18nUnprefixedManifest),
      true,
    );
    assert.strictEqual(
      await isGuarded({ url: "/docs/en/dashboard/sub" }, i18nUnprefixedManifest),
      true,
    );
    assert.strictEqual(await isGuarded({ url: "/docs/dashboard" }, i18nUnprefixedManifest), true);
    assert.strictEqual(
      await isGuarded({ url: "/docs/FR/Dashboard" }, i18nUnprefixedManifest),
      true,
    );
    assert.strictEqual(
      await isGuarded(
        { url: "/docs/_next/data/test-build-id/dashboard.json" },
        i18nUnprefixedManifest,
      ),
      true,
    );
    assert.strictEqual(
      await isGuarded(
        { url: "/docs/_next/data/test-build-id/fr/dashboard.json" },
        i18nUnprefixedManifest,
      ),
      true,
    );
    assert.strictEqual(await isGuarded({ url: "/docs/fr/blog" }, i18nUnprefixedManifest), false);
    // Request outside basePath is not matched by middleware
    assert.strictEqual(await isGuarded({ url: "/dashboard" }, i18nUnprefixedManifest), false);

    // 2. Next-compiled matcher (with basePath and locale group baked into sourceRegex)
    const i18nNextCompiledManifest = createBaseManifest({
      basePath: "/docs",
      i18n: {
        locales: ["en", "fr"],
        defaultLocale: "en",
      },
      routing: {
        ...manifest.routing,
        middlewareMatchers: [
          {
            source: "/dashboard/:path*",
            sourceRegex:
              "^/docs(?:/(_next/data/[^/]{1,}))?(?:/((?!_next/)[^/.]{1,}))/dashboard(?:/((?:[^/]{1,}(?:/[^/]{1,})*)?))?(?:\\.json)?/?$",
          },
        ],
      },
    });

    assert.strictEqual(
      await isGuarded({ url: "/docs/fr/dashboard" }, i18nNextCompiledManifest),
      true,
    );
    assert.strictEqual(await isGuarded({ url: "/docs/dashboard" }, i18nNextCompiledManifest), true);
    assert.strictEqual(
      await isGuarded(
        { url: "/docs/_next/data/test-build-id/dashboard.json" },
        i18nNextCompiledManifest,
      ),
      true,
    );
    assert.strictEqual(await isGuarded({ url: "/docs/fr/blog" }, i18nNextCompiledManifest), false);
  });

  it("handles trailing slashes on guarded and unguarded routes", async () => {
    assert.strictEqual(await isGuarded({ url: "/dashboard/" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/x/" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/about/" }, manifest), false);
  });

  it("does not guard unguarded URLs rewritten to guarded destinations in next.config", async () => {
    assert.strictEqual(await isGuarded({ url: "/old" }, manifest), false);
    assert.strictEqual(await isGuarded({ url: "/old-before" }, manifest), false);
  });

  it("fails closed on non-origin-form targets (//x, \\x, absolute-form, empty)", async () => {
    assert.strictEqual(await isGuarded({ url: "//x" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "//dashboard" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "\\x" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/\\x" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "/about\\x" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "http://localhost:3000/about" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "https://example.com/dashboard" }, manifest), true);
    assert.strictEqual(await isGuarded({ url: "" }, manifest), true);
    assert.strictEqual(await isGuarded({}, manifest), true);
    assert.strictEqual(await isGuarded(null, manifest), true);
  });

  it("treats undefined middlewareMatchers as match-all and [] as match-none", async () => {
    const undefinedMatchersManifest = createBaseManifest({
      routing: {
        ...manifest.routing,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        middlewareMatchers: undefined as any,
      },
    });
    assert.strictEqual(await isGuarded({ url: "/about" }, undefinedMatchersManifest), true);
    assert.strictEqual(await isGuarded({ url: "/anything" }, undefinedMatchersManifest), true);

    const emptyMatchersManifest = createBaseManifest({
      routing: {
        ...manifest.routing,
        middlewareMatchers: [],
      },
    });
    assert.strictEqual(await isGuarded({ url: "/dashboard" }, emptyMatchersManifest), false);
    assert.strictEqual(await isGuarded({ url: "/about" }, emptyMatchersManifest), false);
  });

  it("fails closed on broken or malformed manifests", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.strictEqual(await isGuarded({ url: "/about" }, null as any), true);
    assert.strictEqual(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await isGuarded({ url: "/about" }, undefined as any),
      true,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.strictEqual(await isGuarded({ url: "/about" }, {} as any), true);

    const badRegexManifest = createBaseManifest({
      routing: {
        ...manifest.routing,
        middlewareMatchers: [{ sourceRegex: "[unclosed-group" }],
      },
    });
    assert.strictEqual(isValidManifestShape(badRegexManifest), false);
    assert.strictEqual(await isGuarded({ url: "/about" }, badRegexManifest), true);
  });
});

describe("serve.js — (b) Header-rewrite table & CDN header stripping", () => {
  it("rewrites Cache-Control according to the header rules table", () => {
    // Guarded, no positive max-age (or max-age=0, or no-store) -> private, no-cache, no-store, max-age=0, must-revalidate
    assert.strictEqual(rewriteCacheControl(undefined, true), NO_STORE_CACHE_CONTROL);
    assert.strictEqual(rewriteCacheControl("", true), NO_STORE_CACHE_CONTROL);
    assert.strictEqual(rewriteCacheControl("s-maxage=31536000", true), NO_STORE_CACHE_CONTROL);
    assert.strictEqual(
      rewriteCacheControl("s-maxage=31536000, stale-while-revalidate", true),
      NO_STORE_CACHE_CONTROL,
    );
    assert.strictEqual(
      rewriteCacheControl("public, max-age=3600, no-store", true),
      NO_STORE_CACHE_CONTROL,
    );
    assert.strictEqual(
      rewriteCacheControl("public, max-age=0, s-maxage=3600", true),
      NO_STORE_CACHE_CONTROL,
    );

    // Guarded, with positive max-age -> drop public and s-maxage; add private; keep the rest
    assert.strictEqual(
      rewriteCacheControl("public, max-age=60, s-maxage=3600", true),
      "private, max-age=60",
    );
    assert.strictEqual(
      rewriteCacheControl("public, max-age=3600, s-maxage=86400", true),
      "private, max-age=3600",
    );
    assert.strictEqual(
      rewriteCacheControl("max-age=60, s-maxage=300, stale-while-revalidate=30", true),
      "private, max-age=60, stale-while-revalidate=30",
    );
    assert.strictEqual(
      rewriteCacheControl("private, max-age=120, must-revalidate", true),
      "private, max-age=120, must-revalidate",
    );

    // Unguarded, s-maxage without max-age -> append ", max-age=0"
    assert.strictEqual(
      rewriteCacheControl("s-maxage=31536000", false),
      "s-maxage=31536000, max-age=0",
    );
    assert.strictEqual(
      rewriteCacheControl("s-maxage=60, stale-while-revalidate=300", false),
      "s-maxage=60, stale-while-revalidate=300, max-age=0",
    );

    // Unguarded, everything else -> untouched
    assert.strictEqual(
      rewriteCacheControl("s-maxage=60, max-age=10", false),
      "s-maxage=60, max-age=10",
    );
    assert.strictEqual(
      rewriteCacheControl("public, max-age=31536000, immutable", false),
      "public, max-age=31536000, immutable",
    );
    assert.strictEqual(rewriteCacheControl(undefined, false), undefined);
  });

  it("rewrites object headers and strips all 4 CDN cache headers when guarded", () => {
    const obj: Record<string, unknown> = {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "CDN-Cache-Control": "public, max-age=86400",
      "Cloudflare-CDN-Cache-Control": "public, max-age=86400",
      "Vercel-CDN-Cache-Control": "public, max-age=86400",
      "Surrogate-Control": "max-age=86400",
      "X-Keep": "1",
    };
    rewriteHeadersObject(obj, true);
    assert.strictEqual(obj["Cache-Control"], "private, max-age=3600");
    assert.strictEqual(obj["CDN-Cache-Control"], undefined);
    assert.strictEqual(obj["Cloudflare-CDN-Cache-Control"], undefined);
    assert.strictEqual(obj["Vercel-CDN-Cache-Control"], undefined);
    assert.strictEqual(obj["Surrogate-Control"], undefined);
    assert.strictEqual(obj["X-Keep"], "1");
  });

  it("rewrites flat-array headers and strips CDN headers when guarded", () => {
    const arr: unknown[] = [
      "Location",
      "/login",
      "Cache-Control",
      "public, s-maxage=60",
      "CDN-Cache-Control",
      "max-age=3600",
      "Cloudflare-CDN-Cache-Control",
      "max-age=3600",
      "Vercel-CDN-Cache-Control",
      "max-age=3600",
      "Surrogate-Control",
      "max-age=3600",
      "X-Redirect-Reason",
      "auth",
    ];
    rewriteHeadersArray(arr, true);
    assert.deepStrictEqual(arr, [
      "Location",
      "/login",
      "Cache-Control",
      NO_STORE_CACHE_CONTROL,
      "X-Redirect-Reason",
      "auth",
    ]);
  });

  it("hooks res.writeHead across object form, flat-array form, and setHeader + implicit flush over real HTTP without mutating caller inputs", async () => {
    const manifest = createBaseManifest();
    let callerObjRef: Record<string, string> | undefined;
    let callerFlatArrRef: string[] | undefined;
    let callerTupleInnerPairRef: [string, string] | undefined;
    let callerTupleArrRef: [string, string][] | undefined;

    const nextListener: httpTypes.RequestListener = (req, res) => {
      if (req.url === "/dashboard/object") {
        const callerHeaders: Record<string, string> = {
          "Cache-Control": "public, max-age=300, s-maxage=600",
          "CDN-Cache-Control": "public, max-age=86400",
          "Cloudflare-CDN-Cache-Control": "public, max-age=86400",
          "Vercel-CDN-Cache-Control": "public, max-age=86400",
          "Surrogate-Control": "max-age=86400",
          "X-Mode": "object",
        };
        callerObjRef = callerHeaders;
        res.writeHead(200, "Custom Object OK", callerHeaders);
        res.end("guarded-object");
        return;
      }
      if (req.url === "/dashboard/array") {
        // Next.js api-utils redirect style: flat array passed to writeHead
        const callerFlatArr = [
          "Location",
          "/login",
          "Cache-Control",
          "s-maxage=31536000",
          "CDN-Cache-Control",
          "public, max-age=3600",
          "Surrogate-Control",
          "max-age=3600",
        ];
        callerFlatArrRef = callerFlatArr;
        res.writeHead(307, callerFlatArr);
        res.end();
        return;
      }
      if (req.url === "/dashboard/tuple-status-msg") {
        const ccPair: [string, string] = ["Cache-Control", "public, max-age=60, s-maxage=3600"];
        const callerTupleArr: [string, string][] = [
          ccPair,
          ["CDN-Cache-Control", "public, max-age=3600"],
          ["X-Tuple", "1"],
        ];
        callerTupleInnerPairRef = ccPair;
        callerTupleArrRef = callerTupleArr;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.writeHead(201, "Tuple Created", callerTupleArr as any);
        res.end("guarded-tuple");
        return;
      }
      if (req.url === "/dashboard/implicit") {
        res.setHeader("Cache-Control", "s-maxage=31536000, stale-while-revalidate");
        for (const cdnHeader of CDN_CACHE_CONTROL_HEADERS) {
          res.setHeader(cdnHeader, "public, max-age=86400");
        }
        // Implicit header flush via res.end() without calling res.writeHead() explicitly
        res.end("guarded-implicit");
        return;
      }
      if (req.url === "/about") {
        res.setHeader("Cache-Control", "s-maxage=31536000");
        res.setHeader("CDN-Cache-Control", "public, max-age=86400");
        res.end("unguarded-about");
        return;
      }
      res.writeHead(404);
      res.end("not-found");
    };

    const server = http.createServer(createGuardedRequestListener(manifest, nextListener));
    const port = await getFreePort();
    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

    try {
      // 1. Object form (+ statusMessage) on guarded route; caller object is untouched
      const resObj = await httpGet(port, "/dashboard/object");
      assert.strictEqual(resObj.statusCode, 200);
      assert.strictEqual(resObj.statusMessage, "Custom Object OK");
      assert.strictEqual(resObj.headers["cache-control"], "private, max-age=300");
      for (const h of CDN_CACHE_CONTROL_HEADERS) {
        assert.strictEqual(resObj.headers[h], undefined, `Expected ${h} to be stripped`);
      }
      assert.strictEqual(resObj.headers["x-mode"], "object");
      assert.deepStrictEqual(callerObjRef, {
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "CDN-Cache-Control": "public, max-age=86400",
        "Cloudflare-CDN-Cache-Control": "public, max-age=86400",
        "Vercel-CDN-Cache-Control": "public, max-age=86400",
        "Surrogate-Control": "max-age=86400",
        "X-Mode": "object",
      });

      // 2. Flat-array form on guarded route; caller array is untouched
      const resArr = await httpGet(port, "/dashboard/array");
      assert.strictEqual(resArr.statusCode, 307);
      assert.strictEqual(resArr.headers["location"], "/login");
      assert.strictEqual(resArr.headers["cache-control"], NO_STORE_CACHE_CONTROL);
      for (const h of CDN_CACHE_CONTROL_HEADERS) {
        assert.strictEqual(resArr.headers[h], undefined, `Expected ${h} to be stripped`);
      }
      assert.deepStrictEqual(callerFlatArrRef, [
        "Location",
        "/login",
        "Cache-Control",
        "s-maxage=31536000",
        "CDN-Cache-Control",
        "public, max-age=3600",
        "Surrogate-Control",
        "max-age=3600",
      ]);

      // 3. Tuple-array form + statusMessage on guarded route; outer & inner arrays are untouched
      const resTuple = await httpGet(port, "/dashboard/tuple-status-msg");
      assert.strictEqual(resTuple.statusCode, 201);
      assert.strictEqual(resTuple.statusMessage, "Tuple Created");
      assert.strictEqual(resTuple.headers["cache-control"], "private, max-age=60");
      assert.strictEqual(resTuple.headers["cdn-cache-control"], undefined);
      assert.strictEqual(resTuple.headers["x-tuple"], "1");
      assert.deepStrictEqual(callerTupleInnerPairRef, [
        "Cache-Control",
        "public, max-age=60, s-maxage=3600",
      ]);
      assert.deepStrictEqual(callerTupleArrRef, [
        ["Cache-Control", "public, max-age=60, s-maxage=3600"],
        ["CDN-Cache-Control", "public, max-age=3600"],
        ["X-Tuple", "1"],
      ]);

      // 4. Implicit header flush after setHeader on guarded route
      const resImp = await httpGet(port, "/dashboard/implicit");
      assert.strictEqual(resImp.statusCode, 200);
      assert.strictEqual(resImp.headers["cache-control"], NO_STORE_CACHE_CONTROL);
      for (const h of CDN_CACHE_CONTROL_HEADERS) {
        assert.strictEqual(resImp.headers[h], undefined, `Expected ${h} to be stripped`);
      }

      // 5. Unguarded route with s-maxage without max-age -> appends max-age=0 and keeps CDN headers
      const resUnguarded = await httpGet(port, "/about");
      assert.strictEqual(resUnguarded.statusCode, 200);
      assert.strictEqual(resUnguarded.headers["cache-control"], "s-maxage=31536000, max-age=0");
      assert.strictEqual(resUnguarded.headers["cdn-cache-control"], "public, max-age=86400");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe("serve.js — (c) Boot validation & real next@16.4.3 standalone + --project boot test", function (this: Mocha.Context) {
  this.timeout(30000);

  const pkgRoot = path.resolve(__dirname, "../..");
  const distServeJs = path.join(pkgRoot, "dist/serve.js");

  it("validates manifest schema, port, keepAliveTimeout, and vulnerable Next versions", () => {
    const manifest = createBaseManifest();
    assert.strictEqual(validateRoutingManifest(manifest, "/app"), manifest);
    assert.throws(() => validateRoutingManifest({ ...manifest, serverDir: "../escape" }, "/app"));
    assert.throws(() =>
      validateRoutingManifest({ ...manifest, outputMode: "export" as "standalone" }, "/app"),
    );
    assert.throws(
      () =>
        validateRoutingManifest(
          createBaseManifest({
            routing: {
              ...manifest.routing,
              middlewareMatchers: [{ sourceRegex: "[unclosed-group" }],
            },
          }),
          "/app",
        ),
      /Invalid next-routing\.json schema/,
    );

    assert.strictEqual(parsePort("8080"), 8080);
    assert.strictEqual(parsePort(""), 3000);
    assert.strictEqual(parsePort(undefined), 3000);
    assert.strictEqual(parsePort("abc"), 3000);
    assert.strictEqual(parsePort("0"), 3000);
    assert.strictEqual(parsePort("-1"), 3000);
    assert.strictEqual(parsePort("65536"), 3000);
    assert.strictEqual(parsePort("70000"), 3000);
    assert.strictEqual(parsePort("3000.5"), 3000);

    assert.strictEqual(parseKeepAliveTimeout(undefined), undefined);
    assert.strictEqual(parseKeepAliveTimeout("-5"), undefined);
    assert.strictEqual(parseKeepAliveTimeout("abc"), undefined);
    assert.strictEqual(parseKeepAliveTimeout("65000"), 65000);

    assert.ok(checkVulnerableNextVersion("16.3.5")?.includes("GHSA-vcvr-r3jv-pc5j"));
    assert.ok(checkVulnerableNextVersion("16.3.7")?.includes("CVE-2026-94483"));
    assert.strictEqual(checkVulnerableNextVersion("16.3.8"), null);
    assert.strictEqual(checkVulnerableNextVersion("16.4.3"), null);
  });

  it("exits with code 1 when manifest, required-server-files.json, static/, or createServer attachment is invalid", () => {
    assert.ok(
      fs.existsSync(distServeJs),
      `Expected bundled ${distServeJs} to exist (run npm run build first)`,
    );

    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "serve-guard-neg-"));
    try {
      const cloudrunDir = path.join(tmpRoot, ".cloudrun");
      fs.mkdirSync(cloudrunDir, { recursive: true });
      fs.copyFileSync(distServeJs, path.join(cloudrunDir, "serve.js"));

      // 1. Missing next-routing.json -> exit 1
      const r1 = spawnSync(process.execPath, [path.join(cloudrunDir, "serve.js")], {
        encoding: "utf8",
      });
      assert.strictEqual(r1.status, 1);
      assert.ok(r1.stderr.includes("next-routing.json"));

      // Write valid next-routing.json
      const manifest = createBaseManifest();
      fs.writeFileSync(path.join(cloudrunDir, "next-routing.json"), JSON.stringify(manifest));
      const serverDir = path.join(tmpRoot, ".next/standalone");
      fs.mkdirSync(path.join(serverDir, ".next"), { recursive: true });
      fs.writeFileSync(
        path.join(serverDir, "package.json"),
        JSON.stringify({ name: "app", version: "1.0.0" }),
      );

      // 2. Missing required-server-files.json -> exit 1
      const r2 = spawnSync(process.execPath, [path.join(cloudrunDir, "serve.js")], {
        encoding: "utf8",
      });
      assert.strictEqual(r2.status, 1);
      assert.ok(r2.stderr.includes("required-server-files.json"));

      // Write required-server-files.json, but omit .next/static
      fs.writeFileSync(
        path.join(serverDir, ".next/required-server-files.json"),
        JSON.stringify({ config: { distDir: ".next" } }),
      );

      // 3. Missing .next/static -> exit 1
      const r3 = spawnSync(process.execPath, [path.join(cloudrunDir, "serve.js")], {
        encoding: "utf8",
      });
      assert.strictEqual(r3.status, 1);
      assert.ok(r3.stderr.includes("static"));

      // 4. Create .next/static and stub start-server that does NOT call http.createServer -> attached=0 -> exit 1
      fs.mkdirSync(path.join(serverDir, ".next/static"), { recursive: true });
      const fakeNextDir = path.join(serverDir, "node_modules/next/dist/server/lib");
      fs.mkdirSync(fakeNextDir, { recursive: true });
      fs.writeFileSync(
        path.join(fakeNextDir, "start-server.js"),
        "exports.startServer = async function() {};",
      );

      const r4 = spawnSync(process.execPath, [path.join(cloudrunDir, "serve.js")], {
        encoding: "utf8",
      });
      assert.strictEqual(r4.status, 1);
      assert.ok(r4.stderr.includes("attached=0"));
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  const fixtureDir =
    process.env.FAB_E2E_FIXTURE_DIR ||
    path.join(process.env.SMOKE_FIXTURE_DIR || os.tmpdir(), "serve-guard-fixture");
  const shouldRunBootTest =
    process.env.SKIP_BOOT_TESTS !== "1" &&
    (process.env.RUN_BOOT_TESTS === "1" ||
      fs.existsSync(path.join(fixtureDir, ".next/standalone")));

  (shouldRunBootTest ? it : it.skip)(
    "boots dist/serve.js in BOTH standalone and --project modes against a real next@16.4.3 build and enforces guard + header rules",
    async () => {
      const cloudrunDir = path.join(fixtureDir, ".cloudrun");
      fs.mkdirSync(cloudrunDir, { recursive: true });
      fs.writeFileSync(
        path.join(cloudrunDir, "package.json"),
        JSON.stringify({ type: "commonjs" }, null, 2),
      );
      fs.copyFileSync(distServeJs, path.join(cloudrunDir, "serve.js"));

      // Verify there is NO node_modules directory inside .cloudrun/
      assert.strictEqual(
        fs.existsSync(path.join(cloudrunDir, "node_modules")),
        false,
        "Expected .cloudrun/serve.js to run with no adjacent node_modules",
      );

      for (const mode of ["standalone", "project"] as const) {
        const port = await getFreePort();
        const args = [path.join(cloudrunDir, "serve.js")];
        if (mode === "project") {
          args.push("--project");
        }

        let stdout = "";
        let stderr = "";
        const child = spawn(process.execPath, args, {
          cwd: fixtureDir,
          env: {
            ...process.env,
            PORT: String(port),
            KEEP_ALIVE_TIMEOUT: "5000",
          },
          stdio: ["ignore", "pipe", "pipe"],
        });

        child.stdout.on("data", (chunk: Buffer) => {
          stdout += chunk.toString("utf8");
        });
        child.stderr.on("data", (chunk: Buffer) => {
          stderr += chunk.toString("utf8");
        });

        try {
          // Wait for server to accept connections and emit startup log line
          const deadline = Date.now() + 15000;
          let ready = false;
          while (Date.now() < deadline) {
            if (child.exitCode !== null) {
              throw new Error(
                `serve.js (${mode}) exited prematurely with code ${child.exitCode}.\nstdout:\n${stdout}\nstderr:\n${stderr}`,
              );
            }
            try {
              const probe = await httpGet(port, "/about");
              if (probe.statusCode === 200) {
                ready = true;
                break;
              }
            } catch {
              // Still starting up
            }
            await new Promise((r) => setTimeout(r, 100));
          }
          assert.ok(
            ready,
            `serve.js (${mode}) did not become ready in time.\nstdout:\n${stdout}\nstderr:\n${stderr}`,
          );

          // Verify the single startup log line
          assert.ok(
            stdout.includes(`[serve.js] mode=${mode} next=16.4.3 guard=on matchers=2`),
            `Expected startup log line in stdout for mode=${mode}, got:\n${stdout}`,
          );

          // 1. Curl guarded route (/dashboard)
          // Note: in the fixture, /dashboard is a static page where proxy.ts sets
          // x-proxy-ran: 1, CDN-Cache-Control: public, max-age=86400, Surrogate-Control: max-age=86400,
          // and Next.js sets Cache-Control: s-maxage=31536000.
          const guardedRes = await httpGet(port, "/dashboard");
          assert.strictEqual(guardedRes.statusCode, 200);
          assert.strictEqual(guardedRes.headers["x-proxy-ran"], "1");
          assert.strictEqual(
            guardedRes.headers["cache-control"],
            NO_STORE_CACHE_CONTROL,
            `Expected guarded /dashboard in mode=${mode} to have private no-store Cache-Control`,
          );
          assert.strictEqual(
            guardedRes.headers["cdn-cache-control"],
            undefined,
            `Expected CDN-Cache-Control to be stripped on guarded route in mode=${mode}`,
          );
          assert.strictEqual(
            guardedRes.headers["surrogate-control"],
            undefined,
            `Expected Surrogate-Control to be stripped on guarded route in mode=${mode}`,
          );
          assert.ok(guardedRes.body.includes("Dashboard Secret Area"));

          // 2. Curl unguarded route (/about)
          // Next.js emits Cache-Control: s-maxage=31536000 -> serve.js appends ", max-age=0"
          const unguardedRes = await httpGet(port, "/about");
          assert.strictEqual(unguardedRes.statusCode, 200);
          assert.strictEqual(unguardedRes.headers["x-about-header"], "1");
          const unguardedCC = String(unguardedRes.headers["cache-control"] ?? "");
          assert.ok(
            unguardedCC.includes("s-maxage=") && unguardedCC.endsWith(", max-age=0"),
            `Expected unguarded /about in mode=${mode} to append ", max-age=0", got "${unguardedCC}"`,
          );
          assert.ok(unguardedRes.body.includes("About Page"));
        } finally {
          child.kill("SIGTERM");
          await new Promise<void>((resolve) => {
            if (child.exitCode !== null) return resolve();
            child.once("exit", () => resolve());
            setTimeout(() => {
              child.kill("SIGKILL");
              resolve();
            }, 2000);
          });
        }
      }
    },
  );
});
