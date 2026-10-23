import { Request } from "firebase-functions/v2/https";
import { IncomingMessage } from "node:http";
import { Socket } from "node:net";

export async function isUsingFirebaseJsSdk() {
  if (!process.env.__FIREBASE_DEFAULTS__) return false;
  try {
    await import("firebase/app");
    return true;
  } catch (e) {
    return false;
  }
}

export function incomingMessageFromExpress(req: Request): IncomingMessage {
  const socket = new Socket();
  const incomingMessage = new IncomingMessage(socket);

  incomingMessage.push(req.rawBody);
  incomingMessage.push(null);
  // The whole body is pushed above. Left false, Node emits "aborted" once the body is read.
  incomingMessage.complete = true;

  incomingMessage.headers = req.headers;
  incomingMessage.headersDistinct = req.headersDistinct;
  incomingMessage.httpVersion = req.httpVersion;
  incomingMessage.httpVersionMajor = req.httpVersionMajor;
  incomingMessage.httpVersionMinor = req.httpVersionMinor;
  incomingMessage.method = req.method;
  incomingMessage.rawHeaders = req.rawHeaders;
  incomingMessage.rawTrailers = req.rawTrailers;
  incomingMessage.trailers = req.trailers;
  incomingMessage.trailersDistinct = req.trailersDistinct;
  incomingMessage.url = req.url;

  return incomingMessage;
}
