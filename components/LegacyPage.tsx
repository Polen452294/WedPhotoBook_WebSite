import { LegacyEnhancements } from "@/components/LegacyEnhancements";
import type { RenderedPage } from "@/lib/rendered-pages";

const INTERNAL_HOSTS = new Set(["wedfotobook.ru", "www.wedfotobook.ru"]);
const ROUTE_ALIASES = new Map([
  ["/fotoknigi-s-dopolnennoj-realnostju/", "/fotokniga-s-dopolnennoj-realnostyu/"],
  ["/vypusknye-fotoknigi-2/", "/vypusknye-fotoknigi/"],
]);

function normalizeInternalHref(href: string): string {
  if (!href || href.startsWith("#") || href.startsWith("//") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return href;

  let localHref = href;
  try {
    const url = new URL(href, "https://wedfotobook.ru");
    if (!INTERNAL_HOSTS.has(url.hostname)) return href;
    localHref = `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }

  const [pathAndQuery, hash = ""] = localHref.split("#", 2);
  const [pathname, query = ""] = pathAndQuery.split("?", 2);
  const aliasedPath = ROUTE_ALIASES.get(pathname) ?? pathname;
  return `${aliasedPath}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

function withNavigableLinks(bodyHtml: string): string {
  return bodyHtml
    .replace(
      /href="#collapse\d+"(?=\s+data-redirect-url="([^"]+)")/g,
      (_href, destination: string) => `href="${normalizeInternalHref(destination)}"`,
    )
    .replace(
      /href=("|')([^"']*)\1/g,
      (_attribute, quote: string, href: string) => `href=${quote}${normalizeInternalHref(href)}${quote}`,
    )
    .replace(/href=(\/[^\s>]+)/g, (_attribute, href: string) => `href="${normalizeInternalHref(href)}"`);
}

function withHomepageImages(bodyHtml: string, slug: string): string {
  let localizedHtml = bodyHtml;

  const imageReplacements = [
    ["/wp-content/uploads/2022/03/logotip-copy-optimized.png", "/media/brand/logo-wedfotobook-v2.png"],
    ["/wp-content/uploads/2021/04/icon6-optimized.png", "/media/social/yandex-wedfotobook.png"],
    ["/wp-content/uploads/2021/03/icos1-optimized.png", "/media/social/vk-wedfotobook.png"],
    ["/wp-content/uploads/2021/03/icos3-optimized.png", "/media/social/tg-wedfotobook.png"],
    ["/wp-content/uploads/2026/01/telegram_2019_logo.svg_-optimized.png", "/media/social/tg-wedfotobook.png"],
    ["/wp-content/uploads/2021/03/icos5-optimized.png", "/media/social/wapp-wedfotobook.png"],
    ["/wp-content/uploads/2026/01/whatsapp.svg_-e1768212721627-optimized.png", "/media/social/wapp-wedfotobook.png"],
    ["/wp-content/uploads/2026/01/logotip_max.svg_-optimized.png", "/media/social/max-wedfotobook.png"],
  ] as const;

  for (const [source, replacement] of imageReplacements) {
    localizedHtml = localizedHtml.replaceAll(source, replacement);
  }

  if (slug) return localizedHtml;

  return localizedHtml.replace(
    "/wp-content/uploads/2026/04/001-1-1-optimized.jpg",
    "/media/home/fotokniga-na-zakaz-wedfotobook-ru.webp",
  );
}

export function LegacyPage({ page }: { page: RenderedPage }) {
  return (
    <>
      <LegacyEnhancements bodyClass={page.bodyClass} />
      <div className={`legacy-wordpress ${page.bodyClass}`} dangerouslySetInnerHTML={{ __html: withNavigableLinks(withHomepageImages(page.bodyHtml, page.slug)) }} />
    </>
  );
}
