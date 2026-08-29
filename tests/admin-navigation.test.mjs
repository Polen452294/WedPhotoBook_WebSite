import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("admin navigation uses reliable document links", async () => {
  const [shell, dashboard, login] = await Promise.all([
    source("components/AdminShell.tsx"),
    source("app/admin/page.tsx"),
    source("app/admin/login/page.tsx"),
  ]);

  for (const file of [shell, dashboard, login]) {
    assert.doesNotMatch(file, /from\s+["']next\/link["']/u);
    assert.doesNotMatch(file, /<Link\b/u);
  }

  assert.match(shell, /<a href="\/admin\/content\/">/u);
  assert.match(shell, /<a href="\/admin\/code\/">/u);
  assert.match(dashboard, /<a className="admin-primary-link" href="\/admin\/content\/">Редактировать тексты<\/a>/u);
});
