"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- a native legal link needs no router preload */
import { useEffect, useId, useState } from "react";
import { readCookieConsent, saveCookieConsent } from "@/lib/cookie-consent";

export function CookieNotice() {
  const descriptionId = useId();
  const [ready, setReady] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readCookieConsent();
      setAnalytics(stored?.analytics ?? false);
      setNoticeOpen(!stored);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function choose(value: boolean) {
    saveCookieConsent(value);
    setAnalytics(value);
    setNoticeOpen(false);
    setPreferencesOpen(false);
  }

  if (!ready) return null;

  return (
    <>
      {(noticeOpen || preferencesOpen) && (
        <div
          className={`cookie-consent ${preferencesOpen ? "cookie-consent-expanded" : ""}`}
          role="dialog"
          aria-modal="false"
          aria-label="Настройки файлов cookies"
          aria-describedby={descriptionId}
        >
          <div className="cookie-consent-mark" aria-hidden="true">✓</div>
          <div className="cookie-consent-content">
            <span className="cookie-consent-kicker">Конфиденциальность</span>
            <h2>Настройки cookies</h2>
            <p id={descriptionId}>
              Обязательные cookies и локальное хранилище нужны для работы сайта. Аналитические cookies Яндекс Метрики включаются только с вашего согласия и помогают нам улучшать сайт.
            </p>

            {preferencesOpen && (
              <div className="cookie-preferences" aria-label="Категории cookies">
                <div className="cookie-preference-row">
                  <div>
                    <strong>Обязательные</strong>
                    <small>Сохраняют выбранные настройки и обеспечивают основные функции сайта. Всегда активны.</small>
                  </div>
                  <span className="cookie-status">Всегда включены</span>
                </div>
                <label className="cookie-preference-row cookie-preference-toggle">
                  <span>
                    <strong>Аналитические</strong>
                    <small>Яндекс Метрика: посещённые страницы, источник перехода, устройство и взаимодействие с сайтом. Срок хранения отдельных идентификаторов — до 1 года.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(event) => setAnalytics(event.target.checked)}
                    aria-label="Разрешить аналитические cookies"
                  />
                </label>
                <p className="cookie-details">
                  Поставщик аналитики — ООО «ЯНДЕКС». Сохранённый выбор можно удалить в настройках браузера. Подробнее — в{" "}
                  <a href="/politika-obrabotki-personalnyh-dannyh/">политике обработки персональных данных</a>.
                </p>
              </div>
            )}
          </div>

          <div className="cookie-consent-actions">
            {preferencesOpen ? (
              <>
                <button className="cookie-button cookie-button-primary" type="button" onClick={() => choose(analytics)}>Сохранить выбор</button>
                <button className="cookie-button cookie-button-secondary" type="button" onClick={() => choose(false)}>Отклонить необязательные</button>
              </>
            ) : (
              <>
                <button className="cookie-button cookie-button-primary" type="button" onClick={() => choose(true)}>Принять все</button>
                <button className="cookie-button cookie-button-secondary" type="button" onClick={() => choose(false)}>Отклонить необязательные</button>
                <button className="cookie-button cookie-button-link" type="button" onClick={() => setPreferencesOpen(true)}>Настроить</button>
              </>
            )}
          </div>
        </div>
      )}

    </>
  );
}
