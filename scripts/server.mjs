import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import next from "next";

const hostname = process.env.HOST?.trim() || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();
const homepageCss = await readFile(resolve("public/wp-assets/home-optimized.css"), "utf8");

function withoutHomepageRuntime(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (script) => (
      /type=(?:"|')application\/ld\+json(?:"|')/i.test(script)
      || /id=(?:"|')analytics-bootstrap(?:"|')/i.test(script)
      || /id=(?:"|')talk-me-bootstrap(?:"|')/i.test(script)
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
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  return ["GET", "HEAD"].includes(request.method || "") && url.pathname === "/" && !url.search;
}

await app.prepare();

let homepage;
let resolveHomepage;
let rejectHomepage;
const homepageReady = new Promise((resolve, reject) => {
  resolveHomepage = resolve;
  rejectHomepage = reject;
});

const server = createServer(async (request, response) => {
  try {
    if (!isPublicHomepage(request)) {
      await handle(request, response);
      return;
    }

    await homepageReady;
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
    resolveHomepage();
    console.log(`WedFotoBook ready on http://${hostname}:${port}; homepage ${body.length} bytes without framework runtime`);
  } catch (error) {
    rejectHomepage(error);
    console.error("Failed to prepare the public homepage", error);
    server.close(() => process.exit(1));
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
