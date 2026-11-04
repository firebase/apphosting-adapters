#! /usr/bin/env node
const { execSync } = require("child_process");

const [, packagePatternFromRef, versionFromRef, , prereleaseFromRef] =
  /^refs\/tags\/(.+)-v(\d\d*\.\d\d*(\.\d\d*)?(-.+)?)$/.exec(process.env.GITHUB_REF ?? "") ?? [];

const packageFilter = (process.env.PACKAGE_FILTER ?? "").trim();

const since =
  process.env.GITHUB_ACTION && process.env.GITHUB_EVENT_NAME !== "workflow_dispatch"
    ? `--since ${
        (process.env.GITHUB_BASE_REF && `origin/${process.env.GITHUB_BASE_REF}`) || "HEAD^1"
      }`
    : "";

const lernaList = JSON.parse(execSync("lerna list --json --loglevel silent"));

// Packages that CI builds and tests but that this repo doesn't release or publish yet.
const unreleasedPackages = ["@google-cloud/adapter-nextjs"];
const ignoreUnreleased = unreleasedPackages.map((pkgName) => `--ignore='${pkgName}'`).join(" ");

// Unscoped release tags (e.g. adapter-nextjs-v14.0.22, firebase-frameworks-v0.11.9) match only
// unscoped or @apphosting/* packages so they never collide with @google-cloud/adapter-nextjs.
// Scoped release tags (e.g. @google-cloud/adapter-nextjs-v0.1.0) match that exact package.
const toLernaScope = (pattern) =>
  pattern.startsWith("@") ? `--scope='${pattern}'` : `--scope='{,@apphosting/}${pattern}'`;

const scopeFromRef = packagePatternFromRef && toLernaScope(packagePatternFromRef);
const scopeFromFilter = packageFilter && toLernaScope(packageFilter);

const ref = process.env.GITHUB_SHA ?? "HEAD";
const shortSHA = execSync(`git rev-parse --short ${ref}`).toString().trim();

let lernaListFilterArgs;
if (scopeFromRef) {
  lernaListFilterArgs = `--include-dependents ${scopeFromRef} ${ignoreUnreleased}`;
} else if (scopeFromFilter) {
  lernaListFilterArgs = `${scopeFromFilter} ${ignoreUnreleased}`;
} else {
  lernaListFilterArgs = `--include-dependents ${since}`;
}

const scopedLernaList = JSON.parse(
  execSync(`lerna list --json --no-private --toposort --loglevel silent ${lernaListFilterArgs}`),
);

if (packageFilter && scopedLernaList.length === 0) {
  throw new Error(`Package filter "${packageFilter}" did not match any releasable package.`);
}

const packagesFromRef =
  scopeFromRef &&
  JSON.parse(
    execSync(
      `lerna list --json --no-private --loglevel silent ${scopeFromRef} ${ignoreUnreleased}`,
    ),
  );
if (packagePatternFromRef && packagesFromRef.length !== 1) {
  throw new Error(`Tag pattern matched more than one package...`);
}
const packageFromRef = packagesFromRef?.[0].name;

const lernaScopes = scopedLernaList.map(({ name: pkgName }) => ["--scope", pkgName]).flat();

module.exports = {
  taggedRelease: packageFromRef && {
    name: packageFromRef,
    version: versionFromRef,
    tag: prereleaseFromRef ? "next" : "latest",
  },
  versionFromRef,
  lernaList,
  scopedLernaList,
  shortSHA,
  lernaScopes,
  unreleasedPackages,
};
