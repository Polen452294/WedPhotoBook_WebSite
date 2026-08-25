import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/ArticlePage";
import { BlogPage } from "@/components/BlogPage";
import { CatalogPage } from "@/components/CatalogPage";
import { CatalogDetailPage, catalogDetailDisplayTitles } from "@/components/CatalogDetailPage";
import { CompanyPage } from "@/components/CompanyPage";
import { ContactPage } from "@/components/ContactPage";
import { LegacyPage, WHITE_LEGAL_PAGES } from "@/components/LegacyPage";
import { OriginalFooter } from "@/components/OriginalHomeSections";
import { PricingDetailPage, type PricingDetailSlug } from "@/components/PricingDetailPage";
import { PricingPage } from "@/components/PricingPage";
import { articleSlugs, getArticle } from "@/lib/articles";
import { getSnapshot, snapshots } from "@/lib/rendered-pages";
import { PageStructuredData } from "@/lib/seo";
import { catalogItems, pricing } from "@/lib/site-data";

type Props = { params: Promise<{ slug: string }> };

function withUpdatedGenealogyNaming(text: string): string {
  return text
    .replaceAll("Родословные фотокниги", "Родословная фотокнига")
    .replaceAll("Родословная книга", "Родословная фотокнига");
}

const catalogTitleReplacements: Record<string, string[]> = {
  "detskaya-fotokniga": ["Детские фотокниги"],
  "yubilejnaya-fotokniga": ["Фотокниги на юбилей"],
  "fotokniga-o-puteshestvii": ["Фотокниги путешествий", "Фотокнига о путешествии"],
  "genealogicheskaya-fotokniga": ["Родословные фотокниги", "Родословная книга"],
  "fotokniga-na-lyubuyu-temu": ["Разные фотокниги", "Фотокниги на любую тему"],
  "fotokniga-s-dopolnennoj-realnostyu": ["Фотокниги с оживающими фото"],
};

function withUpdatedCatalogTitle(slug: string, text: string): string {
  const displayTitle = catalogDetailDisplayTitles[slug];
  if (!displayTitle) return withUpdatedGenealogyNaming(text);

  return (catalogTitleReplacements[slug] ?? []).reduce(
    (updated, previousTitle) => updated.replaceAll(previousTitle, displayTitle),
    text,
  );
}

const CATALOG_DETAIL_SLUGS = new Set([
  "wedding-fotoknig",
  "detskaya-fotokniga",
  "yubilejnaya-fotokniga",
  "fotokniga-o-puteshestvii",
  "vypusknye-fotoknigi",
  "genealogicheskaya-fotokniga",
  "fotokniga-na-lyubuyu-temu",
  "fotokniga-s-dopolnennoj-realnostyu",
]);

const PRICING_DETAIL_SLUGS = new Set<PricingDetailSlug>([
  "fotokniga-premium",
  "fotokniga-standart",
  "vypusknye-fotoknigi-stoimost",
  "fotoknigi-s-dopolnennoj-realnostju-stoim",
]);

function getPageImage(slug: string): string | undefined {
  return catalogItems.find((item) => item.slug === slug)?.cover
    ?? pricing.find((item) => item.href === `/${slug}/`)?.image;
}

