import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { gzipSync } from "node:zlib";

const globalCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const headerCss = await readFile(new URL("../public/wp-assets/home-original-fix.css", import.meta.url), "utf8");
const firstVersionCss = await readFile(new URL("../public/wp-assets/first-version-home.css", import.meta.url), "utf8");
const optimizedHomeCss = await readFile(new URL("../public/wp-assets/home-optimized.css", import.meta.url), "utf8");
const orderDialogSource = await readFile(new URL("../components/OrderDialog.tsx", import.meta.url), "utf8");
const contactPageSource = await readFile(new URL("../components/ContactPage.tsx", import.meta.url), "utf8");
const contactRouteSource = await readFile(new URL("../app/api/contact/route.ts", import.meta.url), "utf8");
const contactEmailSource = await readFile(new URL("../lib/contact-email.ts", import.meta.url), "utf8");
const legacyEnhancementsSource = await readFile(new URL("../components/LegacyEnhancements.tsx", import.meta.url), "utf8");
const legacyPageSource = await readFile(new URL("../components/LegacyPage.tsx", import.meta.url), "utf8");
const cookieNoticeSource = await readFile(new URL("../components/CookieNotice.tsx", import.meta.url), "utf8");
const analyticsSource = await readFile(new URL("../components/Analytics.tsx", import.meta.url), "utf8");
const cookieConsentSource = await readFile(new URL("../lib/cookie-consent.ts", import.meta.url), "utf8");
const databaseSchemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const layoutSource = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const nextConfigSource = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const articleRoutes = [
  "/article-genealogy/",
  "/article-vipysk/",
  "/article-travell/",
  "/article-alivefoto/",
  "/article-otziv/",
  "/statya-6-fotoknigi-na-zakaz-wedfotobook-ru/",
  "/article-wedding/",
  "/article-children/",
  "/article-anniversary/",
];

