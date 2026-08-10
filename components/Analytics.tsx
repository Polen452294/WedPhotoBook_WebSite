"use client";

import { useEffect } from "react";

const COUNTER_ID = 600494;
const CONSENT_KEY = "wedfotobook-cookie-consent";

function loadYandexMetrika() {
  if (document.getElementById("yandex-metrika")) return;

  const script = document.createElement("script");
  script.id = "yandex-metrika";
  script.text = `
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
    ym(${COUNTER_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
  `;
  document.head.appendChild(script);
}

export function Analytics() {
  useEffect(() => {
    if (window.localStorage.getItem(CONSENT_KEY) === "accepted") loadYandexMetrika();

    window.addEventListener("wedfotobook:cookie-consent", loadYandexMetrika);
    return () => window.removeEventListener("wedfotobook:cookie-consent", loadYandexMetrika);
  }, []);

  return null;
}
