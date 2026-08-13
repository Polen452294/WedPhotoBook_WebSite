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
      <form className="order-form" onSubmit={submit}>
        <label>Ваше имя<input name="name" autoComplete="name" required /></label>
        <label>Телефон<input name="phone" type="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" required /></label>
        <label>Ссылка на фото <small>(можно прислать потом в мессенджере)</small><input name="photos" type="url" /></label>
        <label>Пожелания<textarea name="message" rows={3} /></label>
        <label className="honeypot" aria-hidden="true">Адрес<input name="address" tabIndex={-1} autoComplete="off" /></label>
        <label className="checkbox"><input name="consent" type="checkbox" required />
          <span>Я соглашаюсь на <a href="/soglashenie/">обработку персональных данных</a> согласно <a href="/politika-obrabotki-personalnyh-dannyh/">политике конфиденциальности</a></span>
        </label>
        <button className="button" disabled={status === "sending"} type="submit">
          {status === "sending" ? "Отправка…" : "Отправить"}
        </button>
        {status === "success" && <p className="form-message success">Спасибо за ваше сообщение. Оно успешно отправлено.</p>}
        {status === "error" && <p className="form-message error">При отправке сообщения произошла ошибка. Пожалуйста, попробуйте ещё раз позже.</p>}
      </form>
    </dialog>
  );
}
