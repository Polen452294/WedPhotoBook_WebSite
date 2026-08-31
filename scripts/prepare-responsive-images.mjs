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
  const widths = [320, 480, 640, 960, 1280, 1600].filter((width) => width < metadata.width);
  for (const width of widths) {
    await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 88, effort: 6 })
      .toFile(`public/media/responsive/${id}-${width}.webp`);
    count++;
  }
  // The final srcset candidate remains the unmodified original at native size.
  manifest[source] = { id, width: metadata.width, widths };
}
await writeFile("data/responsive-photos.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`Prepared ${count} responsive images from ${sources.size} originals.`);
