import Image from "next/image";

type PricingDetailSlug =
  | "fotokniga-premium"
  | "fotokniga-standart"
  | "vypusknye-fotoknigi-stoimost"
  | "fotoknigi-s-dopolnennoj-realnostju-stoim";

type PriceRow = {
  pages: string;
  photos: string;
  prices: [string, string, string, string];
};

type BookPricingPage = {
  kind: "book";
  eyebrow: string;
  title: string;
  price: string;
  description: string;
  hero: string;
  images: string[];
  features: string[];
  tableTitle: string;
  rows: PriceRow[];
  services: string[];
  faq?: [string, string][];
};

type SimplePricingPage = {
  kind: "graduation" | "alive";
  eyebrow: string;
  title: string;
  price: string;
  description: string;
  hero: string;
  images: string[];
  features: string[];
};

const premiumImages = [
  "/media/pricing-details/premium/premium-01-wedfotobook-ru.webp",
  "/media/pricing-details/premium/premium-02-wedfotobook-ru.webp",
  "/media/pricing-details/premium/premium-03-wedfotobook-ru.webp",
  "/media/pricing-details/premium/premium-04-wedfotobook-ru.webp",
];

const standardImages = [
  "/media/pricing-details/standard/standard-01-wedfotobook-ru.webp",
  "/media/pricing-details/standard/standard-02-wedfotobook-ru.webp",
  "/media/pricing-details/standard/standard-03-wedfotobook-ru.webp",
  "/media/pricing-details/standard/standard-04-wedfotobook-ru.webp",
];

const graduationImages = Array.from(
  { length: 12 },
  (_, index) => `/media/gallery/graduation/graduation-${String(index + 1).padStart(2, "0")}-wedfotobook-ru.webp`,
);

