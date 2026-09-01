import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const scriptPath = fileURLToPath(new URL("../scripts/check-contact-config.mjs", import.meta.url));

async function runWithEnv(contents) {
  const directory = await mkdtemp(join(tmpdir(), "wedfotobook-contact-"));
  const envPath = join(directory, ".env.local");
  await writeFile(envPath, contents);
  const result = spawnSync(process.execPath, [scriptPath, envPath], { encoding: "utf8" });
  await rm(directory, { recursive: true, force: true });
  return result;
}

test("rejects a VPS contact configuration that cannot deliver notifications", async () => {
  const result = await runWithEnv([
    "RESEND_API_KEY=",
    "CONTACT_TO_EMAIL=79854342367@yandex.ru",
    "CONTACT_FROM_EMAIL=Wedfotobook <orders@your-verified-domain.ru>",
  ].join("\n"));

  assert.equal(result.status, 1);
  assert.match(result.stderr, /RESEND_API_KEY is missing/);
  assert.match(result.stderr, /verified Resend domain/);
});

test("accepts a complete VPS contact notification configuration without exposing values", async () => {
  const apiKey = "re_test_secret_value";
  const result = await runWithEnv([
    `RESEND_API_KEY=${apiKey}`,
    "CONTACT_TO_EMAIL=orders@example.com",
    "CONTACT_FROM_EMAIL=Wedfotobook <forms@example.com>",
  ].join("\n"));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /configuration is present/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, new RegExp(apiKey));
});
