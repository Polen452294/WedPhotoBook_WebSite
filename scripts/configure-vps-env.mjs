import { chmod, readFile, writeFile } from "node:fs/promises";

const filePath = process.argv[2] || ".env.local";
const databasePath = process.argv[3] || "/var/lib/wedfotobook/wedfotobook.sqlite3";
const obsoleteKeys = new Set([
  "ADMIN_EMAILS",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "RESEND_API_KEY",
  "TURNSTILE_SECRET_KEY",
]);

const source = await readFile(filePath, "utf8");
const retained = source.split(/\r?\n/).filter((line) => {
  const key = /^([A-Z][A-Z0-9_]*)=/.exec(line.trim())?.[1];
  return !key || (key !== "DATABASE_PATH" && !obsoleteKeys.has(key) && !key.startsWith("CLOUDFLARE_"));
});
while (retained.at(-1) === "") retained.pop();
retained.push(`DATABASE_PATH=${databasePath}`, "");

await writeFile(filePath, retained.join("\n"), { mode: 0o600 });
await chmod(filePath, 0o600);
console.log(`VPS runtime configuration updated in ${filePath}.`);
