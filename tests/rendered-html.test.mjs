import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the migrated home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Фотокнига на заказ/);
  assert.match(html, /под ключ/);
  assert.match(html, /\/media\/home\/fotokniga-na-zakaz-wedfotobook-ru\.webp/);
  assert.match(html, /\/og\.png/);
  assert.match(html, /data-order-open/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("preserves all WordPress routes and curated media", async () => {
  const [pagesJson, manifestJson] = await Promise.all([
    readFile(new URL("../data/pages.json", import.meta.url), "utf8"),
    readFile(new URL("../public/media/manifest.json", import.meta.url), "utf8"),
  ]);
  const pages = JSON.parse(pagesJson);
  const manifest = JSON.parse(manifestJson);

  assert.equal(pages.length, 29);
  assert.equal(new Set(pages.map((page) => page.slug)).size, 29);
  assert.equal(manifest.length, 140);
  assert.ok(manifest.some((asset) => asset.group === "brand"));
  assert.ok(manifest.some((asset) => asset.group === "reviews"));
  assert.ok(manifest.some((asset) => asset.group === "gallery/wedding"));

  await Promise.all(
    manifest.map((asset) => access(new URL(`../public${asset.src}`, import.meta.url))),
  );
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/favicon.svg", import.meta.url));
});
