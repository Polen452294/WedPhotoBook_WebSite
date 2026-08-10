import type { MetadataRoute } from "next";
import { pages } from "@/lib/site-data";

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({
    url: page.slug ? `https://wedfotobook.ru/${page.slug}/` : "https://wedfotobook.ru/",
    lastModified: page.modifiedAt ? new Date(`${page.modifiedAt}Z`) : new Date(),
    changeFrequency: page.slug ? "monthly" : "weekly",
    priority: page.slug ? (page.kind === "catalog" || page.kind === "pricing" ? 0.8 : 0.6) : 1,
  }));
}
