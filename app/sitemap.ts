import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { absoluteUrl } from "@/lib/seo";
import { catalogItems, pages, pricing } from "@/lib/site-data";

function pageImage(slug: string): string | undefined {
  if (!slug) return "/media/home/fotokniga-na-zakaz-wedfotobook-ru.webp";
  return articles.find((article) => article.slug === slug)?.image
    ?? catalogItems.find((item) => item.slug === slug)?.cover
    ?? pricing.find((item) => item.href === `/${slug}/`)?.image;
}

function reliableLastModified(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pageSlugs = new Set(pages.map((page) => page.slug));
  const pageEntries: MetadataRoute.Sitemap = pages.map((page) => {
    const image = pageImage(page.slug);
    return {
      url: absoluteUrl(page.slug ? `/${page.slug}/` : "/"),
      lastModified: reliableLastModified(page.modifiedAt),
      changeFrequency: page.slug ? "monthly" : "weekly",
      priority: page.slug ? (page.kind === "catalog" || page.kind === "pricing" ? 0.8 : 0.6) : 1,
      images: image ? [absoluteUrl(image)] : undefined,
    };
  });

  const articleEntries: MetadataRoute.Sitemap = articles
    .filter((article) => !pageSlugs.has(article.slug))
    .map((article) => ({
      url: absoluteUrl(`/${article.slug}/`),
      changeFrequency: "monthly",
      priority: 0.7,
      images: [absoluteUrl(article.image)],
    }));

  return [...pageEntries, ...articleEntries];
}
