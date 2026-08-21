#! /usr/bin/env node
const { execSync } = require("child_process");
const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");
const {
  scopedLernaList,
  lernaList,
  versionFromRef,
  shortSHA,
  taggedRelease,
} = require("./github.js");

const wombatDressingRoomTokens = new Map([
  // ['firebase-frameworks', process.env.FIREBASE_FRAMEWORKS_NPM_TOKEN],
  ["@apphosting/adapter-nextjs", process.env.ADAPTER_NEXTJS_NPM_TOKEN],
  ["@apphosting/adapter-angular", process.env.ADAPTER_ANGULAR_NPM_TOKEN],
  ["@apphosting/common", process.env.ADAPTER_COMMON_NPM_TOKEN],
  ["@apphosting/astro-adapter", process.env.ADAPTER_ASTRO_NPM_TOKEN],
]);

wombatDressingRoomTokens.forEach((token, pkg) => {
  writeFileSync(".npmrc", `//wombat-dressing-room.appspot.com/${pkg}/:_authToken=${token}\n`, {
    flag: "a+",
  });
});

const packagesToPublish = scopedLernaList.map((lerna) => {
  const isTaggedRelease = lerna.name === taggedRelease?.name;
  if (isTaggedRelease && taggedRelease.version.split("-")[0] !== lerna.version) {
    throw new Error(
      `Cowardly refusing to publish ${lerna.name}@${versionFromRef} from ${lerna.version}, version needs to be bumped in source.`,
    );
  }
  const newVersion = isTaggedRelease
    ? taggedRelease.version
    : `${lerna.version}-canary.${shortSHA}`;
  const registry = wombatDressingRoomTokens.get(lerna.name)
    ? `https://wombat-dressing-room.appspot.com/${lerna.name}/_ns`
    : "https://registry.npmjs.org";
  const tag = isTaggedRelease ? taggedRelease.tag : "canary";
  const packageJsonPath = join(lerna.location, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath).toString());
  packageJson.version = newVersion;
  packageJson.publishConfig = { tag, registry, provenance: true, access: "public" };
  return packageJson;
});

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
  const { location } = lernaList.find((it) => it.name === package.name);
  const packageJsonPath = join(location, "package.json");
  writeFileSync(packageJsonPath, JSON.stringify(package, undefined, 2));
  execSync(`npm publish`, { cwd: location });
}
