import { describe, it } from "mocha";
import assert from "assert";
import type { Options } from "./types.js";

const importUtils = import("@apphosting/astro-adapter/dist/utils.js");

describe("resolveImageEntrypoint", () => {
  it("serves builds from the Node endpoint", async () => {
    const { resolveImageEntrypoint } = await importUtils;
    assert.equal(resolveImageEntrypoint(undefined, "build"), "astro/assets/endpoint/node");
  });

  it("serves `astro dev` from the dev endpoint", async () => {
    const { resolveImageEntrypoint } = await importUtils;
    assert.equal(resolveImageEntrypoint(undefined, "dev"), "astro/assets/endpoint/dev");
  });

  it("keeps a user-configured entrypoint for every command", async () => {
    const { resolveImageEntrypoint } = await importUtils;
    assert.equal(resolveImageEntrypoint("my/custom/endpoint", "build"), "my/custom/endpoint");
    assert.equal(resolveImageEntrypoint("my/custom/endpoint", "dev"), "my/custom/endpoint");
  });
});

describe("createConfigPlugin", () => {
  const config = { mode: "standalone", host: true, port: 4321 } as Options;

  it("names the plugin after the virtual config module id", async () => {
    const { createConfigPlugin } = await importUtils;
    const plugin = createConfigPlugin(config);
    assert.equal(plugin.name, "virtual:astro-node:config");
  });

  it("resolves the virtual module id to its \\0-prefixed resolved id", async () => {
    const { createConfigPlugin } = await importUtils;
    const plugin = createConfigPlugin(config);
    assert.equal(plugin.resolveId.handler(), "\0virtual:astro-node:config");
  });

  it("loads the config as ESM export statements", async () => {
    const { createConfigPlugin } = await importUtils;
    const plugin = createConfigPlugin(config);
    const code: string = plugin.load.handler();
    assert.ok(code.includes(`export const mode = "standalone";`));
    assert.ok(code.includes(`export const host = true;`));
    assert.ok(code.includes(`export const port = 4321;`));
  });

  it("exports the config keys @astrojs/node's server imports", async () => {
    const { createConfigPlugin } = await importUtils;
    const plugin = createConfigPlugin(config);
    const code: string = plugin.load.handler();
    assert.ok(code.includes(`export const staticHeaders = false;`));
    assert.ok(code.includes(`export const experimentalDisableStreaming = false;`));
    assert.ok(code.includes(`export const bodySizeLimit = 1073741824;`));
  });

  it("marks @astrojs/node non-external for server environments only", async () => {
    const { createConfigPlugin } = await importUtils;
    const plugin = createConfigPlugin(config);
    assert.deepEqual(plugin.configEnvironment("ssr"), {
      resolve: { noExternal: ["@astrojs/node"] },
    });
    assert.equal(plugin.configEnvironment("client"), undefined);
  });
});

describe("SUPPORTED_ASTRO_FEATURES", () => {
  it("advertises stable server output", async () => {
    const { SUPPORTED_ASTRO_FEATURES } = await importUtils;
    assert.equal(SUPPORTED_ASTRO_FEATURES.serverOutput, "stable");
  });
});
