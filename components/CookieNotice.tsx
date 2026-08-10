"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "wedfotobook-cookie-consent";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) !== "accepted");
  }, []);

  function accept() {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    window.dispatchEvent(new Event("wedfotobook:cookie-consent"));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="cookie-notice" aria-label="Уведомление об использовании cookies">
      <p>
        Мы используем cookies, чтобы сайт работал корректно и чтобы понимать, как его улучшают посетители. Подробнее — в{" "}
        <Link href="/politika-konfidencialnosti/">политике конфиденциальности</Link>.
      </p>
      <button className="button button-small" type="button" onClick={accept}>Хорошо</button>
    </aside>
  );
}
