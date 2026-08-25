import Link from "next/link";
import type { Article, ArticleBlock } from "@/lib/articles";

function ArticleBlockView({ block, index }: { block: ArticleBlock; index: number }) {
  if (block.type === "heading") return <h2>{block.text}</h2>;
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "qa") {
    return (
      <ol className="article-qa">
        {block.items.map((item) => (
          <li key={item.question}>
            <p>{item.question}</p>
            <p>{item.answer}</p>
          </li>
        ))}
      </ol>
    );
  }

  const List = block.ordered ? "ol" : "ul";
  return <List key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</List>;
}

export function ArticlePage({ article }: { article: Article }) {
  return (
    <main className={`article-page article-page-${article.number}`}>
      <header className="article-hero">
        <div className="shell article-hero-inner">
          <Link href="/blog_fotoknigi/">Блог о фотокнигах</Link>
          <span>Статья {article.number}</span>
          <h1>{article.title}</h1>
        </div>
      </header>
      <section className="article-body-section">
        <article className="shell article-copy">
          {article.blocks.map((block, index) => <ArticleBlockView block={block} index={index} key={`${block.type}-${index}`} />)}
        </article>
      </section>
    </main>
  );
}
