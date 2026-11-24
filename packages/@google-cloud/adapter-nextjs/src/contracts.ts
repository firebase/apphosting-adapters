import type {
  I18nConfig as NextRoutingI18nConfig,
  I18nDomain as NextRoutingI18nDomain,
  Route as NextRoutingPhaseRoute,
  RouteHas as NextRoutingRouteHas,
} from "@next/routing";

export type {
  NextRoutingI18nConfig,
  NextRoutingI18nDomain,
  NextRoutingPhaseRoute,
  NextRoutingRouteHas,
};

export type NextOutputMode = "standalone" | "export";

export interface BundleRunConfigV2 {
  runCommand: string;
  projectRunCommand?: string;
}

export interface BundleMetadataV2 {
  adapterPackageName: string;
  adapterVersion: string;
  framework: string;
  frameworkVersion: string;
  buildId: string;
  outputMode: NextOutputMode;
  projectDir: string;
  distDir: string;
  serverDir: string;
  runtimeManifest: string;
}

export interface BundleCopyEntryV2 {
  from: string;
  to: string;
}

export interface BundleServerAppV2 {
  include: string[];
  copy?: BundleCopyEntryV2[];
}

export interface BundleOutputFilesV2 {
  serverApp: BundleServerAppV2;
}

export interface BundleYamlV2 {
  version: "v2";
  runConfig?: BundleRunConfigV2;
  metadata: BundleMetadataV2;
  outputFiles: BundleOutputFilesV2;
}

export interface NextSanitizedMatcher {
  source?: string;
  sourceRegex: string;
}

export interface NextRoutingRoute extends NextRoutingPhaseRoute {
  source?: string;
  priority?: boolean;
}

export interface NextRoutingRscConfig {
  header: string;
  varyHeader: string;
  prefetchHeader: string;
  didPostponeHeader: string;
  contentTypeHeader: string;
  suffix: string;
  prefetchSegmentHeader: string;
  prefetchSegmentSuffix: string;
  prefetchSegmentDirSuffix: string;
  clientParamParsing: boolean;
  clientParamParsingOrigins?: string[];
  dynamicRSCPrerender: boolean;
}

export interface NextRoutingTable {
  caseSensitive?: boolean;
  beforeMiddleware: NextRoutingRoute[];
  middlewareMatchers: NextSanitizedMatcher[];
  beforeFiles: NextRoutingRoute[];
  afterFiles: NextRoutingRoute[];
  dynamicRoutes: NextRoutingRoute[];
  onMatch: NextRoutingRoute[];
  fallback: NextRoutingRoute[];
  shouldNormalizeNextData?: boolean;
  rsc?: NextRoutingRscConfig;
}

export interface NextMiddlewareConfig {
  runtime: "nodejs" | "edge";
  matchers: NextSanitizedMatcher[];
}

export type NextRouteType =
  | "PAGES"
  | "PAGES_API"
  | "APP_PAGE"
  | "APP_ROUTE"
  | "STATIC_FILE"
  | "MIDDLEWARE";

export interface NextRouteEntry {
  pathname: string;
  type: NextRouteType;
  runtime: "nodejs" | "edge";
  filePath: string;
}

export type NextRenderingMode = "STATIC" | "PARTIALLY_STATIC";

export interface NextPrerenderEntry {
  pathname: string;
  renderingMode: NextRenderingMode;
}

export interface NextRoutingManifest {
  version: 1;
  nextVersion: string;
  adapterVersion: string;
  buildId: string;
  outputMode: NextOutputMode;
  projectDir: string;
  distDir: string;
  serverDir: string;
  basePath: string;
  i18n: NextRoutingI18nConfig | null;
  routing: NextRoutingTable;
  pathnames: string[];
  middleware: NextMiddlewareConfig | null;
  routes: NextRouteEntry[];
  prerenders: NextPrerenderEntry[];
  edgeOutputs: string[];
}
