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
    "CONTACT_MAILER_URL=",
    "CONTACT_MAILER_TOKEN=",
    "CONTACT_TO_EMAIL=79854342367@yandex.ru",
    "CONTACT_FROM_EMAIL=Wedfotobook <orders@your-verified-domain.ru>",
  ].join("\n"));

  assert.equal(result.status, 1);
  assert.match(result.stderr, /local VPS mailer must be configured/);
  assert.match(result.stderr, /valid sender address/);
});

test("accepts the loopback mailer without exposing its token", async () => {
  const token = "7ea276366443585f81e43128f152c5ec8de6e7166c4026b725fa88e84d14a065";
  const result = await runWithEnv([
    "CONTACT_MAILER_URL=http://127.0.0.1:3081/send",
    `CONTACT_MAILER_TOKEN=${token}`,
    "CONTACT_TO_EMAIL=79854342367@yandex.ru",
    "CONTACT_FROM_EMAIL=Wedfotobook <orders@fotobooktest24.ru>",
  ].join("\n"));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /present \(local VPS mailer\)/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, new RegExp(token));
});

test("rejects a local mailer that could transmit its token off-server", async () => {
  const result = await runWithEnv([
    "CONTACT_MAILER_URL=https://mailer.example.com/send",
    "CONTACT_MAILER_TOKEN=12345678901234567890123456789012",
    "CONTACT_TO_EMAIL=orders@example.com",
    "CONTACT_FROM_EMAIL=Wedfotobook <forms@example.com>",
  ].join("\n"));

  assert.equal(result.status, 1);
  assert.match(result.stderr, /HTTP loopback/);
});
