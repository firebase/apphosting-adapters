import type { NextAdapter } from "next";
import { getAdapterMetadata, populateOutputBundleOptions, generateBundleYaml } from "./utils.js";
import { addRouteOverrides } from "./overrides.js";
import { PHASE_PRODUCTION_BUILD } from "./constants.js";
import fs from "fs-extra";

const adapter: NextAdapter = {
  name: "firebase-apphosting-adapter",

  async modifyConfig(config, context) {
    console.log(`🔌 [Adapter] Modifying config for phase: ${context.phase}`);
    if (context.phase === PHASE_PRODUCTION_BUILD) {
      /**
       * config that optimizes the app for Firebase App Hosting.
       *
       * Current overrides include:
       * - images.unoptimized = true, unless user explicitly sets images.unoptimized to false or
       * is using a custom image loader.
       **/
      return {
        ...config,
        images: {
          ...(config.images || {}),
          ...(config.images?.unoptimized === undefined && config.images?.loader === undefined
            ? { unoptimized: true }
            : {}),
        },
        headers: async () => {
          /**
           * It adds the following headers to all routes:
           * - x-fah-adapter: The Firebase App Hosting adapter version used to build the app.
           **/
          const originalHeaders = (config.headers && (await config.headers())) || [];
          const adapterMetadata = getAdapterMetadata();
          // TODO add our middleware header OR not... :P
          return [
            ...originalHeaders,
            {
              source: "/(.*)",
              headers: [
                {
                  key: "x-fah-adapter",
                  value: `nextjs-${adapterMetadata.adapterVersion}`,
                },
              ],
            },
          ];
        },
        experimental: {
          ...(config.experimental || {}),
          nodeMiddleware: true,
        },
        output: "standalone",
      };
    }
    // TODO override config for production build
    return config;
  },

  async onBuildComplete(context) {
    const nextBuildDirectory = context.distDir;
    if (context.outputs.middleware?.config?.matchers) {
      await addRouteOverrides(nextBuildDirectory, context.outputs.middleware.config.matchers);
    }
    const outputBundleOptions = populateOutputBundleOptions(
      context.repoRoot,
      context.projectDir,
      nextBuildDirectory,
    );
    await fs.ensureDir(outputBundleOptions.outputDirectoryBasePath);

    await fs.writeFile(
      `${outputBundleOptions.outputDirectoryBasePath}/output.json`,
      JSON.stringify(context),
    );
    const adapterMetadata = getAdapterMetadata();

    const root = process.cwd();

    const nextjsVersion = process.env.FRAMEWORK_VERSION || context.nextVersion || "unspecified";

    await generateBundleYaml(outputBundleOptions, root, nextjsVersion, adapterMetadata);
  },
};

export default adapter;
