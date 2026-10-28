import type * as http from "http";
import { resolveRoutes } from "@next/routing";
import type { NextRoutingManifest } from "../contracts";

export interface GuardRequestLike {
  url?: string;
  headers?: http.IncomingHttpHeaders | Record<string, string | string[] | undefined>;
}

function emptyBody(): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.close();
    },
  });
}

/**
 * Removes trailing `/` characters in linear time. The input is the request path, so a
 * `/\/+$/` regex (polynomial on long runs of `/`) would let a crafted URL burn CPU.
 */
function stripTrailingSlashes(input: string): string {
  let end = input.length;
  while (end > 0 && input.charCodeAt(end - 1) === 47 /* "/" */) {
    end--;
  }
  return input.slice(0, end);
}

export function toHeaders(
  rawHeaders?: http.IncomingHttpHeaders | Record<string, string | string[] | undefined>,
): Headers {
  const headers = new Headers();
  if (!rawHeaders || typeof rawHeaders !== "object") {
    return headers;
  }
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value === undefined) continue;
    try {
      if (Array.isArray(value)) {
        for (const item of value) {
          headers.append(key, String(item));
        }
      } else {
        headers.set(key, String(value));
      }
    } catch {
      // Ignore invalid HTTP header names/values in user request headers
    }
  }
  return headers;
}

export function isValidManifestShape(manifest: unknown): manifest is NextRoutingManifest {
  if (!manifest || typeof manifest !== "object") {
    return false;
  }
  const m = manifest as Partial<NextRoutingManifest>;
  if (m.version !== 1) return false;
  if (typeof m.buildId !== "string" || m.buildId.length === 0) return false;
  if (typeof m.basePath !== "string") return false;
  if (!Array.isArray(m.pathnames)) return false;
  if (!m.routing || typeof m.routing !== "object") return false;

  const r = m.routing;
  if (!Array.isArray(r.beforeMiddleware)) return false;
  if (!Array.isArray(r.beforeFiles)) return false;
  if (!Array.isArray(r.afterFiles)) return false;
  if (!Array.isArray(r.dynamicRoutes)) return false;
  if (!Array.isArray(r.onMatch)) return false;
  if (!Array.isArray(r.fallback)) return false;
  if (r.middlewareMatchers !== undefined && !Array.isArray(r.middlewareMatchers)) {
    return false;
  }
  if (Array.isArray(r.middlewareMatchers)) {
    for (const matcher of r.middlewareMatchers) {
      if (!matcher || typeof matcher.sourceRegex !== "string") {
        return false;
      }
      // Verify regex compiles cleanly; invalid regex throws and fails closed.
      new RegExp(matcher.sourceRegex);
    }
  }
  return true;
}

function pathHasPrefix(pathname: string, prefix: string, caseSensitive: boolean): boolean {
  if (!prefix) return true;
  const normPath = caseSensitive ? pathname : pathname.toLowerCase();
  const normPrefix = caseSensitive ? prefix : prefix.toLowerCase();
  return normPath === normPrefix || normPath.startsWith(normPrefix + "/");
}

function stripBasePath(pathname: string, basePath: string, caseSensitive: boolean): string {
  if (!basePath || !pathHasPrefix(pathname, basePath, caseSensitive)) {
    return pathname;
  }
  const rest = pathname.slice(basePath.length);
  return rest.startsWith("/") ? rest : rest ? `/${rest}` : "/";
}

function stripLocalePrefix(
  pathname: string,
  locales: readonly string[] | undefined,
  caseSensitive: boolean,
): { pathname: string; strippedLocale?: string } {
  if (!locales || locales.length === 0) {
    return { pathname };
  }
  const segments = pathname.split("/");
  const firstSeg = segments[1];
  if (!firstSeg) {
    return { pathname };
  }
  const matched = locales.find((loc) =>
    caseSensitive ? loc === firstSeg : loc.toLowerCase() === firstSeg.toLowerCase(),
  );
  if (!matched) {
    return { pathname };
  }
  const rest = "/" + segments.slice(2).join("/");
  return {
    pathname: rest === "" ? "/" : rest,
    strippedLocale: matched,
  };
}

function normalizeNextDataPath(
  pathname: string,
  buildId: string,
): { normalized: string; wasNextData: boolean } {
  const prefix = `/_next/data/${buildId}/`;
  if (!pathname.startsWith(prefix) || !pathname.endsWith(".json")) {
    return { normalized: pathname, wasNextData: false };
  }
  let inner = pathname.slice(prefix.length - 1, -".json".length);
  if (inner === "/index") {
    inner = "/";
  } else if (inner.endsWith("/index")) {
    inner = inner.slice(0, -"/index".length) || "/";
  }
  return { normalized: inner || "/", wasNextData: true };
}

/**
 * Determines whether Next.js could invoke `proxy.ts` / `middleware.ts` for the given request.
 *
 * Fails closed (`true`) on:
 * - broken or invalid manifest
 * - missing or non-origin-form `req.url` (`http://...`, `//...`, `\...`)
 * - invalid percent-encoding or encoded `//` / `\`
 * - `undefined` `middlewareMatchers` (match-all in `@next/routing`)
 * - any exception thrown during route resolution
 */
