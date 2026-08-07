import { createRequire } from "module";
import fsExtra from "fs-extra";
import type { AstroAdapterFeatureMap } from "astro";
import type { Options } from "./types.js";

const { readFileSync } = fsExtra;

export const ASTRO_PACKAGE_NAME = "astro";
const ASTROJS_NODE_PACKAGE_NAME = "@astrojs/node";
// The `@astrojs/node` major that replaced the adapter `args` config with the virtual config module.
const VIRTUAL_CONFIG_MIN_MAJOR = 10;
// `@astrojs/node`'s own default, applied here because its server reads this from the virtual config.
const DEFAULT_BODY_SIZE_LIMIT = 1024 * 1024 * 1024;
const VIRTUAL_CONFIG_ID = "virtual:astro-node:config";
const RESOLVED_VIRTUAL_CONFIG_ID = "\0" + VIRTUAL_CONFIG_ID;
const SERVER_ENVIRONMENTS = ["ssr", "prerender", "astro"];
export const SUPPORTED_ASTRO_FEATURES: AstroAdapterFeatureMap = {
  hybridOutput: "stable",
  staticOutput: "stable",
  serverOutput: "stable",
  sharpImageService: "stable",
  i18nDomains: "experimental",
  envGetSecret: "stable",
} as const;

/**
 * Reads the version of a package as installed in the user's project.
 * @param packageName The package to look up.
 * @return The installed version, or undefined if its package.json cannot be read.
 */
export function getPackageVersion(packageName: string): string | undefined {
  const require = createRequire(import.meta.url);

  try {
    // A module specifier, not a filesystem path: it must stay forward-slashed on every platform.
    const packageJsonPath = require.resolve(`${packageName}/package.json`, {
      paths: [process.cwd()],
    });
    const { version } = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return version;
  } catch {
    // Package not installed, or its package.json is unreadable or malformed
    return undefined;
  }
}

/**
 * Determines how the installed `@astrojs/node` expects its config: v10 replaced the adapter `args` with
 * a `virtual:astro-node:config` module.
 * @return Whether the config must be served through the virtual module. Falls back to the `args`
 * config when the installed version cannot be determined.
 */
export function usesVirtualConfig(): boolean {
  const version = getPackageVersion(ASTROJS_NODE_PACKAGE_NAME);
  if (!version) return false;
  return Number.parseInt(version, 10) >= VIRTUAL_CONFIG_MIN_MAJOR;
}

/** The `virtual:astro-node:config` Vite plugin, narrowed to the hooks this adapter defines. */
export interface VirtualConfigPlugin {
  name: string;
  configEnvironment(environmentName: string): { resolve: { noExternal: string[] } } | undefined;
  resolveId: { filter: { id: RegExp }; handler(): string };
  load: { filter: { id: RegExp }; handler(): string };
}

/**
 * Builds the Vite plugin that serves `@astrojs/node`'s `virtual:astro-node:config` module, exposing the
 * adapter config to its server entrypoint (the mechanism `@astrojs/node`@10+ uses instead of `args`).
 * @param config The resolved adapter options to expose through the virtual module.
 * @return The Vite plugin providing the virtual config module.
 */
export function createConfigPlugin(config: Options): VirtualConfigPlugin {
  // `@astrojs/node`'s server imports these directly, so the module must export them all.
  const virtualConfig: Options = {
    staticHeaders: false,
    bodySizeLimit: DEFAULT_BODY_SIZE_LIMIT,
    experimentalDisableStreaming: false,
    ...config,
  };
  return {
    name: VIRTUAL_CONFIG_ID,
    configEnvironment(environmentName: string) {
      if (SERVER_ENVIRONMENTS.includes(environmentName)) {
        return { resolve: { noExternal: ["@astrojs/node"] } };
      }
    },
    resolveId: {
      filter: { id: new RegExp(`^${VIRTUAL_CONFIG_ID}$`) },
      handler() {
        return RESOLVED_VIRTUAL_CONFIG_ID;
      },
    },
    load: {
      filter: { id: new RegExp(`^${RESOLVED_VIRTUAL_CONFIG_ID}$`) },
      handler() {
        return Object.entries(virtualConfig)
          .map(([key, value]) => `export const ${key} = ${JSON.stringify(value)};`)
          .join("\n");
      },
    },
  };
}
