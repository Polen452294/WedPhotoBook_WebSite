import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import { faqs } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Фотокнига на заказ в Москве — под ключ за 7 дней",
  description:
    "Заказать фотокнигу на заказ в Москве — от 8 900 руб. Индивидуальный дизайн, от 1 экз. Пришлите фото — сделаем под ключ за 7 дней.",
  alternates: { canonical: "/" },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["ProfessionalService", "Organization"],
      "@id": "https://wedfotobook.ru/#organization",
      name: "Фотокниги под ключ — wedfotobook.ru",
      url: "https://wedfotobook.ru/",
      telephone: "+7-985-434-23-67",
      email: "79854342367@yandex.ru",
      areaServed: "Москва и Россия",
      priceRange: "₽₽",
      openingHours: "Mo-Su 09:00-21:00",
    },
    {
      "@type": "Service",
      name: "Изготовление фотокниг на заказ",
      provider: { "@id": "https://wedfotobook.ru/#organization" },
      offers: { "@type": "Offer", price: "8900", priceCurrency: "RUB", availability: "https://schema.org/InStock" },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
  ],
};

export default function Home() {
  return <><HomePage /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /></>;
}