export async function isGuarded(
  req: GuardRequestLike | null | undefined,
  manifest: NextRoutingManifest,
): Promise<boolean> {
  try {
    if (!isValidManifestShape(manifest)) {
      return true;
    }

    if (!req || typeof req.url !== "string" || req.url.length === 0) {
      return true;
    }

    const target = req.url;
    // Enforce origin-form target: must start with single '/', no '\\'
    if (!target.startsWith("/") || target.startsWith("//") || target.includes("\\")) {
      return true;
    }

    const rawHost = req.headers?.host;
    const host = (Array.isArray(rawHost) ? rawHost[0] : rawHost)?.trim() || "localhost";
    const parsedUrl = new URL(target, `http://${host}`);

    // Decode pathname upfront to catch invalid %-sequences (URIError -> catch -> true)
    // and encoded '//' or '\' or null byte bypasses.
    const decodedPathname = decodeURIComponent(parsedUrl.pathname);
    if (
      !decodedPathname.startsWith("/") ||
      decodedPathname.startsWith("//") ||
      decodedPathname.includes("\\") ||
      decodedPathname.includes("\0")
    ) {
      return true;
    }

    const r = manifest.routing;
    // Undefined middlewareMatchers means match-all in @next/routing.
    if (r.middlewareMatchers === undefined) {
      return true;
    }
    if (r.middlewareMatchers.length === 0) {
      return false;
    }

    const caseSensitive = r.caseSensitive ?? false;
    const basePath = manifest.basePath || "";

    // If basePath is configured and the request does not start with basePath,
    // Next.js does not invoke middleware for this request.
    if (
      basePath &&
      !pathHasPrefix(parsedUrl.pathname, basePath, caseSensitive) &&
      !pathHasPrefix(decodedPathname, basePath, caseSensitive)
    ) {
      return false;
    }

    const headers = toHeaders(req.headers);

    const runResolveOnUrl = async (
      candidateUrl: URL,
      candidateBasePath: string,
      candidateI18n: NextRoutingManifest["i18n"],
    ): Promise<boolean> => {
      let ran = false;
      await resolveRoutes({
        // Pass a copy so the original URL stays intact for the retry passes below, even if
        // resolveRoutes rewrites the URL it receives.
        url: new URL(candidateUrl.href),
        buildId: manifest.buildId,
        basePath: candidateBasePath,
        i18n: candidateI18n ?? undefined,
        headers,
        requestBody: emptyBody(),
        pathnames: manifest.pathnames,
        routes: {
          caseSensitive,
          beforeMiddleware: r.beforeMiddleware,
          middlewareMatchers: r.middlewareMatchers,
          beforeFiles: r.beforeFiles,
          afterFiles: r.afterFiles,
          dynamicRoutes: r.dynamicRoutes,
          onMatch: r.onMatch,
          fallback: r.fallback,
          shouldNormalizeNextData: r.shouldNormalizeNextData ?? true,
        },
        invokeMiddleware: () => {
          ran = true;
          return Promise.resolve({});
        },
      });
      return ran;
    };

    // 1. Primary check via @next/routing resolveRoutes as-is.
    if (await runResolveOnUrl(parsedUrl, basePath, manifest.i18n)) {
      return true;
    }

    // 2. If percent-decoding changed the pathname (e.g. %2D, %5F), retry on decodedPathname.
    if (decodedPathname !== parsedUrl.pathname) {
      const decodedUrl = new URL(parsedUrl.toString());
      decodedUrl.pathname = decodedPathname;
      if (await runResolveOnUrl(decodedUrl, basePath, manifest.i18n)) {
        return true;
      }
    }

    // 3. Normalization pass for:
    //    - /_next/data/<buildId>/<path>.json (since @next/routing runs shouldInvokeMiddlewareForRequest
    //      before normalizeNextDataUrl, and skips defaultLocale detection on /_next/data URLs)
    //    - basePath + i18n locale prefix stripping (when matchers do not have basePath/locale pre-baked)
    //    - trailing slash normalization (when beforeMiddleware does not already contain the slash redirect)
    const afterBase = stripBasePath(decodedPathname, basePath, caseSensitive);
    const { normalized: afterData, wasNextData } = normalizeNextDataPath(
      afterBase,
      manifest.buildId,
    );
    const { pathname: afterLocale } = stripLocalePrefix(
      afterData,
      manifest.i18n?.locales,
      caseSensitive,
    );
    const trimmedTrailing =
      afterLocale.length > 1 && afterLocale.endsWith("/")
        ? stripTrailingSlashes(afterLocale) || "/"
        : afterLocale;

    const candidates = new Set<string>();
    if (afterLocale !== decodedPathname) {
      candidates.add(afterLocale);
    }
    if (trimmedTrailing !== decodedPathname) {
      candidates.add(trimmedTrailing);
    }
    if (wasNextData && basePath) {
      const withBase = afterLocale === "/" ? basePath : `${basePath}${afterLocale}`;
      candidates.add(withBase);
      if (manifest.i18n?.defaultLocale) {
        const withBaseAndDefaultLocale =
          afterLocale === "/"
            ? `${basePath}/${manifest.i18n.defaultLocale}`
            : `${basePath}/${manifest.i18n.defaultLocale}${afterLocale}`;
        candidates.add(withBaseAndDefaultLocale);
      }
    }

    for (const candidatePath of candidates) {
      const candidateUrl = new URL(parsedUrl.toString());
      candidateUrl.pathname = candidatePath;
      if (await runResolveOnUrl(candidateUrl, "", null)) {
        return true;
      }
      if (
        basePath &&
        pathHasPrefix(candidatePath, basePath, caseSensitive) &&
        (await runResolveOnUrl(candidateUrl, basePath, manifest.i18n))
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return true;
  }
}