const pages: Record<PricingDetailSlug, BookPricingPage | SimplePricingPage> = {
  "fotokniga-premium": {
    kind: "book",
    eyebrow: "Стоимость · Фотокнига Премиум",
    title: "Фотокнига Премиум",
    price: "от 8 900 руб.",
    description: "Обработка фотографий, индивидуальный дизайн фотокниги, согласование макета и печать уже входят в стоимость.",
    hero: premiumImages[0],
    images: premiumImages,
    features: [
      "Толстая глянцевая фотообложка",
      "Красивый квадратный корешок",
      "Плотные страницы (матовые или глянцевые)",
      "Фотопечать",
      "Панорамный разворот (180 градусов)",
      "Повышенная прочность и долговечность",
      "Скидка 30% со второго экземпляра",
    ],
    tableTitle: "Стоимость фотокниги Премиум",
    rows: [
      { pages: "20 (10 развор.)", photos: "30–60 шт.", prices: ["8 900", "9 700", "9 900", "10 600"] },
      { pages: "30 (15 развор.)", photos: "60–90 шт.", prices: ["12 700", "13 700", "14 000", "14 900"] },
      { pages: "40 (20 развор.)", photos: "90–120 шт.", prices: ["16 400", "17 700", "18 100", "19 300"] },
      { pages: "50 (25 развор.)", photos: "120–150 шт.", prices: ["20 200", "21 700", "22 200", "23 600"] },
      { pages: "60 (30 развор.)", photos: "150–180 шт.", prices: ["24 100", "25 800", "26 300", "28 000"] },
      { pages: "70 (35 развор.)", photos: "180–210 шт.", prices: ["27 700", "29 800", "30 400", "32 300"] },
      { pages: "80 (40 развор.)", photos: "210–240 шт.", prices: ["31 400", "33 900", "34 500", "36 700"] },
      { pages: "90 (45 развор.)", photos: "240–270 шт.", prices: ["35 200", "38 000", "38 700", "41 000"] },
      { pages: "100 (50 развор.)", photos: "270–300 шт.", prices: ["38 900", "42 100", "42 800", "45 400"] },
      { pages: "110 (55 развор.)", photos: "300–330 шт.", prices: ["42 600", "46 100", "46 900", "49 800"] },
      { pages: "120 (60 развор.)", photos: "330–360 шт.", prices: ["46 400", "50 200", "51 000", "54 100"] },
    ],
    services: [
      "Ретушь фотографий — 100 руб/фото",
      "Декоративные элементы в дизайне (сердечки, цветы, голуби и т.д.) — 100 руб./разворот",
      "Восстановление старых черно-белых фотографий — от 150 руб.",
      "Срочный заказ (фотокниги через 4 дня) — на 50% больше",
      "Доставка на пункт выдачи Боксберри (50–350 руб.) или курьером в пределах МКАД (350 руб.)",
    ],
    faq: [
      ["Чем «Премиум» отличается от «Стандарта»?", "У «Премиум» твёрдая фотообложка, плотные листы и панорамный разворот, который раскрывается без разрыва по центру. У «Стандарта» — твёрдая обложка и «мягкие» листы."],
      ["Что такое панорамный разворот?", "Это разворот, где фото или коллаж занимает обе страницы целиком, без белой полосы и обрыва по линии сгиба — идеально для крупных кадров."],
      ["Сколько стоит фотокнига «Премиум»?", "От 8 900 ₽; обработка фото и печать включены, а правки макета — без доплат."],
      ["Можно ли выбрать кожаную или тканевую обложку?", "Да, обложку можно сделать в коже или ткани — звоните или пишите, подберём вариант."],
      ["За сколько дней изготовите «Премиум»?", "В среднем за 7 дней; есть срочный заказ за 4 дня (дороже на 50%)."],
    ],
  },
  "fotokniga-standart": {
    kind: "book",
    eyebrow: "Стоимость · Фотокнига Стандарт",
    title: "Фотокнига Стандарт",
    price: "от 9 800 руб.",
    description: "Обработка фотографий, индивидуальный дизайн фотокниги, согласование макета и печать уже входят в стоимость.",
    hero: standardImages[0],
    images: standardImages,
    features: [
      "Толстая глянцевая фотообложка",
      "Красивый квадратный корешок",
      "Журнальные страницы",
      "Часть страницы уходит в переплет",
      "Повышенная прочность и долговечность",
      "Скидка 30% со второго экземпляра",
    ],
    tableTitle: "Стоимость фотокниги Стандарт",
    rows: [
      { pages: "24", photos: "50–70 шт.", prices: ["9 800", "10 800", "11 300", "12 800"] },
      { pages: "30", photos: "70–90 шт.", prices: ["12 100", "13 100", "13 600", "15 100"] },
      { pages: "50", photos: "120–150 шт.", prices: ["18 600", "20 100", "20 600", "22 600"] },
      { pages: "70", photos: "180–210 шт.", prices: ["25 600", "27 100", "27 600", "29 600"] },
      { pages: "100", photos: "270–300 шт.", prices: ["35 600", "37 100", "37 600", "40 100"] },
      { pages: "130", photos: "370–400 шт.", prices: ["45 100", "47 300", "47 900", "51 100"] },
      { pages: "160", photos: "450–480 шт.", prices: ["54 600", "57 600", "58 100", "61 100"] },
    ],
    services: [
      "Ретушь фотографий — 100 руб/фото",
      "Декоративные элементы в дизайне (сердечки, цветы, голуби и т.д.) — 100 руб./разворот",
      "Восстановление старых черно-белых фотографий — от 150 руб.",
      "Срочный заказ (фотокниги через 4 дня) — на 50% больше",
      "Доставка на пункт выдачи Боскберри (50–350 руб.) или курьером в пределах МКАД (350 руб.)",
    ],
  },
  "vypusknye-fotoknigi-stoimost": {
    kind: "graduation",
    eyebrow: "Стоимость · Выпускные альбомы",
    title: "Выпускные альбомы",
    price: "от 1 500 руб.",
    description: "Можно сделать фотокнигу Премиум (плотные листы) или Стандарт (журнальные листы).",
    hero: graduationImages[0],
    images: graduationImages,
    features: [
      "Фотокнига Премиум (плотные листы) или Стандарт (журнальные листы)",
      "Количество разворотов от 1 до 60",
      "Форматы 20×20, 20×28 и 28×20",
      "Заказ от 10 экземпляров",
      "Индивидуальный дизайн",
      "Согласование каждого макета",
    ],
  },
  "fotoknigi-s-dopolnennoj-realnostju-stoim": {
    kind: "alive",
    eyebrow: "Стоимость · Оживающие фото",
    title: "Оживающие фото",
    price: "300 руб. за фото",
    description: "В фотокнигу «Премиум» или «Стандарт» можно добавить любое количество оживающих фотографий.",
    hero: "/media/home/fotokniga-alive-photo-stoimost-wedfotobook-ru.webp",
    images: [
      "/wp-content/uploads/2021/04/D-001-optimized.jpg",
      "/wp-content/uploads/2021/04/D-002-optimized.jpg",
    ],
    features: [
      "Можно добавить в фотокнигу Премиум или Стандарт",
      "Любое количество оживающих фотографий",
      "Фотокнига «под ключ» — от 8 900 руб.",
      "Одно оживающее фото — 300 руб.",
    ],
  },
};

