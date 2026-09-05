import type { Metadata, Viewport } from "next";
import { GA_MEASUREMENT_ID, YANDEX_COUNTER_ID } from "@/lib/analytics-config";
import { BusinessStructuredData, SITE_URL } from "@/lib/seo";
import "./globals.css";

/* eslint-disable @next/next/no-img-element -- Yandex Metrika requires a noscript tracking pixel. */

const talkMeBootstrap = `
  (function () {
    var search = new URLSearchParams(window.location.search);
    if (window.location.pathname.indexOf("/admin") === 0 || search.has("cms_preview") || search.has("code_preview")) return;
    (function c(d,w,m,i) {
      window.supportAPIMethod = m;
      var s = d.createElement('script');
      s.id = 'supportScript';
      s.async = true;
      var id = 'd58741dc8f2861b47a7e46e1f5d5144b';
      s.src = (!i ? 'https://lcab.talk-me.ru/support/support.js' : 'https://static.site-chat.me/support/support.int.js') + '?h=' + id;
      s.onerror = i ? undefined : function(){c(d,w,m,true)};
      w[m] = w[m] ? w[m] : function(){(w[m].q = w[m].q ? w[m].q : []).push(arguments);};
      (d.head ? d.head : d.body).appendChild(s);
    })(document,window,'TalkMe');
  })();
`;

const analyticsBootstrap = `
  (function () {
    var gaId = ${JSON.stringify(GA_MEASUREMENT_ID)};
    var yandexId = ${YANDEX_COUNTER_ID};
    var retryDelays = [400, 1200, 3000, 8000];

    function excluded() {
      var search = new URLSearchParams(window.location.search);
      return window.location.pathname.indexOf("/admin") === 0 || search.has("cms_preview") || search.has("code_preview");
    }

    function readChoice() {
      try {
        var value = JSON.parse(window.localStorage.getItem("wedfotobook-cookie-consent-v2") || "null");
        return value && value.version === 2 && value.necessary === true && typeof value.analytics === "boolean" ? value : null;
      } catch (error) {
        return null;
      }
    }

    function protectFormFields() {
      document.querySelectorAll("input:not([type='checkbox']):not([type='hidden']), textarea").forEach(function (field) {
        field.classList.add("ym-disable-keys");
      });
    }

    function loadScript(id, src, attempt) {
      var savedChoice = readChoice();
      if (excluded() || (savedChoice && savedChoice.analytics === false)) return;
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
      if (excluded()) return;
      var choice = readChoice();
      if (choice && choice.analytics === false) return;

      window["ga-disable-" + gaId] = false;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

      if (!window.__wedfotobookGoogleAnalyticsInitialized) {
        window.gtag("consent", "default", {
          analytics_storage: choice && choice.analytics ? "granted" : "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
        window.gtag("js", new Date());
        window.gtag("config", gaId, {
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false
        });
        window.__wedfotobookGoogleAnalyticsInitialized = true;
      } else if (choice && choice.analytics) {
        window.gtag("consent", "update", { analytics_storage: "granted" });
      }
      loadScript("google-analytics", "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId), 0);

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

    function disableAnalytics() {
      window["ga-disable-" + gaId] = true;
      window["disableYaCounter" + yandexId] = true;
      if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
      if (window.ym && window.__wedfotobookYandexMetrikaInitialized) window.ym(yandexId, "destruct");
      document.getElementById("google-analytics")?.remove();
      document.getElementById("yandex-metrika")?.remove();
      document.cookie.split(";").forEach(function (entry) {
        var name = (entry.split("=")[0] || "").trim();
        if (!/^(_ga|_ym_|yandexuid|yuidss|ymex|gdpr|is_gdpr)/.test(name)) return;
        document.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax";
        if (window.location.hostname && window.location.hostname !== "localhost") {
          document.cookie = name + "=; Max-Age=0; Path=/; Domain=." + window.location.hostname + "; SameSite=Lax";
        }
      });
      try {
        Object.keys(window.localStorage).forEach(function (key) {
          if (/^(_ga|_ym|ym)/.test(key)) window.localStorage.removeItem(key);
        });
        Object.keys(window.sessionStorage).forEach(function (key) {
          if (/^(_ga|_ym|ym)/.test(key)) window.sessionStorage.removeItem(key);
        });
      } catch (error) {}
      window.__wedfotobookAnalyticsLoadStarted = false;
      window.__wedfotobookYandexMetrikaInitialized = false;
    }

    window.__wedfotobookStartAnalytics = startAnalytics;
    window.__wedfotobookDisableAnalytics = disableAnalytics;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", protectFormFields, { once: true });
    else protectFormFields();
    startAnalytics();
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
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#061d31" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html id="top" lang="ru"><head>
    <script id="talk-me-bootstrap" dangerouslySetInnerHTML={{ __html: talkMeBootstrap }} />
    <link rel="dns-prefetch" href="//www.googletagmanager.com" />
    <link rel="dns-prefetch" href="//region1.google-analytics.com" />
    <link rel="dns-prefetch" href="//mc.yandex.ru" />
    <link rel="dns-prefetch" href="//mc.yandex.com" />
    <link rel="describedby" href="/llms.txt" type="text/markdown" />
    <script id="analytics-bootstrap" dangerouslySetInnerHTML={{ __html: analyticsBootstrap }} />
    <BusinessStructuredData />
  </head><body>{children}<noscript><div><img src={`https://mc.yandex.ru/watch/${YANDEX_COUNTER_ID}`} width="1" height="1" style={{ position: "absolute", left: "-9999px" }} alt="" /></div></noscript></body></html>;
}
