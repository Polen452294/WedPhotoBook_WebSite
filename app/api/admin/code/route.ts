import { eq, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { adminAuditLog, siteCodeSettings } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import { authorizeAdminMutation } from "@/lib/admin-security";
import { readJsonObject, RequestSecurityError, requestSecurityResponse, sha256 } from "@/lib/request-security";
import { MAX_CUSTOM_CSS_BYTES, SITE_CODE_KEY, validateCustomCss } from "@/lib/site-code";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = MAX_CUSTOM_CSS_BYTES + 2048;
const AUDIT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

function expectedRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new RequestSecurityError(422, "Некорректная версия кода.");
  }
  return Number(value);
}

async function currentSettings() {
  const [settings] = await (await getDb()).select().from(siteCodeSettings)
    .where(eq(siteCodeSettings.key, SITE_CODE_KEY)).limit(1);
  return settings;
}

async function removeExpiredAudit(now: Date) {
  const retentionStart = new Date(now.getTime() - AUDIT_RETENTION_MS);
  await (await getDb()).delete(adminAuditLog).where(lt(adminAuditLog.createdAt, retentionStart)).run();
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Требуется вход в систему." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  try {
    const settings = await currentSettings();
    return Response.json(
      { customCss: settings?.customCss ?? "", revision: settings?.revision ?? 0, updatedAt: settings?.updatedAt?.toISOString() ?? null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin code read error", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось загрузить код." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await authorizeAdminMutation(request);
    const body = await readJsonObject(request, MAX_REQUEST_BYTES);
    const revision = expectedRevision(body.expectedRevision);
    const validation = validateCustomCss(body.customCss);
    if (!validation.ok) throw new RequestSecurityError(422, validation.error);

    const db = await getDb();
    const existing = await currentSettings();
    const currentRevision = existing?.revision ?? 0;
    if (revision !== currentRevision) {
      throw new RequestSecurityError(409, "Код уже изменён в другой сессии. Обновите страницу.");
    }
    const nextRevision = currentRevision + 1;
    const [previousValueHash, nextValueHash] = await Promise.all([
      sha256(existing?.customCss ?? ""),
      sha256(validation.css),
    ]);
    await removeExpiredAudit(authorization.now);
    await db.batch([
      db.insert(siteCodeSettings).values({
        key: SITE_CODE_KEY,
        customCss: validation.css,
        revision: nextRevision,
        updatedBy: authorization.user.email.toLowerCase(),
        updatedAt: authorization.now,
      }).onConflictDoUpdate({
        target: siteCodeSettings.key,
        set: { customCss: validation.css, revision: nextRevision, updatedBy: authorization.user.email.toLowerCase(), updatedAt: authorization.now },
      }),
      db.insert(adminAuditLog).values({
        id: crypto.randomUUID(),
        actorUserId: authorization.user.userId,
        actorEmail: authorization.user.email.toLowerCase(),
        action: "code_update",
        pagePath: "*",
        nodeKey: SITE_CODE_KEY,
        previousValueHash,
        nextValueHash,
        clientHash: authorization.clientHash,
        requestId: authorization.requestId,
        createdAt: authorization.now,
      }),
    ]);
    return Response.json({ ok: true, customCss: validation.css, revision: nextRevision, updatedAt: authorization.now.toISOString() });
  } catch (error) {
    if (error instanceof RequestSecurityError) return requestSecurityResponse(error);
    console.error("Site code update error", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось сохранить код." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await authorizeAdminMutation(request);
    const body = await readJsonObject(request, 2048);
    const revision = expectedRevision(body.expectedRevision);
    const db = await getDb();
    const existing = await currentSettings();
    const currentRevision = existing?.revision ?? 0;
    if (revision !== currentRevision) {
      throw new RequestSecurityError(409, "Код уже изменён в другой сессии. Обновите страницу.");
    }
    if (!existing) return Response.json({ ok: true, customCss: "", revision: 0, updatedAt: null });

    const nextRevision = currentRevision + 1;
    const [previousValueHash, nextValueHash] = await Promise.all([sha256(existing.customCss), sha256("")]);
    await removeExpiredAudit(authorization.now);
    await db.batch([
      db.update(siteCodeSettings).set({
        customCss: "",
        revision: nextRevision,
        updatedBy: authorization.user.email.toLowerCase(),
        updatedAt: authorization.now,
      }).where(eq(siteCodeSettings.key, SITE_CODE_KEY)),
      db.insert(adminAuditLog).values({
        id: crypto.randomUUID(),
        actorUserId: authorization.user.userId,
        actorEmail: authorization.user.email.toLowerCase(),
        action: "code_reset",
        pagePath: "*",
        nodeKey: SITE_CODE_KEY,
        previousValueHash,
        nextValueHash,
        clientHash: authorization.clientHash,
        requestId: authorization.requestId,
        createdAt: authorization.now,
      }),
    ]);
    return Response.json({ ok: true, customCss: "", revision: nextRevision, updatedAt: authorization.now.toISOString() });
  } catch (error) {
    if (error instanceof RequestSecurityError) return requestSecurityResponse(error);
    console.error("Site code reset error", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось сбросить код." }, { status: 500 });
  }
}
