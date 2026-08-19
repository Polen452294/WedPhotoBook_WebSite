import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const globalCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const headerCss = await readFile(new URL("../public/wp-assets/home-original-fix.css", import.meta.url), "utf8");
const firstVersionCss = await readFile(new URL("../public/wp-assets/first-version-home.css", import.meta.url), "utf8");
const orderDialogSource = await readFile(new URL("../components/OrderDialog.tsx", import.meta.url), "utf8");
const contactRouteSource = await readFile(new URL("../app/api/contact/route.ts", import.meta.url), "utf8");
const legacyEnhancementsSource = await readFile(new URL("../components/LegacyEnhancements.tsx", import.meta.url), "utf8");
const legacyPageSource = await readFile(new URL("../components/LegacyPage.tsx", import.meta.url), "utf8");
const cookieNoticeSource = await readFile(new URL("../components/CookieNotice.tsx", import.meta.url), "utf8");
const analyticsSource = await readFile(new URL("../components/Analytics.tsx", import.meta.url), "utf8");
const cookieConsentSource = await readFile(new URL("../lib/cookie-consent.ts", import.meta.url), "utf8");
const databaseSchemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");

test("uses Open Sans across the entire site", () => {
  assert.match(globalCss, /body \* \{\s*font-family: "Open Sans", Arial, sans-serif !important;/);
});

test("uses a two-field callback form with consent and spam protection", () => {
  assert.match(orderDialogSource, /<input name="name"/);
  assert.match(orderDialogSource, /<input name="phone" type="tel"/);
  assert.match(orderDialogSource, /<input name="consent" type="checkbox" required/);
  assert.match(orderDialogSource, /className="honeypot"/);
  assert.match(orderDialogSource, /name="formStartedAt" type="hidden"/);
  assert.match(orderDialogSource, /className="order-antispam"/);
  assert.doesNotMatch(orderDialogSource, /name="(?:photos|message)"/);
  assert.match(globalCss, /\.order-dialog \{[^}]*border-radius: 22px;/s);
  assert.match(globalCss, /\.order-dialog \.order-form \.checkbox > span \{[^}]*width: auto !important;[^}]*float: none !important;/s);
  assert.match(contactRouteSource, /FORM_MIN_AGE_MS/);
  assert.match(contactRouteSource, /RATE_LIMIT_MAX/);
  assert.match(contactRouteSource, /verifyTurnstile/);
  assert.match(contactRouteSource, /value === true \|\| value === "on" \|\| value === "1"/);
  assert.match(contactRouteSource, /insert\(enquiries\)/);
  assert.match(contactRouteSource, /notificationStatus/);
  assert.match(databaseSchemaSource, /export const enquiries = sqliteTable/);
  assert.match(databaseSchemaSource, /export const submissionAttempts = sqliteTable/);
  assert.match(legacyEnhancementsSource, /kind: email \|\| message \? "message" : "callback"/);
  assert.match(legacyEnhancementsSource, /your-message/);
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
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: { accept: "text/html", ...(init.headers ?? {}) },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

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

test("removes the obsolete WordPress comment endpoint and keeps the privacy alias working", async () => {
  const classicHtml = await (await render("/fotokniga-klassik/")).text();
  assert.doesNotMatch(classicHtml, /wp-comments-post\.php/);
  assert.match(classicHtml, /Комментарии к этой записи закрыты\./);

  const privacyAlias = await render("/politika-konfidencialnosti/");
  assert.ok([301, 302, 307, 308].includes(privacyAlias.status));
  assert.equal(privacyAlias.headers.get("location"), "/politika-obrabotki-personalnyh-dannyh/");
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
  assert.match(pricingHtml, /Цены на фотокниги на заказ в Москве/);
  assert.match(pricingHtml, /Цена фотокниги зависит от вида печати\./);
  assert.equal([...pricingHtml.matchAll(/class="price-card(?: featured)?"/g)].length, 4);
  assert.match(pricingHtml, /class="button" data-order-open="true" type="button">Заказать<\/button>/);
  assert.match(firstVersionCss, /\.legacy-wordpress\.page-id-20303 > :not\(\.navbar\)/);
  assert.match(firstVersionCss, /\.restored-first-version \.pricing-page-section[\s\S]*background: var\(--cream\)/);
});

test("reworks every requested catalog detail page with its exact text and adaptive gallery", async () => {
  const routes = [
    { pathname: "/detskaya-fotokniga/", slug: "detskaya-fotokniga", title: "Детская фотокнига", gallery: "children", images: 8, text: "Детская фотокнига на заказ гарантирует индивидуальный подход", faq: "Частые вопросы о детской фотокниге" },
    { pathname: "/yubilejnaya-fotokniga/", slug: "yubilejnaya-fotokniga", title: "Фотокнига на юбилей", gallery: "anniversary", images: 8, text: "Фотокнига на юбилей на заказ станет лучшим подарком", faq: null },
    { pathname: "/fotokniga-o-puteshestvii/", slug: "fotokniga-o-puteshestvii", title: "Фотокнига путешествий", gallery: "travel", images: 8, text: "Фотоальбом путешествий может включать не только снимки", faq: null },
    { pathname: "/vypusknye-fotoknigi/", slug: "vypusknye-fotoknigi", title: "Выпускные альбомы", gallery: "graduation", images: 12, text: "Выпускной альбом на заказ разрабатывается индивидуально", faq: "Частые вопросы о выпускных фотокнигах" },
    { pathname: "/genealogicheskaya-fotokniga/", slug: "genealogicheskaya-fotokniga", title: "Родословная фотокнига", gallery: "genealogy", images: 12, text: "Родословная (генеалогическая) фотокнига на заказ позволяет объединить", faq: null },
    { pathname: "/fotokniga-na-lyubuyu-temu/", slug: "fotokniga-na-lyubuyu-temu", title: "Фотокнига на любую тему", gallery: "custom", images: 8, text: "Корпоративная фотокнига станет стильным подарком", faq: null },
    { pathname: "/fotokniga-s-dopolnennoj-realnostyu/", slug: "fotokniga-s-dopolnennoj-realnostyu", title: "Фотокнига с оживающими фото", gallery: "alive", images: 2, text: "Если видео нет, не страшно, мы оживим фото с помощью ИИ", faq: null },
  ];

  for (const route of routes) {
    const { pathname, slug, title, gallery, images, text, faq } = route;
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
    assert.equal([...pageHtml.matchAll(new RegExp(`/media/gallery/${gallery}/${gallery}-\\d{2}-wedfotobook-ru\\.webp`, "g"))].length, images, pathname);
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
  }

  assert.match(firstVersionCss, /\.catalog-detail-route \.legacy-wordpress > :not\(\.navbar\)/);
  assert.match(firstVersionCss, /\.restored-first-version \.catalog-story-chapter/);
  assert.match(firstVersionCss, /\.restored-first-version \.catalog-story-gallery\.gallery-count-3/);
  assert.match(firstVersionCss, /\.restored-first-version \.catalog-story-page \.section-seven-days/);

  const childrenHtml = await (await render("/detskaya-fotokniga/")).text();
  assert.ok(childrenHtml.indexOf("children-07-wedfotobook-ru.webp") < childrenHtml.indexOf("children-05-wedfotobook-ru.webp"));
  assert.ok(childrenHtml.indexOf("children-04-wedfotobook-ru.webp") > childrenHtml.indexOf("children-06-wedfotobook-ru.webp"));
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
  assert.match(pageHtml, /\/media\/covers\/svadba-fotokniga-wedfotobook-ru\.webp/);
  assert.match(pageHtml, /Свадебная фотокнига — это не просто альбом с фотографиями, а настоящая история любви/);
  assert.match(pageHtml, /Наши дизайнеры знают, как выстроить повествование так, чтобы каждая страница раскрывала отдельную главу/);
  assert.match(pageHtml, /Свадебная фотокнига на заказ создаётся с учётом всех ваших пожеланий\./);
  assert.equal([...pageHtml.matchAll(/\/media\/gallery\/wedding\/svadba-fotokniga-\d+-wedfotobook-ru\.webp/g)].length, 12);

  const storyIndex = pageHtml.indexOf("wedding-story-section");
  const trustIndex = pageHtml.indexOf("Почему нам можно доверять?");
  const pricingIndex = pageHtml.indexOf("Хотите узнать стоимость фотокниги?");
  const sevenDaysIndex = pageHtml.indexOf("Семь простых шагов");
  const faqIndex = pageHtml.indexOf("Частые вопросы о свадебной фотокниге");
  assert.ok(storyIndex < trustIndex && trustIndex < pricingIndex && pricingIndex < sevenDaysIndex && sevenDaysIndex < faqIndex);
  assert.match(pageHtml, /Сколько фотографий нужно для свадебной фотокниги\?/);
  assert.match(pageHtml, /Можно ли заказать дополнительные копии для родителей\?/);
  assert.doesNotMatch(pageHtml, /День свадьбы — это история, которую хочется пересматривать снова и снова\./);
  assert.match(pageHtml, /class="section section-seven-days"/);
  assert.match(firstVersionCss, /\.restored-first-version \.wedding-story-chapter/);
  assert.match(firstVersionCss, /\.restored-first-version \.wedding-faq-content \.wfb-faq/);
  assert.match(firstVersionCss, /\.restored-first-version \.wedding-detail-page \.section-seven-days,[\s\S]*?background: #fff;/);
});

test("uses the genealogy photobook name consistently across the site", async () => {
  const html = await (await render("/genealogicheskaya-fotokniga/")).text();
  const start = html.indexOf('<main class="catalog-detail-page catalog-story-page catalog-story-page-genealogicheskaya-fotokniga">');
  const end = html.indexOf("</main>", start);
  const pageHtml = html.slice(start, end);

  assert.match(pageHtml, /<h1>Родословная фотокнига<\/h1>/);
  assert.doesNotMatch(pageHtml, /<h1>Генеалогическое древо/);

  for (const pathname of ["/", "/katalog/", "/blog_fotoknigi/", "/article-genealogy/"]) {
    const routeHtml = await (await render(pathname)).text();
    assert.match(routeHtml, /Родословная фотокнига/, pathname);
    assert.doesNotMatch(routeHtml, /Родословная книга|Родословные фотокниги/, pathname);
  }
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
  }
});

test("keeps the original opening screen and restores the first working version below it", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");

  const html = await response.text();
  assert.match(html, /От вас только фото/);
  assert.match(headerCss, /\.vc_custom_1777448124380 > \.hcode-column-1 ul > li::before \{[\s\S]*?color: #b99769;[\s\S]*?content: "✓";/);
  assert.match(html, /Сделаем дизайн и согласуем макет/);
  assert.match(html, /Мы увеличиваем размеры маленьких снимков с помощью ИИ\./);
  assert.match(html, /Безлимитные правки до вашего/);
  assert.match(html, /Вы работаете с юр\. лицами\?/);
  const homepagePhotos = [
    "fotokniga-na-zakaz-wedfotobook-ru.webp",
    "obrabotka-foto-wedfotobook-ru.webp",
    "dizain-fotoknigi-wedfotobook-ru.webp",
    "soglasovanie-maketa-wedfotobook-ru.webp",
    "print-fotoknig-wedfotobook-ru.webp",
    "fotokniga-alive-photo-blok-wedfotobook-ru.webp",
    "fotokniga-premium-wedfotobook-ru.webp",
    "fotokniga-standart-wedfotobook-ru.webp",
    "vipusk-albom-1-wedfotobook-ru.webp",
    "fotokniga-alive-photo-stoimost-wedfotobook-ru.webp",
  ];
  for (const photo of homepagePhotos) assert.match(html, new RegExp(`/media/home/${photo.replaceAll(".", "\\.")}`));
  assert.doesNotMatch(html, /wp-content\/uploads\/2026\/04\/001-1-1-optimized\.jpg/);
  assert.match(html, /class="navbar navbar-default/);
  assert.match(html, /href="\/katalog\/" data-redirect-url="\/katalog\/"/);
  assert.match(html, /href="\/stoimost\/" data-redirect-url="\/stoimost\/"/);
  assert.doesNotMatch(html, /href="#collapse[2-5]" data-redirect-url=/);
  assert.match(html, /<footer class="bg-light-gray2 hcode-main-footer/);
  assert.match(html, /class="restored-first-version"/);
  assert.match(html, /home-original-fix\.css\?v=15/);
  assert.match(html, /first-version-home\.css\?v=41/);
  const restoredHtml = html.slice(html.indexOf('class="restored-first-version"'));
  const footerHtml = restoredHtml.slice(restoredHtml.indexOf('<footer class="site-footer">'), restoredHtml.indexOf("</footer>") + "</footer>".length);
  assert.equal([...footerHtml.matchAll(/<a\b/g)].length, 26);
  assert.match(footerHtml, /Адрес: Москва, Свободный проспект, д\. 33/);
  assert.ok(footerHtml.indexOf("Адрес: Москва, Свободный проспект, д. 33") < footerHtml.indexOf("Режим работы: с 9 до 21, без выходных"));
  assert.match(footerHtml, /class="footer-contact-card"/);
  assert.match(restoredHtml, /class="price-card featured"/);
  assert.match(restoredHtml, /class="price-badge"/);
  assert.match(restoredHtml, /class="faq-intro"><span class="eyebrow"/);
  assert.match(restoredHtml, /Как мы делаем фотокниги\?/);
  assert.match(restoredHtml, /Фотокнига — это больше, чем просто фотографии/);
  assert.match(restoredHtml, /Хотите узнать стоимость фотокниги до начала работы\?/);
  assert.match(restoredHtml, /15\. Вы работаете с юр\. лицами\?/);
  assert.match(restoredHtml, /1\. Есть ли у вас конструктор по созданию фотокниг\?/);
  assert.match(restoredHtml, /Конструктора у нас нет\. Все макеты делаются дизайнерами вручную, без шаблонов, только с индивидуальным дизайном\./);
  assert.ok(restoredHtml.indexOf("4. Сколько стоит добавить тексты в фотокнигу?") < restoredHtml.indexOf("5. Что нужно при заказе фотокниги у вас?"));
  assert.match(restoredHtml, /Обычно на создание и печать фотокниги уходит 7 дней\./);
  assert.match(restoredHtml, /сделать закрывающие документы\./);
  assert.doesNotMatch(restoredHtml, /class="section section-ink alive-section"/);
  assert.match(restoredHtml, /class="review-carousel"/);
  assert.match(restoredHtml, /id="review-carousel-track" class="review-carousel-track"/);
  assert.match(restoredHtml, /\/media\/reviews-selected\/otziv-o-fotoknige-01-wedfotobook\.webp/);
  assert.match(restoredHtml, /aria-label="Следующий отзыв"/);
  assert.match(restoredHtml, /aria-label="Предыдущий отзыв"/);
  assert.doesNotMatch(restoredHtml, /class="review-strip"/);
  assert.ok(restoredHtml.indexOf("Как проходит заказ") < restoredHtml.indexOf("Отзывы о фотокнигах"));
  assert.match(restoredHtml, /class="craft-number">01<\/span><h3>Профессиональная обработка фотографий<\/h3>/);
  assert.match(restoredHtml, /<strong>Каталог<\/strong>/);
  assert.match(restoredHtml, /<strong>Стоимость<\/strong>/);
  assert.match(restoredHtml, /class="footer-subheading"><strong>Сервисы<\/strong>/);
  assert.match(restoredHtml, /class="footer-service-links"><a href="\/company\/">О компании<\/a>/);
  assert.match(restoredHtml, /<strong>Соглашения<\/strong>/);
  assert.match(restoredHtml, /ИНН 772008137237(?:&nbsp;|\u00a0)ОГРНИП(?:&nbsp;|\u00a0)325774600377441/);
  assert.match(restoredHtml, /class="footer-socials"/);
  assert.match(html, /\/media\/brand\/logo-wedfotobook-v2\.png/);
  assert.match(restoredHtml, /\/media\/social\/yandex-wedfotobook\.png/);
  assert.match(restoredHtml, /\/media\/social\/vk-wedfotobook\.png/);
  assert.match(restoredHtml, /\/media\/social\/tg-wedfotobook\.png/);
  assert.match(restoredHtml, /\/media\/social\/wapp-wedfotobook\.png/);
  assert.match(restoredHtml, /\/media\/social\/max-wedfotobook\.png/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">От снимков к семейной реликвии<\/span><h2>Как мы делаем фотокниги\?<\/h2><\/div><p>Каждый этап выполняют люди — от отбора фотографий и дизайна до финальной проверки перед печатью\.<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow eyebrow-light">Каталог<\/span><h2>Какие фотокниги мы делаем\? Любые!<\/h2><\/div><p>Свадьба, первый год малыша, юбилей, выпускной или путешествие — мы найдём визуальный язык для любого события\.<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">Стоимость<\/span><h2>Хотите узнать стоимость фотокниги(?: до начала работы)?\?<\/h2><\/div><p>Можем сделать фотокнигу в кожаной или тканевой обложке<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">Почему нам доверяют<\/span><h2>Почему нам можно доверять\?<\/h2><\/div><p>Вы видите будущую книгу ещё до оплаты и участвуете в создании ровно настолько, насколько хотите\.<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">Семь простых шагов<\/span><h2>Как проходит заказ<\/h2><\/div><p>Вся работа идёт онлайн, без поездок в офис и долгих встреч\.<\/p>/);
  assert.match(restoredHtml, /class="step-number">0(?:<!-- -->)?1<\/span>/);
  assert.match(restoredHtml, /class="step-number">0(?:<!-- -->)?7<\/span>/);
  assert.doesNotMatch(restoredHtml, /class="step-number">0(?:<!-- -->)?8<\/span>/);
  const stepsHtml = restoredHtml.slice(restoredHtml.indexOf('<ol class="steps-grid">'), restoredHtml.indexOf("</ol>", restoredHtml.indexOf('<ol class="steps-grid">')));
  assert.doesNotMatch(stepsHtml, /Консультация/);
  assert.ok(stepsHtml.indexOf("Оплата") < stepsHtml.indexOf("Печать"));
  assert.match(restoredHtml, /<button class="button" data-order-open="true" type="button">Заказать<\/button>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">Отзывы<\/span><h2>Отзывы о фотокнигах<\/h2><\/div><p>Сохраняем живые отзывы клиентов без пересказа и редакторских правок\.<\/p>/);
  assert.match(restoredHtml, /<span class="eyebrow">Частые вопросы<\/span><h2>Остались вопросы\?<\/h2>/);
});

test("keeps all internal navigation local and resolves known legacy aliases", async () => {
  const snapshots = JSON.parse(await readFile(new URL("../data/rendered-pages.json", import.meta.url), "utf8"));
  const routeSet = new Set(snapshots.map((page) => `/${page.slug ? `${page.slug}/` : ""}`));
  const checkedPaths = new Set(["/"]);

  for (const page of snapshots) {
    const response = await render(page.slug ? `/${page.slug}/` : "/");
    assert.equal(response.status, 200, page.slug || "/");
    const html = await response.text();
    const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");
    assert.match(html, /class="navbar navbar-default/, page.slug || "/");
    assert.match(html, /home-original-fix\.css\?v=15/, page.slug || "/");
    assert.doesNotMatch(html, /<a\b[^>]*href=["']https?:\/\/(?:www\.)?wedfotobook\.ru/i, page.slug || "/");
    assert.match(visibleHtml, /\/media\/brand\/logo-wedfotobook-v2\.png/, page.slug || "/");
    assert.doesNotMatch(visibleHtml, /(?:icon6-optimized|icos[135]-optimized|logotip_max\.svg_|telegram_2019_logo|whatsapp\.svg_)/, page.slug || "/");
    assert.match(visibleHtml, /class="restored-first-version"/, page.slug || "/");
    const sharedFooter = visibleHtml.slice(visibleHtml.indexOf('<footer class="site-footer">'), visibleHtml.indexOf("</footer>", visibleHtml.indexOf('<footer class="site-footer">')) + "</footer>".length);
    assert.equal([...sharedFooter.matchAll(/<a\b/g)].length, 26, page.slug || "/");
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
  assert.equal(snapshots.length, 29);
  assert.equal(new Set(snapshots.map((page) => page.slug)).size, 29);
  assert.ok(snapshots.every((page) => page.bodyHtml.length > 1_000));
  assert.ok(snapshots.every((page) => page.visibleText.length > 900));

  const rootText = snapshots.find((page) => page.slug === "").visibleText;
  const privacyText = snapshots.find((page) => page.slug === "politika-obrabotki-personalnyh-dannyh").visibleText;
  assert.match(rootText, /После того, как вы пришлете фотографии, мы сделаем 3 разворота до внесения предоплаты/);
  assert.match(rootText, /Срочный заказ дороже на 50%/);
  assert.match(privacyText, /Политика обработки персональных данных/);

  const localAssets = new Set();
  for (const page of snapshots) {
    for (const match of page.bodyHtml.matchAll(/["'](\/[^"']+\.(?:avif|gif|jpe?g|png|svg|webp|woff2?))(?:\?[^"']*)?["']/gi)) {
      localAssets.add(match[1]);
    }
  }
  assert.ok(localAssets.size > 150);
  await Promise.all([...localAssets].map((asset) => access(new URL(`../public${asset}`, import.meta.url))));
  await access(new URL("../public/wp-assets/wordpress.css", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
});
