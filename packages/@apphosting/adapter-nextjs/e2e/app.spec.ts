import * as assert from "assert";
import { posix } from "path";
import fsExtra from "fs-extra";

export const host = process.env.HOST;
if (!host) {
  throw new Error("HOST environment variable expected");
}

let adapterVersion: string;
before(() => {
  const packageJson = fsExtra.readJSONSync("package.json");
  adapterVersion = packageJson.version;
  if (!adapterVersion) throw new Error("couldn't parse package.json version");
});

describe("app", () => {
  it("/", async () => {
    const response = await fetch(host);
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), "s-maxage=31536000, ");
  });

  it("/ssg", async () => {
    const response = await fetch(posix.join(host, "ssg"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), "s-maxage=31536000, ");
    const text = await response.text();
    assert.ok(text.includes("SSG"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
  });

  it("/ssr", async () => {
    const response = await fetch(posix.join(host, "ssr"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(
      response.headers.get("cache-control"),
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
    const text = await response.text();
    assert.ok(text.includes("A server generated page!"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
  });

  it("/ssr/streaming", async () => {
    const response = await fetch(posix.join(host, "ssr", "streaming"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(
      response.headers.get("cache-control"),
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
    const text = await response.text();
    assert.ok(text.includes("A server generated page!"));
    assert.ok(text.includes("Streaming!"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
  }).timeout(3000); // Increased timeout to 3000ms to allow for the 2000ms component timeout

  it("/isr/time", async () => {
    const response = await fetch(posix.join(host, "isr", "time"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.ok(
      response.headers.get("cache-control")?.includes("s-maxage=10"),
      "Cache-Control header should include s-maxage=10",
    );
    const text = await response.text();
    assert.ok(text.includes("A cached page"));
    assert.ok(text.includes("(should be regenerated every 10 seconds)"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
  });

  it("/isr/demand", async () => {
    const response = await fetch(posix.join(host, "isr", "demand"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), "s-maxage=31536000, ");
    const text = await response.text();
    assert.ok(text.includes("A cached page"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
    assert.ok(text.includes("Regenerate page"));
  });

  it("/isr/demand/revalidate", async () => {
    // First, fetch the initial page
    const initialResponse = await fetch(posix.join(host, "isr", "demand"));
    assert.ok(initialResponse.ok);
    const initialText = await initialResponse.text();
    const initialUUID = /UUID<\/p>\s*<h2>([^<]+)<\/h2>/.exec(initialText)?.[1];

    // Trigger revalidation
    const revalidateResponse = await fetch(posix.join(host, "isr", "demand", "revalidate"), {
      method: "POST",
    });
    assert.equal(revalidateResponse.status, 200);

    // Fetch the page again
    const newResponse = await fetch(posix.join(host, "isr", "demand"));
    assert.ok(newResponse.ok);
    const newText = await newResponse.text();
    const newUUID = /UUID<\/p>\s*<h2>([^<]+)<\/h2>/.exec(newText)?.[1];

    // Check if the UUID has changed, indicating successful revalidation
    assert.notEqual(initialUUID, newUUID, "UUID should change after revalidation");
  });

  it(`404`, async () => {
    const response = await fetch(posix.join(host, Math.random().toString()));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(
      response.headers.get("cache-control"),
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
  });

  it("should have x-fah-adapter header and no x-fah-middleware header on all routes", async () => {
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
      assert.equal(
        response.headers.get("x-fah-middleware"),
        null,
        `Route ${route} should not have x-fah-middleware header`,
      );
    }
  });
});
