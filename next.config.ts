import type { NextConfig } from "next";

const DEVELOPMENT_EVAL_SOURCE = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

// Talk-Me serves the widget, attachments and live connections from these domains.
const TALK_ME_SOURCES = "https://lcab.talk-me.ru https://*.site-chat.me https://*.me-talk.ru";
const TALK_ME_CONNECTIONS = `${TALK_ME_SOURCES} wss://*.site-chat.me wss://*.me-talk.ru`;

const YANDEX_METRIKA_ORIGINS = [
  "https://mc.yandex.ru", "https://mc.yandex.az", "https://mc.yandex.by", "https://mc.yandex.co.il",
  "https://mc.yandex.com", "https://mc.yandex.com.am", "https://mc.yandex.com.ge", "https://mc.yandex.com.tr",
  "https://mc.yandex.ee", "https://mc.yandex.fr", "https://mc.yandex.kg", "https://mc.yandex.kz",
  "https://mc.yandex.lt", "https://mc.yandex.lv", "https://mc.yandex.md", "https://mc.yandex.tj",
  "https://mc.yandex.tm", "https://mc.yandex.uz", "https://mc.webvisor.com", "https://mc.webvisor.org",
];
const YANDEX_METRIKA_FRAMES = [
  "https://metrika.yandex.ru", "https://analytics.yandex.by", "https://analytics.yandex.com",
  "https://analytics.yandex.com.tr", "https://analytics.yandex.kz", "https://analytics.yandex.ru",
  "https://metr.yandex.by", "https://metr.yandex.com", "https://metr.yandex.com.tr", "https://metr.yandex.kz",
  "https://metr.yandex.ru", "https://metrica.ya.ru", "https://metrica.yandex", "https://metrica.yandex.by",
  "https://metrica.yandex.com", "https://metrica.yandex.com.tr", "https://metrica.yandex.kz",
  "https://metrica.yandex.ru", "https://metrika.ya.ru", "https://metrika.yandex",
  "https://metrika.yandex.by", "https://metrika.yandex.com", "https://metrika.yandex.com.tr",
  "https://metrika.yandex.kz", "https://metrika.yandex.uz",
];
const YANDEX_METRIKA_SOURCES = YANDEX_METRIKA_ORIGINS.join(" ");
const YANDEX_METRIKA_CONNECTIONS = [
  ...YANDEX_METRIKA_ORIGINS,
  ...YANDEX_METRIKA_ORIGINS.map((origin) => origin.replace("https://", "wss://")),
].join(" ");

const PUBLIC_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors 'self' ${YANDEX_METRIKA_FRAMES.join(" ")}`,
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${DEVELOPMENT_EVAL_SOURCE} https://www.googletagmanager.com ${YANDEX_METRIKA_SOURCES} https://yastatic.net ${TALK_ME_SOURCES}`,
  `style-src 'self' 'unsafe-inline' ${TALK_ME_SOURCES}`,
  `img-src 'self' data: blob: https://*.yandex.ru https://*.yandex.net ${YANDEX_METRIKA_SOURCES} https://*.google-analytics.com https://www.googletagmanager.com ${TALK_ME_SOURCES}`,
  `font-src 'self' data: ${TALK_ME_SOURCES}`,
  `connect-src 'self' https://*.yandex.ru https://*.yandex.net ${YANDEX_METRIKA_CONNECTIONS} https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com ${TALK_ME_CONNECTIONS}`,
  `child-src 'self' blob: ${YANDEX_METRIKA_SOURCES}`,
  `frame-src 'self' blob: https://yandex.ru https://*.yandex.ru ${YANDEX_METRIKA_SOURCES} ${TALK_ME_SOURCES}`,
  `media-src 'self' blob: ${TALK_ME_SOURCES}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const ADMIN_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${DEVELOPMENT_EVAL_SOURCE}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

const COMMON_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Content-Security-Policy", value: PUBLIC_CONTENT_SECURITY_POLICY },
];

const PRIVATE_HEADERS = [
  { key: "Cache-Control", value: "private, no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  trailingSlash: true,
  serverExternalPackages: ["better-sqlite3"],
  images: { unoptimized: true },
  experimental: { inlineCss: true },
  async headers() {
    return [
      { source: "/:path*", headers: COMMON_HEADERS },
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=300, stale-while-revalidate=86400" },
          {
            key: "Link",
            value: '</media/responsive/c465bcb8000c362c-384.avif>; rel=preload; as=image; type="image/avif"; imagesrcset="/media/responsive/c465bcb8000c362c-320.avif 320w, /media/responsive/c465bcb8000c362c-384.avif 384w, /media/responsive/c465bcb8000c362c-480.avif 480w, /media/responsive/c465bcb8000c362c-640.avif 640w, /media/responsive/c465bcb8000c362c-800.avif 800w, /media/responsive/c465bcb8000c362c-960.avif 960w, /media/responsive/c465bcb8000c362c-1280.avif 1280w, /media/responsive/c465bcb8000c362c-1600.avif 1600w, /media/responsive/c465bcb8000c362c-1767.avif 1767w"; imagesizes="(max-width: 359px) calc(100vw - 58px), (max-width: 559px) calc(61vw - 44px), (max-width: 767px) 298px, 50vw"; fetchpriority=high',
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          ...PRIVATE_HEADERS,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: ADMIN_CONTENT_SECURITY_POLICY },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          ...PRIVATE_HEADERS,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'" },
        ],
      },
      { source: "/media/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/wp-content/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/wp-assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
