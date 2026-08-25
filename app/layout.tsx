import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/Analytics";
import { CookieNotice } from "@/components/CookieNotice";
import { OrderDialog } from "@/components/OrderDialog";
import { BusinessStructuredData, SITE_URL } from "@/lib/seo";
import "./globals.css";

/* eslint-disable @next/next/no-css-tags -- captured WordPress stylesheets are static public assets shared by all legacy pages */

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
    images: [{ url: "/og.png", width: 1729, height: 911, alt: "Фотокнига на заказ — wedfotobook.ru" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Фотокнига на заказ — под ключ за 7 дней",
    description: "Индивидуальный дизайн, обработка фотографий и печать фотокниги.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#061d31" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html id="top" lang="ru"><head><link rel="stylesheet" href="/wp-assets/wordpress.css?v=10" /><link rel="stylesheet" href="/wp-assets/home-original-fix.css?v=50" /><link rel="stylesheet" href="/wp-assets/first-version-home.css?v=68" /><BusinessStructuredData /></head><body><OrderDialog />{children}<CookieNotice /><Analytics /></body></html>;
}
