import assert from "assert";
import { parse } from "semver";
import fsExtra from "fs-extra";

const { readJson } = fsExtra;

const readPackageJson = readJson("package.json");
const importCreateJs = import("@apphosting/adapter-angular/dist/bin/create.js");

describe("peer dependencies", () => {
  let expectedAngularRange: string;

  before(async () => {
    const packageJson = await readPackageJson;
    const version = parse(packageJson.version);
    if (!version) throw new Error("couldn't parse package.json version");
    expectedAngularRange = `~${version.major}.${version.minor}.0`;
  });

  it("expected @angular/cli version requirement to match", async () => {
    const { ANGULAR_CLI_VERSION } = await importCreateJs;
    assert.equal(expectedAngularRange, ANGULAR_CLI_VERSION);
  });

  it("expected @angular-devkit/architect version requirement to match", async () => {
    const packageJson = await readPackageJson;
    const devKitArchitectRange = packageJson.peerDependencies["@angular-devkit/architect"];
    assert.equal("*", devKitArchitectRange);
  });

  it("expected @angular-devkit/core version requirement to match", async () => {
    const packageJson = await readPackageJson;
    const devKitCoreRange = packageJson.peerDependencies["@angular-devkit/core"];
    assert.equal("*", devKitCoreRange);
  });
});