function OrderButton({ children = "Заказать" }: { children?: string }) {
  return <button className="button" data-order-open type="button">{children}</button>;
}

function Hero({ page }: { page: BookPricingPage | SimplePricingPage }) {
  return (
    <section className="pricing-detail-hero">
      <div className="shell pricing-detail-hero-grid">
        <div className="pricing-detail-hero-copy">
          <span className="eyebrow">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <div className="pricing-detail-price">{page.price}</div>
          <OrderButton children="Рассчитать стоимость" />
        </div>
        <figure className="pricing-detail-hero-image">
          <Image src={page.hero} alt={page.title} width={1200} height={800} priority />
        </figure>
      </div>
    </section>
  );
}

function Features({ page }: { page: BookPricingPage | SimplePricingPage }) {
  const featureList = (
    <ul className="pricing-detail-feature-list">
      {page.features.map((feature) => <li key={feature}>{feature}</li>)}
    </ul>
  );

  return (
    <section className="pricing-detail-section pricing-detail-features-section">
      {page.kind === "alive" ? (
        <div className="shell">
          <span className="eyebrow">Характеристики</span>
          <div className="pricing-detail-feature-layout pricing-detail-feature-layout-alive">
            {page.images[1] && (
            <figure className="pricing-detail-feature-image">
              <Image src={page.images[1]} alt={`${page.title} — пример`} width={1200} height={800} loading="lazy" />
            </figure>
            )}
            {featureList}
          </div>
        </div>
      ) : (
        <div className="shell pricing-detail-feature-layout">
          <div><span className="eyebrow">Характеристики</span><h2>{page.title}</h2></div>
          {featureList}
        </div>
      )}
    </section>
  );
}

