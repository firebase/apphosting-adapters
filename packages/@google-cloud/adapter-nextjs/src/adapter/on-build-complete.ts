import * as fs from "fs";
import * as path from "path";
import type { NextConfigComplete } from "next/dist/server/config-shared";
import { isSupportedNextVersion } from "./semver";
import { validateRepoRelativePath } from "./paths";
import { ADAPTER_PACKAGE_NAME, buildBundleManifest } from "../manifests/bundle";
import {
  buildNextRoutingManifest,
  type RawAdapterOutput,
  type RawMatcher,
} from "../manifests/routing";
import { serializeBundleYamlV2 } from "../manifests/yaml";
import type { NextRoutingRoute, NextRoutingRscConfig } from "../contracts";

export interface OnBuildCompleteContext {
  routing: {
    beforeMiddleware: NextRoutingRoute[];
    middlewareMatchers: RawMatcher[];
    beforeFiles: NextRoutingRoute[];
    afterFiles: NextRoutingRoute[];
    dynamicRoutes: NextRoutingRoute[];
    onMatch: NextRoutingRoute[];
    fallback: NextRoutingRoute[];
    shouldNormalizeNextData: boolean;
    rsc?: NextRoutingRscConfig;
  };
  outputs: {
    pages: RawAdapterOutput[];
    pagesApi: RawAdapterOutput[];
    appPages: RawAdapterOutput[];
    appRoutes: RawAdapterOutput[];
    prerenders: RawAdapterOutput[];
    staticFiles: RawAdapterOutput[];
    middleware?: RawAdapterOutput;
  };
  projectDir: string;
  repoRoot: string;
  distDir: string;
  config: NextConfigComplete;
  nextVersion: string;
  buildId: string;
}

/**
 * Resolves the bundled `dist/serve.js` file path relative to the compiled adapter module.
 */
