import Image from "next/image";
import Link from "next/link";
import { Gallery } from "@/components/Gallery";
import {
  catalogItems,
  contacts,
  getMediaGroup,
  pages,
  pricing,
  safeContent,
  type SitePage,
} from "@/lib/site-data";

function Breadcrumbs({ page }: { page: SitePage }) {
  return <nav className="breadcrumbs" aria-label="Хлебные крошки"><Link href="/">Главная</Link><span>›</span><span>{page.name}</span></nav>;
}

function PageHero({ page, image }: { page: SitePage; image?: string }) {
  return (
    <section className={`page-hero ${image ? "with-image" : ""}`}>
      <div className="shell page-hero-grid">
        <div><Breadcrumbs page={page} /><span className="eyebrow">Фотокниги под ключ · Москва</span><h1>{page.name.replace(/^Статья \d+\.\s*/, "")}</h1>{page.description && <p>{page.description}</p>}<button className="button" data-order-open type="button">Рассчитать стоимость</button></div>
        {image && <div className="page-hero-image"><Image src={image} alt={`Обложка: ${page.name.replace(/^Статья \d+\.\s*/, "")}`} width={500} height={500} priority /></div>}
      </div>
    </section>
  );
}

function CatalogIndex() {
  return (
    <section className="section"><div className="shell"><div className="catalog-grid light-catalog">
      {catalogItems.map((item) => <Link className="catalog-card" href={`/${item.slug}/`} key={item.slug}><Image src={item.cover} alt={item.coverAlt} width={500} height={500} /><div><h2>{item.title}</h2><p>{item.description}</p><span>Открыть галерею →</span></div></Link>)}
    </div></div></section>
  );
}

function PricingIndex() {
  return (
    <section className="section section-warm"><div className="shell"><div className="pricing-grid">
      {pricing.map((item, index) => <article className={`price-card ${index === 0 ? "featured" : ""}`} key={item.title}>{index === 0 && <span className="price-badge">Чаще выбирают</span>}<Image src={item.image} alt={item.imageAlt} width={960} height={518} /><div className="price-card-copy"><h2>{item.title}</h2><strong>{item.price}</strong><ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><Link href={item.href}>Подробная таблица цен →</Link></div></article>)}
    </div></div></section>
  );
}

function ReviewsPage() {
  const reviews = getMediaGroup("reviews");
  return <section className="section"><div className="shell"><div className="reviews-wall">{reviews.map((image) => <figure key={image.src}><Image src={image.src} alt={image.alt || "Отзыв о фотокниге"} width={image.width} height={image.height} loading="lazy" /></figure>)}</div><div className="center-action"><a className="button" href={contacts.yandex} target="_blank" rel="noreferrer">Читать отзывы на Яндекс Услугах</a></div></div></section>;
}

function ContactsPage() {
  return (
    <section className="section"><div className="shell contact-grid">
      <div className="contact-card"><span className="eyebrow">Телефон</span><a className="contact-big" href={contacts.phoneHref}>{contacts.phoneDisplay}</a><p>Ежедневно с 9:00 до 21:00</p></div>
      <div className="contact-card"><span className="eyebrow">Почта</span><a className="contact-big" href={`mailto:${contacts.email}`}>{contacts.email}</a><p>Пришлите ссылку на фотографии и кратко опишите идею.</p></div>
      <div className="contact-card contact-card-wide"><div><span className="eyebrow">Мессенджеры</span><h2>Пишите там, где удобно</h2><p>Telegram, WhatsApp, Max и ВКонтакте. Отвечаем без выходных.</p></div><div className="contact-buttons"><a href={contacts.telegram} target="_blank" rel="noreferrer">Telegram</a><a href={contacts.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a><a href={contacts.max} target="_blank" rel="noreferrer">Max</a><a href={contacts.vk} target="_blank" rel="noreferrer">ВКонтакте</a></div></div>
      <div className="contact-card contact-card-wide contact-order"><div><span className="eyebrow">Заказать фотокнигу</span><h2>Получите предварительный расчёт</h2><p>Оставьте телефон и расскажите, для какого события нужна книга.</p></div><button className="button" data-order-open type="button">Оставить заявку</button></div>
    </div></section>
  );
}

function BlogIndex() {
  const articles = pages.filter((item) => item.kind === "article" && item.slug !== "blog_fotoknigi");
  return <section className="section"><div className="shell article-grid">{articles.map((article, index) => <Link className="article-card" href={`/${article.slug}/`} key={article.slug}><span>0{index + 1}</span><h2>{article.name.replace(/^Статья \d+\.\s*/, "")}</h2><p>{article.description}</p><strong>Читать статью →</strong></Link>)}</div></section>;
}

export function ContentPage({ page }: { page: SitePage }) {
  const catalog = catalogItems.find((item) => item.slug === page.slug);
  const heroImage = catalog?.cover ?? (page.slug === "fotokniga-premium" ? pricing[0].image : page.slug === "fotokniga-standart" ? pricing[1].image : undefined);
  const showImportedContent = !["katalog", "otzyvy", "kontakty", "blog_fotoknigi"].includes(page.slug);

  return (
    <main>
      <PageHero page={page} image={heroImage} />
      {page.slug === "katalog" && <CatalogIndex />}
      {page.slug === "stoimost" && <PricingIndex />}
      {page.slug === "otzyvy" && <ReviewsPage />}
      {page.slug === "kontakty" && <ContactsPage />}
      {page.slug === "blog_fotoknigi" && <BlogIndex />}

      {showImportedContent && <section className={`section content-section ${page.kind === "legal" ? "legal-section" : ""}`}><article className="shell rich-content" dangerouslySetInnerHTML={{ __html: safeContent(page.bodyHtml) }} /></section>}

      {catalog && <section className="section gallery-section"><div className="shell"><div className="section-heading split-heading"><div><span className="eyebrow">Примеры работ</span><h2>{catalog.title}</h2></div><p>Нажмите на фотографию, чтобы рассмотреть разворот крупнее.</p></div><Gallery images={getMediaGroup(catalog.gallery)} title={catalog.title} /></div></section>}

      {page.kind !== "legal" && <section className="compact-cta"><div className="shell"><div><span className="eyebrow eyebrow-light">Бесплатная консультация</span><h2>Обсудим вашу фотокнигу?</h2><p>Подскажем формат, количество разворотов и точную стоимость.</p></div><button className="button button-light" data-order-open type="button">Получить расчёт</button></div></section>}
    </main>
  );
}
