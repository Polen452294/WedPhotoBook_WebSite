import { and, count, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { adminActionAttempts } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import type { AdminUser } from "@/lib/admin-session";
import { assertSameOriginMutation, RequestSecurityError, requestClientAddress, sha256 } from "@/lib/request-security";

const ADMIN_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const ADMIN_RATE_LIMIT_MAX = 30;
const ADMIN_ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

export type AuthorizedAdminMutation = {
  user: AdminUser;
  now: Date;
  clientHash: string | null;
  requestId: string;
};

export async function authorizeAdminMutation(request: Request): Promise<AuthorizedAdminMutation> {
  assertSameOriginMutation(request);
  const user = await getAdminUser();
  if (!user) throw new RequestSecurityError(401, "Требуется вход в систему.");

  const now = new Date();
  const windowStart = new Date(now.getTime() - ADMIN_RATE_LIMIT_WINDOW_MS);
  const retentionStart = new Date(now.getTime() - ADMIN_ATTEMPT_RETENTION_MS);
  const db = await getDb();
  const recentRows = db.transaction((tx) => {
    tx.delete(adminActionAttempts).where(lt(adminActionAttempts.createdAt, retentionStart)).run();
    tx.insert(adminActionAttempts).values({ actorUserId: user.userId, createdAt: now }).run();
    return tx.select({ total: count() }).from(adminActionAttempts).where(
      and(eq(adminActionAttempts.actorUserId, user.userId), gt(adminActionAttempts.createdAt, windowStart)),
    ).all();
  });
  const [result] = recentRows;
  if ((result?.total ?? 0) > ADMIN_RATE_LIMIT_MAX) {
    throw new RequestSecurityError(429, "Слишком много действий. Повторите через минуту.", { "Retry-After": "60" });
  }

  const auditSalt = process.env.ADMIN_AUDIT_SALT?.trim();
  const clientHash = auditSalt ? await sha256(`${auditSalt}:${requestClientAddress(request)}`) : null;
  const requestId = (request.headers.get("x-request-id") || crypto.randomUUID()).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80);
  return { user, now, clientHash, requestId };
}
