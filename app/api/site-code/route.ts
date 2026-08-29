import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { siteCodeSettings } from "@/db/schema";
import { SITE_CODE_KEY } from "@/lib/site-code";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [settings] = await (await getDb())
      .select({ customCss: siteCodeSettings.customCss, revision: siteCodeSettings.revision, updatedAt: siteCodeSettings.updatedAt })
      .from(siteCodeSettings)
      .where(eq(siteCodeSettings.key, SITE_CODE_KEY))
      .limit(1);
    return Response.json(
      { customCss: settings?.customCss ?? "", revision: settings?.revision ?? 0, updatedAt: settings?.updatedAt?.toISOString() ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Site code read error", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Стили временно недоступны." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
