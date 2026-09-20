"use client";

import { useEffect, useState } from "react";
import { COOKIE_CONSENT_EVENT, CookieConsent, readCookieConsent } from "@/lib/cookie-consent";

export function ConsentControlledIframe({ src, title }: { src: string; title: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAllowed(readCookieConsent()?.analytics === true), 0);
    const update = (event: Event) => {
      setAllowed((event as CustomEvent<CookieConsent>).detail.analytics === true);
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(COOKIE_CONSENT_EVENT, update);
    };
  }, []);

  if (allowed) return <iframe src={src} title={title} loading="lazy" allowFullScreen />;

  return (
    <div className="consent-embed-placeholder">
      <p>Карта загрузится только после вашего согласия на использование куки.</p>
      <button type="button" onClick={() => window.dispatchEvent(new Event("wedfotobook:request-cookie-consent"))}>
        Настроить куки
      </button>
    </div>
  );
}
