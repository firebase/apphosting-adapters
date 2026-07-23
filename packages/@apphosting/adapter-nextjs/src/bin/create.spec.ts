import assert from "assert";
import { parse } from "semver";
import fsExtra from "fs-extra";

const { readJson } = fsExtra;

const readPackageJson = readJson("package.json");
const importCreateJs = import("@apphosting/adapter-nextjs/dist/bin/create.js");

describe("peer dependencies", () => {
  let expectedNextJSRange: string;

  before(async () => {
    const packageJson = await readPackageJson;
    const version = parse(packageJson.version);
    if (!version) throw new Error("couldn't parse package.json version");
    expectedNextJSRange = `~${version.major}.${version.minor}.0`;
  });

  it("expected create-next-app version requirement to match", async () => {
    const { CREATE_NEXT_APP_VERSION } = await importCreateJs;
    assert.equal(expectedNextJSRange, CREATE_NEXT_APP_VERSION);
  });

  it("expected next version requirement to match", async () => {
    const packageJson = await readPackageJson;
    const nextVersionRange = packageJson.peerDependencies["next"];
    assert.equal("*", nextVersionRange);
  });
});
