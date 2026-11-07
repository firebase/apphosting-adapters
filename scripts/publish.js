#! /usr/bin/env node
const { execSync } = require("child_process");
const { existsSync, writeFileSync, readFileSync } = require("fs");
const { join } = require("path");

const EXIT_GATE_AR_REGISTRY =
  "https://us-npm.pkg.dev/oss-exit-gate-prod/firebase-framework-tools--npm/";
const EXIT_GATE_NPMRC_LINES = [
  `registry=${EXIT_GATE_AR_REGISTRY}`,
  `@apphosting:registry=${EXIT_GATE_AR_REGISTRY}`,
  `@google-cloud:registry=${EXIT_GATE_AR_REGISTRY}`,
  "//us-npm.pkg.dev/oss-exit-gate-prod/firebase-framework-tools--npm/:always-auth=true",
];

function ensureExitGateNpmrc(npmrcPath = ".npmrc") {
  const existing = existsSync(npmrcPath) ? readFileSync(npmrcPath, "utf8") : "";
  const existingLines = new Set(existing.split(/\r?\n/));
  const missingLines = EXIT_GATE_NPMRC_LINES.filter((line) => !existingLines.has(line));
  if (missingLines.length > 0) {
    const prefix = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
    writeFileSync(npmrcPath, `${prefix}${missingLines.join("\n")}\n`, { flag: "a+" });
  }
}

const args = process.argv.slice(2);
if (args.includes("--setup-npmrc")) {
  ensureExitGateNpmrc();
  process.exit(0);
}

const {
  scopedLernaList,
  lernaList,
  versionFromRef,
  shortSHA,
  taggedRelease,
  unreleasedPackages,
} = require("./github.js");

const useOssGate =
  args.includes("--use-oss-gate") ||
  process.env.NPM_PUBLISH_VIA === "exit-gate" ||
  process.env.USE_OSS_GATE === "true";
const dryRun = args.includes("--dry-run") || process.env.PUBLISH_DRY_RUN === "true";
const manifestPath = process.env.EXIT_GATE_MANIFEST_PATH || "manifest.json";

const NPMJS_REGISTRY = "https://registry.npmjs.org/";

// A registry never accepts the same version twice, and manual runs can repeat on one commit, so
// their canary versions get a per-run suffix (e.g. 0.0.9-canary.abc1234.12345678.1).
const canaryRunSuffix =
  useOssGate && process.env.GITHUB_EVENT_NAME === "workflow_dispatch" && process.env.GITHUB_RUN_ID
    ? `.${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT || "1"}`
    : "";

// Whether name@version is already in a registry. With no registry given, npm uses the registries
// in .npmrc, which point at Exit Gate's Artifact Registry repository in Exit Gate mode.
function isPublished(name, version, registry) {
  const scope = name.startsWith("@") ? name.split("/")[0] : "";
  const registryFlags = registry
    ? ` --registry=${registry}${scope ? ` --${scope}:registry=${registry}` : ""}`
    : "";
  try {
    const found = execSync(`npm view ${name}@${version} version${registryFlags}`, {
      stdio: ["ignore", "pipe", "ignore"],
    });
    return found.toString().trim() === version;
  } catch {
    return false;
  }
}

const wombatDressingRoomTokens = new Map([
  // ['firebase-frameworks', process.env.FIREBASE_FRAMEWORKS_NPM_TOKEN],
  ["@apphosting/adapter-nextjs", process.env.ADAPTER_NEXTJS_NPM_TOKEN],
  ["@apphosting/adapter-angular", process.env.ADAPTER_ANGULAR_NPM_TOKEN],
  ["@apphosting/common", process.env.ADAPTER_COMMON_NPM_TOKEN],
  ["@apphosting/astro-adapter", process.env.ADAPTER_ASTRO_NPM_TOKEN],
]);

if (useOssGate) {
  if (!dryRun) {
    ensureExitGateNpmrc();
  }
} else if (!dryRun) {
  wombatDressingRoomTokens.forEach((token, pkg) => {
    writeFileSync(".npmrc", `//wombat-dressing-room.appspot.com/${pkg}/:_authToken=${token}\n`, {
      flag: "a+",
    });
  });
}

