import * as assert from "assert";
import { posix } from "path";
import fsExtra from "fs-extra";

export const host = process.env.HOST;
if (!host) {
  throw new Error("HOST environment variable expected");
}

const scenario = process.env.SCENARIO;
if (!scenario) {
  throw new Error("SCENARIO environment variable expected");
}

let adapterVersion: string;
before(() => {
  const packageJson = fsExtra.readJSONSync("package.json");
  adapterVersion = packageJson.version;
  if (!adapterVersion) throw new Error("couldn't parse package.json version");
});

describe("middleware", () => {
  it("should have x-fah-adapter header on all routes", async function () {
    if (scenario.includes("basepath-i18n")) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }

    const routes = [
      "/",
      "/ssg",
      "/ssr",
      "/ssr/streaming",
      "/isr/time",
      "/isr/demand",
      "/nonexistent-route",
    ];

    for (const route of routes) {
      const response = await fetch(posix.join(host, route));
      assert.equal(
        response.headers.get("x-fah-adapter"),
        `nextjs-${adapterVersion}`,
        `Route ${route} missing x-fah-adapter header`,
      );
    }
  });

  it("should have x-fah-middleware header on middleware routes", async () => {
    // Middleware is configured to run on these routes via run-local.ts with-middleware setup function
    const routes = scenario.includes("basepath-i18n")
      ? ["/base", "/base/ssg", "/base/hello", "/base/fr/hello"]
      : ["/ssg", "/ssr"];

    for (const route of routes) {
      const response = await fetch(posix.join(host, route));
      assert.equal(
        response.headers.get("x-fah-middleware"),
        "true",
        `Route ${route} missing x-fah-middleware header`,
      );
    }
  });

  it("should not have x-fah-middleware header on other routes", async function () {
    if (!scenario.includes("basepath-i18n")) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }

    const routes = ["/base/ssr", "/base/fr/other"];

    for (const route of routes) {
      const response = await fetch(posix.join(host, route));
      assert.equal(
        response.headers.get("x-fah-middleware"),
        null,
        `Route ${route} has x-fah-middleware header`,
      );
    }
  });
});
