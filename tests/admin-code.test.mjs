import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { MAX_CUSTOM_CSS_BYTES, validateCustomCss } from "../lib/site-code.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [adminRoute, publicRoute, manager, editor, page, shell, schema] = await Promise.all([
  read("../app/api/admin/code/route.ts"),
  read("../app/api/site-code/route.ts"),
  read("../components/SiteCodeManager.tsx"),
  read("../components/AdminCodeEditor.tsx"),
  read("../app/admin/code/page.tsx"),
  read("../components/AdminShell.tsx"),
  read("../db/schema.ts"),
]);

test("custom CSS validator accepts local styles and normalizes line endings", () => {
  assert.deepEqual(validateCustomCss(".hero { color: #123; }\r\n"), { ok: true, css: ".hero { color: #123; }" });
  assert.equal(MAX_CUSTOM_CSS_BYTES, 50 * 1024);
});

test("custom CSS validator blocks executable and external-loading constructs", () => {
  for (const css of [
    "@import 'https://example.com/a.css';",
    ".x { background: url(https://example.com/a.png); }",
    ".x { background-image: image-set('a.png' 1x); }",
    ".x { width: expression(alert(1)); }",
    ".x { behavior: url(test.htc); }",
    "</style><script>alert(1)</script>",
  ]) assert.equal(validateCustomCss(css).ok, false, css);
});

test("custom CSS validator rejects malformed and oversized input", () => {
  assert.equal(validateCustomCss(".x { color: red;").ok, false);
  assert.equal(validateCustomCss(".x::after { content: 'open; }").ok, false);
  assert.equal(validateCustomCss("/* open").ok, false);
  assert.equal(validateCustomCss("a".repeat(MAX_CUSTOM_CSS_BYTES + 1)).ok, false);
});

test("code editor is protected, revisioned, audited and CSS-only", () => {
  assert.match(page, /requireAdminUser\("\/admin\/code\/"\)/u);
  assert.match(adminRoute, /getAdminUser\(\)/u);
  assert.match(adminRoute, /authorizeAdminMutation\(request\)/u);
  assert.match(adminRoute, /expectedRevision/u);
  assert.match(adminRoute, /RequestSecurityError\(409/u);
  assert.match(adminRoute, /validateCustomCss/u);
  assert.match(adminRoute, /action: "code_update"/u);
  assert.match(adminRoute, /action: "code_reset"/u);
  assert.match(schema, /export const siteCodeSettings = sqliteTable/u);
  assert.match(schema, /"code_update", "code_reset"/u);
  assert.doesNotMatch(adminRoute, /(?:writeFile|readFile|exec|spawn|eval)\s*\(/u);
  assert.match(editor, /JavaScript, HTML и серверные файлы недоступны/u);
  assert.match(editor, /const previewCss = validation\.ok \? validation\.css : publishedCss/u);
  assert.match(editor, /postToPreview\(previewCss\)/u);
});

test("public site applies CSS as text while admin pages remain isolated", () => {
  assert.match(publicRoute, /Cache-Control": "no-store"/u);
  assert.match(manager, /style\.textContent = css/u);
  assert.match(manager, /pathname\.startsWith\("\/admin"\)/u);
  assert.match(manager, /event\.origin !== window\.location\.origin/u);
  assert.match(editor, /\/\?code_preview=1/u);
  assert.match(shell, /<a href="\/admin\/code\/">/u);
});
