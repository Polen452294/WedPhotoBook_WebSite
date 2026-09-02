import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const directory = await mkdtemp(join(tmpdir(), "wedfotobook-tests-"));
const databasePath = join(directory, "test.sqlite3");
const port = String(31_000 + Math.floor(Math.random() * 1_000));
const baseUrl = `http://127.0.0.1:${port}`;
const environment = { ...process.env, NODE_ENV: "production", DATABASE_PATH: databasePath, HOST: "127.0.0.1", PORT: port };

let server;
let output = "";
try {
  const migration = spawnSync(process.execPath, ["scripts/migrate-sqlite.mjs"], { cwd: process.cwd(), env: environment, encoding: "utf8" });
  if (migration.status !== 0) throw new Error(migration.stderr || migration.stdout || "Test migration failed");

  server = spawn(process.execPath, ["scripts/server.mjs"], { cwd: process.cwd(), env: environment, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });

  const deadline = Date.now() + 30_000;
  let ready = false;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Test server stopped early:\n${output}`);
    try {
      const response = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) { ready = true; break; }
    } catch {
      // The server may still be binding the test port.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  if (!ready) throw new Error(`Test server did not become ready:\n${output}`);

  const tests = (await readdir(resolve("tests"))).filter((name) => name.endsWith(".test.mjs")).map((name) => join("tests", name));
  const result = spawnSync(process.execPath, ["--test", ...tests], {
    cwd: process.cwd(), env: { ...environment, TEST_BASE_URL: baseUrl }, stdio: "inherit",
  });
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  server?.kill("SIGTERM");
  await rm(directory, { recursive: true, force: true });
}
