import { loadRouteManifest, writeRouteManifest } from "./utils.js";
import type { MiddlewareMatcher } from "next/dist/build/analysis/get-page-static-info.js";

/**
 * Modifies the app's route manifest (routes-manifest.json) to add Firebase App Hosting
 * specific overrides (i.e headers).
 *
 * It adds the following headers to all routes for which middleware is enabled:
 * - x-fah-middleware: When middleware is enabled.
 * @param distDir The path to the dist directory.
 * @param adapterMetadata The adapter metadata.
 */
export async function addRouteOverrides(distDir: string, middlewareMatchers: MiddlewareMatcher[]) {
  // Add the middleware header to all routes for which middleware is enabled
  const routeManifest = loadRouteManifest(distDir);
  middlewareMatchers.forEach((matcher) => {
    routeManifest.headers.push({
      source: matcher.originalSource,
      headers: [
        {
          key: "x-fah-middleware",
          value: "true",
        },
      ],
      regex: matcher.regexp,
    });
  });
  await writeRouteManifest(distDir, routeManifest);
}
