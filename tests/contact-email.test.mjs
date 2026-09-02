import assert from "node:assert/strict";
import test from "node:test";
import { sendContactEmail } from "../lib/contact-email.ts";

const input = {
  apiKey: "re_test_key",
  id: "b6b8311f-a231-4f3d-bcff-63f4ff742f49",
  sender: "Wedfotobook <orders@example.com>",
  recipient: "owner@example.com",
  subject: "Новая тестовая заявка",
  text: "Тест",
};

test("retries a transient Resend failure without duplicating the email", async () => {
  const requests = [];
  const fetcher = async (url, init) => {
    requests.push({ url, init });
    return requests.length === 1
      ? new Response("temporary", { status: 503 })
      : Response.json({ id: "email-id" });
  };
  let delays = 0;

  const result = await sendContactEmail(input, fetcher, async () => { delays += 1; });

  assert.deepEqual(result, { ok: true });
  assert.equal(requests.length, 2);
  assert.equal(delays, 1);
  assert.equal(requests[0].url, "https://api.resend.com/emails");
  assert.equal(requests[0].init.headers["idempotency-key"], `contact-notification/${input.id}`);
  assert.equal(requests[1].init.headers["idempotency-key"], requests[0].init.headers["idempotency-key"]);
  assert.deepEqual(JSON.parse(requests[0].init.body).to, [input.recipient]);
});

test("does not retry a permanent Resend configuration error", async () => {
  let requests = 0;
  const result = await sendContactEmail(input, async () => {
    requests += 1;
    return new Response("sender domain is not verified", { status: 422 });
  });

  assert.equal(requests, 1);
  assert.deepEqual(result, { ok: false, error: "Resend 422: sender domain is not verified" });
});

test("retries one network interruption", async () => {
  let requests = 0;
  const result = await sendContactEmail(input, async () => {
    requests += 1;
    if (requests === 1) throw new Error("connection reset");
    return Response.json({ id: "email-id" });
  }, async () => undefined);

  assert.equal(requests, 2);
  assert.deepEqual(result, { ok: true });
});

test("prefers the authenticated loopback mailer without sending to a third party", async () => {
  const requests = [];
  const result = await sendContactEmail({
    ...input,
    apiKey: undefined,
    localMailerUrl: "http://127.0.0.1:3081/send",
    localMailerToken: "local-secret-token-32-characters-ok",
  }, async (url, init) => {
    requests.push({ url, init });
    return Response.json({ ok: true });
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "http://127.0.0.1:3081/send");
  assert.equal(requests[0].init.headers.authorization, "Bearer local-secret-token-32-characters-ok");
  assert.equal(requests[0].init.headers["idempotency-key"], `contact-notification/${input.id}`);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    id: input.id,
    from: input.sender,
    to: input.recipient,
    subject: input.subject,
    text: input.text,
  });
});

test("refuses a non-loopback local mailer URL", async () => {
  let requests = 0;
  const result = await sendContactEmail({
    ...input,
    apiKey: undefined,
    localMailerUrl: "https://mailer.example.com/send",
    localMailerToken: "must-not-leave-the-server",
  }, async () => {
    requests += 1;
    return Response.json({ ok: true });
  });

  assert.equal(requests, 0);
  assert.deepEqual(result, { ok: false, error: "Email transport is not configured" });
});
