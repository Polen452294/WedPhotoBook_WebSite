"use client";

import { useEffect } from "react";

const BODY_CLASSES = ["wordpress-clone", "cookies-not-set"];

function openOrderDialog() {
  document.querySelector<HTMLDialogElement>(".order-dialog")?.showModal();
}

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

export function LegacyEnhancements({ bodyClass }: { bodyClass: string }) {
  useEffect(() => {
    const previous = document.body.className;
    document.body.className = `${BODY_CLASSES.join(" ")} ${bodyClass}`.trim();

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

      if (target?.closest(".wpb-pcf-form-fire, .wpb-pcf-button, .fancybox-inline")) {
        event.preventDefault();
        openOrderDialog();
        return;
      }

      const cookieButton = target?.closest<HTMLElement>("#cn-accept-cookie, .cn-set-cookie");
      if (cookieButton) {
        event.preventDefault();
        window.localStorage.setItem("wedfotobook-cookie-consent", "accepted");
        window.dispatchEvent(new Event("wedfotobook:cookie-consent"));
        document.querySelector("#cookie-notice")?.remove();
        document.body.classList.remove("cookies-not-set");
        document.body.classList.add("cookies-set");
        return;
      }

      const scrollTopLink = target?.closest<HTMLAnchorElement>("a.scrollToTop");
      if (scrollTopLink) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
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
      if (!form?.matches(".wpcf7-form")) return;
      event.preventDefault();
      const data = new FormData(form);
      const status = form.querySelector<HTMLElement>(".wpcf7-response-output");
      const consent = [...data.keys()].some((key) => key.startsWith("acceptance"));
      const payload = {
        name: data.get("your-name") ?? data.get("name") ?? "",
        phone: data.get("your-phone") ?? data.get("phone") ?? "",
        photos: data.get("your-photo") ?? data.get("your-link") ?? data.get("photos") ?? "",
        message: data.get("your-message") ?? data.get("message") ?? "",
        address: data.get("address") ?? "",
        consent,
      };
      if (status) status.textContent = "Отправляем…";
      try {
        const response = await fetch("/api/contact/", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("send_failed");
        form.reset();
        if (status) status.textContent = "Спасибо! Заявка отправлена. Мы скоро свяжемся с вами.";
      } catch {
        if (status) status.innerHTML = "Не удалось отправить форму. Позвоните 8 (985) 434-23-67 или напишите на <a href=\"mailto:79854342367@yandex.ru\">79854342367@yandex.ru</a>.";
      }
    };

    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit);
      document.body.className = previous;
    };
  }, [bodyClass]);

  return null;
}
