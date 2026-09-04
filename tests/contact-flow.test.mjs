import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Database from "better-sqlite3";

test("order API persists callbacks from every entry point and uses only the configured mailer", async (t) => {
  // Never deliver test data to the real recipient, even on a configured VPS.
  const directory = await mkdtemp(join(tmpdir(), "wedfotobook-contact-flow-"));
  const databasePath = join(directory, "test.sqlite3");
  const token = "isolated-test-mailer-token-not-a-production-secret";
  const requests = [];
  let mailerStatus = 200;
  const mailer = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    requests.push({ headers: request.headers, payload: JSON.parse(body) });
    response.writeHead(mailerStatus, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: mailerStatus === 200 }));
  });
  let app;
  t.after(async () => {
    if (app && app.exitCode === null) {
      const exited = once(app, "exit");
      app.kill("SIGTERM");
      await exited;
    }
    await new Promise((resolve) => mailer.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  mailer.listen(0, "127.0.0.1");
  await once(mailer, "listening");
  const portReservation = createServer();
  portReservation.listen(0, "127.0.0.1");
  await once(portReservation, "listening");
  const port = portReservation.address().port;
  await new Promise((resolve) => portReservation.close(resolve));
  const baseUrl = `http://127.0.0.1:${port}`;
  const environment = {
    ...process.env,
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    PORT: String(port),
    DATABASE_PATH: databasePath,
    CONTACT_MAILER_URL: `http://127.0.0.1:${mailer.address().port}/send`,
    CONTACT_MAILER_TOKEN: token,
    CONTACT_FROM_EMAIL: "WedFotoBook <orders@example.test>",
    CONTACT_TO_EMAIL: "owner@example.test",
    RATE_LIMIT_SALT: "isolated-contact-flow-test",
  };
  const migration = spawnSync(process.execPath, ["scripts/migrate-sqlite.mjs"], { env: environment, encoding: "utf8" });
  assert.equal(migration.status, 0, migration.stderr);
  app = spawn(process.execPath, ["scripts/server.mjs"], { env: environment, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  app.stdout.on("data", (chunk) => { output += chunk; });
  app.stderr.on("data", (chunk) => { output += chunk; });
  const deadline = Date.now() + 30000;
  let ready = false;
  while (Date.now() < deadline) {
    assert.equal(app.exitCode, null, output);
    try {
      if ((await fetch(baseUrl, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; }
    } catch { /* Wait for the isolated Next.js server to bind its port. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, output);

  const submit = (sourcePath, overrides = {}) => fetch(`${baseUrl}/api/contact/`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseUrl },
    body: JSON.stringify({
      kind: "callback", name: "Тест формы", phone: "+7 (000) 000-00-00",
      consent: "on", address: "", formStartedAt: Date.now() - 2000, sourcePath,
      ...overrides,
    }),
  });
  const db = new Database(databasePath, { readonly: true });
  try {
    for (const sourcePath of ["/", "/kontakty/", "/fotokniga-premium/"]) {
      const response = await submit(sourcePath, { to: "untrusted@example.test", from: "untrusted@example.test" });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.saved, true);
      assert.equal(result.notified, true);
      const row = db.prepare("SELECT * FROM enquiries WHERE id = ?").get(result.id);
      assert.equal(row.kind, "callback");
      assert.equal(row.source_path, sourcePath);
      assert.equal(row.notification_status, "sent");
      const sent = requests.at(-1);
      assert.equal(sent.payload.to, environment.CONTACT_TO_EMAIL);
      assert.equal(sent.payload.from, environment.CONTACT_FROM_EMAIL);
      assert.equal(sent.headers.authorization, `Bearer ${token}`);
      assert.equal(sent.headers["idempotency-key"], `contact-notification/${result.id}`);
      assert.ok(sent.payload.text.includes(sourcePath));
      assert.ok(sent.payload.text.includes(result.id));
    }
    const messageResponse = await submit("/kontakty/", {
      kind: "message",
      phone: "",
      email: "client@example.test",
      message: "Хочу заказать семейную фотокнигу.",
    });
    assert.equal(messageResponse.status, 200);
    const messageResult = await messageResponse.json();
    assert.equal(messageResult.saved, true);
    assert.equal(messageResult.notified, true);
    const messageRow = db.prepare("SELECT * FROM enquiries WHERE id = ?").get(messageResult.id);
    assert.equal(messageRow.kind, "message");
    assert.equal(messageRow.phone, null);
    assert.equal(messageRow.email, "client@example.test");
    assert.equal(messageRow.message, "Хочу заказать семейную фотокнигу.");
    assert.equal(messageRow.source_path, "/kontakty/");
    assert.equal(messageRow.notification_status, "sent");
    const messageEmail = requests.at(-1);
    assert.match(messageEmail.payload.subject, /Новое сообщение/);
    assert.ok(messageEmail.payload.text.includes("client@example.test"));
    assert.ok(messageEmail.payload.text.includes("Хочу заказать семейную фотокнигу."));
    assert.ok(messageEmail.payload.text.includes("/kontakty/"));
    assert.ok(messageEmail.payload.text.includes(messageResult.id));

    const invalid = await submit("/kontakty/", { phone: "123" });
    assert.equal(invalid.status, 422);
    assert.equal(requests.length, 4, "invalid orders must not reach the mailer");

    mailerStatus = 503;
    const delayed = await submit("/fotokniga-standart/");
    assert.equal(delayed.status, 202);
    const result = await delayed.json();
    assert.equal(result.saved, true);
    assert.equal(result.notified, false);
    assert.equal(requests.length, 6, "one failed notification is retried once");
    assert.equal(requests[4].payload.id, requests[5].payload.id);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM enquiries WHERE id = ?").get(result.id).count, 1);
    assert.equal(db.prepare("SELECT notification_status FROM enquiries WHERE id = ?").get(result.id).notification_status, "failed");
  } finally {
    db.close();
  }
});
