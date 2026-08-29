import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const privatePaths = [
  "/api/",
  "/admin/",
  "/author/",
  "/search/",
  "/signin-with-chatgpt",
  "/signout-with-chatgpt",
  "/callback",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      { userAgent: ["YandexAdditional", "YandexAdditionalBot"], allow: "/", disallow: privatePaths },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "Claude-SearchBot",
          "Google-Extended",
          "PerplexityBot",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
