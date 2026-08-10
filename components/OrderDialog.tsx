"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export function OrderDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const open = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-order-open]")) return;
      event.preventDefault();
      setStatus("idle");
      dialogRef.current?.showModal();
    };
    document.addEventListener("click", open);
    return () => document.removeEventListener("click", open);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("send_failed");
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <dialog className="order-dialog" ref={dialogRef} onClick={(event) => {
      if (event.target === dialogRef.current) dialogRef.current.close();
    }}>
      <button className="dialog-close" type="button" aria-label="Закрыть" onClick={() => dialogRef.current?.close()}>×</button>
      <div className="dialog-copy">
        <span className="eyebrow">Обсудим вашу фотокнигу</span>
        <h2>Расскажите немного о заказе</h2>
        <p>Оставьте контакты — мы свяжемся с вами, уточним формат и предварительно рассчитаем стоимость.</p>
      </div>
      <form className="order-form" onSubmit={submit}>
        <label>Ваше имя<input name="name" autoComplete="name" required /></label>
        <label>Телефон<input name="phone" type="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" required /></label>
        <label>Ссылка на фотографии <small>необязательно</small><input name="photos" type="url" placeholder="Яндекс Диск или Облако Mail" /></label>
        <label>Пожелания <small>необязательно</small><textarea name="message" rows={3} /></label>
        <label className="honeypot" aria-hidden="true">Адрес<input name="address" tabIndex={-1} autoComplete="off" /></label>
        <label className="checkbox"><input name="consent" type="checkbox" required />
          <span>Я согласен с <a href="/politika-obrabotki-personalnyh-dannyh/">политикой обработки данных</a>.</span>
        </label>
        <button className="button button-wide" disabled={status === "sending"} type="submit">
          {status === "sending" ? "Отправляем…" : "Отправить заявку"}
        </button>
        {status === "success" && <p className="form-message success">Спасибо! Заявка отправлена. Мы скоро свяжемся с вами.</p>}
        {status === "error" && <p className="form-message error">Не удалось отправить форму. Позвоните нам или напишите на <a href="mailto:79854342367@yandex.ru">79854342367@yandex.ru</a>.</p>}
      </form>
    </dialog>
  );
}
