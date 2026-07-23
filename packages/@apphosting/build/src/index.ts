import promiseSpawn from "@npmcli/promise-spawn";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { yellow, bgRed, bold } from "colorette";
import { OutputBundleConfig } from "@apphosting/common";
import { SupportedFrameworks, Framework } from "@apphosting/common";
import { parse as parseYaml } from "yaml";

export async function localBuild(
  projectRoot: string,
  framework?: string,
): Promise<OutputBundleConfig> {
  if (framework && SupportedFrameworks.includes(framework as Framework)) {
    // TODO(#382): Skip this if there's a custom build command in apphosting.yaml.
    await adapterBuild(projectRoot, framework);
    const bundleYamlPath = join(projectRoot, ".apphosting", "bundle.yaml");
    if (!existsSync(bundleYamlPath)) {
      throw new Error(`Cannot load ${bundleYamlPath} from given path, it doesn't exist`);
    }
    return parseYaml(readFileSync(bundleYamlPath, "utf8")) as OutputBundleConfig;
  }
  throw new Error("framework not supported");
}

export async function adapterBuild(
  projectRoot: string,
  framework: string,
): Promise<OutputBundleConfig> {
  // TODO(#382): support other apphosting.*.yaml files.
  // TODO(#382): parse apphosting.yaml for environment variables / secrets needed during build time.

  // TODO(#382): We are using the latest framework adapter versions, but in the future
  // we should parse the framework version and use the matching adapter version.
  const adapterName = `@apphosting/adapter-${framework}`;
  const packumentResponse = await fetch(`https://registry.npmjs.org/${adapterName}`);
  if (!packumentResponse.ok)
    throw new Error(
      `Failed to fetch ${adapterName}: ${packumentResponse.status} ${packumentResponse.statusText}`,
    );
  let packument;
  try {
    packument = await packumentResponse.json();
  } catch (e) {
    throw new Error(`Failed to parse response from NPM registry for ${adapterName}.`);
  }
  const adapterVersion = packument?.["dist-tags"]?.["latest"];
  if (!adapterVersion) {
    throw new Error(`Could not find 'latest' dist-tag for ${adapterName}`);
  }
  // TODO(#382): should check for existence of adapter in app's package.json and use that version instead.

  console.log(" 🔥", bgRed(` ${adapterName}@${yellow(bold(adapterVersion))} `), "\n");

  const buildCommand = `apphosting-adapter-${framework}-build`;
  await promiseSpawn("npx", ["-y", "-p", `${adapterName}@${adapterVersion}`, buildCommand], {
    cwd: projectRoot,
    shell: true,
    stdio: "inherit",
  });

  const bundleYamlPath = join(projectRoot, ".apphosting", "bundle.yaml");
  if (!existsSync(bundleYamlPath)) {
    throw new Error(`Cannot load ${bundleYamlPath} from given path, it doesn't exist`);
  }
  return parseYaml(readFileSync(bundleYamlPath, "utf8")) as OutputBundleConfig;

  // TODO(#382): Parse apphosting.yaml to set custom run command in bundle.yaml
  // TODO(#382): parse apphosting.yaml for runConfig to include in bundle.yaml
  // TODO(#382): parse apphosting.yaml for environment variables / secrets needed during runtime to include in the bundle.yaml
}
