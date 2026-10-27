import "./env";
import * as fs from "fs";
import * as http from "http";
import { createRequire } from "module";
import * as path from "path";
import type { NextRoutingManifest } from "../contracts";
import { isGuarded, isValidManifestShape } from "./guard";
import { wrapResponseForGuard } from "./headers";

export interface BootOptions {
  serveDir?: string;
  rootDir?: string;
  argv?: string[];
  env?: NodeJS.ProcessEnv;
}

function isSubpathOrSame(parentDir: string, candidatePath: string): boolean {
  const absParent = path.resolve(parentDir);
  const absCandidate = path.resolve(candidatePath);
  return absCandidate === absParent || absCandidate.startsWith(absParent + path.sep);
}

export function validateRoutingManifest(raw: unknown, rootDir: string): NextRoutingManifest {
  if (!isValidManifestShape(raw)) {
    throw new Error("Invalid next-routing.json schema or routing table.");
  }
  if (typeof raw.nextVersion !== "string" || raw.nextVersion.length === 0) {
    throw new Error("Missing or invalid nextVersion in next-routing.json.");
  }
  if (raw.outputMode !== "standalone") {
    throw new Error(
      `Unsupported outputMode "${String(
        raw.outputMode,
      )}" in next-routing.json; expected "standalone".`,
    );
  }
  for (const field of ["projectDir", "distDir", "serverDir"] as const) {
    const val = raw[field];
    if (typeof val !== "string" || val.length === 0 || path.isAbsolute(val)) {
      throw new Error(
        `Invalid ${field} "${String(
          val,
        )}" in next-routing.json; must be a non-empty relative path.`,
      );
    }
    const resolved = path.resolve(rootDir, val);
    if (!isSubpathOrSame(rootDir, resolved)) {
      throw new Error(`Path traversal detected in ${field} ("${val}"): escapes root "${rootDir}".`);
    }
  }
  return raw;
}

export function parseKeepAliveTimeout(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === "") {
    return undefined;
  }
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

export function parsePort(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!raw || Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed <= 0) {
    return 3000;
  }
  return parsed;
}

export function checkVulnerableNextVersion(nextVersion: string): string | null {
  const clean = nextVersion.trim().replace(/^v/, "");
  if (clean === "16.3.5") {
    return (
      `[serve.js] WARNING: Next.js ${nextVersion} is vulnerable to GHSA-vcvr-r3jv-pc5j (next/og) ` +
      `and 16.3.8 security advisories (CVE-2026-94483, CVE-2026-94543, CVE-2026-94484). ` +
      `Upgrade to next>=16.3.8.`
    );
  }
  if (clean === "16.3.6" || clean === "16.3.7") {
    return (
      `[serve.js] WARNING: Next.js ${nextVersion} is missing security fixes included in 16.3.8 ` +
      `(CVE-2026-94483, CVE-2026-94543, CVE-2026-94484). Upgrade to next>=16.3.8.`
    );
  }
  return null;
}

export function createGuardedRequestListener(
  manifest: NextRoutingManifest,
  nextListener: http.RequestListener,
): http.RequestListener {
  return (req: http.IncomingMessage, res: http.ServerResponse) => {
    void (async () => {
      let guarded = true;
      try {
        guarded = await isGuarded(req, manifest);
      } catch {
        guarded = true;
      }
      wrapResponseForGuard(res, guarded);
      try {
        await Promise.resolve(nextListener(req, res));
      } catch (err) {
        console.error("[serve.js] Unhandled error in Next request listener:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      }
    })();
  };
}

function assertDirectoryExists(dirPath: string, label: string): void {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(dirPath);
  } catch {
    throw new Error(`Missing required ${label} directory at "${dirPath}".`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`Expected ${label} at "${dirPath}" to be a directory, but it is not.`);
  }
}

function assertFileExists(filePath: string, label: string): void {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    throw new Error(`Missing required ${label} file at "${filePath}".`);
  }
  if (!stat.isFile()) {
    throw new Error(`Expected ${label} at "${filePath}" to be a file, but it is not.`);
  }
}

