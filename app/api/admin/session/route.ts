import { and, count, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { adminLoginAttempts } from "@/db/schema";
import {
  adminPasswordIsConfigured,
  adminSessionCookie,
  clearedAdminSessionCookie,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/admin-session";
import {
  assertSameOriginMutation,
  readJsonObject,
  RequestSecurityError,
  requestClientAddress,
  requestSecurityResponse,
  sha256,
} from "@/lib/request-security";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 4 * 1024;
const MAX_PASSWORD_LENGTH = 1024;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_CLIENT_FAILURES = 5;
const MAX_GLOBAL_FAILURES = 40;

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    if (!adminPasswordIsConfigured()) {
      throw new RequestSecurityError(503, "Вход временно недоступен. Проверьте настройки сервера.");
    }
    const loginSalt = process.env.ADMIN_LOGIN_SALT?.trim() ?? "";
    if (new TextEncoder().encode(loginSalt).byteLength < 32) {
      throw new RequestSecurityError(503, "Вход временно недоступен. Проверьте настройки сервера.");
    }

    const body = await readJsonObject(request, MAX_REQUEST_BYTES);
    const password = typeof body.password === "string" ? body.password : "";
    if (!password || password.length > MAX_PASSWORD_LENGTH) return invalidCredentialsResponse();

    const now = new Date();
    const windowStart = new Date(now.getTime() - LOGIN_WINDOW_MS);
    const retentionStart = new Date(now.getTime() - LOGIN_RETENTION_MS);
    const clientHash = await sha256(`${loginSalt}:${requestClientAddress(request)}`);
    const db = await getDb();
    await db.delete(adminLoginAttempts).where(lt(adminLoginAttempts.createdAt, retentionStart)).run();
    const [clientRows, globalRows] = await Promise.all([
      db.select({ total: count() }).from(adminLoginAttempts).where(and(
        eq(adminLoginAttempts.clientHash, clientHash),
        eq(adminLoginAttempts.succeeded, false),
        gt(adminLoginAttempts.createdAt, windowStart),
      )),
      db.select({ total: count() }).from(adminLoginAttempts).where(and(
        eq(adminLoginAttempts.succeeded, false),
        gt(adminLoginAttempts.createdAt, windowStart),
      )),
    ]);
    if ((clientRows[0]?.total ?? 0) >= MAX_CLIENT_FAILURES || (globalRows[0]?.total ?? 0) >= MAX_GLOBAL_FAILURES) {
      throw new RequestSecurityError(429, "Слишком много попыток. Повторите вход через 15 минут.", { "Retry-After": "900" });
    }

    const passwordMatches = await verifyAdminPassword(password);
    if (!passwordMatches) {
      await db.insert(adminLoginAttempts).values({ clientHash, succeeded: false, createdAt: now }).run();
      return invalidCredentialsResponse();
    }

    await db.batch([
      db.delete(adminLoginAttempts).where(and(
        eq(adminLoginAttempts.clientHash, clientHash),
        eq(adminLoginAttempts.succeeded, false),
      )),
      db.insert(adminLoginAttempts).values({ clientHash, succeeded: true, createdAt: now }),
    ]);
    const token = await createAdminSessionToken(now);
    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "private, no-store",
        "Set-Cookie": adminSessionCookie(token),
      },
    });
  } catch (error) {
    if (error instanceof RequestSecurityError) return requestSecurityResponse(error);
    console.error("Admin login error", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось выполнить вход." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOriginMutation(request);
    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "private, no-store",
        "Set-Cookie": clearedAdminSessionCookie(),
      },
    });
  } catch (error) {
    if (error instanceof RequestSecurityError) return requestSecurityResponse(error);
    return Response.json({ error: "Не удалось завершить сеанс." }, { status: 500 });
  }
}

function invalidCredentialsResponse(): Response {
  return Response.json(
    { error: "Неверный пароль." },
    { status: 401, headers: { "Cache-Control": "private, no-store" } },
  );
}
