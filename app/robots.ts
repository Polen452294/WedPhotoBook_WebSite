import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/author/", "/search/"] }],
    sitemap: "https://wedfotobook.ru/sitemap.xml",
    host: "https://wedfotobook.ru",
  };
}
