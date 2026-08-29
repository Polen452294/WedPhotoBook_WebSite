"use client";

import { useEffect } from "react";
import { COOKIE_CONSENT_EVENT, CookieConsent, readCookieConsent } from "@/lib/cookie-consent";

const COUNTER_ID = 600494;
const METRIKA_SCRIPT_ID = "yandex-metrika";
const ANALYTICS_SESSION_KEY = "wedfotobook_analytics_session";

function analyticsSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function deviceType(): "desktop" | "tablet" | "mobile" {
  if (window.innerWidth < 680) return "mobile";
  if (window.innerWidth < 1100) return "tablet";
  return "desktop";
}

function referrerLabel(): string {
  if (!document.referrer) return "Прямой переход";
  try {
    const url = new URL(document.referrer);
    return url.origin === window.location.origin ? "Переход по сайту" : url.hostname.replace(/^www\./, "");
  } catch {
    return "Другой источник";
  }
}

function sendFirstPartyEvent(eventType: "page_view" | "click", details: Record<string, string> = {}) {
  const body = JSON.stringify({
    eventType,
    pagePath: window.location.pathname,
    sessionId: analyticsSessionId(),
    device: deviceType(),
    ...details,
  });
  void fetch("/api/analytics/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

function startFirstPartyAnalytics(): () => void {
  const search = new URLSearchParams(window.location.search);
  if (window.location.pathname.startsWith("/admin") || search.has("cms_preview") || search.has("code_preview")) return () => undefined;
  sendFirstPartyEvent("page_view", { referrer: referrerLabel() });
  const handleClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("a, button, [role='button']") : null;
    if (!target || target.dataset.analyticsIgnore === "true") return;
    const label = (target.innerText || target.getAttribute("aria-label") || target.getAttribute("title") || "Клик").replace(/\s+/g, " ").trim().slice(0, 180);
    const destination = target instanceof HTMLAnchorElement ? target.getAttribute("href") ?? "" : target.dataset.orderOpen === "true" ? "Форма заказа" : "Кнопка";
    sendFirstPartyEvent("click", { label, target: destination });
  };
  document.addEventListener("click", handleClick, { capture: true });
  return () => document.removeEventListener("click", handleClick, { capture: true });
}

function loadYandexMetrika() {
  if (document.getElementById(METRIKA_SCRIPT_ID)) return;

  window.ym = window.ym || function (...args: unknown[]) {
    (window.ym!.a = window.ym!.a || []).push(args);
  };
  window.ym.l = Date.now();

  const script = document.createElement("script");
  script.id = METRIKA_SCRIPT_ID;
  script.async = true;
  script.src = "https://mc.yandex.ru/metrika/tag.js";
  script.addEventListener("load", () => {
    window.ym?.(COUNTER_ID, "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false,
    });
  }, { once: true });
  document.head.appendChild(script);
}

function clearMetrikaStorage() {
  window.ym?.(COUNTER_ID, "destruct");
  document.getElementById(METRIKA_SCRIPT_ID)?.remove();
  const cookiePrefixes = ["_ym_", "yandexuid", "yuidss", "ymex", "gdpr", "is_gdpr"];
  document.cookie.split(";").forEach((entry) => {
    const name = entry.split("=")[0]?.trim();
    if (!name || !cookiePrefixes.some((prefix) => name.startsWith(prefix))) return;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname}; SameSite=Lax`;
  });
  try {
    Object.keys(window.localStorage).forEach((key) => {
      if (key.startsWith("_ym") || key.startsWith("ym")) window.localStorage.removeItem(key);
    });
  } catch {
    // Storage may be unavailable in privacy mode.
  }
}

export function Analytics() {
  useEffect(() => {
    let stopFirstParty = () => undefined;
    let firstPartyStarted = false;
    const startFirstParty = () => {
      if (!firstPartyStarted) {
        stopFirstParty = startFirstPartyAnalytics();
        firstPartyStarted = true;
      }
    };
    const stopFirstPartyAnalytics = () => {
      stopFirstParty();
      firstPartyStarted = false;
    };

    if (readCookieConsent()?.analytics) loadYandexMetrika();
    if (readCookieConsent()?.analytics) startFirstParty();

    const update = (event: Event) => {
      const consent = (event as CustomEvent<CookieConsent>).detail;
      if (consent.analytics) loadYandexMetrika();
      else clearMetrikaStorage();
      if (consent.analytics) startFirstParty();
      else stopFirstPartyAnalytics();
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, update);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, update);
      stopFirstParty();
    };
  }, []);

  return null;
}

declare global {
  interface Window {
    ym?: ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };
  }
}
