import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/Analytics";
import { OrderDialog } from "@/components/OrderDialog";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wedfotobook.ru"),
  title: { default: "Фотокниги на заказ в Москве", template: "%s | wedfotobook.ru" },
  description: "Фотокниги на заказ с индивидуальным дизайном, обработкой фотографий и печатью под ключ.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/favicon.png" },
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
  return <html lang="ru"><head><link rel="stylesheet" href="/wp-assets/wordpress.css?v=10" /><link rel="stylesheet" href="/wp-assets/home-original-fix.css?v=12" /><link rel="stylesheet" href="/wp-assets/first-version-home.css?v=27" /></head><body><OrderDialog />{children}<Analytics /></body></html>;
}