function PhotoGallery({ page }: { page: BookPricingPage | SimplePricingPage }) {
  return (
    <section className="pricing-detail-section pricing-detail-gallery-section">
      <div className="shell">
        <header className="pricing-detail-section-heading">
          <div><span className="eyebrow">Фотографии</span><h2>{page.title}</h2></div>
        </header>
        <div className={`pricing-detail-gallery pricing-detail-gallery-${page.images.length}`}>
          {page.images.map((src, index) => (
            <figure key={src}>
              <Image src={src} alt={`${page.title} — фото ${index + 1}`} width={1200} height={800} loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function PriceTable({ page }: { page: BookPricingPage }) {
  return (
    <section className="pricing-detail-section pricing-detail-table-section">
      <div className="shell">
        <header className="pricing-detail-section-heading">
          <div><span className="eyebrow">Цены</span><h2>{page.tableTitle}</h2></div>
          <p>Обработка фотографий, индивидуальный дизайн, согласование макета и печать включены.</p>
        </header>
        <div className="pricing-detail-table-wrap">
          <table>
            <thead><tr><th>Количество страниц</th><th>Количество фотографий</th><th>20×20</th><th>28×20</th><th>25×25</th><th>30×30</th></tr></thead>
            <tbody>
              {page.rows.map((row) => (
                <tr key={row.pages}>
                  <th scope="row">{row.pages}</th><td>{row.photos}</td>
                  {row.prices.map((price, index) => <td key={`${row.pages}-${index}`}>{price} ₽</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pricing-detail-table-action"><OrderButton children="Заказать фотокнигу" /></div>
      </div>
    </section>
  );
}

function Services({ services }: { services: string[] }) {
  return (
    <section className="pricing-detail-section pricing-detail-services-section">
      <div className="shell pricing-detail-services-layout">
        <div><span className="eyebrow eyebrow-light">Дополнительно</span><h2>Дополнительные услуги</h2></div>
        <ul>{services.map((service) => <li key={service}>{service}</li>)}</ul>
      </div>
    </section>
  );
}

function PremiumFaq({ items }: { items: [string, string][] }) {
  return (
    <section className="pricing-detail-section pricing-detail-faq-section">
      <div className="shell pricing-detail-faq-layout">
        <div><span className="eyebrow">Частые вопросы</span><h2>О фотокниге «Премиум»</h2></div>
        <div className="pricing-detail-faq-list">
          {items.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}
        </div>
      </div>
    </section>
  );
}

function GraduationDetails() {
  const options = [
    "Все выпускные альбомы одинаковые для всех детей.",
    "Все выпускные альбомы одинаковые, но с персональной фотографией на обложке.",
    "Базовая часть (учителя и дети) одинаковая у всех, плюс персональные страницы для каждого ребёнка. Можно заказать только базовую часть или базовую часть с персональными страницами.",
    "Общий макет, но фотографии у каждого ребёнка свои.",
    "Можно добавить «оживающие» фотографии.",
  ];
  return (
    <section className="pricing-detail-section pricing-detail-options-section">
      <div className="shell pricing-detail-options-layout">
        <div>
          <span className="eyebrow">Варианты</span>
          <h2>Варианты выпускных альбомов</h2>
          <p>Услуга фотографа в стоимость фотокниги не входит. Но мы может порекомендовать вам отличного фотографа, с которым сотрудничаем уже много лет.</p>
        </div>
        <ol>{options.map((option) => <li key={option}>{option}</li>)}</ol>
      </div>
      <div className="shell pricing-detail-note">
        <p>Цена зависит от того, нужен ли вам фотограф, от вида выпускного альбома, формата, количества разворотов и количества экземпляров. Напишите мне в вотаспе 8-985-434-23-67, мы с вами обсудим, что вы хотите, и я сразу посчитаю по стоимости. Наши цены вас приятно удивят!</p>
        <OrderButton children="Получить расчёт" />
      </div>
    </section>
  );
}

export function PricingDetailPage({ slug }: { slug: PricingDetailSlug }) {
  const page = pages[slug];
  return (
    <main className={`pricing-detail-page pricing-detail-${page.kind} pricing-detail-${slug}`}>
      <Hero page={page} />
      <Features page={page} />
      {page.kind !== "alive" && <PhotoGallery page={page} />}
      {page.kind === "book" && <PriceTable page={page} />}
      {page.kind === "book" && <Services services={page.services} />}
      {page.kind === "book" && page.faq && <PremiumFaq items={page.faq} />}
      {page.kind === "graduation" && <GraduationDetails />}
    </main>
  );
}

export type { PricingDetailSlug };
