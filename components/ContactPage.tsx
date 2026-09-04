"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { contacts } from "@/lib/site-data";

type Status = "idle" | "sending" | "success" | "saved" | "error";

const messengers = [
  { href: contacts.telegram, src: "/media/social/Tg wedfotobook .png", label: "Telegram", alt: "Написать в Telegram" },
  { href: contacts.whatsapp, src: "/media/social/Wapp wedfotobook .png", label: "WhatsApp", alt: "Написать в WhatsApp" },
  { href: contacts.max, src: "/media/social/Max wedfotobook .png", label: "MAX", alt: "Написать в мессенджере MAX" },
  { href: contacts.vk, src: "/media/social/Vk wedfotobook .png", label: "ВКонтакте", alt: "Страница WedFotoBook во ВКонтакте" },
] as const;

const mapAddress = "%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%A1%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%BD%D1%8B%D0%B9%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%2C%20%D0%B4.%2033";

export function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formStartedAt, setFormStartedAt] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setFormStartedAt(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.kind = "message";
    payload.sourcePath = window.location.pathname;

    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; saved?: boolean; notified?: boolean };
      if (!response.ok) throw new Error(result.error || "Не удалось отправить сообщение.");

      form.reset();
      setFormStartedAt(Date.now());
      setStatus(result.saved && result.notified === false ? "saved" : "success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось отправить сообщение.");
      setStatus("error");
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-layout-main">
        <div className="shell">
          <header className="contact-page-heading">
            <span className="section-kicker">Связаться с нами</span>
            <h1>
              <span className="contact-title-main">Контакты</span>
              <span className="contact-title-detail"><span className="contact-title-dash">—</span> фотокниги на заказ в Москве</span>
            </h1>
          </header>

          <div className="contact-layout-grid">
            <div className="contact-form-column">
              <header className="contact-column-heading">
                <span className="section-kicker">Напишите нам</span>
              </header>

              <form className="contact-journal-form" onSubmit={submit}>
                <div className="contact-form-row">
                  <label><span>Ваше имя</span><input className="ym-disable-keys" name="name" autoComplete="name" maxLength={120} required /></label>
                  <label><span>E-mail</span><input className="ym-disable-keys" name="email" type="email" autoComplete="email" maxLength={254} required /></label>
                </div>
                <label><span>Ваше сообщение</span><textarea className="ym-disable-keys" name="message" rows={7} maxLength={5000} required /></label>
                <label className="contact-honeypot" aria-hidden="true">Адрес<input className="ym-disable-keys" name="address" tabIndex={-1} autoComplete="off" /></label>
                <input name="formStartedAt" type="hidden" value={formStartedAt} readOnly />
                <label className="contact-consent">
                  <input name="consent" type="checkbox" required />
                  <span>Я соглашаюсь на <a href="/soglashenie/" target="_blank">обработку персональных данных</a> согласно <a href="/politika-obrabotki-personalnyh-dannyh/" target="_blank">политике конфиденциальности</a></span>
                </label>
                <div className="contact-form-action">
                  <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Отправляем…" : "Отправить"}</button>
                  {status === "success" && <p className="contact-form-status success" role="status">Спасибо! Сообщение отправлено.</p>}
                  {status === "saved" && <p className="contact-form-status success" role="status">Сообщение сохранено. Почтовое уведомление задерживается, но обращение уже доступно нам в системе.</p>}
                  {status === "error" && <p className="contact-form-status error" role="alert">{errorMessage}</p>}
                </div>
              </form>
            </div>

            <aside className="contact-info-column" aria-label="Способы связи">
              <div className="contact-info-list">
                <div className="contact-info-item"><small>Телефон</small><a href={contacts.phoneHref}>8 (985) 434-23-67</a></div>
                <div className="contact-info-item"><small>Режим работы</small><strong>с 9-00 до 21-00<br />без выходных</strong></div>
                <div className="contact-info-item"><small>Почта</small><a href={`mailto:${contacts.email}`}>79854342367@yandex.ru</a></div>
                <div className="contact-info-item"><small>Адрес</small><strong>Москва, Свободный проспект, д. 33</strong></div>
                <div className="contact-info-item contact-info-socials">
                  <small>Социальные сети</small>
                  <div className="contact-social-list">
                    {messengers.map((messenger) => (
                      <a className={messenger.label === "WhatsApp" ? "contact-social-whatsapp" : undefined} href={messenger.href} target="_blank" rel="noopener noreferrer" aria-label={messenger.label} key={messenger.label}>
                        <Image src={messenger.src} alt={messenger.alt} width={46} height={46} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="company-map-section contact-map-section" aria-labelledby="contact-map-title">
        <div className="shell company-map-grid">
          <div className="company-map-copy">
            <span className="section-kicker">Адрес</span>
            <h2 id="contact-map-title">Мы на карте</h2>
            <p>Москва, Свободный проспект, д. 33</p>
            <a href={`https://yandex.ru/maps/?mode=search&text=${mapAddress}`} target="_blank" rel="noopener noreferrer">
              Открыть в Яндекс Картах <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="company-map-visual">
            <div className="company-map-frame">
              <iframe src={`https://yandex.ru/map-widget/v1/?mode=search&text=${mapAddress}&z=16`} title="Яндекс Карта: Москва, Свободный проспект, д. 33" loading="lazy" allowFullScreen />
            </div>
            <p className="company-map-notice">Пожалуйста, не приезжайте без предварительного звонка.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
