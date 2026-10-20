import { parse } from "url";
import createNextServer from "next";

import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import type { NextServer } from "next/dist/server/next.js";
import { incomingMessageFromExpress } from "../utils.js";

// @ts-expect-error - Next.js doesn't export the custom server function with proper types
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const nextApp: NextServer = createNextServer({
  dev: false,
  dir: process.cwd(),
  hostname: "0.0.0.0",
  port: 8080,
});

const preparePromise = nextApp.prepare();

export const handle = async (req: Request, res: Response): Promise<void> => {
  await preparePromise;
  const parsedUrl = parse(req.url, true);
  const incomingMessage = incomingMessageFromExpress(req);
  await nextApp.getRequestHandler()(incomingMessage, res, parsedUrl);
};
