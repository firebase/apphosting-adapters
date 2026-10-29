import type * as http from "http";

export const NO_STORE_CACHE_CONTROL = "private, no-cache, no-store, max-age=0, must-revalidate";

export const CDN_CACHE_CONTROL_HEADERS = [
  "cdn-cache-control",
  "cloudflare-cdn-cache-control",
  "vercel-cdn-cache-control",
  "surrogate-control",
] as const;

const CDN_HEADER_SET = new Set<string>(CDN_CACHE_CONTROL_HEADERS);

interface ParsedDirective {
  raw: string;
  name: string;
  value?: string;
}

function normalizeHeaderValueToString(
  raw: string | string[] | number | undefined | null,
): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v)).join(", ");
  }
  return String(raw);
}

function parseDirectives(headerValue: string): ParsedDirective[] {
  const parts = headerValue.split(",");
  const result: ParsedDirective[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) {
      result.push({
        raw: trimmed,
        name: trimmed.toLowerCase(),
      });
    } else {
      const name = trimmed.slice(0, eqIdx).trim().toLowerCase();
      const value = trimmed.slice(eqIdx + 1).trim();
      result.push({
        raw: trimmed,
        name,
        value,
      });
    }
  }
  return result;
}

/**
 * Rewrites a Cache-Control header value according to the Pillar 2 guard table:
 * - Guarded, no positive `max-age` (including `max-age=0`) or has `no-store`:
 *   `private, no-cache, no-store, max-age=0, must-revalidate`
 * - Guarded, with positive integer `max-age` (`> 0`) and no `no-store`:
 *   drop `public` and `s-maxage`; add `private`; keep the rest
 * - Unguarded, `s-maxage` without `max-age`:
 *   append `, max-age=0`
 * - Unguarded, everything else:
 *   untouched
 */
export function rewriteCacheControl(
  raw: string | string[] | number | undefined | null,
  guarded: boolean,
): string | undefined {
  const str = normalizeHeaderValueToString(raw);

  if (guarded) {
    if (!str || !str.trim()) {
      return NO_STORE_CACHE_CONTROL;
    }
    const directives = parseDirectives(str);
    if (directives.length === 0) {
      return NO_STORE_CACHE_CONTROL;
    }

    const hasNoStore = directives.some((d) => d.name === "no-store");
    const hasPositiveMaxAge = directives.some(
      (d) =>
        d.name === "max-age" &&
        d.value !== undefined &&
        /^\d+$/.test(d.value) &&
        Number(d.value) > 0,
    );

    if (hasNoStore || !hasPositiveMaxAge) {
      return NO_STORE_CACHE_CONTROL;
    }

    const kept: string[] = [];
    let hasPrivate = false;
    for (const d of directives) {
      if (d.name === "public" || d.name === "s-maxage") {
        continue;
      }
      if (d.name === "private") {
        hasPrivate = true;
        kept.push("private");
      } else {
        kept.push(d.raw);
      }
    }
    if (!hasPrivate) {
      kept.unshift("private");
    }
    return kept.join(", ");
  }

  // Unguarded route
  if (!str || !str.trim()) {
    return str;
  }
  const directives = parseDirectives(str);
  const hasSMaxAge = directives.some((d) => d.name === "s-maxage");
  const hasMaxAge = directives.some((d) => d.name === "max-age");
  if (hasSMaxAge && !hasMaxAge) {
    return `${str.trim()}, max-age=0`;
  }
  return str;
}

export function isCdnCacheHeader(headerName: string): boolean {
  return CDN_HEADER_SET.has(headerName.trim().toLowerCase());
}

/**
 * Rewrites a flat alternating header array (`['Key', 'Val', ...]`) or tuple array (`[['Key', 'Val'], ...]`)
 * in place and returns it.
 */
export function rewriteHeadersArray(
  headersArr: unknown[],
  guarded: boolean,
  fallbackCacheControl?: string | string[] | number,
): unknown[] {
  // Check if tuple form: [['Key', 'Val'], ...]
  if (headersArr.length > 0 && Array.isArray(headersArr[0])) {
    const out: unknown[] = [];
    let sawCacheControl = false;
    for (const entry of headersArr) {
      if (!Array.isArray(entry) || entry.length < 2) {
        out.push(entry);
        continue;
      }
      const key = String(entry[0]);
      const lower = key.toLowerCase();
      if (guarded && isCdnCacheHeader(lower)) {
        continue;
      }
      if (lower === "cache-control") {
        if (sawCacheControl) continue;
        sawCacheControl = true;
        const rewritten = rewriteCacheControl(entry[1] as string | string[] | number, guarded);
        out.push([entry[0], rewritten ?? entry[1]]);
      } else {
        out.push(entry);
      }
    }
    if (!sawCacheControl) {
      const rewritten = rewriteCacheControl(fallbackCacheControl, guarded);
      if (rewritten !== undefined) {
        out.push(["Cache-Control", rewritten]);
      }
    }
    headersArr.splice(0, headersArr.length, ...out);
    return headersArr;
  }

  // Flat alternating array: ['Key1', 'Val1', 'Key2', 'Val2', ...]
  const out: unknown[] = [];
  let sawCacheControl = false;
  for (let i = 0; i < headersArr.length; i += 2) {
    if (i + 1 >= headersArr.length) {
      out.push(headersArr[i]);
      break;
    }
    const key = String(headersArr[i]);
    const val = headersArr[i + 1];
    const lower = key.toLowerCase();
    if (guarded && isCdnCacheHeader(lower)) {
      continue;
    }
    if (lower === "cache-control") {
      if (sawCacheControl) continue;
      sawCacheControl = true;
      const rewritten = rewriteCacheControl(val as string | string[] | number, guarded);
      out.push(key, rewritten ?? val);
    } else {
      out.push(headersArr[i], val);
    }
  }

  if (!sawCacheControl) {
    const rewritten = rewriteCacheControl(fallbackCacheControl, guarded);
    if (rewritten !== undefined) {
      out.push("Cache-Control", rewritten);
    }
  }

  headersArr.splice(0, headersArr.length, ...out);
  return headersArr;
}

