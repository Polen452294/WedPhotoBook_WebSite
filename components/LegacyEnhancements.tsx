"use client";

import { useEffect } from "react";

const BODY_CLASSES = ["wordpress-clone"];

function openImage(url: string, alt: string) {
  const dialog = document.createElement("dialog");
  dialog.className = "legacy-lightbox";
  dialog.innerHTML = `<button type="button" aria-label="Закрыть">×</button><img src="${url.replaceAll('"', "&quot;")}" alt="${alt.replaceAll('"', "&quot;")}" />`;
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || (event.target instanceof HTMLElement && event.target.closest("button"))) dialog.close();
  });
  dialog.addEventListener("close", () => dialog.remove());
  document.body.appendChild(dialog);
  dialog.showModal();
}

function showViewerItem(gallery: HTMLElement, requestedIndex: number) {
  const items = [...gallery.querySelectorAll<HTMLElement>(".fiv-inner-container > .fg-item")];
  if (!items.length) return;
  const index = (requestedIndex + items.length) % items.length;

  items.forEach((item, itemIndex) => {
    item.classList.remove("fg-loading", "fg-idle", "fg-error");
    item.classList.add("fg-loaded");
    item.style.display = itemIndex === index ? "inline-block" : "none";
    item.style.position = itemIndex === index ? "relative" : "absolute";
  });
  gallery.dataset.currentIndex = String(index);
  const current = gallery.querySelector<HTMLElement>(".fiv-count-current");
  const total = gallery.querySelector<HTMLElement>(".fiv-count-total");
  if (current) current.textContent = String(index + 1);
  if (total) total.textContent = String(items.length);
}

function initializeImageViewers() {
  document.querySelectorAll<HTMLElement>(".foogallery-image-viewer").forEach((gallery) => showViewerItem(gallery, 0));
}

function setLegacyFormStatus(form: HTMLFormElement, state: "sent" | "failed", message: string) {
  const status = form.querySelector<HTMLElement>(".wpcf7-response-output");
  form.classList.remove("init", "sent", "failed", "submitting");
  form.classList.add(state);
  if (!status) return;
  status.textContent = message;
  status.setAttribute("aria-hidden", "false");
  status.style.display = "block";
}

export function LegacyEnhancements({ bodyClass }: { bodyClass: string }) {
  useEffect(() => {
    // The homepage CSS is scoped to .legacy-wordpress.home already. Replacing
    // the body class after hydration invalidates styles for the whole, long
    // document and delays the hero paint. Legacy inner pages still receive the
    // original WordPress body classes until their remaining CSS is scoped too.
    const isHomepage = bodyClass.split(/\s+/).includes("home");
    const previous = document.body.className;
    if (!isHomepage) document.body.className = `${BODY_CLASSES.join(" ")} ${bodyClass}`.trim();
    document.querySelector("#cookie-notice")?.remove();
    initializeImageViewers();
    const legacyFormStartedAt = new WeakMap<HTMLFormElement, number>();
    document.querySelectorAll<HTMLFormElement>(".wpcf7-form").forEach((form) => legacyFormStartedAt.set(form, Date.now()));

    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const menuToggle = target?.closest<HTMLButtonElement>(".navbar-toggle");
      if (menuToggle) {
        event.preventDefault();
        document.querySelector("#mega-menu")?.classList.toggle("in");
        return;
      }

      const redirectedLink = target?.closest<HTMLAnchorElement>("a[data-redirect-url]");
      if (redirectedLink?.dataset.redirectUrl) {
        event.preventDefault();
        window.location.href = redirectedLink.dataset.redirectUrl;
        return;
      }

      const scrollTopLink = target?.closest<HTMLAnchorElement>("a.scrollToTop");
      if (scrollTopLink) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const viewerButton = target?.closest<HTMLButtonElement>(".foogallery-image-viewer .fiv-prev, .foogallery-image-viewer .fiv-next");
      if (viewerButton) {
        event.preventDefault();
        const gallery = viewerButton.closest<HTMLElement>(".foogallery-image-viewer");
        if (gallery) {
          const currentIndex = Number(gallery.dataset.currentIndex ?? "0");
          showViewerItem(gallery, currentIndex + (viewerButton.classList.contains("fiv-next") ? 1 : -1));
        }
        return;
      }

      const imageLink = target?.closest<HTMLAnchorElement>("a.fg-thumb, a.foogallery-lightbox, a[href$='.jpg'], a[href$='.jpeg'], a[href$='.png'], a[href$='.webp']");
      if (imageLink && imageLink.href && imageLink.closest(".foogallery")) {
        event.preventDefault();
        openImage(imageLink.href, imageLink.querySelector("img")?.alt ?? "Фотография фотокниги");
        return;
      }

      const localLink = target?.closest<HTMLAnchorElement>('a[href^="/"]');
      if (localLink && !localLink.hasAttribute("download") && localLink.target !== "_blank") {
        event.preventDefault();
        window.location.assign(localLink.getAttribute("href")!);
      }
    };

    const submit = async (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (form?.matches(".comment-form")) {
        event.preventDefault();
        form.replaceWith(Object.assign(document.createElement("p"), {
          className: "legacy-comments-closed",
          textContent: "Комментарии к этой записи закрыты.",
        }));
        return;
      }
      if (!form?.matches(".wpcf7-form")) return;
      event.preventDefault();
      const data = new FormData(form);
      const status = form.querySelector<HTMLElement>(".wpcf7-response-output");
      const consent = [...data.keys()].some((key) => key.startsWith("acceptance"));
      const email = data.get("your-email") ?? data.get("email") ?? "";
      const message = data.get("your-message") ?? data.get("message") ?? "";
      const photoLink = data.get("href_photo");
      const wishes = data.get("pozhelaniya");
      const extraMessage = [
        photoLink ? `Ссылка на фото: ${photoLink}` : "",
        wishes ? `Пожелания: ${wishes}` : "",
      ].filter(Boolean).join("\n");
      const payload = {
        kind: email || message ? "message" : "callback",
        name: data.get("your-name") ?? data.get("name") ?? "",
        phone: data.get("your-phone") ?? data.get("phone") ?? "",
        email,
        message: message || extraMessage,
        address: data.get("address") ?? "",
        formStartedAt: legacyFormStartedAt.get(form) ?? 0,
        consent,
        sourcePath: window.location.pathname,
      };
      form.classList.remove("init", "sent", "failed");
      form.classList.add("submitting");
      if (status) {
        status.textContent = "Отправляем…";
        status.setAttribute("aria-hidden", "false");
        status.style.display = "block";
      }
      try {
        const response = await fetch("/api/contact/", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as { error?: string; saved?: boolean; notified?: boolean };
        if (!response.ok) throw new Error(result.error || "Не удалось отправить форму.");
        form.reset();
        legacyFormStartedAt.set(form, Date.now());
        setLegacyFormStatus(
          form,
          "sent",
          result.saved && result.notified === false
            ? "Заявка сохранена. Почтовое уведомление задерживается, но обращение уже доступно нам в системе."
            : "Спасибо! Заявка принята. Мы скоро свяжемся с вами.",
        );
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Не удалось отправить форму.";
        setLegacyFormStatus(form, "failed", `${reason} Позвоните 8 (985) 434-23-67 или напишите на 79854342367@yandex.ru.`);
      }
    };

    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit);
      if (!isHomepage) document.body.className = previous;
    };
  }, [bodyClass]);

  return null;
}
