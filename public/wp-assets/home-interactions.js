(() => {
  "use strict";

  const consentKey = "wedfotobook-cookie-consent-v2";
  const consentMaxAge = 180 * 24 * 60 * 60 * 1000;
  let analyticsStarted = false;

  const onIdle = (callback) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(callback, { timeout: 3500 });
    else window.setTimeout(callback, 1200);
  };

  function getConsent() {
    try {
      const value = JSON.parse(localStorage.getItem(consentKey) || "null");
      const updatedAt = Date.parse(value?.updatedAt || "");
      return value?.version === 2 && value?.necessary === true && typeof value.analytics === "boolean"
        && Number.isFinite(updatedAt) && Date.now() - updatedAt <= consentMaxAge ? value : null;
    } catch { return null; }
  }

  function setConsent(analytics) {
    const value = { version: 2, necessary: true, analytics, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(consentKey, JSON.stringify(value));
      localStorage.removeItem("wedfotobook-cookie-consent");
    } catch { /* The choice still applies to this page. */ }
    if (analytics) startAnalytics();
  }

  function sessionId() {
    try {
      const stored = sessionStorage.getItem("wedfotobook_analytics_session");
      if (stored) return stored;
      const value = crypto.randomUUID();
      sessionStorage.setItem("wedfotobook_analytics_session", value);
      return value;
    } catch { return crypto.randomUUID(); }
  }

  function sendAnalytics(eventType, details = {}) {
    const device = innerWidth < 680 ? "mobile" : innerWidth < 1100 ? "tablet" : "desktop";
    void fetch("/api/analytics/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType, pagePath: location.pathname, sessionId: sessionId(), device, ...details }),
      keepalive: true,
    }).catch(() => undefined);
  }

  function startAnalytics() {
    if (analyticsStarted || location.search.includes("cms_preview") || location.search.includes("code_preview")) return;
    analyticsStarted = true;
    const referrer = document.referrer ? (() => { try { return new URL(document.referrer).hostname.replace(/^www\./, ""); } catch { return "Другой источник"; } })() : "Прямой переход";
    sendAnalytics("page_view", { referrer });
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("a, button, [role='button']") : null;
      if (!target || target.dataset.analyticsIgnore === "true") return;
      const label = (target.innerText || target.getAttribute("aria-label") || target.getAttribute("title") || "Клик").replace(/\s+/g, " ").trim().slice(0, 180);
      const destination = target instanceof HTMLAnchorElement ? target.getAttribute("href") || "" : target.dataset.orderOpen === "true" ? "Форма заказа" : "Кнопка";
      sendAnalytics("click", { label, target: destination });
    }, { capture: true });
    if (!document.getElementById("yandex-metrika")) {
      window.ym = window.ym || function (...args) { (window.ym.a = window.ym.a || []).push(args); };
      window.ym.l = Date.now();
      const script = document.createElement("script");
      script.id = "yandex-metrika";
      script.async = true;
      script.src = "https://mc.yandex.ru/metrika/tag.js";
      script.addEventListener("load", () => window.ym?.(600494, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false }), { once: true });
      document.head.append(script);
    }
  }

  function mountCookieNotice() {
    if (getConsent()) { if (getConsent().analytics) startAnalytics(); return; }
    const notice = document.createElement("div");
    notice.className = "cookie-consent";
    notice.setAttribute("role", "dialog");
    notice.setAttribute("aria-label", "Настройки файлов cookies");
    notice.innerHTML = `<div class="cookie-consent-mark" aria-hidden="true">✓</div><div class="cookie-consent-content"><span class="cookie-consent-kicker">Конфиденциальность</span><h2>Настройки cookies</h2><p>Обязательные cookies и локальное хранилище нужны для работы сайта. Аналитические cookies Яндекс Метрики включаются только с вашего согласия и помогают нам улучшать сайт.</p></div><div class="cookie-consent-actions"><button class="cookie-button cookie-button-primary" type="button" data-cookie-choice="accept">Принять все</button><button class="cookie-button cookie-button-secondary" type="button" data-cookie-choice="reject">Отклонить необязательные</button><button class="cookie-button cookie-button-link" type="button" data-cookie-choice="settings">Настроить</button></div>`;
    notice.addEventListener("click", (event) => {
      const choice = event.target instanceof Element ? event.target.closest("[data-cookie-choice]")?.dataset.cookieChoice : "";
      if (!choice) return;
      if (choice === "settings") {
        notice.classList.add("cookie-consent-expanded");
        notice.querySelector(".cookie-consent-content").insertAdjacentHTML("beforeend", `<div class="cookie-preferences" aria-label="Категории cookies"><div class="cookie-preference-row"><div><strong>Обязательные</strong><small>Сохраняют выбранные настройки и обеспечивают основные функции сайта. Всегда активны.</small></div><span class="cookie-status">Всегда включены</span></div><label class="cookie-preference-row cookie-preference-toggle"><span><strong>Аналитические</strong><small>Яндекс Метрика: посещённые страницы, источник перехода, устройство и взаимодействие с сайтом. Срок хранения отдельных идентификаторов — до 1 года.</small></span><input type="checkbox" aria-label="Разрешить аналитические cookies" /></label><p class="cookie-details">Поставщик аналитики — ООО «ЯНДЕКС». Сохранённый выбор можно удалить в настройках браузера. Подробнее — в <a href="/politika-obrabotki-personalnyh-dannyh/">политике обработки персональных данных</a>.</p></div>`);
        notice.querySelector(".cookie-consent-actions").innerHTML = '<button class="cookie-button cookie-button-primary" type="button" data-cookie-choice="save">Сохранить выбор</button><button class="cookie-button cookie-button-secondary" type="button" data-cookie-choice="reject">Отклонить необязательные</button>';
        return;
      }
      setConsent(choice === "accept" || (choice === "save" && Boolean(notice.querySelector("input[type=checkbox]")?.checked)));
      notice.remove();
    });
    document.body.append(notice);
  }

  function formatPhone(value) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
    if (digits && !digits.startsWith("7")) digits = `7${digits}`;
    digits = digits.slice(0, 11);
    return `+7${digits.slice(1, 4) ? ` (${digits.slice(1, 4)}${digits.length >= 4 ? ")" : ""}` : ""}${digits.slice(4, 7) ? ` ${digits.slice(4, 7)}` : ""}${digits.slice(7, 9) ? `-${digits.slice(7, 9)}` : ""}${digits.slice(9, 11) ? `-${digits.slice(9, 11)}` : ""}`;
  }

  function openOrderDialog() {
    const dialog = document.createElement("dialog");
    dialog.className = "order-dialog";
    dialog.setAttribute("aria-labelledby", "order-dialog-title");
    dialog.innerHTML = `<button class="dialog-close" type="button" aria-label="Закрыть">×</button><form class="order-form"><header class="order-form-heading"><span class="order-form-kicker">Обратный звонок</span><h2 id="order-dialog-title">Обсудим вашу фотокнигу</h2><p>Оставьте имя и номер телефона. Мы перезвоним ежедневно с 9:00 до 21:00.</p></header><div class="order-fields"><label><span>Ваше имя</span><input name="name" autocomplete="name" placeholder="Как к вам обращаться?" maxlength="120" required></label><label><span>Телефон</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" minlength="18" required></label></div><label class="honeypot" aria-hidden="true">Адрес<input name="address" tabindex="-1" autocomplete="off"></label><input name="formStartedAt" type="hidden"><label class="checkbox"><input name="consent" type="checkbox" required><span>Я соглашаюсь на <a href="/soglashenie/" target="_blank">обработку персональных данных</a> согласно <a href="/politika-obrabotki-personalnyh-dannyh/" target="_blank">политике конфиденциальности</a></span></label><div class="order-antispam" aria-label="Форма защищена от автоматических заявок"><span class="order-antispam-icon" aria-hidden="true">✓</span><span><strong>Антиспам-защита включена</strong><small>Форма проверяется на сервере перед отправкой</small></span></div><button class="button order-submit" type="submit">Отправить</button><p class="form-message" hidden></p></form>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector(".dialog-close").addEventListener("click", close);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    const form = dialog.querySelector("form");
    form.elements.formStartedAt.value = String(Date.now());
    form.elements.phone.addEventListener("input", (event) => { event.target.value = formatPhone(event.target.value); });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector("button[type=submit]");
      const message = form.querySelector(".form-message");
      submit.disabled = true;
      submit.textContent = "Отправляем…";
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.kind = "callback";
      payload.sourcePath = location.pathname;
      try {
        const response = await fetch("/api/contact/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Не удалось отправить заявку.");
        form.reset();
        form.elements.formStartedAt.value = String(Date.now());
        message.textContent = result.saved && result.notified === false ? "Заявка сохранена. Почтовое уведомление задерживается, но обращение уже доступно нам в системе." : "Спасибо! Заявка принята. Мы скоро свяжемся с вами.";
        message.className = "form-message success";
      } catch (error) {
        message.textContent = `${error instanceof Error ? error.message : "Не удалось отправить заявку."} Позвоните нам: 8 (985) 434-23-67.`;
        message.className = "form-message error";
      }
      message.hidden = false;
      submit.disabled = false;
      submit.textContent = "Отправить";
    });
    dialog.showModal();
  }

  function showImage(url, alt) {
    const dialog = document.createElement("dialog");
    dialog.className = "legacy-lightbox";
    dialog.innerHTML = `<button type="button" aria-label="Закрыть">×</button><img src="${url.replaceAll('"', "&quot;")}" alt="${alt.replaceAll('"', "&quot;")}">`;
    dialog.addEventListener("click", (event) => { if (event.target === dialog || event.target.closest("button")) dialog.close(); });
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();
  }

  function hydrateCarouselFrame(frame) {
    if (frame.querySelector("img")) return;
    const image = document.createElement("img");
    image.src = frame.dataset.carouselSrc;
    image.alt = frame.dataset.carouselAlt || "";
    image.width = Number(frame.dataset.carouselWidth || 0);
    image.height = Number(frame.dataset.carouselHeight || 0);
    image.loading = "lazy";
    image.fetchPriority = "low";
    image.decoding = "async";
    if (frame.dataset.carouselSrcset) image.srcset = frame.dataset.carouselSrcset;
    if (frame.dataset.carouselSizes) image.sizes = frame.dataset.carouselSizes;
    if (frame.dataset.carouselAvifSrcset) {
      const picture = document.createElement("picture");
      picture.dataset.responsivePicture = "";
      picture.style.display = "contents";
      const source = document.createElement("source");
      source.type = "image/avif";
      source.srcset = frame.dataset.carouselAvifSrcset;
      source.sizes = frame.dataset.carouselSizes || "100vw";
      picture.append(source, image);
      frame.append(picture);
    } else frame.append(image);
  }

  function moveCarousel(button, delta) {
    const root = button.closest("[data-carousel]");
    const track = root?.querySelector(".home-gallery-carousel-track, .review-carousel-track");
    const frames = track ? [...track.children] : [];
    if (!root || !track || !frames.length) return;
    const index = (Number(root.dataset.carouselIndex || 0) + delta + frames.length) % frames.length;
    root.dataset.carouselIndex = String(index);
    track.style.transform = `translate3d(-${index * 100}%,0,0)`;
    frames.forEach((frame, frameIndex) => frame.setAttribute("aria-hidden", String(frameIndex !== index)));
    hydrateCarouselFrame(frames[index]);
    hydrateCarouselFrame(frames[(index + 1) % frames.length]);
    root.querySelector("[data-carousel-current]").textContent = String(index + 1);
  }

  function findContentTarget(key) {
    const [path, target] = key.split("::");
    if (!path?.startsWith("body>") || !target) return null;
    let current = document.body;
    for (const part of path.split(">").slice(1)) {
      const match = /^([\w-]+)\[(\d+)]$/.exec(part);
      if (!match) return null;
      const children = [...current.children].flatMap((child) => child.matches("picture[data-responsive-picture]") ? [...child.querySelectorAll(":scope > img")] : [child]).filter((child) => child.tagName.toLowerCase() === match[1]);
      current = children[Number(match[2])];
      if (!current) return null;
    }
    return { element: current, target };
  }

  function applyContentOverrides(items) {
    items.forEach(({ nodeKey, value }) => {
      if (typeof nodeKey !== "string" || typeof value !== "string") return;
      const match = findContentTarget(nodeKey);
      if (!match) return;
      const text = /^text\[(\d+)]$/.exec(match.target);
      const attribute = /^attr\[([^\]]+)]$/.exec(match.target);
      if (text) {
        const node = [...match.element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)[Number(text[1])];
        if (!node) return;
        const original = node.nodeValue || "";
        node.nodeValue = `${original.match(/^\s*/)?.[0] || ""}${value}${original.match(/\s*$/)?.[0] || ""}`;
      } else if (attribute) match.element.setAttribute(attribute[1], value);
    });
  }

  function loadCustomizations() {
    if (location.search.includes("cms_preview") || location.search.includes("code_preview")) return;
    void fetch("/api/site-code/", { cache: "no-store" }).then((response) => response.ok ? response.json() : {}).then(({ customCss = "" }) => {
      if (!customCss) return;
      const style = document.createElement("style");
      style.id = "wedfotobook-custom-css";
      style.dataset.source = "admin-code-editor";
      style.textContent = customCss;
      document.head.append(style);
    }).catch(() => undefined);
    void fetch("/api/site-content/?path=/", { cache: "no-store" }).then((response) => response.ok ? response.json() : {}).then(({ items = [] }) => applyContentOverrides(items)).catch(() => undefined);
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const menu = target?.closest(".navbar-toggle");
    if (menu) { event.preventDefault(); document.querySelector("#mega-menu")?.classList.toggle("in"); return; }
    const order = target?.closest("[data-order-open], .wpb-pcf-form-fire, .wpb-pcf-button, .fancybox-inline");
    if (order) { event.preventDefault(); openOrderDialog(); return; }
    const previous = target?.closest("[data-carousel-prev]");
    const next = target?.closest("[data-carousel-next]");
    if (previous || next) { event.preventDefault(); moveCarousel(previous || next, next ? 1 : -1); return; }
    const image = target?.closest("a.fg-thumb, a.foogallery-lightbox, .foogallery a[href$='.jpg'], .foogallery a[href$='.jpeg'], .foogallery a[href$='.png'], .foogallery a[href$='.webp']");
    if (image?.href) { event.preventDefault(); showImage(image.href, image.querySelector("img")?.alt || "Фотография фотокниги"); return; }
    if (target?.closest("a.scrollToTop")) { event.preventDefault(); scrollTo({ top: 0, behavior: "smooth" }); }
  }, true);

  mountCookieNotice();
  onIdle(loadCustomizations);
})();
