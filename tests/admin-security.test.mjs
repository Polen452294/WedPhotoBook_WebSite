import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [
  authSource,
  sessionSource,
  loginRouteSource,
  loginPageSource,
  requestSecuritySource,
  adminSecuritySource,
  contentRouteSource,
  analyticsRouteSource,
  schemaSource,
  workerSource,
  deploySource,
  packageSource,
  vpsStartSource,
  vpsRuntimeSource,
] = await Promise.all([
  read("../lib/admin-auth.ts"),
  read("../lib/admin-session.ts"),
  read("../app/api/admin/session/route.ts"),
  read("../app/admin/login/page.tsx"),
  read("../lib/request-security.ts"),
  read("../lib/admin-security.ts"),
  read("../app/api/admin/content/route.ts"),
  read("../app/api/analytics/route.ts"),
  read("../db/schema.ts"),
  read("../worker/index.ts"),
  read("../docs/deploy.md"),
  read("../package.json"),
  read("../scripts/start-vps.sh"),
  read("../scripts/prepare-vps-runtime.mjs"),
]);

test("admin authorization fails closed and is enforced on mutations", () => {
  assert.match(authSource, /process\.env\.ADMIN_EMAILS \?\? ""/);
  assert.doesNotMatch(authSource, /CONTACT_TO_EMAIL/);
  assert.match(authSource, /getPasswordAdminUser\(\)/);
  assert.match(adminSecuritySource, /getAdminUser\(\)/);
  assert.match(contentRouteSource, /authorizeAdminMutation\(request\)/);
});

test("single-user login uses a hardened password hash and signed secure cookie", () => {
  assert.match(sessionSource, /PASSWORD_HASH_PREFIX = "pbkdf2-sha256"/);
  assert.match(sessionSource, /iterations < 100_000/);
  assert.match(sessionSource, /name: "HMAC"/);
  assert.match(sessionSource, /constantTimeEqual/);
  assert.match(sessionSource, /HttpOnly/);
  assert.match(sessionSource, /Secure/);
  assert.match(sessionSource, /SameSite=Strict/);
  assert.match(sessionSource, /__Host-wfb_admin/);
  assert.match(loginPageSource, /AdminLoginForm/);
  assert.doesNotMatch(loginPageSource, /name=["'](?:email|login|username)["']/i);
});

test("login endpoint resists cross-site requests and password guessing", () => {
  assert.match(loginRouteSource, /assertSameOriginMutation\(request\)/);
  assert.match(loginRouteSource, /MAX_REQUEST_BYTES = 4 \* 1024/);
  assert.match(loginRouteSource, /MAX_CLIENT_FAILURES = 5/);
  assert.match(loginRouteSource, /MAX_GLOBAL_FAILURES = 40/);
  assert.match(loginRouteSource, /Retry-After/);
  assert.match(schemaSource, /export const adminLoginAttempts = sqliteTable/);
});

test("state-changing endpoints enforce same-origin JSON size and route constraints", () => {
  assert.match(requestSecuritySource, /if \(!origin \|\| origin === "null" \|\| origin !== effectiveRequestOrigin\(request\)\)/);
  assert.match(requestSecuritySource, /fetchSite && fetchSite !== "same-origin"/);
  assert.match(requestSecuritySource, /process\.env\.TRUST_PROXY_ORIGIN !== "1"/);
  assert.match(requestSecuritySource, /x-forwarded-proto/);
  assert.match(requestSecuritySource, /content-length/);
  assert.match(requestSecuritySource, /total > maxBytes/);
  assert.match(contentRouteSource, /normalizeEditablePagePath/);
  assert.match(contentRouteSource, /NODE_KEY_PATTERN/);
  assert.match(analyticsRouteSource, /assertSameOriginMutation\(request\)/);
});

test("admin writes have rate limiting conflict detection and audit records", () => {
  assert.match(adminSecuritySource, /ADMIN_RATE_LIMIT_MAX = 30/);
  assert.match(schemaSource, /export const adminActionAttempts = sqliteTable/);
  assert.match(schemaSource, /export const adminAuditLog = sqliteTable/);
  assert.match(contentRouteSource, /expectedValue/);
  assert.match(contentRouteSource, /RequestSecurityError\(409/);
  assert.match(contentRouteSource, /previousValueHash/);
  assert.match(contentRouteSource, /db\.batch/);
});

test("admin and API responses receive restrictive browser security headers", () => {
  assert.match(workerSource, /frame-ancestors 'none'/);
  assert.match(workerSource, /headers\.set\("X-Frame-Options", "DENY"\)/);
  assert.match(workerSource, /headers\.set\("Cross-Origin-Opener-Policy", "same-origin"\)/);
  assert.match(workerSource, /headers\.delete\("X-Powered-By"\)/);
  assert.match(workerSource, /headers\.set\("Cache-Control", "private, no-store"\)/);
});

test("deployment instructions prevent unsafe direct exposure", () => {
  assert.match(deploySource, /Не запускайте `wrangler deploy`/);
  assert.match(packageSource, /vinext start --hostname 127\.0\.0\.1 --port 3000/);
  assert.match(packageSource, /"start:vps": "bash scripts\/start-vps\.sh"/);
  assert.match(vpsStartSource, /wrangler dev/);
  assert.match(vpsStartSource, /--ip 127\.0\.0\.1/);
  assert.match(vpsStartSource, /install -m 600 \.env\.local dist\/server\/\.dev\.vars/);
  assert.match(vpsStartSource, /prepare-vps-runtime\.mjs dist\/server\/wrangler\.json/);
  assert.match(vpsRuntimeSource, /config\.assets\.binding = "ASSETS"/);
  assert.match(deploySource, /удалять входящие `oai-authenticated-user-\*`/);
});
