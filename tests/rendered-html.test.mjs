import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

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
  assert.match(html, /wp-content\/uploads\/2026\/04\/001-1-1-optimized\.jpg/);
  assert.match(html, /class="navbar navbar-default/);
  assert.match(html, /href="\/katalog\/" data-redirect-url="\/katalog\/"/);
  assert.match(html, /href="\/stoimost\/" data-redirect-url="\/stoimost\/"/);
  assert.doesNotMatch(html, /href="#collapse[2-5]" data-redirect-url=/);
  assert.match(html, /<footer class="bg-light-gray2 hcode-main-footer/);
  assert.match(html, /class="restored-first-version"/);
  assert.match(html, /wordpress\.css\?v=22/);
  assert.match(html, /home-original-fix\.css\?v=11/);
  assert.match(html, /first-version-home\.css\?v=21/);
  const restoredHtml = html.slice(html.indexOf('class="restored-first-version"'));
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
  assert.doesNotMatch(restoredHtml, /class="review-strip"/);
  assert.ok(restoredHtml.indexOf("Фотокнига на заказ всего за 7 дней!") < restoredHtml.indexOf("Отзывы о фотокнигах"));
  assert.match(restoredHtml, /class="craft-number">01<\/span><h3>Профессиональная обработка фотографий<\/h3>/);
  assert.match(restoredHtml, /<strong>Каталог<\/strong>/);
  assert.match(restoredHtml, /<strong>Стоимость<\/strong>/);
  assert.match(restoredHtml, /class="footer-subheading"><strong>Сервисы<\/strong>/);
  assert.match(restoredHtml, /<strong>Соглашения<\/strong>/);
  assert.match(restoredHtml, /ИНН 772008137237(?:&nbsp;|\u00a0)ОГРНИП(?:&nbsp;|\u00a0)325774600377441/);
  assert.match(restoredHtml, /class="footer-socials"/);
  assert.match(restoredHtml, /icon6-optimized\.png/);
  assert.match(restoredHtml, /icos1-optimized\.png/);
  assert.match(restoredHtml, /icos3-optimized\.png/);
  assert.match(restoredHtml, /icos5-optimized\.png/);
  assert.match(restoredHtml, /logotip_max\.svg_-optimized\.png/);
  assert.doesNotMatch(restoredHtml, /От снимков к семейной реликвии|Спокойный путь к идеальному результату|Выберите формат будущей книги/);
});

test("keeps all internal navigation local and resolves known legacy aliases", async () => {
  const snapshots = JSON.parse(await readFile(new URL("../data/rendered-pages.json", import.meta.url), "utf8"));
  const routeSet = new Set(snapshots.map((page) => `/${page.slug ? `${page.slug}/` : ""}`));
  const checkedPaths = new Set(["/"]);

  for (const page of snapshots) {
    const response = await render(page.slug ? `/${page.slug}/` : "/");
    assert.equal(response.status, 200, page.slug || "/");
    const html = await response.text();
    assert.doesNotMatch(html, /<a\b[^>]*href=["']https?:\/\/(?:www\.)?wedfotobook\.ru/i, page.slug || "/");

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

test("uses the restored original footer on every published page", async () => {
  const snapshots = JSON.parse(await readFile(new URL("../data/rendered-pages.json", import.meta.url), "utf8"));
  const footerCss = await readFile(new URL("../public/wp-assets/first-version-home.css", import.meta.url), "utf8");
  assert.match(footerCss, /\.legacy-wordpress > \.hcode-main-footer[\s\S]*?display:\s*none\s*!important/);

  for (const page of snapshots) {
    const pathname = page.slug ? `/${page.slug}/` : "/";
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.equal((html.match(/class="site-footer"/g) ?? []).length, 1, `Missing restored footer: ${pathname}`);
    assert.match(html, /class="shell footer-grid original-footer-grid"/, pathname);
    assert.match(html, /href="\/wedding-fotoknig\/"/, pathname);
    assert.match(html, /href="\/politika-obrabotki-personalnyh-dannyh\/"/, pathname);
    assert.match(html, /href="tel:\+79854342367"/, pathname);
    if (page.slug) assert.match(html, /class="restored-first-version restored-global-footer"/, pathname);
  }
});

test("uses the original Open Sans typography without changing text colors", async () => {
  const globalCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const restoredCss = await readFile(new URL("../public/wp-assets/first-version-home.css", import.meta.url), "utf8");
  const wordpressCss = await readFile(new URL("../public/wp-assets/wordpress.css", import.meta.url), "utf8");

  assert.match(globalCss, /body\s*\{[^}]*font-family:\s*"Wedfotobook Open Sans",\s*"Open Sans",\s*sans-serif/);
  assert.match(globalCss, /button, input, textarea, select\s*\{[^}]*font-family:\s*"Wedfotobook Open Sans",\s*"Open Sans",\s*sans-serif/);
  assert.match(globalCss, /\.legacy-wordpress \.entry-content p,[\s\S]*font-family:\s*"Wedfotobook Open Sans",\s*"Open Sans",\s*sans-serif\s*!important/);
  assert.match(wordpressCss, /body\{font-family:'Open Sans',sans-serif/);
  assert.match(wordpressCss, /font-family:\s*'Oswald'/);
  assert.doesNotMatch(restoredCss, /font-family:\s*(?:Georgia|Inter)\b/i);

  const weddingHtml = await (await render("/wedding-fotoknig/")).text();
  assert.match(weddingHtml, /rel="preload" href="\/wp-assets\/external\/bd757f1ad06c84be47a2d34d6cf8c292de0e1185\.ttf" as="font" type="font\/ttf" crossorigin="anonymous"/);
  assert.match(weddingHtml, /rel="preload" href="\/wp-assets\/external\/38cd786c2a409251d1efc9eca27b2335faebeaf5\.ttf" as="font" type="font\/ttf" crossorigin="anonymous"/);
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
