"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- a native legal link needs no router preload */
import { useEffect, useId, useState } from "react";
import { readCookieConsent, saveCookieConsent } from "@/lib/cookie-consent";

export function CookieNotice() {
  const descriptionId = useId();
  const [ready, setReady] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readCookieConsent();
      setNoticeOpen(!stored);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const open = () => setNoticeOpen(true);
    window.addEventListener("wedfotobook:request-cookie-consent", open);
    return () => window.removeEventListener("wedfotobook:request-cookie-consent", open);
  }, []);

  function choose(value: boolean) {
    saveCookieConsent(value);
    setNoticeOpen(false);
  }

  if (!ready) return null;

  return (
    <>
      {noticeOpen && (
        <div
          className="cookie-consent"
          role="dialog"
          aria-modal="false"
          aria-label="Настройки файлов cookies"
          aria-describedby={descriptionId}
        >
          <div className="cookie-consent-mark" aria-hidden="true">✓</div>
          <div className="cookie-consent-content">
            <span className="cookie-consent-kicker">Конфиденциальность</span>
            <h2>Cookie</h2>
            <p id={descriptionId}>
              Мы используем cookie для работы сайта и аналитики. Подробнее — в <a href="/cookie/">Политике использования cookie-файлов</a>.
            </p>
          </div>

          <div className="cookie-consent-actions">
            <button className="cookie-button cookie-button-primary" type="button" onClick={() => choose(true)}>Принять</button>
            <button className="cookie-button cookie-button-secondary" type="button" onClick={() => choose(false)}>Отклонить</button>
          </div>
        </div>
      )}

    </>
  );
}
