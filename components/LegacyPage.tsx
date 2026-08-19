import { LegacyEnhancements } from "@/components/LegacyEnhancements";
import type { RenderedPage } from "@/lib/rendered-pages";

const INTERNAL_HOSTS = new Set(["wedfotobook.ru", "www.wedfotobook.ru"]);
const ROUTE_ALIASES = new Map([
  ["/fotoknigi-s-dopolnennoj-realnostju/", "/fotokniga-s-dopolnennoj-realnostyu/"],
  ["/vypusknye-fotoknigi-2/", "/vypusknye-fotoknigi/"],
]);

export const WHITE_LEGAL_PAGES = new Set([
  "polzovatelskoe-soglashenie",
  "politika-obrabotki-personalnyh-dannyh",
  "soglashenie",
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

function withWorkingForms(bodyHtml: string): string {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const configuredHtml = siteKey
    ? bodyHtml.replace(/data-sitekey=("|')[^"']*\1/g, `data-sitekey="${siteKey}"`)
    : bodyHtml;

  return configuredHtml.replace(
    /<h3 id=("|')reply-title\1[\s\S]*?<\/form>/i,
    '<h3 id="reply-title" class="comment-reply-title">Комментарии</h3><p class="legacy-comments-closed">Комментарии к этой записи закрыты.</p>',
  );
}

function withoutLegacyTracking(bodyHtml: string): string {
  return bodyHtml
    .replace(/<!-- Compliance by Hu-manity\.co plugin[\s\S]*?<!-- \/ Compliance by Hu-manity\.co plugin -->/gi, "")
    .replace(/<!-- Yandex\.Metrika counter -->[\s\S]*?<!-- \/Yandex\.Metrika counter -->/gi, "");
}

function withUpdatedGenealogyNaming(bodyHtml: string): string {
  return bodyHtml
    .replaceAll("Родословные фотокниги", "Родословная фотокнига")
    .replaceAll("Родословная книга", "Родословная фотокнига");
}

function withHomepageBenefitLabels(bodyHtml: string, slug: string): string {
  if (slug) return bodyHtml;

  return bodyHtml
    .replace(">Опыт работы 17 лет</p>", "><strong>17 лет</strong><span>опыта работы</span></p>")
    .replace(">Обработка фото и печать уже включены в стоимость</p>", "><strong>Всё включено</strong><span>обработка фото и печать</span></p>")
    .replace(">Индивидуальный дизайн</p>", "><strong>Без шаблонов</strong><span>индивидуальный дизайн</span></p>");
}

export function LegacyPage({ page }: { page: RenderedPage }) {
  const bodyHtml = withUpdatedGenealogyNaming(
    withHomepageBenefitLabels(
      withoutLegacyTracking(withWorkingForms(withNavigableLinks(withHomepageImages(page.bodyHtml, page.slug)))),
      page.slug,
    ),
  );
  const legalPageClass = WHITE_LEGAL_PAGES.has(page.slug) ? " legal-white-page" : "";
  return (
    <>
      <LegacyEnhancements bodyClass={page.bodyClass} />
      <div className={`legacy-wordpress ${page.bodyClass}${legalPageClass}`} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
}
