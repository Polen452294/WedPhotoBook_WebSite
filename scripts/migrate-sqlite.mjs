import { mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";

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
const migrationsFolder = resolve(process.cwd(), "drizzle");
mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function seedMigrationJournalForExistingSchema(client) {
  const journal = JSON.parse(readFileSync(resolve(migrationsFolder, "meta/_journal.json"), "utf8"));
  const latestEntry = journal.entries.at(-1);
  if (!latestEntry) return;

  const latestSnapshot = JSON.parse(
    readFileSync(
      resolve(migrationsFolder, `meta/${String(latestEntry.idx).padStart(4, "0")}_snapshot.json`),
      "utf8",
    ),
  );
  const expectedTables = Object.values(latestSnapshot.tables);
  const existingTables = new Set(
    client.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name),
  );
  const existingExpectedTables = expectedTables.filter((table) => existingTables.has(table.name));

  if (existingExpectedTables.length === 0) return;
  if (existingExpectedTables.length !== expectedTables.length) {
    const missing = expectedTables.filter((table) => !existingTables.has(table.name)).map((table) => table.name);
    throw new Error(`Existing SQLite schema is incomplete; missing tables: ${missing.join(", ")}`);
  }

  for (const table of expectedTables) {
    const actualColumns = client.prepare(`PRAGMA table_info(${quoteIdentifier(table.name)})`).all();
    const actualColumnNames = new Set(actualColumns.map((column) => column.name));
    const expectedColumnNames = Object.keys(table.columns);
    const missingColumns = expectedColumnNames.filter((name) => !actualColumnNames.has(name));
    const extraColumns = actualColumns.map((column) => column.name).filter((name) => !table.columns[name]);
    if (missingColumns.length > 0 || extraColumns.length > 0) {
      throw new Error(
        `Existing SQLite table ${table.name} does not match the current schema; missing columns: ${missingColumns.join(", ") || "none"}; extra columns: ${extraColumns.join(", ") || "none"}`,
      );
    }

    const actualIndexes = new Set(
      client.prepare(`PRAGMA index_list(${quoteIdentifier(table.name)})`).all().map((index) => index.name),
    );
    const missingIndexes = Object.keys(table.indexes).filter((name) => !actualIndexes.has(name));
    if (missingIndexes.length > 0) {
      throw new Error(`Existing SQLite table ${table.name} is missing indexes: ${missingIndexes.join(", ")}`);
    }
  }

  client.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )
  `);
  const migrationCount = client.prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations").get().count;
  if (migrationCount > 0) return;

  const migrations = readMigrationFiles({ migrationsFolder });
  const insertMigration = client.prepare(
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
  );
  const seedMigrations = client.transaction(() => {
    for (const migration of migrations) {
      insertMigration.run(migration.hash, migration.folderMillis);
    }
  });
  seedMigrations.immediate();
  console.log(`Registered ${migrations.length} existing SQLite migrations without changing application data.`);
}

const client = new Database(databasePath, { timeout: 5000 });
try {
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  client.pragma("busy_timeout = 5000");
  client.pragma("synchronous = NORMAL");
  seedMigrationJournalForExistingSchema(client);
  migrate(drizzle(client), { migrationsFolder });
  client.pragma("optimize");
  console.log(`SQLite migrations applied to ${databasePath}`);
} finally {
  client.close();
}
