import Image from "next/image";

const articles = [
  {
    number: "01",
    title: "Родословная фотокнига – идеальный подарок и семейная реликвия",
    href: "/article-genealogy/",
    image: "/media/covers/fotokniga-genealogia-wedfotobook-ru.webp",
  },
  {
    number: "02",
    title: "Выпускной альбом: 11 лет за пару оборотов фотокниги",
    href: "/article-vipysk/",
    image: "/media/covers/vipusk-albom-wedfotobook-ru.webp",
  },
  {
    number: "03",
    title: "Фотокнига про путешествия – увлекательная история поездки",
    href: "/article-travell/",
    image: "/media/covers/fotokniga-puteshedtvij-wedfotobook-ru.webp",
  },
  {
    number: "04",
    title: "Оживающие фотографии – сказка или реальность",
    href: "/article-alivefoto/",
    image: "/media/covers/fotokniga-alive-photo-wedfotobook-ru.webp",
  },
  {
    number: "05",
    title: "Популярный дизайн фотокниги на заказ: отзывы и комментарии",
    href: "/article-otziv/",
    image: "/media/home/dizain-fotoknigi-wedfotobook-ru.webp",
  },
  {
    number: "06",
    title: "Фотокнига на заказ: сохраните яркие моменты",
    href: "/statya-6-fotoknigi-na-zakaz-wedfotobook-ru/",
    image: "/media/home/fotokniga-na-zakaz-wedfotobook-ru.webp",
  },
] as const;

export function BlogPage() {
  return (
    <main className="blog-page">
      <section className="blog-hero">
        <div className="shell blog-hero-grid">
          <div className="blog-hero-copy">
            <span className="section-kicker">Блог о фотокнигах</span>
            <h1>Блог о фотокнигах</h1>
          </div>
          <p>Фотокнига на заказ от wedfotobook.ru: сохраните яркие моменты в премиальном исполнении</p>
        </div>
      </section>

      <section className="blog-journal" aria-label="Статьи о фотокнигах">
        <div className="shell">
          <div className="blog-section-heading">
            <span className="section-kicker">Шесть материалов</span>
            <h2>Статьи</h2>
            <span className="blog-heading-line" aria-hidden="true" />
          </div>

          <div className="blog-grid">
            {articles.map((article, index) => (
              <article className={`blog-card ${index === 0 ? "blog-card-featured" : ""}`} key={article.href}>
                <a href={article.href} className="blog-card-image" aria-label={article.title}>
                  <Image src={article.image} alt={article.title} fill sizes={index === 0 ? "(max-width: 760px) 100vw, 66vw" : "(max-width: 760px) 100vw, 33vw"} />
                  <span className="blog-card-number">{article.number}</span>
                </a>
                <div className="blog-card-copy">
                  <span>Статья {Number(article.number)}</span>
                  <h3><a href={article.href}>{article.title}</a></h3>
                  <a className="blog-card-link" href={article.href}>Читать статью <span aria-hidden="true">→</span></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
