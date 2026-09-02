import { mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

function envValue(filePath, key) {
  try {
    const source = readFileSync(filePath, "utf8");
    for (const line of source.split(/\r?\n/)) {
      const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line.trim());
      if (!match || match[1] !== key) continue;
      const raw = match[2].trim();
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        return raw.slice(1, -1);
      }
      return raw;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return "";
}

const envPath = process.argv[2] || ".env.local";
const configured = process.env.DATABASE_PATH?.trim() || envValue(envPath, "DATABASE_PATH");
const selected = configured || ".data/wedfotobook.sqlite3";
const databasePath = isAbsolute(selected) ? selected : resolve(process.cwd(), selected);
mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });

const client = new Database(databasePath, { timeout: 5000 });
try {
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  client.pragma("busy_timeout = 5000");
  client.pragma("synchronous = NORMAL");
  migrate(drizzle(client), { migrationsFolder: resolve(process.cwd(), "drizzle") });
  client.pragma("optimize");
  console.log(`SQLite migrations applied to ${databasePath}`);
} finally {
  client.close();
}
