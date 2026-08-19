"use client";

import { useEffect } from "react";
import { COOKIE_CONSENT_EVENT, CookieConsent, readCookieConsent } from "@/lib/cookie-consent";

const COUNTER_ID = 600494;
const METRIKA_SCRIPT_ID = "yandex-metrika";

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
    if (readCookieConsent()?.analytics) loadYandexMetrika();

    const update = (event: Event) => {
      const consent = (event as CustomEvent<CookieConsent>).detail;
      if (consent.analytics) loadYandexMetrika();
      else clearMetrikaStorage();
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, update);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, update);
  }, []);

  return null;
}

declare global {
  interface Window {
    ym?: ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };
  }
}