export function resolveBundledServeJsPath(customSearchDir?: string): string {
  const baseDir = customSearchDir ?? __dirname;
  const candidates = [
    path.resolve(baseDir, "serve.js"),
    path.resolve(baseDir, "..", "serve.js"),
    path.resolve(baseDir, "..", "dist", "serve.js"),
    path.resolve(baseDir, "..", "..", "dist", "serve.js"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  throw new Error(
    `Could not locate bundled serve.js relative to "${baseDir}" (checked: ${candidates.join(
      ", ",
    )})`,
  );
}

function cleanupBundleYamlIfPresent(repoRoot: string | undefined): void {
  if (typeof repoRoot !== "string" || repoRoot.trim().length === 0) {
    return;
  }
  try {
    const cloudrunDir = path.join(repoRoot, ".cloudrun");
    if (!fs.existsSync(cloudrunDir)) {
      return;
    }
    const bundlePath = path.join(cloudrunDir, "bundle.yaml");
    if (fs.existsSync(bundlePath)) {
      fs.rmSync(bundlePath, { force: true });
    }
    for (const entry of fs.readdirSync(cloudrunDir)) {
      if (entry.startsWith("bundle.yaml.tmp.")) {
        fs.rmSync(path.join(cloudrunDir, entry), { force: true });
      }
    }
  } catch {
    // Ignore cleanup errors during fail-open recovery.
  }
}

/**
 * Implements `NextAdapter.onBuildComplete`.
 *
 * - Never mutates `ctx.config`, `ctx.routing`, or `ctx.outputs`.
 * - Enforces version gate `>=16.3.5 <17.0.0`.
 * - Validates all paths relative to `repoRoot`.
 * - Writes `<repoRoot>/.cloudrun/` in strict order:
 *   1. `package.json` (`{"type":"commonjs"}`)
 *   2. `serve.js` (copied from bundled `dist/serve.js`)
 *   3. `next-routing.json`
 *   4. `bundle.yaml` LAST via write-temp-then-rename.
 * - Any exception logs a console warning, guarantees no `.cloudrun/bundle.yaml` exists,
 *   and never throws.
 */
export function onBuildComplete(ctx: OnBuildCompleteContext): Promise<void> {
  const repoRoot = ctx?.repoRoot;
  // Remove any stale bundle.yaml upfront so a skipped or failed run cannot leave a stale sentinel.
  cleanupBundleYamlIfPresent(repoRoot);

  try {
    if (!ctx || typeof ctx !== "object") {
      throw new Error("onBuildComplete received an invalid context");
    }

    const nextVersion = typeof ctx.nextVersion === "string" ? ctx.nextVersion : "";
    if (!isSupportedNextVersion(nextVersion)) {
      console.warn(
        `[adapter-nextjs] Warning: Next.js version "${nextVersion}" is outside the supported range >=16.3.5 <17.0.0. Skipping .cloudrun/bundle.yaml generation.`,
      );
      return Promise.resolve();
    }

    const serveJsSourcePath = resolveBundledServeJsPath();

    // 1. Build and validate BundleYamlV2 in memory first.
    const computed = buildBundleManifest({
      repoRoot: ctx.repoRoot,
      projectDir: ctx.projectDir,
      distDir: ctx.distDir,
      nextVersion,
      buildId: ctx.buildId,
      config: ctx.config ?? {},
    });

    // 2. Build and validate NextRoutingManifest in memory.
    const routingManifest = buildNextRoutingManifest({
      repoRoot: ctx.repoRoot,
      nextVersion,
      buildId: ctx.buildId,
      outputMode: computed.outputMode,
      projectDir: computed.projectDir,
      distDir: computed.distDir,
      serverDir: computed.serverDir,
      config: (ctx.config ?? {}) as Record<string, unknown>,
      routing: ctx.routing ?? {},
      outputs: ctx.outputs ?? {},
    });

    const bundleYamlContent = serializeBundleYamlV2(computed.bundle);
    const routingJsonContent = JSON.stringify(routingManifest, null, 2) + "\n";
    const packageJsonContent = JSON.stringify({ type: "commonjs" }, null, 2) + "\n";

    // 3. Validate and prepare <repoRoot>/.cloudrun directory.
    const cloudrunRel = validateRepoRelativePath(
      ctx.repoRoot,
      path.join(ctx.repoRoot, ".cloudrun"),
      ".cloudrun",
    );
    const cloudrunDir = path.join(ctx.repoRoot, cloudrunRel);
    fs.mkdirSync(cloudrunDir, { recursive: true });
    // Re-validate after mkdirSync to guard against pre-existing directory symlinks.
    validateRepoRelativePath(ctx.repoRoot, cloudrunDir, ".cloudrun");

    // 4. Write files in strict order:
    //    (a) package.json
    //    (b) serve.js
    //    (c) next-routing.json
    //    (d) bundle.yaml LAST via temp + rename
    const pkgJsonPath = path.join(cloudrunDir, "package.json");
    fs.writeFileSync(pkgJsonPath, packageJsonContent, "utf8");

    const serveJsDestPath = path.join(cloudrunDir, "serve.js");
    fs.copyFileSync(serveJsSourcePath, serveJsDestPath);

    const routingJsonPath = path.join(cloudrunDir, "next-routing.json");
    fs.writeFileSync(routingJsonPath, routingJsonContent, "utf8");

    const bundleYamlPath = path.join(cloudrunDir, "bundle.yaml");
    const tmpBundleYamlPath = path.join(
      cloudrunDir,
      `bundle.yaml.tmp.${process.pid}.${Date.now()}`,
    );
    fs.writeFileSync(tmpBundleYamlPath, bundleYamlContent, "utf8");
    fs.renameSync(tmpBundleYamlPath, bundleYamlPath);

    console.log(
      `[adapter-nextjs] Wrote ${ADAPTER_PACKAGE_NAME} artifacts to ${cloudrunRel}/ (outputMode=${computed.outputMode}, serverDir=${computed.serverDir}).`,
    );
  } catch (err) {
    cleanupBundleYamlIfPresent(repoRoot);
    console.warn(
      "[adapter-nextjs] Warning: onBuildComplete encountered an error; skipping .cloudrun/bundle.yaml emission so the build falls back cleanly:",
      err,
    );
  }
  return Promise.resolve();
}
