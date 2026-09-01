"use client";

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- native dialog backdrop clicks close the modal */

import { FormEvent, useEffect, useRef, useState } from "react";
import { renderTurnstile, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

type Status = "idle" | "sending" | "success" | "saved" | "error";

function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, 11);

  const area = digits.slice(1, 4);
  const first = digits.slice(4, 7);
  const second = digits.slice(7, 9);
  const third = digits.slice(9, 11);

  let formatted = "+7";
  if (area) formatted += ` (${area}${area.length === 3 ? ")" : ""}`;
  if (first) formatted += ` ${first}`;
  if (second) formatted += `-${second}`;
  if (third) formatted += `-${third}`;
  return formatted;
}

export function OrderDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [formStartedAt, setFormStartedAt] = useState(0);
  const turnstileSiteKey = TURNSTILE_SITE_KEY;

  useEffect(() => {
    const show = () => {
      setStatus("idle");
      setErrorMessage("");
      setFormStartedAt(Date.now());
      if (!dialogRef.current?.open) dialogRef.current?.showModal();
      if (turnstileSiteKey && turnstileRef.current) {
        void renderTurnstile(turnstileRef.current, {
          sitekey: turnstileSiteKey,
          theme: "light",
          language: "ru",
          size: "flexible",
          action: "callback",
          "response-field-name": "turnstileToken",
        }).then((widgetId) => {
          turnstileWidgetId.current = widgetId;
          window.turnstile?.reset(widgetId);
        }).catch(() => undefined);
      }
    };
    const open = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-order-open]")) return;
      event.preventDefault();
      show();
    };
    document.addEventListener("click", open);
    window.addEventListener("wedfotobook:open-order", show);
    return () => {
      document.removeEventListener("click", open);
      window.removeEventListener("wedfotobook:open-order", show);
    };
  }, [turnstileSiteKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.kind = "callback";
    payload.sourcePath = window.location.pathname;

    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; saved?: boolean; notified?: boolean };
      if (!response.ok) throw new Error(result.error || "Не удалось отправить заявку.");
      form.reset();
      setPhone("");
      setStatus(result.saved && result.notified === false ? "saved" : "success");
      if (turnstileWidgetId.current) window.turnstile?.reset(turnstileWidgetId.current);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось отправить заявку.");
      setStatus("error");
    }
  }

  return (
    <dialog className="order-dialog" ref={dialogRef} aria-labelledby="order-dialog-title" onClick={(event) => {
      if (event.target === dialogRef.current) dialogRef.current.close();
    }}>
      <button className="dialog-close" type="button" aria-label="Закрыть" onClick={() => dialogRef.current?.close()}>×</button>
      <form className="order-form" onSubmit={submit}>
        <header className="order-form-heading">
          <span className="order-form-kicker">Обратный звонок</span>
          <h2 id="order-dialog-title">Обсудим вашу фотокнигу</h2>
          <p>Оставьте имя и номер телефона. Мы перезвоним ежедневно с 9:00 до 21:00.</p>
        </header>
        <div className="order-fields">
          <label><span>Ваше имя</span><input name="name" autoComplete="name" placeholder="Как к вам обращаться?" maxLength={120} required /></label>
          <label><span>Телефон</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} minLength={18} required /></label>
        </div>
        <label className="honeypot" aria-hidden="true">Адрес<input name="address" tabIndex={-1} autoComplete="off" /></label>
        <input name="formStartedAt" type="hidden" value={formStartedAt} readOnly />
        <label className="checkbox"><input name="consent" type="checkbox" required />
          <span>Я соглашаюсь на <a href="/soglashenie/" target="_blank">обработку персональных данных</a> согласно <a href="/politika-obrabotki-personalnyh-dannyh/" target="_blank">политике конфиденциальности</a></span>
        </label>
        {turnstileSiteKey && (
          <div
            className="order-turnstile"
            ref={turnstileRef}
          />
        )}
        <div className="order-antispam" aria-label="Форма защищена от автоматических заявок">
          <span className="order-antispam-icon" aria-hidden="true">✓</span>
          <span><strong>Антиспам-защита включена</strong><small>Форма проверяется на сервере перед отправкой</small></span>
        </div>
        <button className="button order-submit" disabled={status === "sending"} type="submit">
          {status === "sending" ? "Отправляем…" : "Отправить"}
        </button>
        {status === "success" && <p className="form-message success" role="status">Спасибо! Заявка принята. Мы скоро свяжемся с вами.</p>}
        {status === "saved" && <p className="form-message success" role="status">Заявка сохранена. Почтовое уведомление задерживается, но обращение уже доступно нам в системе.</p>}
        {status === "error" && <p className="form-message error" role="alert">{errorMessage} Позвоните нам: <a href="tel:89854342367">8 (985) 434-23-67</a>.</p>}
      </form>
    </dialog>
  );
}
