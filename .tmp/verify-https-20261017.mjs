import assert from "node:assert/strict";

for (const hostname of ["wedfotobook.ru", "www.wedfotobook.ru", "fotobooktest24.ru", "www.fotobooktest24.ru"]) {
  for (const protocol of ["http:", "https:"]) {
    const path = "/?https-check=20261017";
    const response = await fetch(`${protocol}//${hostname}${path}`, {
      method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(15000),
    });
    const canonical = protocol === "https:" && hostname === "wedfotobook.ru";
    assert.equal(response.status, canonical ? 200 : 301);
    if (!canonical) assert.equal(response.headers.get("location"), `https://wedfotobook.ru${path}`);
    if (protocol === "https:") assert.match(response.headers.get("strict-transport-security"), /max-age=31536000/);
    console.log(`${protocol}//${hostname}: ${response.status}, TLS/redirect OK`);
  }
}
for (const [path, status] of [["/api/health/", 200], ["/admin/", 401], ["/status/", 200], ["/wp-assets/home-interactions.js", 200]]) {
  const response = await fetch(`https://wedfotobook.ru${path}`, { method: "HEAD", signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, status);
  console.log(`${path}: ${status}`);
}
const response = await fetch("https://wedfotobook.ru/status/status.json", { signal: AbortSignal.timeout(15000) });
const status = await response.json();
assert.ok(status.ok);
assert.ok(Date.now() / 1000 - status.updated < 150);
for (const [name, check] of Object.entries(status.history[0].checks)) {
  assert.ok(check.ok, name);
  console.log(`${name}: OK${check.expiresInDays ? `, certificate valid for ${check.expiresInDays} days` : ""}`);
}