function normalizeMediaPaths(html) {
  return html.replace(/%2F/gi, "/").replace(/%20/gi, " ");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("uses Open Sans across the entire site", () => {
  assert.match(globalCss, /body \* \{\s*font-family: "Open Sans", Arial, sans-serif !important;/);
});

test("publishes branded favicon assets", async () => {
  assert.match(layoutSource, /url: "\/favicon\.ico", sizes: "24x24", type: "image\/x-icon"/);
  assert.match(layoutSource, /url: "\/favicon-32x32\.png", sizes: "32x32", type: "image\/png"/);
  assert.match(layoutSource, /url: "\/apple-touch-icon\.png", sizes: "180x180", type: "image\/png"/);
  assert.doesNotMatch(layoutSource, /url: "\/favicon\.svg"/);
  for (const file of ["favicon.ico", "favicon-32x32.png", "apple-touch-icon.png"]) {
    await access(new URL(`../public/${file}`, import.meta.url));
  }
});

test("uses a two-field callback form with consent and spam protection", () => {
  assert.match(orderDialogSource, /<input name="name"/);
  assert.match(orderDialogSource, /<input name="phone" type="tel"/);
  assert.match(orderDialogSource, /<input name="consent" type="checkbox" required/);
  assert.match(orderDialogSource, /className="honeypot"/);
  assert.match(orderDialogSource, /name="formStartedAt" type="hidden"/);
  assert.match(orderDialogSource, /className="order-antispam"/);
  assert.match(orderDialogSource, /status === "sending" \? "Отправляем…" : "Отправить"/);
  assert.match(orderDialogSource, /result\.saved && result\.notified === false \? "saved" : "success"/);
  assert.match(contactPageSource, /result\.saved && result\.notified === false \? "saved" : "success"/);
  assert.match(legacyEnhancementsSource, /result\.saved && result\.notified === false/);
  assert.doesNotMatch(`${orderDialogSource}${contactPageSource}${legacyEnhancementsSource}${contactRouteSource}`, /turnstile/i);
  assert.doesNotMatch(orderDialogSource, /name="(?:photos|message)"/);
  assert.match(globalCss, /\.order-dialog \{[^}]*border-radius: 22px;/s);
  assert.match(globalCss, /\.order-dialog \.order-form \.checkbox > span \{[^}]*width: auto !important;[^}]*float: none !important;/s);
  assert.match(contactRouteSource, /FORM_MIN_AGE_MS/);
  assert.match(contactRouteSource, /RATE_LIMIT_MAX/);
  assert.doesNotMatch(contactRouteSource, /verifyTurnstile/);
  assert.match(contactEmailSource, /"idempotency-key": `contact-notification\/\$\{input\.id\}`/);
  assert.match(contactEmailSource, /response\.status === 409 \|\| response\.status === 408/);
  assert.match(contactEmailSource, /isLoopbackMailerUrl/);
  assert.match(contactRouteSource, /value === true \|\| value === "on" \|\| value === "1"/);
  assert.match(contactRouteSource, /insert\(enquiries\)/);
  assert.match(contactRouteSource, /notificationStatus/);
  assert.match(contactRouteSource, /localMailerConfigured/);
  assert.match(databaseSchemaSource, /export const enquiries = sqliteTable/);
  assert.match(databaseSchemaSource, /export const submissionAttempts = sqliteTable/);
  assert.match(legacyEnhancementsSource, /kind: email \|\| message \? "message" : "callback"/);
  assert.match(legacyEnhancementsSource, /your-message/);
});

test("does not restyle the whole document after homepage hydration", () => {
  assert.match(legacyEnhancementsSource, /const isHomepage = bodyClass\.split\(\/\\s\+\/\)\.includes\("home"\)/);
  assert.match(legacyEnhancementsSource, /if \(!isHomepage\) document\.body\.className =/);
});

test("uses granular cookie consent before analytics", () => {
  assert.match(cookieNoticeSource, />Принять все<\/button>/);
  assert.match(cookieNoticeSource, />Отклонить необязательные<\/button>/);
  assert.match(cookieNoticeSource, />Настроить<\/button>/);
  assert.match(cookieNoticeSource, /Разрешить аналитические cookies/);
  assert.doesNotMatch(cookieNoticeSource, /cookie-settings-trigger/);
  assert.match(cookieConsentSource, /CONSENT_MAX_AGE_MS = 180 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(cookieConsentSource, /analytics: boolean/);
  assert.match(analyticsSource, /if \(readCookieConsent\(\)\?\.analytics\) loadYandexMetrika\(\)/);
  assert.match(analyticsSource, /else clearMetrikaStorage\(\)/);
  assert.match(analyticsSource, /webvisor: false/);
  assert.match(legacyPageSource, /withoutLegacyTracking/);
  assert.match(legacyPageSource, /Yandex\\\.Metrika counter/);
  assert.doesNotMatch(legacyEnhancementsSource, /saveCookieChoice/);
});

test("uses the home-page header styling on every page", () => {
  assert.match(headerCss, /\.legacy-wordpress > \.navbar \{/);
  assert.match(headerCss, /\.legacy-wordpress > \.navbar \.nav-header-container \{/);
  assert.match(headerCss, /\.legacy-wordpress > \.navbar \.navbar-nav > li > a \{/);
  assert.match(headerCss, /\.hcode-header-logo img \{[^}]*width: auto !important;[^}]*height: 50px !important;/s);
  assert.match(headerCss, /\.hcode-header-logo img\.retina-logo \{[^}]*height: 50px !important;/s);
  assert.doesNotMatch(headerCss, /\.legacy-wordpress\.home > \.navbar/);
});

test("keeps comfortable spacing between the footer service links", () => {
  assert.match(firstVersionCss, /\.footer-service-links,\s*\.restored-first-version \.footer-service-links a \{\s*line-height: 23px;/);
});

test("keeps the footer links unchanged while arranging them in a structured grid", () => {
  assert.match(firstVersionCss, /\.legacy-wordpress > \.hcode-main-footer \{\s*display: none !important;/);
  assert.match(firstVersionCss, /grid-template-columns: minmax\(0, 1\.35fr\) minmax\(0, 1fr\) minmax\(0, 1\.35fr\) minmax\(0, 1\.2fr\);/);
  assert.match(firstVersionCss, /\.original-footer-grid > div \+ div \{\s*border-left:/);
  assert.match(firstVersionCss, /\.footer-contacts \{\s*text-align: left;/);
  assert.doesNotMatch(firstVersionCss, /\.original-footer-grid \{[^}]*width:/s);
  assert.doesNotMatch(firstVersionCss, /\.footer-contact-card \{[^}]*border(?:-radius)?:/s);
  assert.doesNotMatch(firstVersionCss, /\.footer-contact-card \{[^}]*background:/s);
});

async function render(path = "/", init = {}) {
  const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
  return fetch(new URL(path, baseUrl), {
    redirect: "manual",
    ...init,
    headers: { accept: "text/html", ...(init.headers ?? {}) },
  });
}

test("does not cache missing images or mislabel an error page as an image", async () => {
  for (const path of [
    "/media/__missing_asset_test__.webp",
  ]) {
    const response = await render(path);
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/, path);
    assert.ok(!response.headers.get("content-type")?.startsWith("image/"), path);
  }
});

test("versions restored images and every responsive candidate to bypass cached failures", async () => {
  const sitemap = await (await render("/sitemap.xml")).text();
  const paths = [...sitemap.matchAll(/<loc>https:\/\/wedfotobook\.ru([^<]*)<\/loc>/g)].map((match) => match[1]);
  let restoredImages = 0;
  for (const path of paths) {
    const html = await (await render(path)).text();
    for (const tag of html.matchAll(/<(?:img|source|link)\b[^>]*>/gi)) {
      for (const attribute of tag[0].matchAll(/\b(src|srcset|imageSrcSet)="([^"]+)"/gi)) {
        const values = attribute[1].toLowerCase() === "src" ? [attribute[2]]
          : attribute[2].split(/,\s*/).map((value) => value.replace(/\s+\d+(?:\.\d+)?[wx]$/, ""));
        for (const value of values) {
          const url = new URL(value.replaceAll("&amp;", "&"), "https://wedfotobook.ru");
          const source = url.pathname === "/_next/image"
            ? new URL(url.searchParams.get("url"), url) : url;
          if (!source.pathname.startsWith("/media/optimized/")) continue;
          restoredImages++;
          assert.equal(source.searchParams.get("v"), "20260830", `${path}: ${value}`);
        }
      }
    }
  }
  assert.ok(restoredImages > 100);
});

test("publishes complete technical SEO and GEO signals", async () => {
  const rootHtml = await (await render()).text();
  const jsonLdBlocks = [...rootHtml.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  assert.equal(jsonLdBlocks.length, 2);
  const graphTypes = jsonLdBlocks.flatMap((block) => block["@graph"].map((item) => item["@type"]));
  assert.ok(graphTypes.includes("LocalBusiness"));
  assert.ok(graphTypes.includes("WebSite"));
  assert.ok(graphTypes.includes("WebPage"));
  assert.match(rootHtml, /"streetAddress":"Свободный проспект, д\. 33"/);
  assert.match(rootHtml, /"telephone":"\+7-985-434-23-67"/);
  assert.match(rootHtml, /<html[^>]*id="top"[^>]*lang="ru"/);
  assert.doesNotMatch(rootHtml, /href="javascript:void\(0\);?"/);
  assert.match(rootHtml, /<meta property="og:image" content="https:\/\/wedfotobook\.ru\/og-1200x630\.png"/);
  assert.match(rootHtml, /<meta property="og:image:width" content="1200"/);
  assert.match(rootHtml, /<meta property="og:image:height" content="630"/);
  assert.match(rootHtml, /<link rel="describedby" href="\/llms\.txt" type="text\/markdown"/);

  const ogImage = await readFile(new URL("../public/og-1200x630.png", import.meta.url));
  assert.equal(ogImage.readUInt32BE(16), 1200);
  assert.equal(ogImage.readUInt32BE(20), 630);

  const llmsText = await readFile(new URL("../public/llms.txt", import.meta.url), "utf8");
  assert.match(llmsText, /^# WedFotoBook/m);
  assert.match(llmsText, /https:\/\/wedfotobook\.ru\/privacy-policy\//);
  const agents = JSON.parse(await readFile(new URL("../public/.well-known/agents.json", import.meta.url), "utf8"));
  assert.equal(agents.resources.llms, "https://wedfotobook.ru/llms.txt");
  assert.equal(agents.resources.privacyPolicy, "https://wedfotobook.ru/privacy-policy/");

  const sitemapResponse = await render("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  assert.equal([...sitemap.matchAll(/<loc>/g)].length, 31);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/wedfotobook\.ru\/fotokniga-klassik\/<\/loc>/);
  for (const route of ["article-wedding", "article-children", "article-anniversary"]) {
    assert.match(sitemap, new RegExp(`<loc>https://wedfotobook\\.ru/${route}/</loc>`));
  }
  assert.match(normalizeMediaPaths(sitemap), /<image:loc>https:\/\/wedfotobook\.ru\/media\/covers\/Svadba fotokniga wedfotobook ru\.webp<\/image:loc>/);

  const robots = await (await render("/robots.txt")).text();
  assert.match(robots, /User-Agent: YandexAdditionalBot/);
  assert.match(robots, /User-Agent: GPTBot/);
  assert.match(robots, /User-Agent: ClaudeBot/);
  assert.match(robots, /User-Agent: Google-Extended/);
  assert.match(robots, /Disallow: \/admin\//);
  assert.match(robots, /Sitemap: https:\/\/wedfotobook\.ru\/sitemap\.xml/);

  const articleHtml = await (await render("/article-wedding/")).text();
  assert.match(normalizeMediaPaths(articleHtml), /<meta property="og:image" content="https:\/\/wedfotobook\.ru\/media\/covers\/Svadba fotokniga wedfotobook ru\.webp"/);
  assert.match(articleHtml, /"@type":"Article"/);
  assert.match(articleHtml, /"datePublished":"2026-08-25T14:55:50\+03:00"/);
  assert.match(articleHtml, /"dateModified":"2026-08-25T14:55:50\+03:00"/);
  assert.match(articleHtml, /"author":\{"@type":"Organization","name":"Редакция WedFotoBook"/);
  assert.match(articleHtml, /class="author-bio"/);
  assert.match(articleHtml, /более 17 лет создаёт фотокниги на заказ/);
});

test("uses one descriptive h1 and an unbroken heading hierarchy on every public page", async () => {
  const sitemap = await (await render("/sitemap.xml")).text();
  const paths = [...sitemap.matchAll(/<loc>https:\/\/wedfotobook\.ru([^<]*)<\/loc>/g)]
    .map((match) => match[1]);

  for (const path of paths) {
    const html = await (await render(path)).text();
    const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({
      level: Number(match[1]),
      text: match[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/&(?:nbsp|#160|#xA0);/gi, " ")
        .replace(/\s+/g, " ")
        .trim(),
    }));

    assert.equal(headings.filter(({ level }) => level === 1).length, 1, `${path} must contain exactly one h1`);
    assert.equal(headings[0]?.level, 1, `${path} must start its content hierarchy with h1`);
    assert.ok(headings.every(({ text }) => text.length > 0), `${path} must not contain empty headings`);

    for (let index = 1; index < headings.length; index += 1) {
      assert.ok(
        headings[index].level <= headings[index - 1].level + 1,
        `${path} skips from h${headings[index - 1].level} to h${headings[index].level}: ${headings[index].text}`,
      );
    }
  }
});

test("serves responsive photos with full-resolution originals without a third-party challenge", async () => {
  const html = await (await render()).text();
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  assert.ok(imageTags.length > 40);
  assert.ok(imageTags.every((tag) => /\bwidth=/.test(tag) && /\bheight=/.test(tag)));
  const photoTags = imageTags.filter((tag) => /\bsrc="\/media\/(?:home|covers|gallery|home-gallery|reviews-selected|originals)\//.test(tag));
  assert.ok(photoTags.length >= 18);
  assert.ok(photoTags.every((tag) => /\?v=20260831/.test(tag)));
  const hero = photoTags.find((tag) => tag.includes("/media/originals/22969.jpg"));
  assert.match(hero, /fetchpriority="high"/i);
  assert.match(hero, /srcset="[^"]+320w,[^"]+480w,[^"]+640w/);
  assert.match(hero, /22969\.jpg\?v=20260831 1767w/);
  assert.match(hero, /sizes="[^"]+calc\(61vw - 44px\)/);
  const heroPicture = [...html.matchAll(/<picture\b[^>]*>[\s\S]*?<\/picture>/g)].map((match) => match[0]).find((picture) => picture.includes("/media/originals/22969.jpg"));
  const avifSource = /<source\b[^>]*>/.exec(heroPicture)?.[0];
  assert.match(avifSource, /384\.avif 384w/);
  assert.match(hero, /loading="eager" fetchpriority="high"/);
  const head = html.slice(0, html.indexOf("</head>"));
  assert.match(head, /<style data-precedence="next"/);
  assert.doesNotMatch(head, /<style data-home-critical>/);
  assert.doesNotMatch(head, /<link[^>]+data-rsc-css-href/);
  assert.doesNotMatch(head, /<link rel="stylesheet" href="\/wp-assets\/home-critical\.css/);
  assert.match(head, /<style data-home-styles>/);
  assert.doesNotMatch(html, /<link[^>]+home-optimized\.css/);
  assert.doesNotMatch(html, /\/_next\/static\/chunks\/.*\.js/, "the homepage must not download the framework runtime");
  assert.doesNotMatch(head, /<link\b[^>]*rel="modulepreload"/, "the public homepage must not preload unused client modules");
  assert.match(html, /<script src="\/wp-assets\/home-interactions\.js\?v=20260902b" defer=""><\/script>/);
  const previewHtml = await (await render("/?cms_preview=1")).text();
  assert.match(previewHtml, /<script\b[^>]+_next\/static/, "the CMS preview must keep its editor runtime");
  assert.doesNotMatch(previewHtml, /home-interactions\.js/, "the public enhancement script must not run in the CMS preview");
  const linkHeader = (await render()).headers.get("link") ?? "";
  const heroResource = "/media/responsive/c465bcb8000c362c-384.avif";
  assert.equal(linkHeader.split(`<${heroResource}>`).length - 1, 1, `${heroResource} must be preloaded exactly once`);
  assert.match(linkHeader, /\/media\/responsive\/c465bcb8000c362c-384\.avif>.*rel=preload.*as=image.*imagesrcset="[^"]+320w,[^"]+384w/);
  assert.doesNotMatch(linkHeader, /2504a79c7c6b3770|\/media\/optimized\/social\//, "non-LCP header images must not compete with the hero preload");
  assert.doesNotMatch(linkHeader, /home-critical\.css|\/_next\/static\/css\//);
  for (const track of ["home-gallery-carousel-track", "review-carousel-track"]) {
    const start = html.indexOf(`id="${track}"`);
    const end = html.indexOf('class="review-navigation"', start);
    const slides = html.slice(start, end);
    assert.equal([...slides.matchAll(/<img\b/g)].length, 1, "only the active slide should have an image source initially");
  }
  assert.ok(imageTags.some((tag) => /\bsrcset=/i.test(tag)));
  assert.doesNotMatch(html, /\/_next\/image\?url=[^"']*social/i, "tiny social icons should load directly");
  const logoTag = imageTags.find((tag) => normalizeMediaPaths(tag).includes("/media/brand/Logo wedfotobook.png"));
  assert.match(logoTag ?? "", /width="962" height="198"/);
  assert.match(logoTag ?? "", /loading="eager" fetchpriority="high"/);
  assert.doesNotMatch(html, /<source type="image\/avif"[^>]+bcc41e6f31b2f1ab/);
  for (const icon of ["telegram", "whatsapp", "max"]) {
    const iconTag = imageTags.find((tag) => tag.includes(`/media/optimized/social/${icon}-64.webp`));
    assert.match(iconTag ?? "", /loading="eager" fetchpriority="low"/);
  }
  assert.match(nextConfigSource, /unoptimized:\s*true/);
  assert.doesNotMatch(`${layoutSource}${orderDialogSource}`, /turnstile|cloudflare/i);
  assert.match(nextConfigSource, /source: "\/media\/:path\*"/);
});

test("rejects automated callback submissions on the server", async () => {
  const trapped = await render("/api/contact/", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "192.0.2.10" },
    body: JSON.stringify({ address: "spam", name: "Bot", phone: "+7 (999) 111-22-33", consent: "on", formStartedAt: Date.now() - 2000 }),
  });
  assert.equal(trapped.status, 200);

  const tooFast = await render("/api/contact/", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "192.0.2.11" },
    body: JSON.stringify({ name: "Bot", phone: "+7 (999) 111-22-33", consent: "on", formStartedAt: Date.now() }),
  });
  assert.equal(tooFast.status, 429);

  const falseConsent = await render("/api/contact/", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "192.0.2.12" },
    body: JSON.stringify({ name: "Bot", phone: "+7 (999) 111-22-33", consent: "false", formStartedAt: Date.now() - 2000 }),
  });
  assert.equal(falseConsent.status, 422);

  const tooLongPhone = await render("/api/contact/", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "192.0.2.13" },
    body: JSON.stringify({ name: "Bot", phone: "+7 (999) 111-22-334", consent: true, formStartedAt: Date.now() - 2000 }),
  });
  assert.equal(tooLongPhone.status, 422);
});

test("limits the contact API surface and rejects malformed or oversized input", async () => {
  const getResponse = await render("/api/contact/");
  assert.ok([404, 405].includes(getResponse.status));

  const wrongContentType = await render("/api/contact/", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "{}",
  });
  assert.equal(wrongContentType.status, 415);

  const malformed = await render("/api/contact/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"name":',
  });
  assert.equal(malformed.status, 400);
  assert.doesNotMatch(await malformed.text(), /(?:stack|node_modules|at POST)/i);

  const oversized = await render("/api/contact/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "x".repeat(40_000) }),
  });
  assert.equal(oversized.status, 413);

  const crossOrigin = await render("/api/contact/", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://evil.example" },
    body: JSON.stringify({ address: "spam" }),
  });
  assert.equal(crossOrigin.headers.get("access-control-allow-origin"), null);
});

test("removes the obsolete classic page and keeps the privacy alias working", async () => {
  const classicResponse = await render("/fotokniga-klassik/");
  assert.equal(classicResponse.status, 404);

  const privacyAlias = await render("/politika-konfidencialnosti/");
  assert.ok([301, 302, 307, 308].includes(privacyAlias.status));
  assert.equal(privacyAlias.headers.get("location"), "/politika-obrabotki-personalnyh-dannyh/");

  const privacyPolicy = await render("/privacy-policy/");
  assert.ok([301, 302, 307, 308].includes(privacyPolicy.status));
  assert.equal(privacyPolicy.headers.get("location"), "/politika-obrabotki-personalnyh-dannyh/");
});

test("publishes the client-approved metadata on the four requested pages", async () => {
  const expected = [
    {
      pathname: "/fotokniga-standart/",
      title: "Стоимость фотокниги Стандарт | wedfotobook.ru",
      description: "В стоимость фотокниги Стандарт входит обработка фотографий, индивидуальный дизайн, согласование макета и печать. Цены начинаются от 9 800 руб.",
    },
    {
      pathname: "/yubilejnaya-fotokniga/",
      title: "Фотокнига на юбилей на заказ в Москве - \"под ключ\" | wedfotobook.ru",
      description: "Заказать фотокнигу на юбилей в Москве - под ключ от 8 900 руб. Любая тема, от 1 экз., за 7 дней. Пришлите фото - всё сделаем сами.",
    },
    {
      pathname: "/fotokniga-o-puteshestvii/",
      title: "Фотокнига путешествий на заказ в Москве - индивидуальный дизайн | wedfotobook.ru",
      description: "Заказать фотокнигу путешествий в Москве - под ключ от 8 900 руб. Любая тема, от 1 экз., за 7 дней. Пришлите фото - всё сделаем сами.",
    },
    {
      pathname: "/fotokniga-s-dopolnennoj-realnostyu/",
      title: "Фотокнига с оживающими на заказ в Москве - \"под ключ\" | wedfotobook.ru",
      description: "Заказать фотокнигу с оживающими фото в Москве - под ключ от 8 900 руб. Любая тема, от 1 экз., за 7 дней. Пришлите фото - всё сделаем сами.",
    },
  ];

  for (const page of expected) {
    const response = await render(page.pathname);
    assert.equal(response.status, 200, page.pathname);
    const html = await response.text();
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]
      .replaceAll("&quot;", "\"")
      .replaceAll("&amp;", "&");
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1]
      .replaceAll("&quot;", "\"")
      .replaceAll("&amp;", "&");
    assert.equal(title, page.title, page.pathname);
    assert.equal(description, page.description, page.pathname);
  }
});

test("uses an entirely white page background only on the three legal pages", async () => {
  for (const pathname of [
    "/polzovatelskoe-soglashenie/",
    "/politika-obrabotki-personalnyh-dannyh/",
    "/soglashenie/",
  ]) {
    const html = await (await render(pathname)).text();
    assert.match(html, /class="legal-white-route"/, pathname);
    assert.match(html, /class="legacy-wordpress [^"]*legal-white-page"/, pathname);
  }

  const companyHtml = await (await render("/company/")).text();
  assert.doesNotMatch(companyHtml, /legal-white-route/);
  assert.doesNotMatch(companyHtml, /legal-white-page/);
  assert.match(firstVersionCss, /\.legacy-wordpress\.legal-white-page > \.parent-section \*[\s\S]*?background: #fff !important;[\s\S]*?background-image: none !important;/);
  assert.match(firstVersionCss, /\.legal-white-route \.restored-first-version[\s\S]*?background: #fff !important;[\s\S]*?background-image: none !important;/);
  const legalWhiteCss = firstVersionCss.slice(
    firstVersionCss.indexOf("/* Permanent rule: the three legal documents use a white canvas; their header and footers keep their own colors. */"),
    firstVersionCss.indexOf("\n.restored-first-version {", firstVersionCss.indexOf("/* Permanent rule:")),
  );
  assert.match(legalWhiteCss, /\.legal-white-route[\s\S]*?background: #fff !important;[\s\S]*?background-image: none !important;/);
  assert.doesNotMatch(legalWhiteCss, /\.navbar|\.site-footer|\.footer-/);
});

test("keeps catalog descriptions and legal labels out of heading elements", async () => {
  const homeHtml = await (await render("/")).text();
  const catalogHtml = await (await render("/katalog/")).text();
  const description = "С индивидуальным дизайном сохранит память об этом прекрасном событии!";

  assert.ok(homeHtml.includes(`<h3>Свадебная фотокнига</h3><small class="catalog-card-description">${description}</small>`));
  assert.ok(catalogHtml.includes(`<h2>Свадебная фотокнига</h2><small class="catalog-card-description">${description}</small>`));
  const homeHeadings = [...homeHtml.matchAll(/<h3\b[^>]*>[\s\S]*?<\/h3>/gi)].map((match) => match[0]);
  const catalogHeadings = [...catalogHtml.matchAll(/<h[23]\b[^>]*>[\s\S]*?<\/h[23]>/gi)].map((match) => match[0]);
  assert.ok(homeHeadings.every((heading) => !heading.includes("<small")));
  assert.ok(catalogHeadings.every((heading) => !heading.includes("<small")));
  assert.match(firstVersionCss, /\.catalog-card-description/);
  assert.match(optimizedHomeCss, /\.catalog-card-description/);
  assert.doesNotMatch(optimizedHomeCss, /\.catalog-card h3 small/);

  const termsHtml = await (await render("/polzovatelskoe-soglashenie/")).text();
  const policyHtml = await (await render("/politika-obrabotki-personalnyh-dannyh/")).text();
  const operatorDetails = "11. РЕКВИЗИТЫ ОПЕРАТОРА (ОПЕРАТОРА ПЕРСОНАЛЬНЫХ ДАННЫХ)";
  const thirdPartySubtitle = "персональных данных, передаваемых третьим лицам Оператором";
  const policySubtitle = "на основании пункта 8.1 Политики обработки и защиты персональных данных";

  assert.match(termsHtml, new RegExp(`<p[^>]*>${escapeRegExp(operatorDetails)}</p>`));
  assert.doesNotMatch(termsHtml, new RegExp(`<h[1-6][^>]*>${escapeRegExp(operatorDetails)}</h[1-6]>`));
  assert.match(policyHtml, new RegExp(`<p[^>]*>${escapeRegExp(thirdPartySubtitle)}</p>`));
  assert.match(policyHtml, new RegExp(`<p[^>]*>${escapeRegExp(policySubtitle)}</p>`));
  assert.doesNotMatch(policyHtml, new RegExp(`<h[1-6][^>]*>(?:${escapeRegExp(thirdPartySubtitle)}|${escapeRegExp(policySubtitle)})</h[1-6]>`));
});

test("uses the original contact information order with one heading and a Yandex map", async () => {
  const html = await (await render("/kontakty/")).text();
  const start = html.indexOf('<main class="contact-page">');
  const end = html.indexOf("</main>", start);
  const contactHtml = html.slice(start, end);

  assert.match(contactHtml, /class="contact-title-main">Контакты<\/span>/);
  assert.match(contactHtml, /class="contact-title-detail"><span class="contact-title-dash">—<\/span> фотокниги на заказ в Москве<\/span>/);
  assert.doesNotMatch(contactHtml, /Контактная форма/);
  assert.doesNotMatch(contactHtml, /Прямая связь/);
  assert.doesNotMatch(contactHtml, /class="contact-layout-hero"/);
  assert.match(firstVersionCss, /\.restored-first-version \.contact-info-list \{[^}]*margin-top: 0;/s);
  assert.match(firstVersionCss, /\.restored-first-version \.contact-info-item:first-child \{[^}]*border-top: 0;[^}]*padding-top: 0;/s);
  assert.equal([...contactHtml.matchAll(/Контакты/g)].length, 1);
  assert.ok(contactHtml.indexOf('class="contact-form-column"') < contactHtml.indexOf('class="contact-info-column"'));
  assert.ok(contactHtml.indexOf('class="contact-info-column"') < contactHtml.indexOf('class="company-map-section contact-map-section"'));
  assert.match(contactHtml, /name="name"/);
  assert.match(contactHtml, /name="email"/);
  assert.match(contactHtml, /name="message"/);
  assert.match(contactHtml, /Москва, Свободный проспект, д\. 33/);
  assert.match(contactHtml, /https:\/\/yandex\.ru\/map-widget\/v1\//);
  assert.match(contactHtml, /class="contact-social-whatsapp"[^>]*aria-label="WhatsApp"/);
  assert.match(firstVersionCss, /\.contact-social-whatsapp img \{[^}]*width: 37px;[^}]*height: auto;[^}]*transform: translateY\(-1px\);/s);
});

test("builds a dedicated catalog page from the home catalog cards", async () => {
  const html = await (await render("/katalog/")).text();
  const start = html.indexOf('<main class="catalog-page">');
  const end = html.indexOf("</main>", start);
  const catalogHtml = html.slice(start, end);

  assert.ok(start >= 0);
  assert.match(catalogHtml, /<h1>(?:Каталог\. )?Примеры фотокниг<\/h1>/);
  assert.match(catalogHtml, /Здесь показаны примеры фотокниг\. Мы создаем уникальные фотокниги на любые темы/);
  assert.equal([...catalogHtml.matchAll(/class="catalog-card"/g)].length, 8);
  assert.match(catalogHtml, /class="button" data-order-open="true" type="button">Заказать<\/button>/);
  assert.match(firstVersionCss, /\.legacy-wordpress\.page-id-19651 > :not\(\.navbar\) \{[^}]*display: none !important;/s);
  assert.match(firstVersionCss, /\.restored-first-version \.catalog-page \{[^}]*background: var\(--cream\);[^}]*color: var\(--text\);/s);
  assert.match(firstVersionCss, /\.restored-first-version \.catalog-page-section \{[^}]*background: var\(--cream\);/s);
});

test("builds a dedicated pricing page from the home pricing cards", async () => {
  const html = await (await render("/stoimost/")).text();
  const start = html.indexOf('<main class="pricing-page">');
  const end = html.indexOf("</main>", start);
  const pricingHtml = html.slice(start, end);

  assert.ok(start >= 0);
  assert.match(pricingHtml, /Цены на фотокниги на заказ/);
  assert.match(pricingHtml, /Цена фотокниги зависит от вида печати\./);
  assert.equal([...pricingHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 4);
  assert.match(pricingHtml, /Разные форматы/);
  assert.match(pricingHtml, /Твердая фотообложка/);
  assert.match(pricingHtml, /От 1 разворота/);
  assert.doesNotMatch(pricingHtml, /₽/);
  assert.match(pricingHtml, /class="button" data-order-open="true" type="button">Рассчитать стоимость<\/button>/);
  assert.match(firstVersionCss, /\.legacy-wordpress\.page-id-20303 > :not\(\.navbar\)/);
  assert.match(firstVersionCss, /\.restored-first-version \.pricing-page-section[\s\S]*background: var\(--cream\)/);
  assert.match(firstVersionCss, /\.restored-first-version \.pricing-page \.price-card\.featured \{[^}]*transform: none;/s);
});

test("compacts and reorders the graduation pricing page while preserving its FAQ", async () => {
  const html = await (await render("/vypusknye-fotoknigi-stoimost/")).text();
  const start = html.indexOf('<main class="pricing-detail-page pricing-detail-graduation');
  const end = html.indexOf("</main>", start);
  const pageHtml = html.slice(start, end);

  assert.ok(start >= 0);
  assert.match(pageHtml, /<span class="eyebrow">Стоимость<\/span><h1>Выпускные альбомы<\/h1>/);
  assert.doesNotMatch(pageHtml, /Стоимость · Выпускные альбомы/);
  const featureGalleryStart = pageHtml.indexOf('<div class="pricing-detail-feature-gallery"');
  const featureGalleryEnd = pageHtml.indexOf("</div>", featureGalleryStart);
  const featureGallery = pageHtml.slice(featureGalleryStart, featureGalleryEnd);
  assert.equal([...featureGallery.matchAll(/<figure/g)].length, 4);
  assert.doesNotMatch(pageHtml, /pricing-detail-gallery-section/);
  assert.match(pageHtml, /pricing-detail-options-section[\s\S]*?<span class="eyebrow">Стоимость<\/span>/);
  assert.match(pageHtml, /О выпускных фотокнигах/);
  assert.equal([...pageHtml.matchAll(/<details/g)].length, 5);
  assert.match(pageHtml, /цена за книгу от 1 500 руб\./);
  assert.doesNotMatch(pageHtml, /1 200/);
  assert.match(pageHtml, /Да, добавим индивидуальную страницу каждому ребёнку в общем дизайне книги\./);
  assert.match(firstVersionCss, /\.pricing-detail-graduation \.pricing-detail-hero::before \{[^}]*display: none;/s);
  assert.match(firstVersionCss, /\.pricing-detail-graduation \.pricing-detail-price \{[^}]*font-weight: 400;/s);
  assert.match(firstVersionCss, /\.pricing-detail-graduation \.pricing-detail-section \{[^}]*padding: clamp\(54px, 5\.5vw, 84px\) 0;/s);
  assert.match(firstVersionCss, /\.pricing-detail-graduation \.pricing-detail-faq-layout h2/);
});

test("compacts the alive photo pricing page", async () => {
  const html = await (await render("/fotoknigi-s-dopolnennoj-realnostju-stoim/")).text();
  const start = html.indexOf('<main class="pricing-detail-page pricing-detail-alive');
  const end = html.indexOf("</main>", start);
  const pageHtml = html.slice(start, end);

  assert.ok(start >= 0);
  assert.match(pageHtml, /<span class="eyebrow">Стоимость<\/span><h1>Оживающие фото<\/h1>/);
  assert.doesNotMatch(pageHtml, /Стоимость · Оживающие фото/);
  assert.match(pageHtml, /<div class="pricing-detail-price">300 руб\. за фото<\/div>/);
  assert.match(firstVersionCss, /\.pricing-detail-alive \.pricing-detail-hero::before \{[^}]*display: none;/s);
  assert.match(firstVersionCss, /\.pricing-detail-alive \.pricing-detail-price \{[^}]*font-weight: 400;/s);
  assert.match(firstVersionCss, /\.pricing-detail-alive \.pricing-detail-section \{[^}]*padding: clamp\(54px, 5\.5vw, 84px\) 0;/s);
});

test("compacts the premium pricing page and moves its four photos into characteristics", async () => {
  const html = await (await render("/fotokniga-premium/")).text();
  const start = html.indexOf('<main class="pricing-detail-page pricing-detail-book pricing-detail-fotokniga-premium">');
  const end = html.indexOf("</main>", start);
  const pageHtml = html.slice(start, end);
  const galleryStart = pageHtml.indexOf('<div class="pricing-detail-feature-gallery"');
  const galleryEnd = pageHtml.indexOf("</div>", galleryStart);
  const featureGallery = pageHtml.slice(galleryStart, galleryEnd);

  assert.ok(start >= 0);
  assert.match(pageHtml, /<span class="eyebrow">Стоимость<\/span><h1>Фотокнига Премиум<\/h1>/);
  assert.doesNotMatch(pageHtml, /Стоимость · Фотокнига Премиум/);
  assert.equal([...pageHtml.matchAll(/class="pricing-detail-feature-list"[\s\S]*?<\/ul>/g)][0][0].match(/<li/g).length, 8);
  assert.match(pageHtml, /Разные форматы/);
  assert.equal([...featureGallery.matchAll(/<figure/g)].length, 4);
  assert.doesNotMatch(pageHtml, /pricing-detail-gallery-section/);
  assert.match(pageHtml, /20 \(10 РАЗВОРОТОВ\)/);
  assert.doesNotMatch(pageHtml, /развор\./i);
  assert.match(pageHtml, /Доставка на пункт выдачи Яндекс Маркета \(350 руб\.\) или курьером в пределах МКАД\./);
  assert.match(firstVersionCss, /\.pricing-detail-fotokniga-premium \.pricing-detail-hero::before \{[^}]*display: none;/s);
  assert.match(firstVersionCss, /\.pricing-detail-fotokniga-premium \.pricing-detail-price \{[^}]*font-weight: 400;/s);
  assert.match(firstVersionCss, /\.pricing-detail-feature-list li \{[^}]*background: #fff;/s);
  assert.doesNotMatch(firstVersionCss, /\.pricing-detail-feature-list li \{[^}]*linear-gradient/s);
  assert.match(firstVersionCss, /\.pricing-detail-feature-gallery \{[^}]*grid-template-columns: repeat\(4,/s);
});

test("compacts the standard pricing page and moves its four photos into characteristics", async () => {
  const html = await (await render("/fotokniga-standart/")).text();
  const start = html.indexOf('<main class="pricing-detail-page pricing-detail-book pricing-detail-fotokniga-standart">');
  const end = html.indexOf("</main>", start);
  const pageHtml = html.slice(start, end);
  const galleryStart = pageHtml.indexOf('<div class="pricing-detail-feature-gallery"');
  const galleryEnd = pageHtml.indexOf("</div>", galleryStart);
  const featureGallery = pageHtml.slice(galleryStart, galleryEnd);

  assert.ok(start >= 0);
  assert.match(pageHtml, /<span class="eyebrow">Стоимость<\/span><h1>Фотокнига Стандарт<\/h1>/);
  assert.doesNotMatch(pageHtml, /Стоимость · Фотокнига Стандарт/);
  assert.equal([...featureGallery.matchAll(/<figure/g)].length, 4);
  assert.doesNotMatch(pageHtml, /pricing-detail-gallery-section/);
  assert.match(pageHtml, /Доставка на пункт выдачи Яндекс Маркета \(350 руб\.\) или курьером в пределах МКАД\./);
  assert.doesNotMatch(pageHtml, /Боскберри|Boxberry/i);
  assert.match(firstVersionCss, /\.pricing-detail-fotokniga-standart \.pricing-detail-hero::before \{[^}]*display: none;/s);
  assert.match(firstVersionCss, /\.pricing-detail-fotokniga-standart \.pricing-detail-price \{[^}]*font-weight: 400;/s);
  assert.match(firstVersionCss, /\.pricing-detail-fotokniga-standart \.pricing-detail-services-section \{[^}]*background: var\(--cream\);[^}]*color: var\(--ink-soft\);/s);
  assert.match(firstVersionCss, /\.pricing-detail-fotokniga-standart \.pricing-detail-services-layout h2 \{[^}]*color: var\(--ink\);/s);
  assert.match(firstVersionCss, /\.pricing-detail-fotokniga-standart \.pricing-detail-services-layout li \{[^}]*border-bottom-color: var\(--line\);[^}]*color: var\(--ink-soft\);/s);
});

test("reworks every requested catalog detail page with its exact text and adaptive gallery", async () => {
  const routes = [
    { pathname: "/detskaya-fotokniga/", slug: "detskaya-fotokniga", title: "Детская фотокнига", gallery: "children", filename: "Dety fotokniga", suffix: "wedfotobok", images: 8, text: "Детская фотокнига на заказ гарантирует индивидуальный подход", faq: "Частые вопросы о детской фотокниге" },
    { pathname: "/yubilejnaya-fotokniga/", slug: "yubilejnaya-fotokniga", title: "Фотокнига на юбилей", gallery: "anniversary", filename: "Ubiley fotokniga", suffix: "wedfotobook", images: 8, text: "Фотокнига на юбилей на заказ станет лучшим подарком", faq: null },
    { pathname: "/fotokniga-o-puteshestvii/", slug: "fotokniga-o-puteshestvii", title: "Фотокнига путешествий", gallery: "travel", filename: "Fotokniga puteshedtvij", suffix: "wedfotobook", images: 8, text: "Фотоальбом путешествий может включать не только снимки", faq: null },
    { pathname: "/vypusknye-fotoknigi/", slug: "vypusknye-fotoknigi", title: "Выпускные альбомы", gallery: "graduation", filename: "Vipusk albom", suffix: "wedfotobook", images: 12, text: "Выпускной альбом на заказ разрабатывается индивидуально", faq: "Частые вопросы о выпускных фотокнигах" },
    { pathname: "/genealogicheskaya-fotokniga/", slug: "genealogicheskaya-fotokniga", title: "Родословная фотокнига", gallery: "genealogy", filename: "Fotokniga genealogia", suffix: "wedfotobook", images: 12, text: "Родословная (генеалогическая) фотокнига на заказ позволяет объединить", faq: null },
    { pathname: "/fotokniga-na-lyubuyu-temu/", slug: "fotokniga-na-lyubuyu-temu", title: "Фотокнига на любую тему", gallery: "custom", filename: "Fotokbiga drugaj", suffix: "wedfotobook", images: 8, text: "Корпоративная фотокнига станет стильным подарком", faq: null },
    { pathname: "/fotokniga-s-dopolnennoj-realnostyu/", slug: "fotokniga-s-dopolnennoj-realnostyu", title: "Фотокнига с оживающими фото", gallery: "alive", filename: "Alive foto", suffix: "wedfotobook", images: 2, text: "Если видео нет, не страшно, мы оживим фото с помощью ИИ", faq: null },
  ];

  for (const route of routes) {
    const { pathname, slug, title, gallery, filename, suffix, images, text, faq } = route;
    const html = await (await render(pathname)).text();
    const start = html.indexOf(`<main class="catalog-detail-page catalog-story-page catalog-story-page-${slug}">`);
    const end = html.indexOf("</main>", start);
    const pageHtml = html.slice(start, end);

    assert.ok(start >= 0, pathname);
    assert.ok(pageHtml.includes(`<h1>${title}</h1>`), pathname);
    assert.match(pageHtml, /class="catalog-detail-hero"/, pathname);
    assert.match(pageHtml, /class="button" data-order-open="true" type="button">Рассчитать стоимость<\/button>/, pathname);
    assert.match(pageHtml, /class="catalog-story-section"/, pathname);
    assert.ok(pageHtml.includes(text), pathname);
    const normalizedAssetPaths = normalizeMediaPaths(pageHtml);
    const galleryAssets = new Set(
      [...normalizedAssetPaths.matchAll(new RegExp(`/media/gallery/${gallery}/${filename} \\d+ ${suffix} ru\\.webp`, "g"))]
        .map((match) => match[0]),
    );
    assert.equal(galleryAssets.size, images, pathname);
    assert.match(pageHtml, /data-order-open="true"/, pathname);
    assert.match(pageHtml, /<img[^>]+width="720"[^>]+height="720"/, pathname);
    const storyIndex = pageHtml.indexOf("catalog-story-section");
    const trustIndex = pageHtml.indexOf("Почему нам можно доверять?");
    const pricingIndex = pageHtml.indexOf("Хотите узнать стоимость фотокниги?");
    const sevenDaysIndex = pageHtml.indexOf("Семь простых шагов");
    assert.ok(storyIndex < trustIndex && trustIndex < pricingIndex && pricingIndex < sevenDaysIndex, pathname);
    if (faq) {
      assert.ok(sevenDaysIndex < pageHtml.indexOf(faq), pathname);
    } else {
      assert.doesNotMatch(pageHtml, /class="section catalog-story-faq-section"/, pathname);
    }
    if (slug === "fotokniga-s-dopolnennoj-realnostyu") {
      assert.match(pageHtml, /Фотокнига «Стандарт»[\s\S]*?Разные форматы/);
      for (const feature of ["Связываем фото и видео", "Эффект дополненной реальности", "Работает со смартфона", "Можно оживить фото с ИИ"]) {
        assert.match(pageHtml, new RegExp(feature));
      }
      assert.match(pageHtml, /<span class="step-number">0(?:<!-- -->)?4<\/span>[\s\S]*?<h3>Согласование макета<\/h3><p>Присылаем макет, вносим правки до вашего полного одобрения\.<\/p>/);
    }
  }

  assert.match(firstVersionCss, /\.catalog-detail-route \.legacy-wordpress > :not\(\.navbar\)/);
  assert.match(firstVersionCss, /\.restored-first-version \.catalog-story-chapter/);
  assert.match(firstVersionCss, /\.restored-first-version \.catalog-story-gallery\.gallery-count-3/);
  assert.match(firstVersionCss, /\.restored-first-version \.catalog-story-page \.section-seven-days \{[^}]*background: var\(--(?:cream|paper)\);/s);

  const childrenHtml = await (await render("/detskaya-fotokniga/")).text();
  const childrenStart = childrenHtml.indexOf('<main class="catalog-detail-page catalog-story-page catalog-story-page-detskaya-fotokniga">');
  const childrenPageHtml = childrenHtml.slice(childrenStart, childrenHtml.indexOf("</main>", childrenStart));
  const normalizedChildrenHtml = normalizeMediaPaths(childrenPageHtml);
  assert.ok(normalizedChildrenHtml.indexOf("Dety fotokniga 5 wedfotobok ru.webp") < normalizedChildrenHtml.indexOf("Dety fotokniga 7 wedfotobok ru.webp"));
  assert.ok(normalizedChildrenHtml.indexOf("Dety fotokniga 4 wedfotobok ru.webp") > normalizedChildrenHtml.indexOf("Dety fotokniga 6 wedfotobok ru.webp"));
  assert.equal([...childrenPageHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 3);
  assert.doesNotMatch(childrenPageHtml, /Выпускные альбомы/);
  assert.match(childrenPageHtml, /Фотокнига «Стандарт»[\s\S]*?Разные форматы/);
  for (const feature of ["Связываем фото и видео", "Эффект дополненной реальности", "Работает со смартфона", "Можно оживить фото с ИИ"]) {
    assert.match(childrenPageHtml, new RegExp(feature));
  }
  assert.match(childrenPageHtml, /<span class="step-number">0(?:<!-- -->)?4<\/span>[\s\S]*?<h3>Согласование макета<\/h3><p>Присылаем макет, вносим правки до вашего полного одобрения\.<\/p>/);
  assert.match(firstVersionCss, /\.catalog-story-page-detskaya-fotokniga \.price-card\.featured,/);

  const anniversaryHtml = await (await render("/yubilejnaya-fotokniga/")).text();
  const anniversaryStart = anniversaryHtml.indexOf('<main class="catalog-detail-page catalog-story-page catalog-story-page-yubilejnaya-fotokniga">');
  const anniversaryPageHtml = anniversaryHtml.slice(anniversaryStart, anniversaryHtml.indexOf("</main>", anniversaryStart));
  assert.equal([...anniversaryPageHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 3);
  assert.doesNotMatch(anniversaryPageHtml, /Выпускные альбомы/);
  assert.match(anniversaryPageHtml, /Фотокнига «Стандарт»[\s\S]*?Разные форматы/);
  for (const feature of ["Связываем фото и видео", "Эффект дополненной реальности", "Работает со смартфона", "Можно оживить фото с ИИ"]) {
    assert.match(anniversaryPageHtml, new RegExp(feature));
  }
  assert.match(anniversaryPageHtml, /<span class="step-number">0(?:<!-- -->)?4<\/span>[\s\S]*?<h3>Согласование макета<\/h3><p>Присылаем макет, вносим правки до вашего полного одобрения\.<\/p>/);
  assert.match(firstVersionCss, /\.catalog-story-page-yubilejnaya-fotokniga \.price-card\.featured,/);

  const travelHtml = await (await render("/fotokniga-o-puteshestvii/")).text();
  const travelStart = travelHtml.indexOf('<main class="catalog-detail-page catalog-story-page catalog-story-page-fotokniga-o-puteshestvii">');
  const travelPageHtml = travelHtml.slice(travelStart, travelHtml.indexOf("</main>", travelStart));
  assert.equal([...travelPageHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 3);
  assert.doesNotMatch(travelPageHtml, /Выпускные альбомы/);
  assert.match(travelPageHtml, /Фотокнига «Стандарт»[\s\S]*?Разные форматы/);
  for (const feature of ["Связываем фото и видео", "Эффект дополненной реальности", "Работает со смартфона", "Можно оживить фото с ИИ"]) {
    assert.match(travelPageHtml, new RegExp(feature));
  }
  assert.match(travelPageHtml, /<span class="step-number">0(?:<!-- -->)?4<\/span>[\s\S]*?<h3>Согласование макета<\/h3><p>Присылаем макет, вносим правки до вашего полного одобрения\.<\/p>/);
  assert.match(firstVersionCss, /\.catalog-story-page-fotokniga-o-puteshestvii \.price-card\.featured,/);

  const genealogyHtml = await (await render("/genealogicheskaya-fotokniga/")).text();
  const genealogyStart = genealogyHtml.indexOf('<main class="catalog-detail-page catalog-story-page catalog-story-page-genealogicheskaya-fotokniga">');
  const genealogyPageHtml = genealogyHtml.slice(genealogyStart, genealogyHtml.indexOf("</main>", genealogyStart));
  assert.equal([...genealogyPageHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 3);
  assert.doesNotMatch(genealogyPageHtml, /Выпускные альбомы/);
  assert.match(genealogyPageHtml, /Фотокнига «Стандарт»[\s\S]*?Разные форматы/);
  for (const feature of ["Связываем фото и видео", "Эффект дополненной реальности", "Работает со смартфона", "Можно оживить фото с ИИ"]) {
    assert.match(genealogyPageHtml, new RegExp(feature));
  }
  assert.match(genealogyPageHtml, /<span class="step-number">0(?:<!-- -->)?4<\/span>[\s\S]*?<h3>Согласование макета<\/h3><p>Присылаем макет, вносим правки до вашего полного одобрения\.<\/p>/);
  assert.match(firstVersionCss, /\.catalog-story-page-genealogicheskaya-fotokniga \.price-card\.featured,/);

  const otherBooksHtml = await (await render("/fotokniga-na-lyubuyu-temu/")).text();
  const otherBooksStart = otherBooksHtml.indexOf('<main class="catalog-detail-page catalog-story-page catalog-story-page-fotokniga-na-lyubuyu-temu">');
  const otherBooksPageHtml = otherBooksHtml.slice(otherBooksStart, otherBooksHtml.indexOf("</main>", otherBooksStart));
  assert.equal([...otherBooksPageHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 3);
  assert.doesNotMatch(otherBooksPageHtml, /Выпускные альбомы/);
  assert.match(otherBooksPageHtml, /Фотокнига «Стандарт»[\s\S]*?Разные форматы/);
  for (const feature of ["Связываем фото и видео", "Эффект дополненной реальности", "Работает со смартфона", "Можно оживить фото с ИИ"]) {
    assert.match(otherBooksPageHtml, new RegExp(feature));
  }
  assert.match(otherBooksPageHtml, /<span class="step-number">0(?:<!-- -->)?4<\/span>[\s\S]*?<h3>Согласование макета<\/h3><p>Присылаем макет, вносим правки до вашего полного одобрения\.<\/p>/);
  assert.match(firstVersionCss, /\.catalog-story-page-fotokniga-na-lyubuyu-temu \.price-card\.featured,/);
  assert.match(firstVersionCss, /\.catalog-story-page-fotokniga-s-dopolnennoj-realnostyu \.price-card\.featured \{[^}]*transform: none;/s);

  const graduationHtml = await (await render("/vypusknye-fotoknigi/")).text();
  const graduationStart = graduationHtml.indexOf('<main class="catalog-detail-page catalog-story-page catalog-story-page-vypusknye-fotoknigi">');
  const graduationPageHtml = graduationHtml.slice(graduationStart, graduationHtml.indexOf("</main>", graduationStart));
  const graduationPricingStart = graduationPageHtml.indexOf('<section class="section section-warm">');
  const graduationPricingHtml = graduationPageHtml.slice(graduationPricingStart, graduationPageHtml.indexOf('<section class="section section-seven-days">', graduationPricingStart));
  assert.equal([...graduationPricingHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 1);
  assert.match(graduationPricingHtml, /class="pricing-grid pricing-grid-one"/);
  assert.match(graduationPricingHtml, /<h3>Выпускные альбомы<\/h3>/);
  assert.doesNotMatch(graduationPricingHtml, /Фотокнига «Премиум»|Фотокнига «Стандарт»|Фотокниги с оживающими фото/);
  assert.doesNotMatch(graduationPricingHtml, /Чаще выбирают/);
  assert.match(graduationPageHtml, /<span class="step-number">0(?:<!-- -->)?4<\/span>[\s\S]*?<h3>Согласование макета<\/h3><p>Присылаем макет, вносим правки до вашего полного одобрения\.<\/p>/);
  assert.match(graduationPageHtml, /цена за книгу от 1 500 ₽\./);
  assert.doesNotMatch(graduationPageHtml, /1 200/);
  assert.match(firstVersionCss, /\.catalog-story-page-vypusknye-fotoknigi \.pricing-grid-one \.price-card \{[^}]*grid-template-columns: minmax\(0, 1\.15fr\) minmax\(320px, \.85fr\);/s);
  assert.match(
    firstVersionCss,
    /\.catalog-story-page-vypusknye-fotoknigi \.pricing-grid-one \.price-card > picture \{[^}]*display: block !important;[^}]*height: 100%;/s,
  );
});

test("reworks only the wedding photobook page while preserving its hero and FAQ", async () => {
  const html = await (await render("/wedding-fotoknig/")).text();
  const start = html.indexOf('<main class="catalog-detail-page wedding-detail-page">');
  const end = html.indexOf("</main>", start);
  const pageHtml = html.slice(start, end);

  assert.ok(start >= 0);
  assert.match(pageHtml, /class="catalog-detail-hero"/);
  assert.match(pageHtml, /<h1>Свадебная фотокнига<\/h1>/);
  assert.match(pageHtml, /class="button" data-order-open="true" type="button">Рассчитать стоимость<\/button>/);
  assert.match(pageHtml, /История вашей свадьбы в книге с индивидуальным дизайном\./);
  const normalizedAssetPaths = normalizeMediaPaths(pageHtml);
  assert.match(normalizedAssetPaths, /\/media\/originals\/22954\.jpg/);
  assert.match(pageHtml, /Свадебная фотокнига(?:&nbsp;|\u00a0)—(?:&nbsp;|\u00a0)это не просто альбом с фотографиями, а настоящая история любви/);
  assert.match(pageHtml, /Наши дизайнеры знают, как выстроить повествование так, чтобы каждая страница раскрывала отдельную главу/);
  assert.match(pageHtml, /Свадебная фотокнига на заказ создаётся с учётом всех ваших пожеланий\./);
  const weddingAssets = new Set(
    [...normalizedAssetPaths.matchAll(/\/media\/gallery\/wedding\/Svadba fotokniga \d+ wedfotobook ru\.webp/g)]
      .map((match) => match[0]),
  );
  assert.equal(weddingAssets.size, 12);

  const storyIndex = pageHtml.indexOf("wedding-story-section");
  const trustIndex = pageHtml.indexOf("Почему нам можно доверять?");
  const pricingIndex = pageHtml.indexOf("Хотите узнать стоимость фотокниги?");
  const sevenDaysIndex = pageHtml.indexOf("Семь простых шагов");
  const faqIndex = pageHtml.indexOf("Частые вопросы о свадебной фотокниге");
  assert.ok(storyIndex < trustIndex && trustIndex < pricingIndex && pricingIndex < sevenDaysIndex && sevenDaysIndex < faqIndex);
  assert.equal([...pageHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 3);
  assert.doesNotMatch(pageHtml, /Выпускные альбомы/);
  assert.match(pageHtml, /Фотокнига «Стандарт»[\s\S]*?Разные форматы/);
  for (const feature of ["Связываем фото и видео", "Эффект дополненной реальности", "Работает со смартфона", "Можно оживить фото с ИИ"]) {
    assert.match(pageHtml, new RegExp(feature));
  }
  assert.match(pageHtml, /<span class="step-number">0(?:<!-- -->)?4<\/span>[\s\S]*?<h3>Согласование макета<\/h3><p>Присылаем макет, вносим правки до вашего полного одобрения\.<\/p>/);
  assert.match(pageHtml, /Сколько фотографий нужно для свадебной фотокниги\?/);
  assert.match(pageHtml, /Можно ли заказать дополнительные копии для родителей\?/);
  assert.match(pageHtml, /Да, печатаем любое количество копий той же книги — это частый заказ для родителей\. Начиная со второго экземпляра скидка 30%\./);
  assert.doesNotMatch(pageHtml, /Стоимость копий уточним при заказе\./);
  assert.doesNotMatch(pageHtml, /День свадьбы — это история, которую хочется пересматривать снова и снова\./);
  assert.match(pageHtml, /class="section section-seven-days"/);
  assert.match(firstVersionCss, /\.restored-first-version \.wedding-story-chapter/);
  assert.match(firstVersionCss, /\.restored-first-version \.wedding-faq-content \.wfb-faq/);
  assert.match(firstVersionCss, /\.restored-first-version \.wedding-detail-page \.section-seven-days,[\s\S]*?background: var\(--cream\);/);
  assert.match(firstVersionCss, /\.restored-first-version \.pricing-grid-three \{[^}]*grid-template-columns: repeat\(3, 1fr\);/s);
  assert.match(firstVersionCss, /\.restored-first-version \.wedding-detail-page \.price-card\.featured,/);
});

test("uses the catalog genealogy name while preserving the supplied article title", async () => {
  const html = await (await render("/genealogicheskaya-fotokniga/")).text();
  const start = html.indexOf('<main class="catalog-detail-page catalog-story-page catalog-story-page-genealogicheskaya-fotokniga">');
  const end = html.indexOf("</main>", start);
  const pageHtml = html.slice(start, end);

  assert.match(pageHtml, /<h1>Родословная фотокнига<\/h1>/);
  assert.doesNotMatch(pageHtml, /<h1>Генеалогическое древо/);

  for (const pathname of ["/", "/katalog/"]) {
    const routeHtml = await (await render(pathname)).text();
    assert.match(routeHtml, /Родословная фотокнига/, pathname);
    assert.doesNotMatch(routeHtml, /Родословная книга|Родословные фотокниги/, pathname);
  }

  const articleHtml = await (await render("/article-genealogy/")).text();
  const articleStart = articleHtml.indexOf('<main class="article-page article-page-1">');
  const articleMain = articleHtml.slice(articleStart, articleHtml.indexOf("</main>", articleStart));
  assert.match(articleMain, /<h1>Родословная книга – идеальный подарок и семейная реликвия<\/h1>/);
});

test("renders all supplied articles without bold or italic article text", async () => {
  const expectedText = new Map([
    ["/article-genealogy/", "Фотокнига, в которой собраны снимки разных поколений"],
    ["/article-vipysk/", "Кажется, будто 11 лет — это целая эпоха"],
    ["/article-travell/", "После путешествия остаётся не только багаж впечатлений"],
    ["/article-alivefoto/", "Ещё недавно идея, что фотография может «ожить»"],
    ["/article-otziv/", "Отзывы клиентов о WedFotoBook"],
    ["/statya-6-fotoknigi-na-zakaz-wedfotobook-ru/", "Какие фотокниги можно заказать"],
    ["/article-wedding/", "Свадебная фотокнига: мгновения, которые останутся навсегда"],
    ["/article-children/", "Детская фотокнига: история взросления в каждом кадре"],
    ["/article-anniversary/", "Фотокнига к юбилею — способ с любовью оглянуться на пройденный путь"],
  ]);

  for (const pathname of articleRoutes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    const start = html.indexOf('<main class="article-page');
    const articleHtml = html.slice(start, html.indexOf("</main>", start));
    assert.ok(start >= 0, pathname);
    assert.match(articleHtml, new RegExp(expectedText.get(pathname).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), pathname);
    assert.match(articleHtml, /Опубликовано <time[^>]*>25 августа 2026 г\.<\/time>/, pathname);
    assert.doesNotMatch(articleHtml, /Обновлено/, pathname);
    assert.doesNotMatch(articleHtml, /<\/?(?:strong|b|em|i)\b/i, pathname);
    assert.doesNotMatch(articleHtml, /PickPoint|Boxberry/i, pathname);
  }

  const blogHtml = await (await render("/blog_fotoknigi/")).text();
  const blogStart = blogHtml.indexOf('<main class="blog-page">');
  const blogMain = blogHtml.slice(blogStart, blogHtml.indexOf("</main>", blogStart));
  assert.doesNotMatch(blogMain, /class="blog-hero"/);
  assert.doesNotMatch(blogMain, /материалов/i);
  assert.match(blogMain, /class="section-kicker">Статьи<\/span><h1>Блог о фотокнигах<\/h1>/);
  assert.equal([...blogMain.matchAll(/class="blog-card"/g)].length, 9);
  assert.doesNotMatch(blogMain, /blog-card-featured/);
  assert.match(firstVersionCss, /\.blog-section-heading \.section-kicker \{[^}]*color: var\(--gold\);/s);
  assert.match(blogMain, /href="\/article-wedding\/"/);
  assert.match(blogMain, /href="\/article-children\/"/);
  assert.match(blogMain, /href="\/article-anniversary\/"/);
  assert.match(firstVersionCss, /\.restored-first-version \.article-page \*,?[\s\S]*?font-style: normal !important;[\s\S]*?font-weight: 400 !important;/);
});

test("uses the homepage palette across the reviews page", async () => {
  const html = await (await render("/otzyvy/")).text();
  assert.match(html, /class="reviews-gallery-section"/);
  assert.match(html, /class="reviews-copy-section"/);
  assert.match(firstVersionCss, /\.legacy-wordpress\.page-id-19634 \.reviews-gallery-section \{\s*background: #f7f3ed;/);
  assert.match(firstVersionCss, /\.legacy-wordpress\.page-id-19634 \.reviews-copy-section \{[^}]*background: #fffdf9;/s);
  assert.match(firstVersionCss, /\.reviews-gallery-section > h1 \{[^}]*color: #071d30 !important;/s);
  assert.match(firstVersionCss, /\.reviews-gallery-section \.fiv-inner \{[^}]*border: 1px solid #dcd7cf !important;[^}]*background: #fff !important;[^}]*box-shadow:/s);
  assert.match(firstVersionCss, /\.reviews-copy-section > p \{[^}]*color: #12334d !important;/s);
});

test("shows the visit warning below every Yandex map", async () => {
  for (const pathname of ["/company/", "/kontakty/"]) {
    const html = await (await render(pathname)).text();
    const mainClass = pathname === "/company/" ? "company-page" : "contact-page";
    const mainStart = html.indexOf(`<main class="${mainClass}">`);
    const pageHtml = html.slice(mainStart, html.indexOf("</main>", mainStart));
    const mapIndex = pageHtml.indexOf("https://yandex.ru/map-widget/v1/");
    const noticeIndex = pageHtml.indexOf("Пожалуйста, не приезжайте без предварительного звонка.");
    assert.ok(mapIndex >= 0, pathname);
    assert.ok(noticeIndex > mapIndex, pathname);
    assert.equal([...pageHtml.matchAll(/Пожалуйста, не приезжайте без предварительного звонка\./g)].length, 1, pathname);
    if (pathname === "/company/") {
      assert.match(pageHtml, /class="company-story"><h2>О нас<\/h2>/);
    }
  }

});

test("keeps the original opening screen and restores the first working version below it", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'self'/);
  assert.doesNotMatch(response.headers.get("content-security-policy") ?? "", /unsafe-eval/);
  assert.doesNotMatch(response.headers.get("content-security-policy") ?? "", /cloudflare|turnstile/i);
  assert.match(nextConfigSource, /process\.env\.NODE_ENV === "development" \? " 'unsafe-eval'" : ""/);
  assert.equal(response.headers.get("cache-control"), "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");

  const html = await response.text();
  // The compact first-screen CSS travels with the compressed HTML and does not
  // require an additional render-blocking request.
  assert.ok(Buffer.byteLength(html, "utf8") < 300_000, "homepage HTML must stay below 300 KB");
  assert.ok(gzipSync(html).length < 55_000, "compressed homepage HTML must stay below 55 KB");
  assert.doesNotMatch(optimizedHomeCss, /\*\{transition-duration:/, "the legacy universal transition must stay removed");
  const normalizedHtml = normalizeMediaPaths(html);
  assert.match(html, /От вас только фото/);
  assert.match(headerCss, /\.vc_custom_1777448124380 > \.hcode-column-1 ul > li::before \{[\s\S]*?color: #b99769;[\s\S]*?content: "✓";/);
  assert.match(html, /Сделаем дизайн и согласуем макет/);
  assert.match(html, /Мы увеличиваем размеры маленьких снимков с помощью ИИ\./);
  assert.match(html, /Безлимитные правки до вашего/);
  assert.match(html, /Вы работаете с юр\. лицами\?/);
  const homepagePhotos = [
    "/media/originals/22969.jpg",
    "/media/originals/22962.jpg",
    "/media/home/Dizain fotoknigi wedfotobook ru.webp",
    "/media/originals/22967.jpg",
    "/media/home/Print fotoknig wedfotobook ru.webp",
    "/media/home/Fotokniga alive photo blok wedfotobook ru.webp",
    "/media/originals/22963.jpg",
    "/media/originals/22964.jpg",
    "/media/home/Vipusk albom stoimost wedfotobook ru.webp",
    "/media/home/Fotokniga alive photo stoimost wedfotobook ru.webp",
  ];
  for (const photo of homepagePhotos) assert.ok(normalizedHtml.includes(photo), photo);
  assert.doesNotMatch(normalizedHtml, /\/media\/optimized\/(?:home|covers)\//);
  assert.doesNotMatch(html, /wp-content\/uploads\/2026\/04\/001-1-1-optimized\.jpg/);
  assert.match(html, /class="navbar navbar-default/);
  assert.match(html, /href="\/katalog\/" data-redirect-url="\/katalog\/"/);
  assert.match(html, /href="\/stoimost\/" data-redirect-url="\/stoimost\/"/);
  assert.doesNotMatch(html, /href="#collapse[2-5]" data-redirect-url=/);
  assert.doesNotMatch(html, /<footer class="bg-light-gray2 hcode-main-footer/);
  assert.doesNotMatch(html, /class="pad2/);
  assert.match(html, /class="restored-first-version"/);
  assert.match(html, /<style data-home-styles>/);
  const restoredHtml = html.slice(html.indexOf('class="restored-first-version"'));
  const footerHtml = restoredHtml.slice(restoredHtml.indexOf('<footer class="site-footer">'), restoredHtml.indexOf("</footer>") + "</footer>".length);
  assert.equal([...footerHtml.matchAll(/<a\b/g)].length, 30);
  assert.match(footerHtml, /Адрес: Москва, Свободный проспект, д\. 33/);
  assert.ok(footerHtml.indexOf("Адрес: Москва, Свободный проспект, д. 33") < footerHtml.indexOf("Режим работы: с 9 до 21, без выходных"));
  assert.match(footerHtml, /class="footer-contact-card"/);
  assert.match(restoredHtml, /class="price-card featured"/);
  assert.match(restoredHtml, /class="price-badge"/);
  const homePricingStart = restoredHtml.indexOf('<section class="section section-warm">', restoredHtml.indexOf("Почему нам можно доверять?"));
  const homePricingHtml = restoredHtml.slice(homePricingStart, restoredHtml.indexOf('<section class="section section-seven-days">', homePricingStart));
  assert.equal([...homePricingHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 4);
  assert.match(homePricingHtml, /Фотокнига «Стандарт»[\s\S]*?Разные форматы/);
  for (const feature of ["Связываем фото и видео", "Эффект дополненной реальности", "Работает со смартфона", "Можно оживить фото с ИИ"]) {
    assert.match(homePricingHtml, new RegExp(feature));
  }
  assert.match(restoredHtml, /class="section home-trust-section"/);
  assert.match(firstVersionCss, /\.original-home-sections \.home-trust-section \{[^}]*background: var\(--cream\);/s);
  assert.match(firstVersionCss, /\.original-home-sections \.pricing-grid \.price-card\.featured \{[^}]*transform: none;/s);
  assert.match(restoredHtml, /class="faq-intro"><span class="eyebrow"/);
  assert.match(restoredHtml, /Как мы делаем фотокниги\?/);
  assert.match(restoredHtml, /Фотокнига — это больше, чем просто фотографии/);
  assert.match(restoredHtml, /Хотите узнать стоимость фотокниги(?: до начала работы)?\?/);
  assert.match(restoredHtml, /15\. Вы работаете с юр\. лицами\?/);
  assert.match(restoredHtml, /1\. Есть ли у вас конструктор по созданию фотокниг\?/);
  assert.match(restoredHtml, /Конструктора у нас нет\. Все макеты делаются дизайнерами вручную, без шаблонов, только с индивидуальным дизайном\./);
  assert.ok(restoredHtml.indexOf("4. Сколько стоит добавить тексты в фотокнигу?") < restoredHtml.indexOf("5. Что нужно при заказе фотокниги у вас?"));
  assert.match(restoredHtml, /Обычно на создание и печать фотокниги уходит 7 дней\./);
  assert.match(restoredHtml, /сделать закрывающие документы\./);
  assert.doesNotMatch(restoredHtml, /class="section section-ink alive-section"/);
  assert.match(restoredHtml, /class="review-carousel"/);
  assert.match(restoredHtml, /id="review-carousel-track" class="review-carousel-track"/);
  assert.match(normalizeMediaPaths(restoredHtml), /\/media\/reviews-selected\/Otziv o fotoknige 01 wedfotobook\.webp/);
  assert.match(restoredHtml, /aria-controls="review-carousel-track"[^>]*><span aria-hidden="true">←<\/span><span>Назад<\/span>/);
  assert.match(restoredHtml, /aria-controls="review-carousel-track"[^>]*><span aria-hidden="true">→<\/span><span>Далее<\/span>/);
  assert.doesNotMatch(restoredHtml, /class="review-strip"/);
  assert.ok(restoredHtml.indexOf("Как проходит заказ") < restoredHtml.indexOf("Отзывы о фотокнигах"));
  assert.match(restoredHtml, /class="craft-number">01<\/span><h3>Профессиональная обработка фотографий<\/h3>/);
  assert.match(restoredHtml, /class="footer-heading-link" href="\/katalog\/"><strong>Каталог<\/strong><\/a>/);
  assert.match(restoredHtml, /class="footer-heading-link" href="\/stoimost\/"><strong>Стоимость<\/strong><\/a>/);
  assert.match(restoredHtml, /class="footer-subheading"><a class="footer-heading-link" href="\/company\/"><strong>Сервисы<\/strong><\/a>/);
  assert.match(restoredHtml, /class="footer-service-links"><a href="\/company\/">О компании<\/a>/);
  assert.match(restoredHtml, /class="footer-heading-link" href="\/polzovatelskoe-soglashenie\/"><strong>Соглашения<\/strong><\/a>/);
  assert.match(restoredHtml, /ИНН 772008137237(?:<br\s*\/>|&nbsp;|\u00a0)ОГРНИП(?:\s|&nbsp;|\u00a0)325774600377441/);
  assert.match(restoredHtml, /class="footer-socials"/);
  assert.match(normalizedHtml, /\/media\/brand\/Logo wedfotobook\.png/);
  const normalizedRestoredHtml = normalizeMediaPaths(restoredHtml);
  assert.match(normalizedRestoredHtml, /\/media\/optimized\/social\/yandex-64\.webp/);
  assert.match(normalizedRestoredHtml, /\/media\/optimized\/social\/vk-64\.webp/);
  assert.match(normalizedRestoredHtml, /\/media\/optimized\/social\/telegram-64\.webp/);
  assert.match(normalizedRestoredHtml, /\/media\/optimized\/social\/whatsapp-64\.webp/);
  assert.match(normalizedRestoredHtml, /\/media\/optimized\/social\/max-64\.webp/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">От снимков к семейной реликвии<\/span><h2>Как мы делаем фотокниги\?<\/h2><\/div><p>Каждый этап выполняют люди — от отбора фотографий и дизайна до финальной проверки перед печатью\.<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow eyebrow-light">Каталог<\/span><h2>Какие фотокниги мы делаем\? Любые!<\/h2><\/div><p>Свадьба, первый год малыша, юбилей, выпускной или путешествие — мы создадим фотокнигу для любого события\.<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">Стоимость<\/span><h2(?: class="pricing-question-title")?>Хотите узнать стоимость фотокниги(?: до начала работы)?\?<\/h2><\/div><p>Можем сделать фотокнигу в кожаной или тканевой обложке<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">Почему нам доверяют<\/span><h2>Почему нам можно доверять\?<\/h2><\/div><p>Вы видите будущую книгу ещё до оплаты и участвуете в создании ровно настолько, насколько хотите\.<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">Семь простых шагов<\/span><h2>Как проходит заказ<\/h2><\/div><p>Вся работа ведется онлайн, без поездок в офис и долгих встреч<\/p>/);
  assert.match(restoredHtml, /class="step-number">0(?:<!-- -->)?1<\/span>/);
  assert.match(restoredHtml, /class="step-number">0(?:<!-- -->)?7<\/span>/);
  assert.doesNotMatch(restoredHtml, /class="step-number">0(?:<!-- -->)?8<\/span>/);
  const stepsHtml = restoredHtml.slice(restoredHtml.indexOf('<ol class="steps-grid">'), restoredHtml.indexOf("</ol>", restoredHtml.indexOf('<ol class="steps-grid">')));
  assert.doesNotMatch(stepsHtml, /Консультация/);
  assert.ok(stepsHtml.indexOf("Оплата") < stepsHtml.indexOf("Печать"));
  assert.match(stepsHtml, /<span class="step-number">0(?:<!-- -->)?4<\/span>[\s\S]*?<h3>Согласование макета<\/h3><p>Присылаем макет, вносим правки до вашего полного одобрения\.<\/p>/);
  assert.match(restoredHtml, /<button class="button" data-order-open="true" type="button">Заказать<\/button>/);
  assert.match(restoredHtml, /section-reviews/);
  assert.match(restoredHtml, /class="section section-reviews section-ink"/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow reviews-eyebrow">Отзывы<\/span><h2>Отзывы о фотокнигах<\/h2><\/div><p>Сохраняем живые отзывы клиентов без пересказа и редакторских правок\.<\/p>/);
  assert.match(firstVersionCss, /\.restored-first-version \.section-reviews \{[^}]*background: #fff;/s);
  assert.match(firstVersionCss, /\.original-home-sections \.section-reviews \.reviews-eyebrow \{[^}]*color: var\(--gold\);/s);
  assert.match(restoredHtml, /<span class="eyebrow">Частые вопросы<\/span><h2>Остались вопросы\?<\/h2>/);
  assert.match(restoredHtml, /Прислать фотографии на ватсап, телеграмм, макс, почту 79854342367@yandex\.ru или ссылку на яндекс диск\/Мейл облако\. Согласовать макет\. Забрать фотокнигу в удобном пункте Яндекс маркета\. Все остальное мы сделаем за вас!/);
});

test("keeps all internal navigation local and resolves known legacy aliases", async () => {
  const snapshots = JSON.parse(await readFile(new URL("../data/rendered-pages.json", import.meta.url), "utf8"));
  const routeSet = new Set([
    ...snapshots.map((page) => `/${page.slug ? `${page.slug}/` : ""}`),
    ...articleRoutes,
    "/privacy-policy/",
  ]);
  const checkedPaths = new Set(["/"]);

  for (const page of snapshots) {
    const response = await render(page.slug ? `/${page.slug}/` : "/");
    assert.equal(response.status, 200, page.slug || "/");
    const html = await response.text();
    const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");
    assert.match(html, /class="navbar navbar-default/, page.slug || "/");
    assert.match(html, page.slug ? /home-original-fix\.css\?v=\d+/ : /<style data-home-styles>/, page.slug || "/");
    assert.doesNotMatch(html, /<a\b[^>]*href=["']https?:\/\/(?:www\.)?wedfotobook\.ru/i, page.slug || "/");
    assert.match(normalizeMediaPaths(visibleHtml), /\/media\/(?:brand\/Logo wedfotobook\.png|optimized\/brand\/logo-256\.webp)/, page.slug || "/");
    assert.doesNotMatch(visibleHtml, /(?:icon6-optimized|icos[135]-optimized|logotip_max\.svg_|telegram_2019_logo|whatsapp\.svg_)/, page.slug || "/");
    assert.match(visibleHtml, /class="restored-first-version"/, page.slug || "/");
    const sharedFooter = visibleHtml.slice(visibleHtml.indexOf('<footer class="site-footer">'), visibleHtml.indexOf("</footer>", visibleHtml.indexOf('<footer class="site-footer">')) + "</footer>".length);
    assert.equal([...sharedFooter.matchAll(/<a\b/g)].length, 30, page.slug || "/");
    assert.ok(sharedFooter.indexOf("Адрес: Москва, Свободный проспект, д. 33") < sharedFooter.indexOf("Режим работы: с 9 до 21, без выходных"), page.slug || "/");

    for (const match of html.matchAll(/href=["'](\/[^"']*)["']/gi)) {
      const pathname = match[1].split(/[?#]/, 1)[0];
      if (!pathname || pathname.startsWith("//") || pathname.startsWith("/_next/") || pathname.startsWith("/wp-content/") || pathname.startsWith("/wp-assets/") || pathname.startsWith("/media/") || pathname.startsWith("/author/") || /\.[a-z0-9]{2,5}$/i.test(pathname)) continue;
      checkedPaths.add(pathname.endsWith("/") ? pathname : `${pathname}/`);
    }
  }

  for (const pathname of checkedPaths) assert.ok(routeSet.has(pathname), `Missing internal route: ${pathname}`);

  const homeHtml = await (await render()).text();
  assert.match(homeHtml, /href="\/fotokniga-s-dopolnennoj-realnostyu\/"/);
  assert.doesNotMatch(homeHtml, /href="\/fotoknigi-s-dopolnennoj-realnostju\/"/);
  const articleHtml = await (await render("/article-vipysk/")).text();
  assert.match(articleHtml, /href="\/vypusknye-fotoknigi\/"/);
  assert.doesNotMatch(articleHtml, /href="\/vypusknye-fotoknigi-2\/"/);
});

test("preserves every published route and its captured text", async () => {
  const snapshots = JSON.parse(await readFile(new URL("../data/rendered-pages.json", import.meta.url), "utf8"));
  assert.equal(snapshots.length, 28);
  assert.equal(new Set(snapshots.map((page) => page.slug)).size, 28);
  assert.ok(snapshots.every((page) => page.bodyHtml.length > 1_000));
  assert.ok(snapshots.every((page) => page.visibleText.length > 900));

  const rootText = snapshots.find((page) => page.slug === "").visibleText;
  const privacyText = snapshots.find((page) => page.slug === "politika-obrabotki-personalnyh-dannyh").visibleText;
  assert.match(rootText, /После того, как вы пришлете фотографии, мы сделаем 3 разворота до внесения предоплаты/);
  assert.match(rootText, /Срочный заказ дороже на 50%/);
  assert.match(privacyText, /Политика обработки персональных данных/);

  await access(new URL("../public/wp-assets/wordpress.css", import.meta.url));
  await access(new URL("../public/og-1200x630.png", import.meta.url));
});
