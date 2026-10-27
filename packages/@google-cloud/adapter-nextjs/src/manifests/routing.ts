import type {
  NextMiddlewareConfig,
  NextOutputMode,
  NextPrerenderEntry,
  NextRenderingMode,
  NextRouteEntry,
  NextRouteType,
  NextRoutingI18nConfig,
  NextRoutingI18nDomain,
  NextRoutingManifest,
  NextRoutingRoute,
  NextRoutingRouteHas,
  NextRoutingRscConfig,
  NextSanitizedMatcher,
} from "../contracts";
import { ADAPTER_VERSION } from "./bundle";
import { validateRepoRelativePath } from "../adapter/paths";

export interface RawMatcher {
  source?: string;
  sourceRegex: string;
  has?: NextRoutingRouteHas[];
  missing?: NextRoutingRouteHas[];
}

export interface RawAdapterOutput {
  id?: string;
  pathname: string;
  type?: string;
  runtime?: string;
  filePath?: string;
  pprChain?: unknown;
  compute?: string;
  config?: {
    allowQuery?: string[];
    allowHeader?: string[];
    renderingMode?: string;
    bypassToken?: string;
    matchers?: RawMatcher[];
    [key: string]: unknown;
  };
  fallback?: {
    filePath?: string;
    initialStatus?: number;
    initialHeaders?: Record<string, string | string[] | undefined>;
    initialExpiration?: number;
    initialRevalidate?: number | false;
    postponedState?: string;
  };
}