export async function boot(options: BootOptions = {}): Promise<void> {
  // 1. Ensure NODE_ENV=production before any require
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";

  const serveDir = options.serveDir ?? __dirname;
  const root = options.rootDir ?? path.resolve(serveDir, "..");
  const argv = options.argv ?? process.argv.slice(2);
  const env = options.env ?? process.env;

  try {
    // 2. Read and validate .cloudrun/next-routing.json
    const manifestPath = path.join(serveDir, "next-routing.json");
    assertFileExists(manifestPath, "next-routing.json");
    const manifestRaw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const m = validateRoutingManifest(manifestRaw, root);

    // 3. Determine mode (standalone vs --project) and bootDir
    const project = argv.includes("--project");
    const mode = project ? "project" : "standalone";
    const bootDir = path.resolve(root, project ? m.projectDir : m.serverDir);

    // 4. Compute distDirRel and verify bootDir, required-server-files.json, and static/
    const distDirRel = path.relative(
      path.resolve(root, m.projectDir),
      path.resolve(root, m.distDir),
    );
    if (!distDirRel || path.isAbsolute(distDirRel) || distDirRel.startsWith("..")) {
      throw new Error(
        `Invalid relative distDir "${distDirRel}" computed from projectDir="${m.projectDir}" and distDir="${m.distDir}".`,
      );
    }

    assertDirectoryExists(bootDir, `bootDir (${mode})`);
    const bootPkgPath = path.join(bootDir, "package.json");
    assertFileExists(bootPkgPath, "bootDir package.json");

    const rsfPath = path.join(bootDir, distDirRel, "required-server-files.json");
    assertFileExists(rsfPath, "required-server-files.json");
    const rsfRaw = JSON.parse(fs.readFileSync(rsfPath, "utf8"));
    if (
      !rsfRaw ||
      typeof rsfRaw !== "object" ||
      !rsfRaw.config ||
      typeof rsfRaw.config !== "object"
    ) {
      throw new Error(
        `Invalid required-server-files.json at "${rsfPath}": missing "config" object.`,
      );
    }

    const staticDirPath = path.join(bootDir, distDirRel, "static");
    assertDirectoryExists(staticDirPath, `${distDirRel}/static`);

    // 5. chdir(bootDir)
    process.chdir(bootDir);

    // 6. Set __NEXT_PRIVATE_STANDALONE_CONFIG
    process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(rsfRaw.config);

    // Log security warning if Next version is in 16.3.5..16.3.7
    const vulnWarn = checkVulnerableNextVersion(m.nextVersion);
    if (vulnWarn) {
      console.warn(vulnWarn);
    }

    // 7. Resolve Next's start-server from bootDir
    const bootRequire = createRequire(bootPkgPath);
    const startServerMod = bootRequire("next/dist/server/lib/start-server") as {
      startServer?: (opts: Record<string, unknown>) => Promise<unknown>;
      default?: {
        startServer?: (opts: Record<string, unknown>) => Promise<unknown>;
      };
    };
    const startServer = startServerMod.startServer ?? startServerMod.default?.startServer;
    if (typeof startServer !== "function") {
      throw new Error(
        `Failed to load startServer function from next/dist/server/lib/start-server in "${bootDir}".`,
      );
    }

    const port = parsePort(env.PORT);
    const keepAliveTimeout = parseKeepAliveTimeout(env.KEEP_ALIVE_TIMEOUT);

    // 8 & 9. Wrap http.createServer ONLY around the synchronous startServer() call.
    // Use CJS require("http") directly so we mutate Node's actual `http` module export
    // (not an ESM namespace wrapper created by TypeScript/esbuild).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const httpMod = require("http") as {
      createServer: typeof http.createServer;
    };
    const origCreateServer = httpMod.createServer;
    let attached = 0;
    let serverPromise: Promise<unknown>;

    try {
      httpMod.createServer = function (...args: Parameters<typeof http.createServer>) {
        const lastIdx = args.length - 1;
        if (lastIdx >= 0 && typeof args[lastIdx] === "function") {
          const nextListener = args[lastIdx] as http.RequestListener;
          args[lastIdx] = createGuardedRequestListener(m, nextListener);
          attached++;
        }
        return origCreateServer.apply(httpMod, args);
      } as typeof http.createServer;

      serverPromise = startServer({
        dir: bootDir,
        isDev: false,
        hostname: "0.0.0.0",
        port,
        allowRetry: false,
        keepAliveTimeout,
      });
    } finally {
      httpMod.createServer = origCreateServer;
    }

    if (attached !== 1) {
      throw new Error(
        `Expected http.createServer to attach request guard exactly once during startServer(), but attached=${attached}.`,
      );
    }

    // 10. Emit one startup log line
    const matchersCount = Array.isArray(m.routing.middlewareMatchers)
      ? m.routing.middlewareMatchers.length
      : "all";
    console.log(`[serve.js] mode=${mode} next=${m.nextVersion} guard=on matchers=${matchersCount}`);

    await serverPromise;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[serve.js] Fatal boot error: ${message}`);
    process.exit(1);
  }
}
