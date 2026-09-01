import { readFile, writeFile } from "node:fs/promises";
import postcss from "postcss";

// Selectors covering the header, hero, facts and first content section, including
// hover/menu states and every media query. Full CSS remains the source of truth.
const selectors = new Set(JSON.parse(await readFile("data/home-critical-selectors.json", "utf8")));
const sourcePath = "public/wp-assets/home-optimized.css";
const sourceRoot = postcss.parse(await readFile(sourcePath, "utf8"));

function splitSelectorList(value) {
  const selectors = [];
  let current = "";
  let parentheses = 0;
  let brackets = 0;
  let quote = "";

  for (const character of value) {
    if (quote) {
      current += character;
      if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (character === "(") parentheses += 1;
    else if (character === ")") parentheses -= 1;
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets -= 1;

    if (character === "," && parentheses === 0 && brackets === 0) {
      if (current.trim()) selectors.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) selectors.push(current.trim());
  return selectors;
}

// The imported WordPress theme applied transition timing to every DOM node.
// Besides creating hundreds of non-composited transitions, this also made
// initial style changes more expensive. Explicit component transitions remain.
sourceRoot.walkRules((rule) => {
  if (rule.selector !== "*") return;
  rule.walkDecls(/^transition-(?:duration|timing-function)$/, (declaration) => declaration.remove());
  if (!rule.nodes?.length) rule.remove();
});

// The same local variable font previously appeared as five separate faces.
// One ranged face preserves every used weight and reduces both critical and
// deferred CSS parsing work.
const openSansFaces = [];
sourceRoot.walkAtRules("font-face", (rule) => {
  if (rule.toString().includes("open-sans-latin-variable-v3.003.woff2")) openSansFaces.push(rule);
});
if (openSansFaces.length > 1) {
  openSansFaces[0].walkDecls("font-weight", (declaration) => { declaration.value = "400 800"; });
  openSansFaces.slice(1).forEach((rule) => rule.remove());
}
await writeFile(sourcePath, sourceRoot.toString());

const root = sourceRoot.clone();
root.walkRules((rule) => {
  const retained = selectors.has(rule.selector)
    ? splitSelectorList(rule.selector)
    : splitSelectorList(rule.selector).filter((selector) => selectors.has(selector));
  if (!retained.length) rule.remove();
  else rule.selector = retained.join(",");
});
root.walkAtRules((rule) => { if (rule.nodes?.length === 0) rule.remove(); });

const referencedVariables = new Set([...root.toString().matchAll(/var\((--[\w-]+)/g)].map((match) => match[1]));
root.walkRules(":root", (rule) => {
  rule.walkDecls(/^--/, (declaration) => {
    if (!referencedVariables.has(declaration.prop)) declaration.remove();
  });
  if (!rule.nodes?.length) rule.remove();
});
await writeFile("public/wp-assets/home-critical.css", root.toString());
console.log(`Prepared ${Buffer.byteLength(root.toString())} bytes of first-screen CSS.`);
