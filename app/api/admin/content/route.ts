import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { adminAuditLog, siteContent } from "@/db/schema";
import { authorizeAdminMutation } from "@/lib/admin-security";
import { normalizeEditablePagePath } from "@/lib/editable-pages";
import { readJsonObject, RequestSecurityError, requestSecurityResponse, sha256 } from "@/lib/request-security";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_CONTENT_LENGTH = 20_000;
const AUDIT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const NODE_KEY_PATTERN = /^body>(?:[a-z][a-z0-9-]*\[\d+\]>?)+::(?:text\[\d+\]|attr\[(?:placeholder|title|aria-label|alt)\])$/;

function pagePath(value: unknown): string {
  const normalized = normalizeEditablePagePath(value);
  if (!normalized) throw new RequestSecurityError(422, "Эта страница недоступна для редактирования.");
  return normalized;
}

function nodeKey(value: unknown): string {
  const key = String(value ?? "");
  if (!key || key.length > 1000 || !NODE_KEY_PATTERN.test(key)) {
    throw new RequestSecurityError(422, "Не удалось определить текстовый фрагмент.");
  }
  return key;
}

function contentValue(value: unknown): string {
  if (typeof value !== "string") throw new RequestSecurityError(422, "Некорректный формат текста.");
  const text = value.replaceAll("\u0000", "");
  if (text.length > MAX_CONTENT_LENGTH) throw new RequestSecurityError(422, "Текст слишком длинный.");
  return text;
}

async function removeExpiredAudit(now: Date) {
  const retentionStart = new Date(now.getTime() - AUDIT_RETENTION_MS);
  await (await getDb()).delete(adminAuditLog).where(lt(adminAuditLog.createdAt, retentionStart)).run();
}

export async function PATCH(request: Request) {
  try {
    const authorization = await authorizeAdminMutation(request);
    const body = await readJsonObject(request, MAX_REQUEST_BYTES);
    const normalizedPath = pagePath(body.pagePath);
    const normalizedNodeKey = nodeKey(body.nodeKey);
    const value = contentValue(body.value);
    const suppliedOriginal = contentValue(body.originalValue);
    const expectedValue = contentValue(body.expectedValue);
    if (!suppliedOriginal) throw new RequestSecurityError(422, "Исходный текст не определён.");

    const db = await getDb();
    const [existing] = await db.select().from(siteContent).where(
      and(eq(siteContent.pagePath, normalizedPath), eq(siteContent.nodeKey, normalizedNodeKey)),
    ).limit(1);
    if (existing && (existing.value !== expectedValue || existing.originalValue !== suppliedOriginal)) {
      throw new RequestSecurityError(409, "Текст уже изменён в другой сессии. Обновите страницу.");
    }
    if (!existing && expectedValue !== suppliedOriginal) {
      throw new RequestSecurityError(409, "Исходный текст изменился. Обновите страницу.");
    }

    const originalValue = existing?.originalValue ?? suppliedOriginal;
    const [previousValueHash, nextValueHash] = await Promise.all([
      sha256(existing?.value ?? originalValue),
      sha256(value),
    ]);
    await removeExpiredAudit(authorization.now);
    db.transaction((tx) => {
      tx.insert(siteContent).values({
        pagePath: normalizedPath,
        nodeKey: normalizedNodeKey,
        value,
        originalValue,
        updatedBy: authorization.user.email.toLowerCase(),
        updatedAt: authorization.now,
      }).onConflictDoUpdate({
        target: [siteContent.pagePath, siteContent.nodeKey],
        set: { value, updatedBy: authorization.user.email.toLowerCase(), updatedAt: authorization.now },
      }).run();
      tx.insert(adminAuditLog).values({
        id: crypto.randomUUID(),
        actorUserId: authorization.user.userId,
        actorEmail: authorization.user.email.toLowerCase(),
        action: "content_update",
        pagePath: normalizedPath,
        nodeKey: normalizedNodeKey,
        previousValueHash,
        nextValueHash,
        clientHash: authorization.clientHash,
        requestId: authorization.requestId,
        createdAt: authorization.now,
      }).run();
    });

    return Response.json({ ok: true, pagePath: normalizedPath, nodeKey: normalizedNodeKey, value, originalValue, updatedAt: authorization.now.toISOString() });
  } catch (error) {
    if (error instanceof RequestSecurityError) return requestSecurityResponse(error);
    console.error("Site content update error", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось сохранить текст." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await authorizeAdminMutation(request);
    const body = await readJsonObject(request, MAX_REQUEST_BYTES);
    const normalizedPath = pagePath(body.pagePath);
    const normalizedNodeKey = nodeKey(body.nodeKey);
    const expectedValue = contentValue(body.expectedValue);
    const db = await getDb();
    const [existing] = await db.select().from(siteContent).where(
      and(eq(siteContent.pagePath, normalizedPath), eq(siteContent.nodeKey, normalizedNodeKey)),
    ).limit(1);
    if (!existing) return Response.json({ ok: true, pagePath: normalizedPath, nodeKey: normalizedNodeKey });
    if (existing.value !== expectedValue) {
      throw new RequestSecurityError(409, "Текст уже изменён в другой сессии. Обновите страницу.");
    }

    const [previousValueHash, nextValueHash] = await Promise.all([
      sha256(existing.value),
      sha256(existing.originalValue),
    ]);
    await removeExpiredAudit(authorization.now);
    db.transaction((tx) => {
      tx.delete(siteContent).where(and(eq(siteContent.pagePath, normalizedPath), eq(siteContent.nodeKey, normalizedNodeKey))).run();
      tx.insert(adminAuditLog).values({
        id: crypto.randomUUID(),
        actorUserId: authorization.user.userId,
        actorEmail: authorization.user.email.toLowerCase(),
        action: "content_reset",
        pagePath: normalizedPath,
        nodeKey: normalizedNodeKey,
        previousValueHash,
        nextValueHash,
        clientHash: authorization.clientHash,
        requestId: authorization.requestId,
        createdAt: authorization.now,
      }).run();
    });
    return Response.json({ ok: true, pagePath: normalizedPath, nodeKey: normalizedNodeKey });
  } catch (error) {
    if (error instanceof RequestSecurityError) return requestSecurityResponse(error);
    console.error("Site content reset error", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось вернуть исходный текст." }, { status: 500 });
  }
}
