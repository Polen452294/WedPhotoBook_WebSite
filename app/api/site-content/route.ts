import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { siteContent } from "@/db/schema";
import { normalizeEditablePagePath } from "@/lib/editable-pages";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const pagePath = normalizeEditablePagePath(new URL(request.url).searchParams.get("path"));
  if (!pagePath) return Response.json({ error: "Страница не найдена." }, { status: 404 });
  try {
    const rows = await (await getDb())
      .select({ nodeKey: siteContent.nodeKey, value: siteContent.value, originalValue: siteContent.originalValue, updatedAt: siteContent.updatedAt })
      .from(siteContent)
      .where(eq(siteContent.pagePath, pagePath))
      .orderBy(asc(siteContent.id));
    return Response.json({ pagePath, items: rows });
  } catch (error) {
    console.error("Site content read error", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Контент временно недоступен." }, { status: 503 });
  }
}