function buildExitGateManifest(publishedPackages, releaseTag) {
  const groupsByNamespace = new Map();
  for (const pkg of publishedPackages) {
    const slashIndex = pkg.name.indexOf("/");
    const isScoped = pkg.name.startsWith("@") && slashIndex !== -1;
    const namespace = isScoped ? pkg.name.slice(0, slashIndex) : "";
    const shortName = isScoped ? pkg.name.slice(slashIndex + 1) : pkg.name;
    if (!groupsByNamespace.has(namespace)) {
      groupsByNamespace.set(namespace, []);
    }
    groupsByNamespace.get(namespace).push({
      name: shortName,
      version: pkg.version,
    });
  }

  const publishingGroups = [];
  for (const [namespace, pkgs] of groupsByNamespace.entries()) {
    if (namespace) {
      publishingGroups.push({
        namespace,
        packages: pkgs,
      });
    } else {
      publishingGroups.push({
        packages: pkgs,
      });
    }
  }

  return {
    // eslint-disable-next-line camelcase
    publish_all: false,
    // eslint-disable-next-line camelcase
    publishing_groups: publishingGroups,
    // eslint-disable-next-line camelcase
    registry_config: {
      npm: {
        tags: [releaseTag],
      },
    },
  };
}

// CI builds and tests unreleased packages, but they don't get canary or tagged releases yet.
// In Exit Gate mode on a tagged release, only the tagged package is published so that
// manifest-level registry_config.npm.tags ("latest"/"next") is never applied to canary dependents.
const packagesToPublish = scopedLernaList
  .filter((lerna) => !unreleasedPackages.includes(lerna.name))
  .filter((lerna) => !useOssGate || !taggedRelease || lerna.name === taggedRelease.name)
  .map((lerna) => {
    const isTaggedRelease = lerna.name === taggedRelease?.name;
    if (isTaggedRelease && taggedRelease.version.split("-")[0] !== lerna.version) {
      throw new Error(
        `Cowardly refusing to publish ${lerna.name}@${versionFromRef} from ${lerna.version}, version needs to be bumped in source.`,
      );
    }
    const newVersion = isTaggedRelease
      ? taggedRelease.version
      : `${lerna.version}-canary.${shortSHA}${canaryRunSuffix}`;
    const registry = wombatDressingRoomTokens.get(lerna.name)
      ? `https://wombat-dressing-room.appspot.com/${lerna.name}/_ns`
      : "https://registry.npmjs.org";
    const tag = isTaggedRelease ? taggedRelease.tag : "canary";
    const packageJsonPath = join(lerna.location, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath).toString());
    packageJson.version = newVersion;
    if (useOssGate) {
      delete packageJson.publishConfig;
    } else {
      packageJson.publishConfig = { tag, registry, provenance: true, access: "public" };
    }
    return packageJson;
  });

const stagedPackages = [];
for (const package of packagesToPublish) {
  for (const dependencyName in package.dependencies) {
    // for/in needs an if to make lint happy
    if (dependencyName) {
      const lernaDependency = lernaList.find((it) => it.name === dependencyName);
      if (lernaDependency) {
        const dependencyBeingPublished = packagesToPublish.find((it) => it.name === dependencyName);
        const dependencyVersion = dependencyBeingPublished?.version || lernaDependency.version;
        const dependencyPrerelease = dependencyVersion.includes("-");
        package.dependencies[dependencyName] = dependencyPrerelease
          ? dependencyVersion
          : `^${dependencyVersion}`;
      }
    }
  }
  if (dryRun) {
    continue;
  }
  const { location } = lernaList.find((it) => it.name === package.name);
  const packageJsonPath = join(location, "package.json");
  writeFileSync(packageJsonPath, JSON.stringify(package, undefined, 2));
  if (!useOssGate) {
    execSync(`npm publish`, { cwd: location });
    continue;
  }
  // Exit Gate mode. A re-run must not fail on a version that an earlier attempt already handled.
  if (isPublished(package.name, package.version, NPMJS_REGISTRY)) {
    console.log(
      `${package.name}@${package.version} is already on npm; leaving it out of the manifest.`,
    );
    continue;
  }
  if (isPublished(package.name, package.version)) {
    console.log(`${package.name}@${package.version} is already staged; reusing it.`);
  } else {
    execSync(`npm publish`, { cwd: location });
  }
  stagedPackages.push(package);
}

if (useOssGate) {
  const releaseTag = taggedRelease ? taggedRelease.tag : "canary";
  const manifest = buildExitGateManifest(dryRun ? packagesToPublish : stagedPackages, releaseTag);
  const serializedManifest = `${JSON.stringify(manifest, undefined, 2)}\n`;
  if (dryRun) {
    process.stdout.write(serializedManifest);
  } else {
    writeFileSync(manifestPath, serializedManifest);
  }
}
