import { createHash } from "node:crypto";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Generate from verified originals, never from the old compressed thumbnails.
// Assets are committed, so production needs no image service or build dependency.
const originals = JSON.parse(await readFile("data/photo-sources.json", "utf8"));
const sources = new Set();
for (const folder of ["home", "covers"]) {
  for (const name of await readdir(`public/media/${folder}`)) {
    if (!/\.(?:jpe?g|webp|png)$/i.test(name)) continue;
    const path = `/media/${folder}/${name}`;
    sources.add(originals[path] ?? path);
  }
}

await mkdir("public/media/responsive", { recursive: true });
const manifest = {};
let count = 0;
for (const source of [...sources].sort()) {
  const input = await readFile(`public${source}`);
  const metadata = await sharp(input).metadata();
  const id = createHash("sha256").update(input).update("webp-q88-m6-v1").digest("hex").slice(0, 16);
  const widths = [320, 384, 480, 640, 800, 960, 1280, 1600].filter((width) => width < metadata.width);
  for (const width of widths) {
    await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 88, effort: 6 })
      .toFile(`public/media/responsive/${id}-${width}.webp`);
    count++;
  }
  // The final srcset candidate remains the unmodified original at native size.
  const avifId = createHash("sha256").update(input).update("avif-q60-m6-444-v1").digest("hex").slice(0, 16);
  const avifWidths = [...widths, metadata.width];
  for (const width of avifWidths) {
    await sharp(input).resize({ width, withoutEnlargement: true })
      .avif({ quality: 60, effort: 6, chromaSubsampling: "4:4:4" })
      .toFile(`public/media/responsive/${avifId}-${width}.avif`);
    count++;
  }
  manifest[source] = { id, width: metadata.width, widths, avifId, avifWidths };
}
await writeFile("data/responsive-photos.json", JSON.stringify(manifest, null, 2) + "\n");
const logoInput = await readFile("public/media/brand/Logo wedfotobook.png");
const logoId = createHash("sha256").update(logoInput).update("webp-lossless-v1").digest("hex").slice(0, 16);
const logoWidths = [256, 384, 480, 640, 800, 962];
for (const width of logoWidths) {
  await sharp(logoInput).resize({ width, withoutEnlargement: true }).webp({ lossless: true, effort: 6 })
    .toFile(`public/media/responsive/${logoId}-${width}.webp`);
}
await writeFile("data/responsive-logo.json", JSON.stringify({ id: logoId, widths: logoWidths }, null, 2) + "\n");
console.log(`Prepared ${count} responsive images from ${sources.size} originals.`);
