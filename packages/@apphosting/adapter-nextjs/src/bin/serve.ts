import { createServer } from "http";
import { parse } from "url";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const __dirname = dirname(__filename);

// 1. SET ENV VARS
// @ts-ignore
process.env['NODE_ENV'] = "production";
process.env['NEXT_PRIVATE_MINIMAL_MODE'] = "1";

async function start() {
  // 1. GET THE APP ROOT
  // The CLI passes the app directory as the first argument (process.argv[2])
  // If missing, fallback to the current directory (but that usually fails in this setup)
  const serverDir = process.argv[2] || process.cwd();

  console.log(`> Starting server from: ${serverDir}`);

  // 2. IMPORT NEXT.JS INTERNALS
  const nextMetaPath = require.resolve("next/dist/server/request-meta", { paths: [serverDir] });
  const { NEXT_REQUEST_META } = require(nextMetaPath);

  let configPath = path.join(serverDir, "output.json");

  if (!fs.existsSync(configPath)) {
     configPath = path.join(process.cwd(), ".apphosting", "output.json");
  }
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config not found at: ${configPath}`);
    process.exit(1);
  }

  const rawConfig = fs.readFileSync(configPath, 'utf-8');
  const buildContext = JSON.parse(rawConfig);

  // Helper to find the postponed state for a path
  const getPostponedState = (path: string) => {
    let prerender = buildContext.outputs.prerenders.find((it: any) => it.pathname === path);
    if (!prerender) {
      const dynamicMatch = buildContext.routes.dynamicRoutes.find((it: any) => 
        path.match(new RegExp(it.sourceRegex))
      )?.source;
      prerender = buildContext.outputs.prerenders.find((it: any) => it.pathname === dynamicMatch);
    }
    return prerender?.fallback?.postponedState;
  };

  // 4. SETUP SERVER
  const nextPath = require.resolve("next/dist/server/next-server", { paths: [serverDir] });
  const NextServer = require(nextPath).default;
  
  const server = new NextServer({
    dir: serverDir,
    hostname: '0.0.0.0',
    port: parseInt(process.env.PORT || "8080"),
    conf: buildContext.config,
  });

  await server.prepare();
  const requestHandler = server.getRequestHandler();

  createServer(async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      if (req.headers['next-resume'] === '1' && pathname) {
        const postponed = getPostponedState(pathname);
        if (postponed) {
          console.log(`⚡️ Injecting Postponed State for ${pathname}`);
          req[NEXT_REQUEST_META] = { postponed };
        }
      }

      if (!req.headers['x-matched-path']) {
        req.headers['x-matched-path'] = pathname;
      }

      await requestHandler(req, res, parsedUrl);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end("Internal Error");
    }
  }).listen(parseInt(process.env.PORT || "8080"), () => {
    console.log(`> Ready on http://localhost:${process.env.PORT || 8080}`);
  });
}

start();