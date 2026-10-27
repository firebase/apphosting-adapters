import "./env";
import {
  boot,
  BootOptions,
  checkVulnerableNextVersion,
  createGuardedRequestListener,
  parseKeepAliveTimeout,
  parsePort,
  validateRoutingManifest,
} from "./boot";
import { GuardRequestLike, isGuarded, isValidManifestShape, toHeaders } from "./guard";
import {
  CDN_CACHE_CONTROL_HEADERS,
  isCdnCacheHeader,
  NO_STORE_CACHE_CONTROL,
  rewriteCacheControl,
  rewriteHeadersArray,
  rewriteHeadersObject,
  wrapResponseForGuard,
} from "./headers";

export {
  boot,
  BootOptions,
  CDN_CACHE_CONTROL_HEADERS,
  checkVulnerableNextVersion,
  createGuardedRequestListener,
  GuardRequestLike,
  isCdnCacheHeader,
  isGuarded,
  isValidManifestShape,
  NO_STORE_CACHE_CONTROL,
  parseKeepAliveTimeout,
  parsePort,
  rewriteCacheControl,
  rewriteHeadersArray,
  rewriteHeadersObject,
  toHeaders,
  validateRoutingManifest,
  wrapResponseForGuard,
};

if (typeof require !== "undefined" && require.main === module) {
  void boot();
}
