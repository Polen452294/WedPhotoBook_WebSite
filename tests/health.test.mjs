import assert from "node:assert/strict";
import test from "node:test";

const base = process.env.TEST_BASE_URL;
test("readiness checks the application and database without caching or leaking details", { skip: !base }, async () => {
  const response = await fetch(`${base}/api/health/`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal((await fetch(`${base}/api/health/`, { method: "POST" })).status, 405);
});
