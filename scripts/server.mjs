import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import next from "next";
import Database from "better-sqlite3";

const hostname = process.env.HOST?.trim() || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();
const homepageCss = await readFile(resolve("public/wp-assets/home-optimized.css"), "utf8");

function withoutHomepageRuntime(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (script) => (
      /type=(?:"|')application\/ld\+json(?:"|')/i.test(script)
      || /id=(?:"|')consented-services-bootstrap(?:"|')/i.test(script)
      || /src=(?:"|')\/wp-assets\/home-interactions\.js\?v=\d+[a-z]?(?:"|')/i.test(script)
        ? script
        : ""
    ))
    .replace(/<link\b[^>]*rel=(?:"|')(?:modulepreload|preload)(?:"|')[^>]*as=(?:"|')script(?:"|')[^>]*\/?\s*>/gi, "")
    .replace(/<link\b[^>]*as=(?:"|')script(?:"|')[^>]*rel=(?:"|')(?:modulepreload|preload)(?:"|')[^>]*\/?\s*>/gi, "")
    .replace(
      /<link rel="stylesheet" href="(\/wp-assets\/home-optimized\.css\?v=\d+)" data-precedence="home"\/>/i,
      `<style data-home-styles>${homepageCss}</style>`,
    );
}

function isPublicHomepage(request) {
  if (request.headers["x-wedfotobook-render-source"] === "1") return false;
  const url = new URL(request.url || "/", "http://localhost");
  return ["GET", "HEAD"].includes(request.method || "") && url.pathname === "/" && !url.search;
}

await app.prepare();

let homepage;
let stopping = false;

function shutdown(code) {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(code), 10_000);
  deadline.unref();
  server.close(() => process.exit(code));
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    if (["/api/health", "/api/health/"].includes(pathname)) {
      response.setHeader("Cache-Control", "no-store");
      response.setHeader("Content-Type", "application/json");
      if (!["GET", "HEAD"].includes(request.method)) {
        response.writeHead(405, { Allow: "GET, HEAD" });
        response.end();
        return;
      }
      let database;
      try {
        if (!homepage || stopping || !process.env.DATABASE_PATH) throw new Error("Not ready");
        database = new Database(process.env.DATABASE_PATH, { readonly: true, fileMustExist: true, timeout: 250 });
        database.prepare("SELECT id FROM enquiries LIMIT 1").get();
        response.end(JSON.stringify({ status: "ok" }));
      } catch {
        response.statusCode = 503;
        response.end(JSON.stringify({ status: "unavailable" }));
      } finally {
        database?.close();
      }
      return;
    }
    if (!isPublicHomepage(request)) {
      await handle(request, response);
      return;
    }

    if (!homepage || stopping) {
      response.writeHead(503, { "Retry-After": "5", "Cache-Control": "no-store" });
      response.end("Service starting");
      return;
    }
    response.statusCode = 200;
    for (const [name, value] of homepage.headers) response.setHeader(name, value);
    const accepted = String(request.headers["accept-encoding"] || "");
    const encoding = /\bbr\b/.test(accepted) ? "br" : /\bgzip\b/.test(accepted) ? "gzip" : "identity";
    const body = homepage[encoding];
    if (encoding !== "identity") response.setHeader("Content-Encoding", encoding);
    response.setHeader("Content-Length", String(body.length));
    response.end(body);
  } catch (error) {
    console.error("HTTP request failed", error);
    if (!response.headersSent) response.statusCode = 500;
    response.end("Internal Server Error");
  }
});

server.listen(port, hostname, async () => {
  try {
    const source = await fetch(`http://${hostname}:${port}/`, {
      headers: { "x-wedfotobook-render-source": "1", accept: "text/html" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!source.ok) throw new Error(`Homepage pre-render returned HTTP ${source.status}`);
    const body = Buffer.from(withoutHomepageRuntime(await source.text()));
    const headers = [];
    for (const [name, value] of source.headers) {
      if (["connection", "content-encoding", "content-length", "date", "keep-alive", "transfer-encoding"].includes(name)) continue;
      headers.push([name, value]);
    }
    headers.push(["etag", `"${createHash("sha256").update(body).digest("base64url")}"`]);
    homepage = {
      identity: body,
      gzip: gzipSync(body, { level: 9 }),
      br: brotliCompressSync(body, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 } }),
      headers: [...headers, ["vary", "Accept-Encoding"]],
    };
    console.log(`WedFotoBook ready on http://${hostname}:${port}; homepage ${body.length} bytes without framework runtime`);
  } catch (error) {
    console.error("Failed to prepare the public homepage", error);
    shutdown(1);
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(0));
}
