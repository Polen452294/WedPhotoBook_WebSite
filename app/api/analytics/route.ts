import { and, count, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { normalizeEditablePagePath } from "@/lib/editable-pages";
import { assertSameOriginMutation, readJsonObject, RequestSecurityError } from "@/lib/request-security";

const MAX_REQUEST_BYTES = 8 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 120;
const ANALYTICS_RETENTION_MS = 400 * 24 * 60 * 60 * 1000;

function clean(value: unknown, max: number): string {
  return String(value ?? "").replace(/[<>]/g, "").replaceAll("\u0000", "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    const body = await readJsonObject(request, MAX_REQUEST_BYTES);
    const eventType = body.eventType === "click" ? "click" : body.eventType === "page_view" ? "page_view" : null;
    const pagePath = normalizeEditablePagePath(body.pagePath);
    const sessionId = clean(body.sessionId, 80);
    const device = body.device === "mobile" || body.device === "tablet" ? body.device : "desktop";
    if (!eventType || !pagePath || !/^[a-zA-Z0-9-]{16,80}$/.test(sessionId)) {
      return new Response(null, { status: 422 });
    }

    const now = new Date();
    const db = await getDb();
    const [recent] = await db.select({ total: count() }).from(analyticsEvents).where(
      and(eq(analyticsEvents.sessionId, sessionId), gt(analyticsEvents.createdAt, new Date(now.getTime() - RATE_LIMIT_WINDOW_MS))),
    );
    if ((recent?.total ?? 0) >= RATE_LIMIT_MAX) {
      return new Response(null, { status: 429, headers: { "Retry-After": "60" } });
    }

    db.transaction((tx) => {
      tx.delete(analyticsEvents).where(lt(analyticsEvents.createdAt, new Date(now.getTime() - ANALYTICS_RETENTION_MS))).run();
      tx.insert(analyticsEvents).values({
        id: crypto.randomUUID(),
        eventType,
        pagePath,
        sessionId,
        label: eventType === "click" ? clean(body.label, 180) || null : null,
        target: eventType === "click" ? clean(body.target, 300) || null : null,
        referrer: eventType === "page_view" ? clean(body.referrer, 180) || "Прямой переход" : null,
        device,
        createdAt: now,
      }).run();
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof RequestSecurityError) return new Response(null, { status: error.status, headers: error.headers });
    console.error("Analytics storage error", error instanceof Error ? error.message : "unknown");
    return new Response(null, { status: 503 });
  }
}
