import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

const manifest = JSON.parse(await readFile(new URL("../data/responsive-photos.json", import.meta.url)));
const logoManifest = JSON.parse(await readFile(new URL("../data/responsive-logo.json", import.meta.url)));

test("responsive images retain the original proportions and never upscale", async () => {
  for (const [source, photo] of Object.entries(manifest)) {
    const original = await sharp(await readFile(new URL("../public" + source, import.meta.url))).metadata();
    assert.equal(photo.width, original.width, source);
    assert.deepEqual(photo.widths, [...new Set(photo.widths)].sort((a, b) => a - b));
    for (const width of photo.widths) {
      const file = "../public/media/responsive/" + photo.id + "-" + width + ".webp";
      const image = await sharp(await readFile(new URL(file, import.meta.url))).metadata();
      assert.equal(image.format, "webp", file);
      assert.equal(image.width, width, file);
      assert.ok(width < original.width, file);
      assert.ok(Math.abs(image.height - width * original.height / original.width) <= 1, file);
    }
    for (const width of photo.avifWidths) {
      const file = `../public/media/responsive/${photo.avifId}-${width}.avif`;
      const image = await sharp(await readFile(new URL(file, import.meta.url))).metadata();
      assert.equal(image.compression, "av1", file);
      assert.equal(image.width, width, file);
      assert.ok(width <= original.width, file);
      assert.ok(Math.abs(image.height - width * original.height / original.width) <= 1, file);
    }
  }
});

test("the mobile hero has sharp 2x/3x candidates with a much smaller payload", async () => {
  const hero = manifest["/media/originals/22969.jpg"];
  const original = await readFile(new URL("../public/media/originals/22969.jpg", import.meta.url));
  assert.equal(hero.width, 1767);
  for (const width of [480, 640]) {
    assert.ok(hero.widths.includes(width));
    const candidate = await readFile(new URL("../public/media/responsive/" + hero.id + "-" + width + ".webp", import.meta.url));
    assert.ok(candidate.length < original.length / 8);
  }
  const avif = await readFile(new URL(`../public/media/responsive/${hero.avifId}-384.avif`, import.meta.url));
  const previousWebp = await readFile(new URL(`../public/media/responsive/${hero.id}-480.webp`, import.meta.url));
  assert.ok(avif.length < previousWebp.length * 0.6, "the mobile LCP resource should be at least 40% smaller");
});

test("the header logo has lossless responsive sources", async () => {
  for (const width of logoManifest.widths) {
    const webp = await sharp(await readFile(new URL(`../public/media/responsive/${logoManifest.id}-${width}.webp`, import.meta.url))).metadata();
    assert.equal(webp.format, "webp");
    assert.equal(webp.width, width);
  }
});

test("the homepage uses compressed local fonts and retains the fallback typefaces", async () => {
  const css = await readFile(new URL("../public/wp-assets/home-optimized.css", import.meta.url), "utf8");
  const faces = [...css.matchAll(/@font-face\{[^}]*\}/g)].map((match) => match[0]);
  assert.equal(faces.length, 1, "the variable font should be declared once instead of once per weight");
  assert.match(faces[0], /font-weight:400 800/);
  const fontUrls = new Set();
  for (const face of faces) {
    assert.match(face, /font-display:optional/);
    assert.match(face, /\.woff2/);
    assert.doesNotMatch(face, /\.ttf/);
    const url = /url\(([^)]+)\)/.exec(face)[1];
    fontUrls.add(url);
    const bytes = await readFile(new URL("../public" + url, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "wOF2");
  }
  assert.equal(fontUrls.size, 1, "all weights must share one variable font download");
});
