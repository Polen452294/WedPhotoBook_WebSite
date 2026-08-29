import Image from "next/image";
import { articles } from "@/lib/articles";

export function BlogPage() {
  return (
    <main className="blog-page">
      <section className="blog-journal" aria-label="Статьи о фотокнигах">
        <div className="shell">
          <div className="blog-section-heading">
            <span className="section-kicker">Статьи</span>
            <h1>Блог о фотокнигах</h1>
            <span className="blog-heading-line" aria-hidden="true" />
          </div>

          <div className="blog-grid">
            {articles.map((article) => (
              <article className="blog-card" key={article.slug}>
                <a href={`/${article.slug}/`} className="blog-card-image" aria-label={article.title}>
                  <Image src={article.image} alt={article.title} fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" />
                  <span className="blog-card-number">{String(article.number).padStart(2, "0")}</span>
                </a>
                <div className="blog-card-copy">
                  <span>Статья {article.number}</span>
                  <h2><a href={`/${article.slug}/`}>{article.title}</a></h2>
                  <a className="blog-card-link" href={`/${article.slug}/`}>Читать статью <span aria-hidden="true">→</span></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
