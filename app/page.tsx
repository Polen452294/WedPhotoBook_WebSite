import type { Metadata } from "next";
import { ClientRuntime } from "@/components/ClientRuntime";
import { LegacyPage } from "@/components/LegacyPage";
import { OriginalFooter, OriginalHomeSections } from "@/components/OriginalHomeSections";
import { getSnapshot } from "@/lib/rendered-pages";
import { PageStructuredData } from "@/lib/seo";

const page = getSnapshot("")!;

const HTML_VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
]);

function closeOpenHtmlElements(fragment: string): string {
  const openElements: string[] = [];
  const tags = fragment.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\s*(\/?)\s*([a-z][\w:-]*)\b[^>]*>/gi);

  for (const match of tags) {
    const token = match[0];
    const tagName = match[2]?.toLowerCase();
    if (!tagName || token.startsWith("<!--") || token.startsWith("<!")) continue;

    if (match[1]) {
      const index = openElements.lastIndexOf(tagName);
      if (index >= 0) openElements.splice(index);
    } else if (!HTML_VOID_ELEMENTS.has(tagName) && !/\/\s*>$/.test(token)) {
      openElements.push(tagName);
    }
  }

  return `${fragment}${openElements.reverse().map((tagName) => `</${tagName}>`).join("")}`;
}

function withoutHiddenLegacyHomepageSections<T extends { bodyHtml: string }>(snapshot: T): T {
  const hiddenSectionsStart = snapshot.bodyHtml.search(/<div\b[^>]*class=("|')[^"']*\bpad2\b[^"']*\1[^>]*>/i);
  if (hiddenSectionsStart < 0) return snapshot;

  return {
    ...snapshot,
    bodyHtml: closeOpenHtmlElements(snapshot.bodyHtml.slice(0, hiddenSectionsStart)),
  };
}

export const metadata: Metadata = {
  title: page.title,
  description: page.description || undefined,
  alternates: { canonical: "/" },
  openGraph: {
    title: page.title,
    description: page.description || undefined,
    url: "/",
    type: "website",
    images: [{ url: "/og-1200x630.png", width: 1200, height: 630, alt: "Фотокниги на заказ — WedFotoBook" }],
  },
  twitter: {
    card: "summary_large_image",
    title: page.title,
    description: page.description || undefined,
    images: ["/og-1200x630.png"],
  },
};

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const isEditorPreview = query.cms_preview === "1" || query.code_preview === "1";

  return (
    <>
      <PageStructuredData title={page.title} description={page.description || undefined} path="/" service />
      <LegacyPage page={withoutHiddenLegacyHomepageSections(page)} enhance={false} />
      <div className="restored-first-version">
        <section className="home-redesign-facts-section" aria-label="Преимущества">
          <div className="shell home-redesign-facts">
            <div><strong>17 лет</strong><span>опыта работы</span></div>
            <div><strong>Всё включено</strong><span>обработка фото и печать</span></div>
            <div><strong>Без шаблонов</strong><span>индивидуальный дизайн</span></div>
          </div>
        </section>
        <OriginalHomeSections />
        <OriginalFooter />
      </div>
      {isEditorPreview && <ClientRuntime />}
    </>
  );
}
