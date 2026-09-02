import type { NextConfig } from "next";

const PUBLIC_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://mc.yandex.ru",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.yandex.ru https://*.yandex.net",
  "font-src 'self' data:",
  "connect-src 'self' https://*.yandex.ru https://*.yandex.net",
  "frame-src https://yandex.ru https://*.yandex.ru",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const COMMON_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
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
          { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; media-src 'self'; worker-src 'self' blob:" },
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
