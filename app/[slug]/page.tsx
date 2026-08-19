import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPage } from "@/components/BlogPage";
import { CatalogPage } from "@/components/CatalogPage";
import { CatalogDetailPage, catalogDetailDisplayTitles } from "@/components/CatalogDetailPage";
import { CompanyPage } from "@/components/CompanyPage";
import { ContactPage } from "@/components/ContactPage";
import { LegacyPage, WHITE_LEGAL_PAGES } from "@/components/LegacyPage";
import { OriginalFooter } from "@/components/OriginalHomeSections";
import { PricingDetailPage, type PricingDetailSlug } from "@/components/PricingDetailPage";
import { PricingPage } from "@/components/PricingPage";
import { getSnapshot, snapshots } from "@/lib/rendered-pages";

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

export function generateStaticParams() {
  return snapshots.filter((page) => page.slug).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getSnapshot(slug);
  if (!page) return {};
  if (slug === "company") {
    const description = "Wedfotobook.ru — компания, которая создаёт фотокниги на заказ «под ключ» в Москве. Компания предлагает превратить разрозненные фотографии в цельное произведение, которое станет семейной реликвией или эффектным подарком.";
    return {
      title: "О компании",
      description,
      alternates: { canonical: "/company/" },
      openGraph: { title: "О компании", description, url: "/company/", type: "website" },
    };
  }
  if (slug === "blog_fotoknigi") {
    const title = "Блог о фотокнигах";
    const description = page.description || undefined;
    return {
      title,
      description,
      alternates: { canonical: "/blog_fotoknigi/" },
      openGraph: { title, description, url: "/blog_fotoknigi/", type: "website" },
    };
  }
  const title = withUpdatedCatalogTitle(slug, page.title);
  const description = page.description ? withUpdatedGenealogyNaming(page.description) : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/${page.slug}/` },
    openGraph: { title, description, url: `/${page.slug}/`, type: "website" },
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getSnapshot(slug);
  if (!page) notFound();
  if (PRICING_DETAIL_SLUGS.has(slug as PricingDetailSlug)) {
    return (
      <div className="pricing-detail-route">
        <LegacyPage page={page} />
        <div className="restored-first-version">
          <PricingDetailPage slug={slug as PricingDetailSlug} />
          <OriginalFooter />
        </div>
      </div>
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

  return WHITE_LEGAL_PAGES.has(slug) ? <div className="legal-white-route">{content}</div> : content;
}
