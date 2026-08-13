import { parse } from "url";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import createNextServer from "next";

import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import type { NextServer } from "next/dist/server/next.js";
import { incomingMessageFromExpress } from "../utils.js";

// @ts-expect-error - Next.js doesn't export the custom server function with proper types
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const nextApp: NextServer = createNextServer({
  dev: false,
  dir: process.cwd(),
  hostname: "0.0.0.0",
  port: 8080,
});

interface RoutesManifestRewrite {
  source: string;
  destination: string;
  regex: string;
  has?: unknown[];
  missing?: unknown[];
}

interface RoutesManifest {
  rewrites:
    | RoutesManifestRewrite[]
    | {
        beforeFiles?: RoutesManifestRewrite[];
        afterFiles?: RoutesManifestRewrite[];
        fallback?: RoutesManifestRewrite[];
      };
}

// Cache for external rewrites
let externalRewritesCache: RoutesManifestRewrite[] | null = null;

/**
 * Load and cache external rewrites from the routes manifest.
 * External rewrites are those with http:// or https:// destinations.
 */
async function getExternalRewrites(): Promise<RoutesManifestRewrite[]> {
  if (externalRewritesCache !== null) {
    return externalRewritesCache;
  }

  try {
    const manifestPath = join(process.cwd(), ".next", "routes-manifest.json");
    const manifestContent = await readFile(manifestPath, "utf-8");
    const manifest: RoutesManifest = JSON.parse(manifestContent);

    let allRewrites: RoutesManifestRewrite[] = [];
    if (Array.isArray(manifest.rewrites)) {
      allRewrites = manifest.rewrites;
    } else if (manifest.rewrites) {
      allRewrites = [
        ...(manifest.rewrites.beforeFiles || []),
        ...(manifest.rewrites.afterFiles || []),
        ...(manifest.rewrites.fallback || []),
      ];
    }

    // Filter to only external URL rewrites
    externalRewritesCache = allRewrites.filter(
      (rewrite) =>
        rewrite.destination.startsWith("http://") || rewrite.destination.startsWith("https://"),
    );

    return externalRewritesCache;
  } catch (err) {
    console.error("Failed to load or parse routes-manifest.json:", err);
    externalRewritesCache = [];
    return externalRewritesCache;
  }
}

/**
 * Handle external URL rewrites by proxying directly.
 * This is needed because Next.js's internal http-proxy doesn't work
 * properly in Cloud Functions due to socket handling issues.
 *
 * Returns true if the request was handled, false otherwise.
 */
async function handleExternalRewrite(req: Request, res: Response): Promise<boolean> {
  const externalRewrites = await getExternalRewrites();
  if (externalRewrites.length === 0) {
    return false;
  }

  const url = req.url || "/";

  for (const rewrite of externalRewrites) {
    const regex = new RegExp(rewrite.regex);
    const match = url.match(regex);

    if (match) {
      try {
        // Build the destination URL by replacing path parameters
        let destination = rewrite.destination;

        // Handle :param* style path parameters using capture groups
        if (match.length > 1) {
          // Replace :path* or similar with the captured group
          const sourceParams = rewrite.source.match(/:([^/]+)\*?/g) || [];
          for (let i = 0; i < sourceParams.length && i + 1 < match.length; i++) {
            const capturedValue = match[i + 1] || "";
            destination = destination.replace(sourceParams[i], capturedValue);
          }
        }

        // Make the proxy request
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.headers)) {
          if (key.toLowerCase() !== "host" && typeof value === "string") {
            headers[key] = value;
          }
        }
        headers["x-forwarded-host"] = req.headers.host || "";

        const fetchOptions: RequestInit = {
          method: req.method,
          headers,
          redirect: "manual",
        };

        // Add body for non-GET/HEAD requests
        if (req.method && !["GET", "HEAD"].includes(req.method) && req.rawBody) {
          // Node.js fetch accepts Buffer directly at runtime
          fetchOptions.body = req.rawBody as unknown as BodyInit;
        }

        const proxyRes = await fetch(destination, fetchOptions);

        // Copy response headers, excluding problematic ones
        // - transfer-encoding: handled by the framework
        // - content-encoding: fetch auto-decompresses
        // - content-length: may change after decompression
        const skipHeaders = new Set(["transfer-encoding", "content-encoding", "content-length"]);
        for (const [key, value] of proxyRes.headers.entries()) {
          if (!skipHeaders.has(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        }

        res.status(proxyRes.status);

        // Get response as buffer and send
        const buffer = Buffer.from(await proxyRes.arrayBuffer());
        res.send(buffer);

        return true;
      } catch (err) {
        console.error("External rewrite proxy error:", err);
        res.status(502).send("Bad Gateway: Failed to proxy to external URL");
        return true;
      }
    }
  }

  return false;
}

export const handle = async (req: Request, res: Response): Promise<void> => {
  // Handle external URL rewrites first, before Next.js processes the request.
  // This is necessary because Next.js's internal http-proxy doesn't work
  // properly in Cloud Functions due to socket handling issues.
  const handled = await handleExternalRewrite(req, res);
  if (handled) {
    return;
  }

  await nextApp.prepare();
  const parsedUrl = parse(req.url, true);
  const incomingMessage = incomingMessageFromExpress(req);
  await nextApp.getRequestHandler()(incomingMessage, res, parsedUrl);
};
