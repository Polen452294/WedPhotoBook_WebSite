import { readFile, readdir, stat, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import { pathToFileURL } from "node:url";

const live = process.argv.find((arg) => arg.startsWith("--base-url="))?.slice(11);
const reportPath = process.argv.find((arg) => arg.startsWith("--report="))?.slice(9);
const base = new URL(live ?? "http://localhost");
const publicRoot = resolve("public");
const buildRoot = resolve("dist/client");
const assets = new Map();
const optimizerSources = new Map();
const failures = [];
const pageResults = [];
const usedClasses = new Set();
const unusedLegacyCssAssets = new Set();
// The captured WordPress stylesheet contains these inactive theme/plugin controls.
// Their files are absent on the original site too. Never exempt them if a page uses them.
const legacyCssControls = new Map([
  ["/wp-content/themes/h-code/assets/css/owl.video.play.png", ["owl-video-play-icon"]],
  ["/wp-content/themes/h-code/assets/css/mCSB_buttons.png", ["mCSB_buttonUp", "mCSB_buttonDown", "mCSB_buttonLeft", "mCSB_buttonRight"]],
  ["/wp-content/themes/h-code/assets/images/buy-theme.png", ["buy-theme"]],
  ["/wp-content/themes/h-code/assets/images/quick-question.png", ["quick-question"]],
]);
const imageExtension = /\.(?:avif|webp|png|jpe?g|gif|svg|ico)$/i;
const decodeHtml = (value) => value.replaceAll("&amp;", "&").replaceAll("&#038;", "&").replaceAll("&quot;", '"');
const worker = live ? null : (await import(pathToFileURL(resolve("dist/server/index.js")).href)).default;

async function pageResponse(path) {
  const request = new Request(new URL(path, base));
  if (live) return fetch(request, { signal: AbortSignal.timeout(20_000) });
  return worker.fetch(request, { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

function addAsset(raw, type, owner) {
  if (!raw || /^(?:data:|blob:|#)/i.test(raw)) return;
  const url = new URL(decodeHtml(raw), owner);
  if (["wedfotobook.ru", "www.wedfotobook.ru"].includes(url.hostname)) {
    url.protocol = base.protocol;
    url.host = base.host;
  }
  if (url.origin !== base.origin) return;
  url.hash = "";
  let key = url.href;
  // The VPS optimizer passes through the same original for every width. Check
  // each source/endpoint once live; distinct pre-generated srcset files stay separate.
  if (live && ["/_next/image", "/_vinext/image"].includes(url.pathname)) {
    const sourceKey = `${url.pathname}:${url.searchParams.get("url")}`;
    key = optimizerSources.get(sourceKey) ?? key;
    optimizerSources.set(sourceKey, key);
  }
  if (!assets.has(key)) assets.set(key, { type, owners: new Set() });
  assets.get(key).owners.add(owner);
}

function collectCss(css, owner) {
  for (const match of css.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/gi)) {
    const raw = match[1] ?? match[2] ?? match[3];
    const path = new URL(raw, owner).pathname;
    const controls = legacyCssControls.get(path);
    if (controls && controls.every((className) => !usedClasses.has(className))) {
      unusedLegacyCssAssets.add(path);
      continue;
    }
    addAsset(raw, /\.css$/i.test(path) ? "css" : imageExtension.test(path) ? "image" : "font", owner);
  }
}

function collectHtml(html, owner) {
  for (const match of html.matchAll(/\bclass=(?:"([^"]*)"|'([^']*)')/gi)) {
    for (const className of (match[1] ?? match[2]).split(/\s+/)) usedClasses.add(className);
  }
  for (const match of html.matchAll(/<(img|source|link|script|a|meta)\b([^>]+)>/gi)) {
    const tag = match[1].toLowerCase();
    const attributes = Object.fromEntries([...match[2].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
      .map((attr) => [attr[1].toLowerCase(), decodeHtml(attr[2] ?? attr[3])]));
    if (["img", "source"].includes(tag)) {
      for (const key of ["src", "data-src", "data-lazy-src"]) addAsset(attributes[key], "image", owner);
    }
    for (const key of ["srcset", "imagesrcset", "data-srcset"]) {
      for (const candidate of (attributes[key] ?? "").split(/,\s*/)) {
        addAsset(candidate.trim().replace(/\s+\d+(?:\.\d+)?[wx]$/, ""), "image", owner);
      }
    }
    if (tag === "script") addAsset(attributes.src, "script", owner);
    if (tag === "link" && /(?:stylesheet|preload|icon)/.test(attributes.rel ?? "")) {
      const type = attributes.rel.includes("icon") || attributes.as === "image" ? "image"
        : attributes.rel === "stylesheet" || attributes.as === "style" ? "css"
          : attributes.as === "font" ? "font" : "script";
      addAsset(attributes.href, type, owner);
    }
    if (tag === "a" && attributes.href && imageExtension.test(new URL(attributes.href, owner).pathname)) addAsset(attributes.href, "image", owner);
    if (tag === "meta" && /^(?:og:image|twitter:image)$/.test(attributes.property ?? attributes.name ?? "")) addAsset(attributes.content, "image", owner);
  }
  collectCss(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ""), owner);
}

async function existingFile(directory, encodedPath) {
  let path = encodedPath;
  // Legacy sources include literal percent signs and double-encoded spaces.
  for (let attempt = 0; attempt < 4; attempt++) {
    const file = resolve(directory, `.${path}`);
    const relativePath = relative(directory, file);
    if (relativePath.startsWith("..")) throw new Error(`Unsafe asset path: ${path}`);
    try { if ((await stat(file)).isFile()) return file; } catch { /* Try the next decoding level. */ }
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    } catch { break; }
  }
  return null;
}

async function checkAsset(href, entry) {
  if (live) {
    const response = await fetch(href, { method: entry.type === "css" ? "GET" : "HEAD", signal: AbortSignal.timeout(20_000) });
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get("content-type") ?? "";
    if (entry.type === "image" && !type.startsWith("image/")) throw new Error(`Not an image: ${type}`);
    if (entry.type === "css" && !type.startsWith("text/css")) throw new Error(`Not CSS: ${type}`);
    if (entry.type === "css") collectCss(await response.text(), href);
    return;
  }
  const url = new URL(href);
  const sourceUrl = ["/_next/image", "/_vinext/image"].includes(url.pathname) ? new URL(url.searchParams.get("url"), base) : url;
  const builtFile = await existingFile(buildRoot, sourceUrl.pathname);
  if (!builtFile) throw new Error("Missing from dist/client");
  const sourceFile = await existingFile(publicRoot, sourceUrl.pathname);
  if (!sourceFile && !sourceUrl.pathname.startsWith("/_next/static/")) throw new Error("Missing from public");
  if (sourceFile && !(await readFile(sourceFile)).equals(await readFile(builtFile))) throw new Error("Source and build contents differ");
  if (entry.type === "css") collectCss(await readFile(builtFile, "utf8"), href);
}

const sitemapResponse = await pageResponse("/sitemap.xml");
if (!sitemapResponse.ok) throw new Error(`Sitemap: HTTP ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const paths = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(decodeHtml(match[1])).pathname))];
if (!paths.length) throw new Error("Sitemap has no pages");
for (const path of paths) {
  const response = await pageResponse(path);
  pageResults.push({ path, status: response.status });
  if (response.status !== 200) failures.push({ path, error: `Page HTTP ${response.status}` });
  collectHtml(await response.text(), new URL(path, base).href);
}

// Check every public image/font as well as rendered references and CSS URLs.
async function collectPublic(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) await collectPublic(file);
    else if (/\.(?:avif|webp|png|jpe?g|gif|svg|ico|woff2?|ttf|otf|eot)$/i.test(entry.name)) {
      const urlPath = "/" + relative(publicRoot, file).split(/[/\\]/).map(encodeURIComponent).join("/");
      // Some legacy filenames need runtime-specific URL encoding; rendered URLs are checked live instead.
      if (!live) addAsset(urlPath, imageExtension.test(entry.name) ? "image" : "font", base.href);
    }
  }
}
await collectPublic(publicRoot);
console.log(`Checking ${paths.length} pages and ${assets.size} discovered resources...`);

const checked = new Set();
while (checked.size < assets.size) {
  const batch = [...assets].filter(([url]) => !checked.has(url)).slice(0, 6);
  await Promise.all(batch.map(async ([url, entry]) => {
    checked.add(url);
    try { await checkAsset(url, entry); }
    catch (error) { failures.push({ url, error: error.message, owners: [...entry.owners] }); }
  }));
  if (checked.size % 120 === 0) console.log(`Checked ${checked.size}/${assets.size} resources`);
}
const report = { baseUrl: base.href, pages: pageResults, assets: assets.size, images: [...assets.values()].filter((entry) => entry.type === "image").length, unusedLegacyCssAssets: [...unusedLegacyCssAssets], failures };
if (reportPath) {
  await mkdir(dirname(resolve(reportPath)), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
}
console.log(`Asset audit: ${paths.length} pages, ${assets.size} resources, ${report.images} image URLs, ${failures.length} failures`);
for (const failure of failures) console.error(JSON.stringify(failure));
if (failures.length) process.exitCode = 1;
