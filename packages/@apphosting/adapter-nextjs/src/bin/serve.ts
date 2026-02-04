import { createServer } from "http";
import { parse } from "url";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// --- 1. ENV SETUP ---
// @ts-ignore
process.env['NODE_ENV'] = "production";
process.env['__NEXT_PRIVATE_PREBUNDLED_REACT'] = 'experimental';

async function start() {
  // --- 2. CONFIGURATION ---
  const serverDir = process.argv[2] || process.cwd();
  const PORT = parseInt(process.env.PORT || "8080");
  
  console.log(`> Starting server from: ${serverDir}`);

  // Import Next.js internals
  const nextMetaPath = require.resolve("next/dist/server/request-meta", { paths: [serverDir] });
  const { NEXT_REQUEST_META } = require(nextMetaPath);

  // Load build config
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

  // --- HELPER: EDGE ROUTING ENGINE ---
  function applyRoutingRules(req: any, res: any, pathname: string) {
    const routing = buildContext.routing;
    if (!routing) return false;

    // 1. Headers (beforeMiddleware)
    if (routing.beforeMiddleware) {
      for (const rule of routing.beforeMiddleware) {
        if (rule.sourceRegex && new RegExp(rule.sourceRegex).test(pathname)) {
          
          if (rule.headers) {
            for (const [key, value] of Object.entries(rule.headers)) {
              res.setHeader(key, value);
            }
            console.log(`[EDGE] 🔧 Applied headers for: ${pathname}`);
          }
          
          // Handle Redirects
          if (rule.status && (rule.status >= 300 && rule.status < 400) && rule.headers?.Location) {
             console.log(`[EDGE] ↪️  Redirecting ${pathname} -> ${rule.headers.Location} (${rule.status})`);
             res.statusCode = rule.status;
             res.setHeader('Location', rule.headers.Location); 
             res.end();
             return true; 
          }
        }
      }
    }
    return false;
  }

  // --- HELPER: PPR STATE ---
  const getPostponedState = (path: string) => {
    let prerender = buildContext.outputs?.prerenders?.find((it: any) => it.pathname === path);
    if (!prerender && buildContext.routes?.dynamicRoutes) {
      const dynamicMatch = buildContext.routes.dynamicRoutes.find((it: any) => 
        path.match(new RegExp(it.sourceRegex))
      )?.source;
      if (dynamicMatch) {
        prerender = buildContext.outputs?.prerenders?.find((it: any) => it.pathname === dynamicMatch);
      }
    }
    return prerender?.fallback?.postponedState;
  };

  // --- 3. SERVER INSTANTIATION ---
  const nextPath = require.resolve("next/dist/server/next-server", { paths: [serverDir] });
  const NextServer = require(nextPath).default;
  
  // Minimal Server (PPR)
  const minimalServer = new NextServer({
    dir: serverDir,
    hostname: '0.0.0.0',
    port: PORT,
    conf: buildContext.config, 
    minimalMode: true,
    customServer: false
  });

  // Full Server (Actions/API/Standard)
  const fullServer = new NextServer({
    dir: serverDir,
    hostname: '0.0.0.0',
    port: PORT,
    conf: buildContext.config,
    minimalMode: false,
    customServer: false
  });

  console.log("Hydrating Next.js servers...");
  try {
      await minimalServer.prepare();
      await fullServer.prepare();
  } catch (e) {
      console.error("Failed to prepare Next.js servers:", e);
      process.exit(1);
  }
  
  const minimalRequestHandler = minimalServer.getRequestHandler();
  const fullRequestHandler = fullServer.getRequestHandler();

  // --- 4. REQUEST HANDLER ---
  const server = createServer(async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // [A] ROUTING ENGINE
      const handled = applyRoutingRules(req, res, pathname || "/");
      if (handled) return;

      // [B] STATIC FILE HANDLING
      if (pathname && (pathname.startsWith("/_next/static/") || pathname.startsWith("/public/") || pathname === "/favicon.ico")) {
        let relativePath;
        if (pathname.startsWith("/_next/static/")) {
           relativePath = pathname.replace(/^\/_next\/static\//, ".next/static/");
        } else if (pathname === "/favicon.ico") {
           relativePath = "public/favicon.ico";
        } else {
           relativePath = pathname.substring(1); 
        }

        const filePath = path.join(serverDir, relativePath);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
           // console.log(`[STATIC] 📄 Serving file: ${pathname}`); // Uncomment for verbose logs
           const ext = path.extname(filePath).toLowerCase();
           const mimeTypes: Record<string, string> = {
             '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png',
             '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
           };
           res.setHeader("Content-Type", mimeTypes[ext] || 'application/octet-stream');
           res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
           fs.createReadStream(filePath).pipe(res);
           return;
        }
      }

      // [C] SERVER ACTIONS (POST)
      if (req.method === 'POST') {
         console.log(`[ACTION] ⚡️ Routing POST to Full Server: ${pathname}`);
         await fullRequestHandler(req, res, parsedUrl);
         return;
      }

      // [D] RESUME REQUESTS (PPR Stream)
      if (req.headers['next-resume'] === '1' && pathname) {
        console.log(`[RESUME] 🌊 Intercepted Resume request for: ${pathname}`);
        const postponed = getPostponedState(pathname);
        if (postponed) {
          req[NEXT_REQUEST_META] = { postponed };
        }
        return minimalRequestHandler(req, res, parsedUrl);
      }

      if (!req.headers['x-matched-path']) {
        req.headers['x-matched-path'] = pathname;
      }

      // [E] ROUTING DECISION
      const match = await minimalServer.matchers.match(pathname, {});
      let isPPR = false;
      if (match) {
        const manifest = minimalServer.getPrerenderManifest();
        
        const safePathname = pathname || "";
        
        const routeData = manifest.routes[safePathname] || 
                          (match.definition && manifest.dynamicRoutes[match.definition.pathname]);
        if (routeData && routeData.experimentalPPR) {
            isPPR = true;
        }
      }

      if (isPPR) {
        console.log(`[MINIMAL] 🟢 Routing to Minimal Server (PPR): ${pathname}`);
        await minimalRequestHandler(req, res, parsedUrl);
      } else {
        console.log(`[FULL] 🔵 Routing to Full Server: ${pathname}`);
        await fullRequestHandler(req, res, parsedUrl);
      }

    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\n❌ FATAL: Port ${PORT} is already in use.`);
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}

start();