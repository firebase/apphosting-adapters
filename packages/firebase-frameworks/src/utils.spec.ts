const importUtils = import("../dist/utils.js");
import { describe, it } from "mocha";
import assert from "assert";
import { once } from "events";
import type { Request } from "firebase-functions/v2/https";

describe("incomingMessageFromExpress", () => {
  it("does not emit aborted once its body is read", async () => {
    const { incomingMessageFromExpress } = await importUtils;
    const req = { method: "GET", url: "/", headers: {} } as Request;
    const incomingMessage = incomingMessageFromExpress(req);
    let aborted = false;
    incomingMessage.on("aborted", () => (aborted = true));

    incomingMessage.resume();
    await once(incomingMessage, "close");

    assert.strictEqual(aborted, false);
  });
});
