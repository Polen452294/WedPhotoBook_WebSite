import type { Metadata, Viewport } from "next";
import { YANDEX_COUNTER_ID } from "@/lib/analytics-config";
import { BusinessStructuredData, SITE_URL } from "@/lib/seo";
import "./globals.css";

const consentedServicesBootstrap = `
  (function () {
    var yandexId = ${YANDEX_COUNTER_ID};
    var retryDelays = [400, 1200, 3000, 8000];

    function excluded() {
      var search = new URLSearchParams(window.location.search);
      return window.location.pathname.indexOf("/admin") === 0 || search.has("cms_preview") || search.has("code_preview");
    }

    function readChoice() {
      try {
        var value = JSON.parse(window.localStorage.getItem("wedfotobook-cookie-consent-v4") || "null");
        return value && value.version === 4 && value.necessary === true && typeof value.analytics === "boolean" ? value : null;
      } catch (error) {
        return null;
      }
    }

    function protectFormFields() {
      document.querySelectorAll("input:not([type='checkbox']):not([type='hidden']), textarea").forEach(function (field) {
        field.classList.add("ym-disable-keys");
      });
    }

    function consentGranted() {
      var choice = readChoice();
      return choice && choice.analytics === true;
    }

    function loadScript(id, src, attempt) {
      if (excluded() || !consentGranted()) return;
      if (document.getElementById(id)) return;
      var script = document.createElement("script");
      script.id = id;
      script.async = true;
      script.fetchPriority = "low";
      script.src = src;
      script.onerror = function () {
        script.remove();
        var delay = retryDelays[attempt];
        if (delay !== undefined) window.setTimeout(function () { loadScript(id, src, attempt + 1); }, delay);
      };
      document.head.appendChild(script);
    }

    function startAnalytics() {
      if (excluded() || !consentGranted()) return;

      window["disableYaCounter" + yandexId] = false;
      window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
      window.ym.l = window.ym.l || Date.now();
      if (!window.__wedfotobookYandexMetrikaInitialized) {
        window.ym(yandexId, "init", {
          ssr: true,
          webvisor: true,
          clickmap: true,
          referrer: document.referrer,
          url: window.location.href,
          accurateTrackBounce: true,
          trackLinks: true
        });
        window.__wedfotobookYandexMetrikaInitialized = true;
      }
      loadScript("yandex-metrika", "https://mc.yandex.ru/metrika/tag.js?id=" + yandexId, 0);
      window.__wedfotobookAnalyticsLoadStarted = true;
    }

    function startSupport() {
      if (excluded() || !consentGranted() || document.getElementById("supportScript")) return;
      (function c(d,w,m,i) {
        window.supportAPIMethod = m;
        var s = d.createElement("script");
        s.id = "supportScript";
        s.async = true;
        var id = "d58741dc8f2861b47a7e46e1f5d5144b";
        s.src = (!i ? "https://lcab.talk-me.ru/support/support.js" : "https://static.site-chat.me/support/support.int.js") + "?h=" + id;
        s.onerror = i ? undefined : function(){c(d,w,m,true)};
        w[m] = w[m] ? w[m] : function(){(w[m].q = w[m].q ? w[m].q : []).push(arguments);};
        (d.head ? d.head : d.body).appendChild(s);
      })(document,window,"TalkMe");
    }

    function startConsentedServices() {
      if (!consentGranted()) return;
      startAnalytics();
      startSupport();
    }

    function disableAnalytics() {
      window["disableYaCounter" + yandexId] = true;
      if (window.ym && window.__wedfotobookYandexMetrikaInitialized) window.ym(yandexId, "destruct");
      document.getElementById("yandex-metrika")?.remove();
      document.cookie.split(";").forEach(function (entry) {
        var name = (entry.split("=")[0] || "").trim();
        if (!/^(_ym_|yandexuid|yuidss|ymex|gdpr|is_gdpr)/.test(name)) return;
        document.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax";
        if (window.location.hostname && window.location.hostname !== "localhost") {
          document.cookie = name + "=; Max-Age=0; Path=/; Domain=." + window.location.hostname + "; SameSite=Lax";
        }
      });
      try {
        Object.keys(window.localStorage).forEach(function (key) {
          if (/^(_ym|ym)/.test(key)) window.localStorage.removeItem(key);
        });
        Object.keys(window.sessionStorage).forEach(function (key) {
          if (/^(_ym|ym)/.test(key)) window.sessionStorage.removeItem(key);
        });
      } catch (error) {}
      window.__wedfotobookAnalyticsLoadStarted = false;
      window.__wedfotobookYandexMetrikaInitialized = false;
    }

    window.__wedfotobookStartConsentedServices = startConsentedServices;
    window.__wedfotobookDisableAnalytics = disableAnalytics;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", protectFormFields, { once: true });
    else protectFormFields();
    startConsentedServices();
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Фотокниги на заказ в Москве", template: "%s | wedfotobook.ru" },
  description: "Фотокниги на заказ с индивидуальным дизайном, обработкой фотографий и печатью под ключ.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "24x24", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Фотокниги под ключ",
    title: "Фотокнига на заказ в Москве — под ключ за 7 дней",
    description: "Индивидуальный дизайн, обработка фотографий, печать и доставка готовой фотокниги.",
    images: [{ url: "/og-1200x630.png", width: 1200, height: 630, alt: "Фотокнига на заказ — wedfotobook.ru" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Фотокнига на заказ — под ключ за 7 дней",
    description: "Индивидуальный дизайн, обработка фотографий и печать фотокниги.",
    images: ["/og-1200x630.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#061d31" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html id="top" lang="ru"><head>
    <link rel="describedby" href="/llms.txt" type="text/markdown" />
    <script id="consented-services-bootstrap" dangerouslySetInnerHTML={{ __html: consentedServicesBootstrap }} />
    <BusinessStructuredData />
  </head><body>{children}</body></html>;
}
