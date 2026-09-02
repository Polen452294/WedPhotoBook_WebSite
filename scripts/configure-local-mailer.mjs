import { readFile, writeFile } from "node:fs/promises";

const envPath = process.argv[2] || ".env.local";
const token = process.env.LOCAL_MAILER_TOKEN_VALUE?.trim() || "";
if (token.length < 32) throw new Error("LOCAL_MAILER_TOKEN_VALUE must contain at least 32 characters");

const updates = new Map([
  ["CONTACT_MAILER_URL", "http://127.0.0.1:3081/send"],
  ["CONTACT_MAILER_TOKEN", token],
  ["CONTACT_TO_EMAIL", "79854342367@yandex.ru"],
  ["CONTACT_FROM_EMAIL", "Wedfotobook <orders@fotobooktest24.ru>"],
]);

const source = await readFile(envPath, "utf8");
const seen = new Set();
const lines = source.split(/\r?\n/).map((line) => {
  const match = /^([A-Z][A-Z0-9_]*)=/.exec(line.trim());
  if (!match || !updates.has(match[1])) return line;
  seen.add(match[1]);
  return `${match[1]}=${updates.get(match[1])}`;
});
for (const [key, value] of updates) {
  if (!seen.has(key)) lines.push(`${key}=${value}`);
}
await writeFile(envPath, `${lines.join("\n").replace(/\n+$/, "")}\n`, { mode: 0o600 });
console.log("Configured the loopback mailer without printing its token.");