export interface BuildRoutingManifestInput {
  repoRoot: string;
  nextVersion: string;
  buildId: string;
  outputMode: NextOutputMode;
  projectDir: string;
  distDir: string;
  serverDir: string;
  config: {
    basePath?: string;
    trailingSlash?: boolean;
    i18n?: NextRoutingI18nConfig | null;
    experimental?: {
      caseSensitiveRoutes?: boolean;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  routing: {
    beforeMiddleware?: NextRoutingRoute[];
    middlewareMatchers?: RawMatcher[];
    beforeFiles?: NextRoutingRoute[];
    afterFiles?: NextRoutingRoute[];
    dynamicRoutes?: NextRoutingRoute[];
    onMatch?: NextRoutingRoute[];
    fallback?: NextRoutingRoute[];
    shouldNormalizeNextData?: boolean;
    rsc?: NextRoutingRscConfig;
    [key: string]: unknown;
  };
  outputs: {
    pages?: RawAdapterOutput[];
    pagesApi?: RawAdapterOutput[];
    appPages?: RawAdapterOutput[];
    appRoutes?: RawAdapterOutput[];
    prerenders?: RawAdapterOutput[];
    staticFiles?: RawAdapterOutput[];
    middleware?: RawAdapterOutput;
    [key: string]: unknown;
  };
}

const SECRET_CONDITION_KEYS = new Set([
  "x-prerender-revalidate",
  "__prerender_bypass",
  "__next_preview_data",
]);

/**
 * Strips `has` and `missing` from a middleware matcher per design spec &.
 * Never mutates the input matcher object.
 */
export function stripMatcherConditions(matcher: RawMatcher): NextSanitizedMatcher {
  const clean: NextSanitizedMatcher = {
    sourceRegex: String(matcher.sourceRegex ?? ""),
  };
  if (typeof matcher.source === "string") {
    clean.source = matcher.source;
  }
  return clean;
}

function sanitizeConditions(
  conditions: NextRoutingRouteHas[] | undefined,
): NextRoutingRouteHas[] | undefined {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return undefined;
  }
  const filtered: NextRoutingRouteHas[] = [];
  for (const cond of conditions) {
    if (!cond || typeof cond !== "object") {
      continue;
    }
    const keyLower = typeof cond.key === "string" ? cond.key.toLowerCase() : "";
    if (SECRET_CONDITION_KEYS.has(keyLower)) {
      continue;
    }
    const cloned: NextRoutingRouteHas = { ...cond };
    filtered.push(cloned);
  }
  return filtered.length > 0 ? filtered : undefined;
}

function sanitizeRoute(route: NextRoutingRoute): NextRoutingRoute {
  const cloned: NextRoutingRoute = {
    sourceRegex: String(route.sourceRegex ?? ""),
  };
  if (typeof route.source === "string") {
    cloned.source = route.source;
  }
  if (typeof route.destination === "string") {
    cloned.destination = route.destination;
  }
  if (route.headers && typeof route.headers === "object") {
    cloned.headers = { ...route.headers };
  }
  const has = sanitizeConditions(route.has);
  if (has) {
    cloned.has = has;
  }
  const missing = sanitizeConditions(route.missing);
  if (missing) {
    cloned.missing = missing;
  }
  if (typeof route.status === "number") {
    cloned.status = route.status;
  }
  if (typeof route.priority === "boolean") {
    cloned.priority = route.priority;
  }
  return cloned;
}

function cloneI18nConfig(
  i18n: NextRoutingI18nConfig | null | undefined,
): NextRoutingI18nConfig | null {
  if (!i18n || typeof i18n !== "object") {
    return null;
  }
  const cloned: NextRoutingI18nConfig = {
    defaultLocale: String(i18n.defaultLocale ?? ""),
    locales: Array.isArray(i18n.locales) ? [...i18n.locales] : [],
  };
  if (typeof i18n.localeDetection === "boolean") {
    cloned.localeDetection = i18n.localeDetection;
  }
  if (Array.isArray(i18n.domains) && i18n.domains.length > 0) {
    cloned.domains = i18n.domains.map((d: NextRoutingI18nDomain) => ({
      domain: d.domain,
      defaultLocale: d.defaultLocale,
      ...(Array.isArray(d.locales) ? { locales: [...d.locales] } : {}),
      ...(d.http === true ? { http: true } : {}),
    }));
  }
  return cloned;
}

function cloneRscConfig(rsc: NextRoutingRscConfig | undefined): NextRoutingRscConfig | undefined {
  if (!rsc || typeof rsc !== "object") {
    return undefined;
  }
  return {
    header: String(rsc.header ?? ""),
    varyHeader: String(rsc.varyHeader ?? ""),
    prefetchHeader: String(rsc.prefetchHeader ?? ""),
    didPostponeHeader: String(rsc.didPostponeHeader ?? ""),
    contentTypeHeader: String(rsc.contentTypeHeader ?? ""),
    suffix: String(rsc.suffix ?? ""),
    prefetchSegmentHeader: String(rsc.prefetchSegmentHeader ?? ""),
    prefetchSegmentSuffix: String(rsc.prefetchSegmentSuffix ?? ""),
    prefetchSegmentDirSuffix: String(rsc.prefetchSegmentDirSuffix ?? ""),
    clientParamParsing: Boolean(rsc.clientParamParsing),
    ...(Array.isArray(rsc.clientParamParsingOrigins)
      ? { clientParamParsingOrigins: [...rsc.clientParamParsingOrigins] }
      : {}),
    dynamicRSCPrerender: Boolean(rsc.dynamicRSCPrerender),
  };
}

function isSegmentRscPathname(pathname: string): boolean {
  return pathname.includes(".segments/") && pathname.endsWith(".segment.rsc");
}

function getBasePathnameForRsc(pathname: string, basePath: string): string | null {
  if (!pathname.endsWith(".rsc") || isSegmentRscPathname(pathname)) {
    return null;
  }
  const withoutRsc = pathname.slice(0, -4);
  if (withoutRsc === "/index") {
    return "/";
  }
  if (basePath && withoutRsc === `${basePath}/index`) {
    return basePath;
  }
  return withoutRsc || "/";
}

function isDedicatedSegmentRoute(route: NextRoutingRoute): boolean {
  if (typeof route.source === "string" && isSegmentRscPathname(route.source)) {
    return true;
  }
  if (
    typeof route.destination === "string" &&
    route.destination.includes(".segments/") &&
    route.destination.includes(".segment.rsc")
  ) {
    return true;
  }
  return false;
}

function sanitizeRouteList(
  routes: NextRoutingRoute[] | undefined,
  basePath: string,
): NextRoutingRoute[] {
  if (!Array.isArray(routes) || routes.length === 0) {
    return [];
  }
  const baseSources = new Set<string>();
  for (const r of routes) {
    if (
      r &&
      typeof r.source === "string" &&
      !r.source.endsWith(".rsc") &&
      !isDedicatedSegmentRoute(r)
    ) {
      baseSources.add(r.source);
    }
  }
  const result: NextRoutingRoute[] = [];
  for (const r of routes) {
    if (!r || typeof r !== "object") {
      continue;
    }
    if (isDedicatedSegmentRoute(r)) {
      continue;
    }
    if (typeof r.source === "string" && r.source.endsWith(".rsc")) {
      const baseSrc = getBasePathnameForRsc(r.source, basePath);
      if (baseSrc && baseSources.has(baseSrc)) {
        continue;
      }
    }
    result.push(sanitizeRoute(r));
  }
  return result;
}

function isNextStaticAssetPathname(pathname: string, basePath: string): boolean {
  if (pathname.startsWith("/_next/static/")) {
    return true;
  }
  if (basePath && pathname.startsWith(`${basePath}/_next/static/`)) {
    return true;
  }
  return false;
}

/**
 * Builds the `NextRoutingManifest` (`next-routing.json`) per design spec, §3.4.
 *
 * - Never mutates any input object (`config`, `routing`, `outputs`).
 * - Strips all `has` and `missing` from `routing.middlewareMatchers` and `middleware.matchers`.
 * - Never copies `bypassToken`, preview props, or any `x-prerender-revalidate` condition value.
 * - Validates all filesystem paths relative to `repoRoot`.
 * - Omits per-route `assets`/`assetsHashes` and drops `.rsc` / `.segments/*` duplicates (P-9 /).
 */
export function buildNextRoutingManifest(input: BuildRoutingManifestInput): NextRoutingManifest {
  const {
    repoRoot,
    nextVersion,
    buildId,
    outputMode,
    projectDir,
    distDir,
    serverDir,
    config,
    routing,
    outputs,
  } = input;

  const basePath = typeof config?.basePath === "string" ? config.basePath : "";
  const caseSensitive = Boolean(config?.experimental?.caseSensitiveRoutes);
  const i18n = cloneI18nConfig(config?.i18n);
  const rsc = cloneRscConfig(routing?.rsc);

  const rawMiddlewareMatchers = Array.isArray(routing?.middlewareMatchers)
    ? routing.middlewareMatchers
    : Array.isArray(outputs?.middleware?.config?.matchers)
      ? outputs.middleware.config.matchers
      : [];

  const strippedMiddlewareMatchers = rawMiddlewareMatchers.map(stripMatcherConditions);

  // Collect pathnames for @next/routing resolveRoutes (excluding .segments/* and redundant .rsc duplicates per)
  const pathnameSet = new Set<string>();
  const outputLists: Array<RawAdapterOutput[] | undefined> = [
    outputs?.pages,
    outputs?.pagesApi,
    outputs?.appPages,
    outputs?.appRoutes,
    outputs?.prerenders,
    outputs?.staticFiles,
  ];
  const basePathnames = new Set<string>();
  for (const list of outputLists) {
    if (!Array.isArray(list)) {
      continue;
    }
    for (const item of list) {
      if (
        item &&
        typeof item.pathname === "string" &&
        item.pathname.length > 0 &&
        !item.pathname.endsWith(".rsc") &&
        !isSegmentRscPathname(item.pathname)
      ) {
        basePathnames.add(item.pathname);
      }
    }
  }
  for (const list of outputLists) {
    if (!Array.isArray(list)) {
      continue;
    }
    const isStaticFilesList = list === outputs?.staticFiles;
    for (const item of list) {
      if (
        !item ||
        typeof item.pathname !== "string" ||
        item.pathname.length === 0 ||
        isSegmentRscPathname(item.pathname)
      ) {
        continue;
      }
      if (isStaticFilesList && isNextStaticAssetPathname(item.pathname, basePath)) {
        continue;
      }
      const baseRsc = getBasePathnameForRsc(item.pathname, basePath);
      if (baseRsc && basePathnames.has(baseRsc)) {
        continue;
      }
      pathnameSet.add(item.pathname);
    }
  }

  // Build routes list (design spec &: omit assets/assetsHashes and drop .rsc/.segments/* duplicates & /_next/static/* chunks)
  const routeEntries: NextRouteEntry[] = [];
  const seenRouteKeys = new Set<string>();
  const typedOutputGroups: Array<{
    defaultType: NextRouteType;
    items: RawAdapterOutput[] | undefined;
    skipNextStaticChunks?: boolean;
  }> = [
    { defaultType: "PAGES", items: outputs?.pages },
    { defaultType: "PAGES_API", items: outputs?.pagesApi },
    { defaultType: "APP_PAGE", items: outputs?.appPages },
    { defaultType: "APP_ROUTE", items: outputs?.appRoutes },
    {
      defaultType: "STATIC_FILE",
      items: outputs?.staticFiles,
      skipNextStaticChunks: true,
    },
  ];

  for (const group of typedOutputGroups) {
    if (!Array.isArray(group.items)) {
      continue;
    }
    for (const item of group.items) {
      if (!item || typeof item.pathname !== "string" || item.pathname.length === 0) {
        continue;
      }
      if (isSegmentRscPathname(item.pathname)) {
        continue;
      }
      const baseRsc = getBasePathnameForRsc(item.pathname, basePath);
      if (baseRsc && basePathnames.has(baseRsc)) {
        continue;
      }
      if (group.skipNextStaticChunks && isNextStaticAssetPathname(item.pathname, basePath)) {
        continue;
      }
      if (typeof item.filePath !== "string" || item.filePath.trim().length === 0) {
        continue;
      }
      const filePathRel = validateRepoRelativePath(
        repoRoot,
        item.filePath,
        `routes["${item.pathname}"].filePath`,
      );
      const routeType: NextRouteType =
        item.type === "PAGES" ||
        item.type === "PAGES_API" ||
        item.type === "APP_PAGE" ||
        item.type === "APP_ROUTE" ||
        item.type === "STATIC_FILE" ||
        item.type === "MIDDLEWARE"
          ? item.type
          : group.defaultType;
      const runtime: "nodejs" | "edge" = item.runtime === "edge" ? "edge" : "nodejs";
      const dedupKey = `${routeType}:${item.pathname}`;
      if (seenRouteKeys.has(dedupKey)) {
        continue;
      }
      seenRouteKeys.add(dedupKey);
      routeEntries.push({
        pathname: item.pathname,
        type: routeType,
        runtime,
        filePath: filePathRel,
      });
    }
  }

  // Build prerenders list (excluding .segments/* and redundant .rsc duplicates to satisfy)
  const rawPrerenders = Array.isArray(outputs?.prerenders) ? outputs.prerenders : [];
  const primaryPrerenderPathnames = new Set<string>();
  for (const item of rawPrerenders) {
    if (
      item &&
      typeof item.pathname === "string" &&
      !item.pathname.endsWith(".rsc") &&
      !isSegmentRscPathname(item.pathname)
    ) {
      primaryPrerenderPathnames.add(item.pathname);
    }
  }

  const prerenders: NextPrerenderEntry[] = [];
  const seenPrerenderPathnames = new Set<string>();
  for (const item of rawPrerenders) {
    if (!item || typeof item.pathname !== "string" || !item.pathname) {
      continue;
    }
    if (isSegmentRscPathname(item.pathname)) {
      continue;
    }
    const baseRscPath = getBasePathnameForRsc(item.pathname, basePath);
    if (baseRscPath && primaryPrerenderPathnames.has(baseRscPath)) {
      continue;
    }
    if (seenPrerenderPathnames.has(item.pathname)) {
      continue;
    }
    seenPrerenderPathnames.add(item.pathname);

    // Validate fallback.filePath if present on the prerender output so any escaping path fails closed.
    if (
      item.fallback &&
      typeof item.fallback.filePath === "string" &&
      item.fallback.filePath.trim().length > 0
    ) {
      validateRepoRelativePath(
        repoRoot,
        item.fallback.filePath,
        `prerenders["${item.pathname}"].fallback.filePath`,
      );
    }

    const renderingMode: NextRenderingMode =
      item.config?.renderingMode === "PARTIALLY_STATIC" ||
      Boolean(item.pprChain) ||
      item.compute === "resuming"
        ? "PARTIALLY_STATIC"
        : "STATIC";

    prerenders.push({
      pathname: item.pathname,
      renderingMode,
    });
  }

  // Collect edgeOutputs (any route or middleware with runtime === 'edge', dropping .rsc duplicates)
  const edgeOutputSet = new Set<string>();
  const routeOutputLists: Array<RawAdapterOutput[] | undefined> = [
    outputs?.pages,
    outputs?.pagesApi,
    outputs?.appPages,
    outputs?.appRoutes,
  ];
  for (const list of routeOutputLists) {
    if (!Array.isArray(list)) {
      continue;
    }
    for (const item of list) {
      if (
        item &&
        item.runtime === "edge" &&
        typeof item.pathname === "string" &&
        item.pathname.length > 0 &&
        !isSegmentRscPathname(item.pathname)
      ) {
        const baseRsc = getBasePathnameForRsc(item.pathname, basePath);
        if (baseRsc && basePathnames.has(baseRsc)) {
          continue;
        }
        edgeOutputSet.add(item.pathname);
      }
    }
  }
  if (outputs?.middleware && outputs.middleware.runtime === "edge") {
    edgeOutputSet.add(
      typeof outputs.middleware.pathname === "string" && outputs.middleware.pathname.length > 0
        ? outputs.middleware.pathname
        : "/_middleware",
    );
  }

  let middlewareBlock: NextMiddlewareConfig | null = null;
  if (outputs?.middleware && typeof outputs.middleware === "object") {
    if (
      typeof outputs.middleware.filePath === "string" &&
      outputs.middleware.filePath.trim().length > 0
    ) {
      validateRepoRelativePath(repoRoot, outputs.middleware.filePath, "middleware.filePath");
    }
    const mwMatchersRaw = Array.isArray(outputs.middleware.config?.matchers)
      ? outputs.middleware.config.matchers
      : rawMiddlewareMatchers;
    middlewareBlock = {
      runtime: outputs.middleware.runtime === "edge" ? "edge" : "nodejs",
      matchers: mwMatchersRaw.map(stripMatcherConditions),
    };
  }

  const manifest: NextRoutingManifest = {
    version: 1,
    nextVersion: String(nextVersion ?? ""),
    adapterVersion: ADAPTER_VERSION,
    buildId: String(buildId ?? ""),
    outputMode,
    projectDir,
    distDir,
    serverDir,
    basePath,
    i18n,
    routing: {
      caseSensitive,
      beforeMiddleware: sanitizeRouteList(routing?.beforeMiddleware, basePath),
      middlewareMatchers: strippedMiddlewareMatchers,
      beforeFiles: sanitizeRouteList(routing?.beforeFiles, basePath),
      afterFiles: sanitizeRouteList(routing?.afterFiles, basePath),
      dynamicRoutes: sanitizeRouteList(routing?.dynamicRoutes, basePath),
      onMatch: sanitizeRouteList(routing?.onMatch, basePath),
      fallback: sanitizeRouteList(routing?.fallback, basePath),
      shouldNormalizeNextData: Boolean(routing?.shouldNormalizeNextData),
      ...(rsc ? { rsc } : {}),
    },
    pathnames: Array.from(pathnameSet),
    middleware: middlewareBlock,
    routes: routeEntries,
    prerenders,
    edgeOutputs: Array.from(edgeOutputSet),
  };

  return manifest;
}
