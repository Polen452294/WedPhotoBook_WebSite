import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type DatabaseConnection = ReturnType<typeof createConnection>;

const databasePath = () => {
  const configured = process.env.DATABASE_PATH?.trim();
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new Error("DATABASE_PATH must be configured in production.");
  }
  const selected = configured || ".data/wedfotobook.sqlite3";
  return isAbsolute(selected) ? selected : resolve(/* turbopackIgnore: true */ process.cwd(), selected);
};

function createConnection() {
  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const client = new Database(path, { timeout: 5000 });
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  client.pragma("busy_timeout = 5000");
  client.pragma("synchronous = NORMAL");
  return drizzle(client, { schema });
}

const globalDatabase = globalThis as typeof globalThis & {
  __wedfotobookDatabase?: DatabaseConnection;
};

export async function getDb() {
  globalDatabase.__wedfotobookDatabase ??= createConnection();
  return globalDatabase.__wedfotobookDatabase;
}
