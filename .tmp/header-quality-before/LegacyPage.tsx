import { LegacyEnhancements } from "@/components/LegacyEnhancements";
import { optimizedMediaUrl } from "@/lib/media-path";
import type { RenderedPage } from "@/lib/rendered-pages";

/* eslint-disable @next/next/no-css-tags -- route-scoped static styles avoid loading the full WordPress bundle on every page */

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
    .replace(/href=("|')javascript:void\(0\);?\1/g, (_attribute, quote: string) => `href=${quote}#top${quote}`)
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
    ["/wp-content/uploads/2022/03/logotip-copy-optimized.png", "/media/optimized/brand/logo-256.webp"],
    ["/wp-content/uploads/2021/04/icon6-optimized.png", "/media/optimized/social/yandex-64.webp"],
    ["/wp-content/uploads/2021/03/icos1-optimized.png", "/media/optimized/social/vk-64.webp"],
    ["/wp-content/uploads/2021/03/icos3-optimized.png", "/media/optimized/social/telegram-64.webp"],
    ["/wp-content/uploads/2026/01/telegram_2019_logo.svg_-optimized.png", "/media/optimized/social/telegram-64.webp"],
    ["/wp-content/uploads/2021/03/icos5-optimized.png", "/media/optimized/social/whatsapp-64.webp"],
    ["/wp-content/uploads/2026/01/whatsapp.svg_-e1768212721627-optimized.png", "/media/optimized/social/whatsapp-64.webp"],
    ["/wp-content/uploads/2026/01/logotip_max.svg_-optimized.png", "/media/optimized/social/max-64.webp"],
  ] as const;

  for (const [source, replacement] of imageReplacements) {
    localizedHtml = localizedHtml.replaceAll(source, optimizedMediaUrl(replacement));
  }

  if (slug) return localizedHtml;

  return localizedHtml.replace(
    "/wp-content/uploads/2026/04/001-1-1-optimized.jpg",
    optimizedMediaUrl("/media/optimized/home/hero-640.webp"),
  );
}