/**
 * Rewrites a plain headers object (`Record<string, OutgoingHttpHeader>`) in place and returns it.
 */
export function rewriteHeadersObject(
  headersObj: Record<string, unknown>,
  guarded: boolean,
  fallbackCacheControl?: string | string[] | number,
): Record<string, unknown> {
  let ccKey: string | undefined;
  let ccVal: unknown;

  for (const key of Object.keys(headersObj)) {
    const lower = key.toLowerCase();
    if (guarded && isCdnCacheHeader(lower)) {
      delete headersObj[key];
      continue;
    }
    if (lower === "cache-control") {
      if (ccKey === undefined) {
        ccKey = key;
        ccVal = headersObj[key];
      } else {
        delete headersObj[key];
      }
    }
  }

  if (ccKey !== undefined) {
    const rewritten = rewriteCacheControl(ccVal as string | string[] | number | undefined, guarded);
    if (rewritten !== undefined) {
      headersObj[ccKey] = rewritten;
    }
  } else {
    const rewritten = rewriteCacheControl(fallbackCacheControl, guarded);
    if (rewritten !== undefined) {
      headersObj["Cache-Control"] = rewritten;
    }
  }

  return headersObj;
}

function clearHeaderCaseInsensitive(res: http.ServerResponse, targetLower: string): void {
  // Node stores outgoing headers by lowercased name, so removeHeader is case-insensitive.
  if (typeof res.removeHeader === "function") {
    res.removeHeader(targetLower);
  }
}

/**
 * Hooks `res.writeHead` on a Node `http.ServerResponse` so that Cache-Control and
 * CDN cache headers are rewritten right before headers are serialized (covering
 * explicit `res.writeHead` with object or flat-array headers as well as implicit
 * header flushes via `res.setHeader` + `res.write`/`res.end`).
 */
export function wrapResponseForGuard(
  res: http.ServerResponse,
  guarded: boolean,
): http.ServerResponse {
  const origWriteHead = res.writeHead as (
    this: http.ServerResponse,
    ...args: unknown[]
  ) => http.ServerResponse;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).writeHead = function (
    statusCode: number,
    statusMessageOrHeaders?: unknown,
    maybeHeaders?: unknown,
  ): http.ServerResponse {
    const hasStatusMessage = typeof statusMessageOrHeaders === "string";
    const headersArg = hasStatusMessage ? maybeHeaders : statusMessageOrHeaders;

    const existingCC =
      typeof res.getHeader === "function" ? res.getHeader("cache-control") : undefined;

    if (guarded) {
      for (const cdnHeader of CDN_CACHE_CONTROL_HEADERS) {
        clearHeaderCaseInsensitive(res, cdnHeader);
      }
    }

    let rewrittenHeaders = headersArg;
    if (Array.isArray(headersArg)) {
      clearHeaderCaseInsensitive(res, "cache-control");
      const copy = headersArg.map((entry) => (Array.isArray(entry) ? [...entry] : entry));
      rewrittenHeaders = rewriteHeadersArray(copy, guarded, existingCC);
    } else if (headersArg && typeof headersArg === "object") {
      clearHeaderCaseInsensitive(res, "cache-control");
      const copy = { ...(headersArg as Record<string, unknown>) };
      rewrittenHeaders = rewriteHeadersObject(copy, guarded, existingCC);
    } else {
      const rewritten = rewriteCacheControl(existingCC, guarded);
      if (rewritten !== undefined && typeof res.setHeader === "function") {
        clearHeaderCaseInsensitive(res, "cache-control");
        res.setHeader("Cache-Control", rewritten);
      }
    }

    if (hasStatusMessage) {
      if (rewrittenHeaders !== undefined) {
        return origWriteHead.call(this, statusCode, statusMessageOrHeaders, rewrittenHeaders);
      }
      return origWriteHead.call(this, statusCode, statusMessageOrHeaders);
    }
    if (rewrittenHeaders !== undefined) {
      return origWriteHead.call(this, statusCode, rewrittenHeaders);
    }
    return origWriteHead.call(this, statusCode);
  };

  return res;
}
