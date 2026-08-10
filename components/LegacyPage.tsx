import { LegacyEnhancements } from "@/components/LegacyEnhancements";
import type { RenderedPage } from "@/lib/rendered-pages";

export function LegacyPage({ page }: { page: RenderedPage }) {
  return (
    <>
      <LegacyEnhancements bodyClass={page.bodyClass} />
      <div className={`legacy-wordpress ${page.bodyClass}`} dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />
    </>
  );
}
