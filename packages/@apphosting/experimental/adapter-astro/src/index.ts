import { writeFile } from "node:fs/promises";
import { stringify as yamlStringify } from "yaml";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fsExtra from "fs-extra";
import { createRequire } from "module";
import path from "path";
import type { AstroAdapter, AstroIntegration } from "astro";
import { AstroError } from "astro/errors";
import type { Options, UserOptions } from "./types.js";
import {
  createConfigPlugin,
  getPackageVersion,
  ASTRO_PACKAGE_NAME,
  SUPPORTED_ASTRO_FEATURES,
  usesVirtualConfig,
} from "./utils.js";
import { OutputBundleConfig, Availability } from "@apphosting/common";
export const { readFileSync, existsSync, ensureDir } = fsExtra;

export function getAdapter(options: Options): AstroAdapter {
  const require = createRequire(import.meta.url);
  const serverEntrypoint = path.join(require.resolve("@astrojs/node"), "../server.js");
  const previewEntrypoint = path.join(require.resolve("@astrojs/node"), "../preview.js");

  if (usesVirtualConfig()) {
    return {
      name: "@apphosting/astro-adapter",
      entrypointResolution: "auto",
      serverEntrypoint,
      previewEntrypoint,
      adapterFeatures: {
        buildOutput: "server",
      },
      supportedAstroFeatures: SUPPORTED_ASTRO_FEATURES,
    };
  }

  return {
    name: "@apphosting/astro-adapter",
    serverEntrypoint,
    previewEntrypoint,
    exports: ["handler", "startServer", "options"],
    args: options,
    adapterFeatures: {
      buildOutput: "server",
      edgeMiddleware: false,
    },
    supportedAstroFeatures: SUPPORTED_ASTRO_FEATURES,
  };
}

export default function createIntegration(userOptions: UserOptions): AstroIntegration {
  if (!userOptions?.mode) {
    throw new AstroError(`Setting the 'mode' option is required.`);
  }

  let _options: Options;
  return {
    name: "@apphosting/astro-adapter",
    hooks: {
      "astro:config:setup": ({ updateConfig, config }) => {
        updateConfig({
          image: {
            endpoint: config.image.endpoint ?? "astro/assets/endpoint/node",
          },
          vite: {
            ssr: {
              noExternal: ["@apphosting/astro-adapter"],
            },
            plugins: usesVirtualConfig()
              ? [
                  createConfigPlugin({
                    ...userOptions,
                    client: config.build.client?.toString(),
                    server: config.build.server?.toString(),
                    host: config.server.host,
                    port: config.server.port,
                    assets: config.build.assets,
                  }),
                ]
              : [],
          },
        });
      },
      "astro:config:done": ({ setAdapter, config }) => {
        _options = {
          ...userOptions,
          client: config.build.client?.toString(),
          server: config.build.server?.toString(),
          host: config.server.host,
          port: config.server.port,
          assets: config.build.assets,
        };
        setAdapter(getAdapter(_options));
      },
      "astro:build:done": async () => {
        await ensureDir("./.apphosting");
        const directoryName = dirname(fileURLToPath(import.meta.url));
        const packageJsonPath = `${directoryName}/../package.json`;
        if (!existsSync(packageJsonPath)) {
          throw new Error(`Astro adapter package.json file does not exist at ${packageJsonPath}`);
        }
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        const packageVersion = getPackageVersion(ASTRO_PACKAGE_NAME);
        const outputBundle: OutputBundleConfig = {
          version: "v1",
          runConfig: {
            runCommand: `node dist/server/entry.mjs`,
            environmentVariables: [
              { variable: "HOST", value: "0.0.0.0", availability: [Availability.Runtime] },
            ],
          },
          metadata: {
            adapterPackageName: packageJson.name,
            adapterVersion: packageJson.version,
            framework: ASTRO_PACKAGE_NAME,
            frameworkVersion: packageVersion,
          },
        };
        await writeFile(`./.apphosting/bundle.yaml`, yamlStringify(outputBundle));
      },
    },
  };
}
