import { readFile, writeFile } from "node:fs/promises";
import postcss from "postcss";

// Selectors covering the header, hero, facts and first content section, including
// hover/menu states and every media query. Full CSS remains the source of truth.
const selectors = new Set(JSON.parse(await readFile("data/home-critical-selectors.json", "utf8")));
const root = postcss.parse(await readFile("public/wp-assets/home-optimized.css", "utf8"));
root.walkRules((rule) => { if (!selectors.has(rule.selector)) rule.remove(); });
root.walkAtRules((rule) => { if (rule.nodes?.length === 0) rule.remove(); });
await writeFile("public/wp-assets/home-critical.css", root.toString());
console.log(`Prepared ${Buffer.byteLength(root.toString())} bytes of first-screen CSS.`);
