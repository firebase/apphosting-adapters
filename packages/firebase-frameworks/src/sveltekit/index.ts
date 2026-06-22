import { pathToFileURL } from "url";
import {} from "@sveltejs/kit";
import { installPolyfills } from "@sveltejs/kit/node/polyfills";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import type { IncomingHttpHeaders } from "http";

const kitPromise = import(`${pathToFileURL(process.cwd())}/index.js`);
const manifestPromise = import(`${pathToFileURL(process.cwd())}/manifest.js`);

// Request, Response, fetch, etc.
installPolyfills();

const server = Promise.all([kitPromise, manifestPromise]).then(
  async ([{ Server }, { manifest }]) => {
    const server = new Server(manifest);
    await server.init({ env: process.env });
    return server;
  },
);

export const handle = async (req: Request, res: Response) => {
  const rendered = await (await server).respond(toSvelteKitRequest(req));

  if (!rendered) {
    return res.writeHead(404, "Not Found").end();
  }

  const body: ArrayBuffer = await rendered.arrayBuffer();

  return res
    .writeHead(rendered.status, Object.fromEntries(rendered.headers))
    .end(Buffer.from(body));
};

// https://github.com/jthegedus/svelte-adapter-firebase/blob/main/src/files/firebase-to-svelte-kit.js
function toSvelteKitRequest(request: Request) {
  // Firebase sometimes omits the protocol used. Default to http.
  const protocol = request.headers["x-forwarded-proto"] || "http";
  // Firebase forwards the request to sveltekit, use the forwarded host.
  const host = `${protocol}://${request.headers["x-forwarded-host"]}`;

  const { href } = new URL(request.url || "", host);
  return new Request(href, {
    method: request.method,
    headers: toSvelteKitHeaders(request.headers),
    body: request.rawBody ? request.rawBody : null,
  });
}

function toSvelteKitHeaders(headers: IncomingHttpHeaders) {
  const finalHeaders: Record<string, string> = {};

  // Assume string | string[] types for all values
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      finalHeaders[key] = Array.isArray(value) ? value.join(",") : value;
    }
  }

  return finalHeaders;
}
