import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const globalCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const headerCss = await readFile(new URL("../public/wp-assets/home-original-fix.css", import.meta.url), "utf8");
const firstVersionCss = await readFile(new URL("../public/wp-assets/first-version-home.css", import.meta.url), "utf8");
const orderDialogSource = await readFile(new URL("../components/OrderDialog.tsx", import.meta.url), "utf8");
const contactRouteSource = await readFile(new URL("../app/api/contact/route.ts", import.meta.url), "utf8");

test("uses Open Sans across the entire site", () => {
  assert.match(globalCss, /body \* \{\s*font-family: "Open Sans", Arial, sans-serif !important;/);
});

test("uses a two-field callback form with consent and spam protection", () => {
  assert.match(orderDialogSource, /<input name="name"/);
  assert.match(orderDialogSource, /<input name="phone" type="tel"/);
  assert.match(orderDialogSource, /<input name="consent" type="checkbox" required/);
  assert.match(orderDialogSource, /className="honeypot"/);
  assert.match(orderDialogSource, /className="order-antispam"/);
  assert.doesNotMatch(orderDialogSource, /name="(?:photos|message)"/);
  assert.match(globalCss, /\.order-dialog \{[^}]*border-radius: 22px;/s);
  assert.match(contactRouteSource, /text: `Имя: \$\{name\}\\nТелефон: \$\{phone\}`/);
  assert.doesNotMatch(contactRouteSource, /body\.(?:photos|message)/);
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

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("keeps the original opening screen and restores the first working version below it", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /От вас только фото/);
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
  assert.match(html, /home-original-fix\.css\?v=14/);
  assert.match(html, /first-version-home\.css\?v=28/);
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
  assert.match(restoredHtml, /<span class="eyebrow eyebrow-light">Каталог<\/span><h2>Какие фотокниги мы делаем\? Любые!<\/h2><p>Свадьба, первый год малыша, юбилей, выпускной или путешествие — мы найдём визуальный язык для любого события\.<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">Почему нам доверяют<\/span><h2>Почему нам можно доверять\?<\/h2><\/div><p>Вы видите будущую книгу ещё до оплаты и участвуете в создании ровно настолько, насколько хотите\.<\/p>/);
  assert.match(restoredHtml, /class="section-heading split-heading"><div><span class="eyebrow">Восемь простых шагов<\/span><h2>Как проходит заказ<\/h2><\/div><p>Вся работа идёт онлайн, без поездок в офис и долгих встреч\.<\/p>/);
  assert.match(restoredHtml, /class="step-number">0(?:<!-- -->)?1<\/span>/);
  assert.match(restoredHtml, /class="step-number">0(?:<!-- -->)?7<\/span>/);
  assert.doesNotMatch(restoredHtml, /class="step-number">0(?:<!-- -->)?8<\/span>/);
  assert.match(restoredHtml, /<button class="button" data-order-open="true" type="button">Начать заказ<\/button>/);
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
    assert.match(html, /home-original-fix\.css\?v=14/, page.slug || "/");
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
