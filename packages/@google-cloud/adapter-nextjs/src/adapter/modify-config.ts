import type { NextConfig } from "next";
import { getSecurityAdvisoryWarnings, isSupportedNextVersion } from "./semver";

export interface ModifyConfigContext {
  phase: string;
  nextVersion: string;
  projectDir: string;
}

const PHASE_PRODUCTION_BUILD = "phase-production-build";
const IMAGE_OPTIMIZATION_ENV = "GOOGLE_NEXTJS_IMAGE_OPTIMIZATION";

/** Returns true when the environment variable is set to "true" or "1" (case-insensitive). */
function isEnvFlagEnabled(name: string): boolean {
  const raw = process.env[name];
  if (typeof raw !== "string") {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

/**
 * Implements `NextAdapter.modifyConfig`.
 *
 * - Runs only in `phase-production-build`; returns `config` untouched in all other phases.
 * - Enforces version gate `>=16.3.5 <17.0.0`; warns and returns `config` untouched outside range.
 * - Logs security advisory warnings for `16.3.5` and `<16.3.8` without blocking.
 * - Sets `output: 'standalone'` unless `config.output === 'export'` (preserves user `'standalone'` or `'export'`).
 * - Sets `experimental.turbopackFileSystemCacheForBuild = false` (Cloud Run never restores
 *   `.next/cache`) and logs the change.
 * - Sets `images.unoptimized: true` (image optimization off by default) unless the config uses a
 *   custom image loader (`images.loader` / `images.loaderFile`) or
 *   `GOOGLE_NEXTJS_IMAGE_OPTIMIZATION=true`, and logs which case applied.
 * - Enables `productionBrowserSourceMaps: true` only when `CRASHLYTICS_UPLOAD_MAPPING=true`.
 * - Never mutates the input `config` object in place, and never throws.
 */
export function modifyConfig<T extends NextConfig = NextConfig>(
  config: T,
  ctx: ModifyConfigContext,
): T {
  try {
    if (!config || typeof config !== "object") {
      return config;
    }
    if (!ctx || ctx.phase !== PHASE_PRODUCTION_BUILD) {
      return config;
    }

    const nextVersion = typeof ctx.nextVersion === "string" ? ctx.nextVersion : "";
    if (!isSupportedNextVersion(nextVersion)) {
      console.warn(
        `[adapter-nextjs] Warning: Next.js version "${nextVersion}" is outside the supported range >=16.3.5 <17.0.0. Standing down and leaving NextConfig untouched.`,
      );
      return config;
    }

    for (const warning of getSecurityAdvisoryWarnings(nextVersion)) {
      console.warn(warning);
    }

    let modified: T | null = null;
    const ensureCopy = (): T => {
      if (!modified) {
        modified = { ...config };
      }
      return modified;
    };

    if (config.output === "export") {
      console.log(
        '[adapter-nextjs] NextConfig has output: "export"; preserving static export mode.',
      );
    } else if (config.output === "standalone") {
      console.log('[adapter-nextjs] NextConfig already has output: "standalone"; preserving.');
    } else {
      const target = ensureCopy();
      target.output = "standalone";
      console.log(
        `[adapter-nextjs] Setting NextConfig output to "standalone" (was ${JSON.stringify(
          config.output,
        )}).`,
      );
    }

    // Disable Turbopack's filesystem build cache on production builds. Cloud Run never restores
    // .next/cache, so the ~48 MiB it writes would only bloat unpruned (report-only/off) images.
    const currentTurboCache =
      config.experimental && typeof config.experimental === "object"
        ? (config.experimental as Record<string, unknown>).turbopackFileSystemCacheForBuild
        : undefined;
    if (currentTurboCache !== false) {
      const target = ensureCopy();
      target.experimental = {
        ...(config.experimental ?? {}),
        turbopackFileSystemCacheForBuild: false,
      };
      console.log(
        `[adapter-nextjs] Setting NextConfig experimental.turbopackFileSystemCacheForBuild=false (was ${JSON.stringify(
          currentTurboCache,
        )}).`,
      );
    } else {
      console.log(
        "[adapter-nextjs] NextConfig experimental.turbopackFileSystemCacheForBuild is already false; preserving.",
      );
    }

    // TODO(b/583959150): Turning Next.js image optimization back on for Cloud Run customers is
    // being investigated (e.g. a concurrency limit on /_next/image in serve.js and a disk-cache
    // size based on instance memory). Until then it is off by default, as on App Hosting.
    // `config` already has Next's defaults filled in (`unoptimized: false`), so an explicit
    // `unoptimized: false` can't be detected; GOOGLE_NEXTJS_IMAGE_OPTIMIZATION=true opts back in.
    // A custom loader is never overridden, because `unoptimized: true` would bypass it.
    const images = config.images ?? {};
    const hasCustomLoader =
      (images.loader !== undefined && images.loader !== "default") || !!images.loaderFile;
    if (images.unoptimized === true) {
      console.log("[adapter-nextjs] NextConfig images.unoptimized is already true; preserving.");
    } else if (hasCustomLoader) {
      console.log(
        `[adapter-nextjs] NextConfig uses a custom image loader (images.loader=${JSON.stringify(
          images.loader,
        )}, images.loaderFile=${JSON.stringify(
          images.loaderFile,
        )}); leaving images.unoptimized unchanged so the loader keeps working.`,
      );
    } else if (isEnvFlagEnabled(IMAGE_OPTIMIZATION_ENV)) {
      console.log(
        `[adapter-nextjs] Leaving Next.js image optimization on because ${IMAGE_OPTIMIZATION_ENV}=true.`,
      );
    } else {
      const target = ensureCopy();
      target.images = { ...images, unoptimized: true };
      console.log(
        `[adapter-nextjs] Setting NextConfig images.unoptimized=true (Next.js image optimization is off by default on Cloud Run; set ${IMAGE_OPTIMIZATION_ENV}=true to turn it on).`,
      );
    }

    if (isEnvFlagEnabled("CRASHLYTICS_UPLOAD_MAPPING")) {
      if (config.productionBrowserSourceMaps !== true) {
        const target = ensureCopy();
        target.productionBrowserSourceMaps = true;
        console.log(
          "[adapter-nextjs] Enabling NextConfig productionBrowserSourceMaps=true because CRASHLYTICS_UPLOAD_MAPPING=true.",
        );
      } else {
        console.log(
          "[adapter-nextjs] NextConfig productionBrowserSourceMaps is already true (CRASHLYTICS_UPLOAD_MAPPING=true).",
        );
      }
    }

    return modified ?? config;
  } catch (err) {
    console.warn(
      "[adapter-nextjs] Warning: modifyConfig encountered an unexpected error and left NextConfig untouched:",
      err,
    );
    return config;
  }
}