function socialMetadata(
  title: string,
  description: string | undefined,
  path: string,
  image: string | undefined,
  type: "article" | "website" = "website",
): Pick<Metadata, "openGraph" | "twitter"> {
  const images = image ? [{ url: image, alt: title }] : undefined;
  return {
    openGraph: { title, description, url: path, type, images },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export function generateStaticParams() {
  return [...new Set([...snapshots.map((page) => page.slug), ...articleSlugs])]
    .filter(Boolean)
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (article) {
    const path = `/${article.slug}/`;
    return {
      title: article.title,
      description: article.description,
      alternates: { canonical: path },
      ...socialMetadata(article.title, article.description, path, article.image, "article"),
    };
  }
  const page = getSnapshot(slug);
  if (!page) return {};
  if (slug === "company") {
    const description = "Wedfotobook.ru — компания, которая создаёт фотокниги на заказ «под ключ» в Москве. Компания предлагает превратить разрозненные фотографии в цельное произведение, которое станет семейной реликвией или эффектным подарком.";
    const path = "/company/";
    return {
      title: "О компании",
      description,
      alternates: { canonical: path },
      ...socialMetadata("О компании", description, path, undefined),
    };
  }
  if (slug === "blog_fotoknigi") {
    const title = "Блог о фотокнигах";
    const description = page.description || undefined;
    const path = "/blog_fotoknigi/";
    return {
      title,
      description,
      alternates: { canonical: path },
      ...socialMetadata(title, description, path, undefined),
    };
  }
  const title = withUpdatedCatalogTitle(slug, page.title);
  const description = page.description ? withUpdatedGenealogyNaming(page.description) : undefined;
  const path = `/${page.slug}/`;
  return {
    title,
    description,
    alternates: { canonical: path },
    ...socialMetadata(title, description, path, getPageImage(slug)),
  };
}

function withOnlyLegacyHeader<T extends { bodyHtml: string }>(page: T): T {
  const contentStart = page.bodyHtml.indexOf('<section class="parent-section');
  return contentStart < 0 ? page : { ...page, bodyHtml: page.bodyHtml.slice(0, contentStart) };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  const snapshot = getSnapshot(slug);
  const articleTemplate = article && !snapshot ? getSnapshot("article-genealogy") : undefined;
  const page = snapshot ?? (article && articleTemplate ? {
    ...articleTemplate,
    slug: article.slug,
    title: article.title,
    description: article.description,
    sourceUrl: `https://wedfotobook.ru/${article.slug}/`,
    visibleText: article.blocks.map((block) => block.type === "list"
      ? block.items.join(" ")
      : block.type === "qa"
        ? block.items.map((item) => `${item.question} ${item.answer}`).join(" ")
        : block.text).join(" "),
  } : undefined);
  if (!page) notFound();
  const structuredTitle = article?.title ?? withUpdatedCatalogTitle(slug, page.title);
  const structuredDescription = article?.description
    ?? (page.description ? withUpdatedGenealogyNaming(page.description) : undefined);
  const structuredData = (
    <PageStructuredData
      title={structuredTitle}
      description={structuredDescription}
      path={`/${slug}/`}
      kind={article ? "Article" : slug === "blog_fotoknigi" || slug === "katalog" ? "CollectionPage" : "WebPage"}
      image={article?.image ?? getPageImage(slug)}
      service={CATALOG_DETAIL_SLUGS.has(slug) || PRICING_DETAIL_SLUGS.has(slug as PricingDetailSlug)}
    />
  );
  if (article) {
    return (
      <>
        {structuredData}
        <div className="article-route">
          <LegacyPage page={withOnlyLegacyHeader(page)} />
          <div className="restored-first-version">
            <ArticlePage article={article} />
            <OriginalFooter />
          </div>
        </div>
      </>
    );
  }
  if (PRICING_DETAIL_SLUGS.has(slug as PricingDetailSlug)) {
    return (
      <>
        {structuredData}
        <div className="pricing-detail-route">
          <LegacyPage page={page} />
          <div className="restored-first-version">
            <PricingDetailPage slug={slug as PricingDetailSlug} />
            <OriginalFooter />
          </div>
        </div>
      </>
    );
  }
  const isCatalogDetail = CATALOG_DETAIL_SLUGS.has(slug);
  const content = (
    <div className={isCatalogDetail ? "catalog-detail-route" : undefined}>
      <LegacyPage page={page} />
      <div className="restored-first-version">
        {slug === "blog_fotoknigi" && <BlogPage />}
        {slug === "katalog" && <CatalogPage />}
        {slug === "stoimost" && <PricingPage />}
        {slug === "company" && <CompanyPage />}
        {slug === "kontakty" && <ContactPage />}
        {isCatalogDetail && <CatalogDetailPage page={page} />}
        <OriginalFooter />
      </div>
    </div>
  );

  const routedContent = WHITE_LEGAL_PAGES.has(slug) ? <div className="legal-white-route">{content}</div> : content;
  return <>{structuredData}{routedContent}</>;
}