function withResponsiveLegacyImages(bodyHtml: string, slug: string): string {
  if (process.env.NODE_ENV === "development") return bodyHtml;

  const allowedWidths = [64, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

  return bodyHtml.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = /\bsrc=("|')([^"']+)\1/i.exec(tag)?.[2];
    const width = Number(/\bwidth=("|')(\d+)\1/i.exec(tag)?.[2]);
    if (!src?.startsWith("/") || !Number.isFinite(width) || /\bsrcset=/i.test(tag) || /\.(?:gif|svg)(?:\?|$)/i.test(src)) {
      return tag;
    }

    const widths = allowedWidths.filter((candidate) => candidate <= Math.max(width, 64));
    if (!widths.length) return tag;
    const isLogo = src.includes("/brand/");
    const isSocialIcon = src.includes("/social/");
    const isHomepageHero = !slug && src.split("?", 1)[0] === "/media/optimized/home/hero-640.webp";
    const quality = isHomepageHero ? 72 : 75;
    const srcset = isHomepageHero
      ? [384, 640, 828, 1080]
        .map((candidate) => `${optimizedMediaUrl(`/media/optimized/home/hero-${candidate}.webp`)} ${candidate}w`)
        .join(", ")
      : widths
        .map((candidate) => `/_vinext/image?url=${encodeURIComponent(src)}&amp;w=${candidate}&amp;q=${quality} ${candidate}w`)
        .join(", ");
    const sizes = isLogo
      ? "150px"
      : isSocialIcon
        ? "40px"
        : isHomepageHero
          ? "(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 560px"
          : "(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 900px";
    return tag.replace(/\s*\/?>(?=$)/, ` srcset="${srcset}" sizes="${sizes}" />`);
  });
}

function withLogoDimensions(bodyHtml: string): string {
  return bodyHtml.replace(/<img\b[^>]*\bsrc=("|')\/media\/(?:brand\/Logo wedfotobook\.png|optimized\/brand\/logo-256\.webp)(?:\?v=\d+)?\1[^>]*>/gi, (tag) => {
    if (/\bwidth=/i.test(tag) && /\bheight=/i.test(tag)) return tag;
    return tag.replace("<img", '<img width="962" height="198" decoding="async"');
  });
}

const LEGACY_IMAGE_ALTS: Record<string, string> = {
  "/media/optimized/brand/logo-256.webp": "WedFotoBook — фотокниги на заказ",
  "/media/optimized/social/yandex-64.webp": "Отзывы о WedFotoBook на Яндекс Услугах",
  "/media/optimized/social/vk-64.webp": "Страница WedFotoBook во ВКонтакте",
  "/media/optimized/social/telegram-64.webp": "Написать в Telegram",
  "/media/optimized/social/whatsapp-64.webp": "Написать в WhatsApp",
  "/media/optimized/social/max-64.webp": "Написать в мессенджере MAX",
  "/media/brand/Logo wedfotobook.png": "WedFotoBook — фотокниги на заказ",
  "/media/social/Yandex wedfotobook .png": "Отзывы о WedFotoBook на Яндекс Услугах",
  "/media/social/Vk wedfotobook .png": "Страница WedFotoBook во ВКонтакте",
  "/media/social/Tg wedfotobook .png": "Написать в Telegram",
  "/media/social/Wapp wedfotobook .png": "Написать в WhatsApp",
  "/media/social/Max wedfotobook .png": "Написать в мессенджере MAX",
  "/wp-content/uploads/2026/01/telegram_2019_logo.svg_-optimized.png": "Написать в Telegram",
  "/wp-content/uploads/2026/01/whatsapp.svg_-e1768212721627-optimized.png": "Написать в WhatsApp",
  "/wp-content/uploads/2026/01/logotip_max.svg_-optimized.png": "Написать в мессенджере MAX",
  "/wp-content/uploads/2026/08/002-s-1-optimized.jpg": "Профессиональная обработка фотографий для фотокниги",
  "/wp-content/uploads/2026/08/b5db748a-ceb6-4e26-907e-a8fd9f4305a1-1-optimized.jpg": "Семейная фотокнига с памятными фотографиями",
  "/wp-content/uploads/2026/08/img_0698-1-optimized.jpg": "Согласование макета фотокниги с клиентом",
  "/wp-content/uploads/2026/08/img_3245-optimized.jpg": "Печать готовой фотокниги в типографии",
  "/wp-content/uploads/2026/08/01-3-optimized.png": "Иконка индивидуального дизайна фотокниги без шаблонов",
  "/wp-content/uploads/2026/08/02-3-optimized.png": "Иконка работы профессионального дизайнера фотокниг",
  "/wp-content/uploads/2026/08/03-3-optimized.png": "Иконка предварительного просмотра макета до оплаты",
  "/wp-content/uploads/2026/08/04-3-optimized.png": "Иконка согласования макета до полного одобрения",
  "/wp-content/uploads/2026/08/05-3-optimized.png": "Иконка обработки и улучшения фотографий",
  "/wp-content/uploads/2026/08/06-3-optimized.png": "Иконка работы над фотокнигой полностью онлайн",
  "/wp-content/uploads/2026/08/07-3-optimized.png": "Иконка изготовления фотокниги в среднем за семь дней",
  "/wp-content/uploads/2026/08/08-3-optimized.png": "Иконка современной технологии печати фотокниг",
  "/wp-content/uploads/2026/08/01-kopiya-optimized.png": "Иконка этапа заказа: отправка фотографий",
  "/wp-content/uploads/2026/08/02-kopiya-optimized.jpg": "Иконка этапа заказа: консультация по фотокниге",
  "/wp-content/uploads/2026/08/03-t-kopiya-optimized.png": "Иконка этапа заказа: первые три разворота",
  "/wp-content/uploads/2026/08/05-kopiya-optimized.png": "Иконка этапа заказа: согласование макета",
  "/wp-content/uploads/2026/08/07-kopiya-optimized.png": "Иконка этапа заказа: печать фотокниги",
  "/wp-content/uploads/2026/08/08-kopiya-optimized.png": "Иконка этапа заказа: готовая фотокнига",
  "/wp-content/uploads/2026/08/061-1-optimized.jpg": "Фотокнига Премиум с плотными панорамными разворотами",
  "/wp-content/uploads/2026/08/062-1-optimized.jpg": "Фотокнига Стандарт с журнальными страницами",
};

const LEGACY_PAGE_IMAGE_PREFIXES: Record<string, string> = {
  "wedding-fotoknig": "Разворот свадебной фотокниги с индивидуальным дизайном",
  "detskaya-fotokniga": "Разворот детской фотокниги с индивидуальным дизайном",
  "yubilejnaya-fotokniga": "Разворот фотокниги на юбилей",
  "fotokniga-o-puteshestvii": "Разворот фотокниги о путешествии",
  "vypusknye-fotoknigi": "Разворот выпускного альбома",
  "genealogicheskaya-fotokniga": "Разворот родословной фотокниги с семейной историей",
  "fotokniga-na-lyubuyu-temu": "Разворот фотокниги на заказ с индивидуальным дизайном",
  "fotokniga-s-dopolnennoj-realnostyu": "Страница фотокниги с оживающей фотографией",
  "fotokniga-premium": "Пример фотокниги Премиум",
  "fotokniga-standart": "Пример фотокниги Стандарт",
  "vypusknye-fotoknigi-stoimost": "Пример выпускного альбома",
  "fotoknigi-s-dopolnennoj-realnostju-stoim": "Пример фотокниги с оживающей фотографией",
  katalog: "Обложка фотокниги с индивидуальным дизайном",
  stoimost: "Пример фотокниги на заказ",
  otzyvy: "Скриншот отзыва клиента о фотокниге",
};

function generatedLegacyImageAlt(src: string, slug: string, index: number): string {
  const normalizedSrc = src.split("?", 1)[0];
  const knownAlt = LEGACY_IMAGE_ALTS[normalizedSrc];
  if (knownAlt) return knownAlt;

  const lowerSrc = normalizedSrc.toLocaleLowerCase("ru-RU");
  const fileName = normalizedSrc.split("/").at(-1) ?? normalizedSrc;
  const sourceNumber = Number(
    /(?:otziv|разворот|fotokniga|albom|dety|svadba|ubiley)[-_ ]*0*(\d+)/i.exec(fileName)?.[1]
      ?? /(?:^|\D)0*(\d+)(?:\D|$)/.exec(fileName)?.[1],
  );
  const suffix = Number.isFinite(sourceNumber) && sourceNumber > 0 ? ` №${sourceNumber}` : ` №${index}`;

  if (lowerSrc.includes("otziv")) return `Скриншот отзыва клиента о фотокниге${suffix}`;
  if (lowerSrc.includes("svadba")) return `Свадебная фотокнига с индивидуальным дизайном${suffix}`;
  if (lowerSrc.includes("dety") || lowerSrc.includes("detsk")) return `Детская фотокнига с индивидуальным дизайном${suffix}`;
  if (lowerSrc.includes("ubiley") || lowerSrc.includes("yubile")) return `Фотокнига на юбилей${suffix}`;
  if (lowerSrc.includes("puteshed") || lowerSrc.includes("travell")) return `Фотокнига о путешествии${suffix}`;
  if (lowerSrc.includes("vipusk")) return `Выпускной альбом с индивидуальным дизайном${suffix}`;
  if (lowerSrc.includes("genealog")) return `Родословная фотокнига с семейной историей${suffix}`;
  if (lowerSrc.includes("alive") || /\/d-00[12](?:-|\.)/i.test(lowerSrc)) return `Фотокнига с оживающей фотографией${suffix}`;
  if (lowerSrc.includes("fotokbiga") || lowerSrc.includes("fotokniga")) return `Фотокнига на заказ с индивидуальным дизайном${suffix}`;

  const pagePrefix = LEGACY_PAGE_IMAGE_PREFIXES[slug] ?? "Фотокнига на заказ с индивидуальным дизайном";
  return `${pagePrefix} №${index}`;
}

function withSeoImageAlts(bodyHtml: string, slug: string): string {
  let contentImageIndex = 0;
  const sourceOccurrences = new Map<string, number>();

  return bodyHtml.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = /\bsrc=("|')([^"']+)\1/i.exec(tag)?.[2];
    if (!src || src.startsWith("https://mc.yandex.ru/watch/")) return tag;

    const normalizedSrc = src.split("?", 1)[0];
    const occurrence = (sourceOccurrences.get(normalizedSrc) ?? 0) + 1;
    sourceOccurrences.set(normalizedSrc, occurrence);
    contentImageIndex += 1;

    const existingAltMatch = /\balt=("|')([^"']*)\1/i.exec(tag);
    const existingAlt = existingAltMatch?.[2].trim() ?? "";
    const forceGeneratedAlt = Boolean(LEGACY_IMAGE_ALTS[normalizedSrc]);
    const technicalAlt = /^\d+$/.test(existingAlt)
      || /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(existingAlt)
      || /\b(?:img|image|optimized|kopiya)\b/i.test(existingAlt);
    if (existingAlt && !forceGeneratedAlt && !technicalAlt) return tag;

    const alt = normalizedSrc.endsWith("/04-kopiya-optimized.png")
      ? occurrence === 1
        ? "Иконка этапа заказа: предоплата"
        : "Иконка этапа заказа: окончательная оплата"
      : generatedLegacyImageAlt(src, slug, contentImageIndex);
    const escapedAlt = alt.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

    if (existingAltMatch) return tag.replace(existingAltMatch[0], `alt="${escapedAlt}"`);
    return tag.replace(/\s*\/?>(?=$)/, ` alt="${escapedAlt}" />`);
  });
}

function withWorkingForms(bodyHtml: string): string {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const configuredHtml = siteKey
    ? bodyHtml.replace(/data-sitekey=("|')[^"']*\1/g, `data-sitekey="${siteKey}"`)
    : bodyHtml;

  return configuredHtml.replace(
    /<h3 id=("|')reply-title\1[\s\S]*?<\/form>/i,
    '<h2 id="reply-title" class="comment-reply-title">Комментарии</h2><p class="legacy-comments-closed">Комментарии к этой записи закрыты.</p>',
  );
}

function headingText(innerHtml: string): string {
  return innerHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|#160|#xA0);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function withSeoHeadingHierarchy(bodyHtml: string, slug: string): string {
  let normalizedHtml = bodyHtml;

  if (!slug) {
    normalizedHtml = normalizedHtml.replace(
      /<h3\b([^>]*\bclass=("|')[^"']*\btel1\b[^"']*\2[^>]*)>([\s\S]*?)<\/h3>/i,
      "<p$1>$3</p>",
    );

    const hiddenSectionsIndex = normalizedHtml.search(
      /<div\b[^>]*\bclass=("|')[^"']*\bpad2\b[^"']*\1[^>]*>/i,
    );
    if (hiddenSectionsIndex >= 0) {
      const visibleHero = normalizedHtml.slice(0, hiddenSectionsIndex);
      const hiddenLegacySections = normalizedHtml.slice(hiddenSectionsIndex).replace(
        /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi,
        '<div data-legacy-heading-level="$1"$2>$3</div>',
      );
      normalizedHtml = visibleHero + hiddenLegacySections;
    }
  }

  return normalizedHtml.replace(
    /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (heading, level: string, attributes: string, innerHtml: string) => {
      const text = headingText(innerHtml);
      if (!text) return `<div${attributes} data-heading-spacer aria-hidden="true"></div>`;

      if (WHITE_LEGAL_PAGES.has(slug)) {
        const isOperatorDetailsLabel = (level === "2" || level === "3")
          && text === "11. РЕКВИЗИТЫ ОПЕРАТОРА (ОПЕРАТОРА ПЕРСОНАЛЬНЫХ ДАННЫХ)";
        const isThirdPartyListSubtitle = level === "3" && (
          text === "персональных данных, передаваемых третьим лицам Оператором"
          || text === "на основании пункта 8.1 Политики обработки и защиты персональных данных"
        );

        if (isOperatorDetailsLabel || isThirdPartyListSubtitle) {
          return `<p${attributes}>${innerHtml}</p>`;
        }
      }

      if (WHITE_LEGAL_PAGES.has(slug) && level === "3") {
        if (/^Настоящий перечень содержит сведения/i.test(text)) {
          return `<p${attributes}>${innerHtml}</p>`;
        }
        if (/^(?:\d+\.\s*)?Реквизиты оператора/i.test(text) || text === "ПЕРЕЧЕНЬ") {
          return `<h2${attributes}>${innerHtml}</h2>`;
        }
      }

      return heading;
    },
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

function withAccessibleLegacyControls(bodyHtml: string): string {
  return bodyHtml
    .replaceAll("https://telegram.me/photokniga_na_zakaz", "https://t.me/photokniga_na_zakaz")
    .replace(
      /<a\b([^>]*\bclass=("|')[^"']*\bfancybox-inline\b[^"']*\2[^>]*)>/gi,
      (tag, attributes: string) => /\baria-label=/i.test(attributes)
        ? tag
        : `<a${attributes} aria-label="Открыть форму заказа">`,
    );
}

function withReviewBackgroundBands(bodyHtml: string, slug: string): string {
  if (slug !== "otzyvy") return bodyHtml;

  const titleTextIndex = bodyHtml.indexOf("Отзывы о фотокнигах");
  const galleryStartIndex = bodyHtml.lastIndexOf("<h1", titleTextIndex);
  const galleryIndex = bodyHtml.indexOf('id="foogallery-gallery-22276"', galleryStartIndex);
  const reviewStartIndex = bodyHtml.indexOf(
    '<div class="vc_empty_space"   style="height: 20px">',
    galleryIndex,
  );
  const sectionEndIndex = bodyHtml.indexOf("</section>", reviewStartIndex);
  const closingMatch = bodyHtml
    .slice(reviewStartIndex, sectionEndIndex)
    .match(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*$/);

  if (galleryStartIndex < 0 || galleryIndex < 0 || reviewStartIndex < 0 || sectionEndIndex < 0 || !closingMatch || closingMatch.index === undefined) {
    return bodyHtml;
  }

  const reviewEndIndex = reviewStartIndex + closingMatch.index;
  return `${bodyHtml.slice(0, galleryStartIndex)}<div class="reviews-gallery-section">${bodyHtml.slice(galleryStartIndex, reviewStartIndex)}</div><div class="reviews-copy-section">${bodyHtml.slice(reviewStartIndex, reviewEndIndex)}</div>${bodyHtml.slice(reviewEndIndex)}`;
}

export function LegacyPage({ page }: { page: RenderedPage }) {
  const normalizedBodyHtml = withSeoImageAlts(withReviewBackgroundBands(
    withUpdatedGenealogyNaming(
      withHomepageBenefitLabels(
        withoutLegacyTracking(
          withSeoHeadingHierarchy(
            withWorkingForms(
              withNavigableLinks(
                withResponsiveLegacyImages(withLogoDimensions(withHomepageImages(page.bodyHtml, page.slug)), page.slug),
              ),
            ),
            page.slug,
          ),
        ),
        page.slug,
      ),
    ),
    page.slug,
  ), page.slug);
  const bodyHtml = withAccessibleLegacyControls(normalizedBodyHtml);
  const legalPageClass = WHITE_LEGAL_PAGES.has(page.slug) ? " legal-white-page" : "";
  const isHomepage = !page.slug;
  return (
    <>
      <link
        rel="stylesheet"
        href={isHomepage ? "/wp-assets/home-optimized.css?v=2" : "/wp-assets/wordpress.css?v=11"}
        precedence="wordpress"
      />
      {!isHomepage && <link rel="stylesheet" href="/wp-assets/home-original-fix.css?v=51" precedence="wordpress-overrides" />}
      {!isHomepage && <link rel="stylesheet" href="/wp-assets/first-version-home.css?v=81" precedence="site-design" />}
      <LegacyEnhancements bodyClass={page.bodyClass} />
      <div className={`legacy-wordpress ${page.bodyClass}${legalPageClass}`} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
}
