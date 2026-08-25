import { contacts } from "@/lib/site-data";

export const SITE_URL = "https://wedfotobook.ru";
export const BUSINESS_ID = `${SITE_URL}/#business`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

function safeJsonLd(data: JsonLdValue): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: JsonLdValue }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />;
}

export function BusinessStructuredData() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "LocalBusiness",
            "@id": BUSINESS_ID,
            name: "WedFotoBook",
            alternateName: "wedfotobook.ru",
            legalName: "ИП Ардашева Елена Викторовна",
            url: `${SITE_URL}/`,
            logo: absoluteUrl("/media/brand/logo-wedfotobook-v2.png"),
            image: absoluteUrl("/og.png"),
            telephone: "+7-985-434-23-67",
            email: contacts.email,
            taxID: "772008137237",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Свободный проспект, д. 33",
              addressLocality: "Москва",
              addressCountry: "RU",
            },
            areaServed: { "@type": "City", name: "Москва" },
            openingHoursSpecification: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ],
              opens: "09:00",
              closes: "21:00",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+7-985-434-23-67",
              email: contacts.email,
              contactType: "customer service",
              availableLanguage: "Russian",
            },
            sameAs: [contacts.yandex, contacts.vk, contacts.telegram],
          },
          {
            "@type": "WebSite",
            "@id": WEBSITE_ID,
            url: `${SITE_URL}/`,
            name: "WedFotoBook",
            inLanguage: "ru-RU",
            publisher: { "@id": BUSINESS_ID },
          },
        ],
      }}
    />
  );
}

type PageStructuredDataProps = {
  title: string;
  description?: string;
  path: string;
  kind?: "WebPage" | "CollectionPage" | "Article";
  image?: string;
  service?: boolean;
};

export function PageStructuredData({
  title,
  description,
  path,
  kind = "WebPage",
  image,
  service = false,
}: PageStructuredDataProps) {
  const url = absoluteUrl(path);
  const pageId = `${url}#webpage`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": kind,
      "@id": pageId,
      url,
      name: title,
      ...(description ? { description } : {}),
      ...(image ? { image: absoluteUrl(image) } : {}),
      inLanguage: "ru-RU",
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": BUSINESS_ID },
      ...(kind === "Article" ? { headline: title, mainEntityOfPage: { "@id": pageId } } : {}),
    },
  ];

  if (service) {
    graph.push({
      "@type": "Service",
      "@id": `${url}#service`,
      url,
      name: title,
      ...(description ? { description } : {}),
      ...(image ? { image: absoluteUrl(image) } : {}),
      provider: { "@id": BUSINESS_ID },
      areaServed: { "@type": "City", name: "Москва" },
      mainEntityOfPage: { "@id": pageId },
    });
  }

  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
}
