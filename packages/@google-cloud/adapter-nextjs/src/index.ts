import type { NextAdapter } from "next";
import { modifyConfig } from "./adapter/modify-config";
import { onBuildComplete } from "./adapter/on-build-complete";
import { ADAPTER_PACKAGE_NAME, ADAPTER_VERSION } from "./manifests/bundle";

export * from "./contracts";
export { modifyConfig, type ModifyConfigContext } from "./adapter/modify-config";
export {
  onBuildComplete,
  resolveBundledServeJsPath,
  type OnBuildCompleteContext,
} from "./adapter/on-build-complete";
export {
  isSupportedNextVersion,
  getSecurityAdvisoryWarnings,
  parseSemver,
  type ParsedSemver,
} from "./adapter/semver";
export {
  validateRepoRelativePath,
  validateContainedSubpath,
  toPosixPath,
  posixJoin,
} from "./adapter/paths";
export { buildBundleManifest } from "./manifests/bundle";
export { buildNextRoutingManifest, stripMatcherConditions } from "./manifests/routing";
export { serializeBundleYamlV2 } from "./manifests/yaml";

const adapter: NextAdapter = {
  name: ADAPTER_PACKAGE_NAME,
  modifyConfig: modifyConfig,
  onBuildComplete: onBuildComplete,
};

export { adapter, ADAPTER_PACKAGE_NAME, ADAPTER_VERSION };
export default adapter;

// Ensure seamless loading via both CJS `require()` and Next.js's `interopDefault(await import(...))`
if (typeof module !== "undefined" && module.exports) {
  module.exports = Object.assign(adapter, module.exports, {
    default: adapter,
    adapter,
  });
}
