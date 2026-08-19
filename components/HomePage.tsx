import Image from "next/image";
import Link from "next/link";
import {
  benefits,
  catalogItems,
  contacts,
  faqs,
  getMediaGroup,
  pricing,
  steps,
} from "@/lib/site-data";

const craft = [
  {
    number: "01.",
    title: "Профессионально обрабатываем фотографии",
    text: "Делаем снимки светлыми и естественными, исправляем цвет, кадрируем и увеличиваем маленькие фото с помощью ИИ.",
    image: "/media/home/obrabotka-foto-wedfotobook-ru.webp",
  },
  {
    number: "02.",
    title: "Создаём дизайн без шаблонов",
    text: "Собираем вашу историю вручную, добавляем тексты и декоративные детали. Первые три разворота показываем до оплаты.",
    image: "/media/home/dizain-fotoknigi-wedfotobook-ru.webp",
  },
  {
    number: "03.",
    title: "Согласовываем каждый разворот",
    text: "Отправляем макет в удобный мессенджер и вносим правки без ограничений — до вашего полного одобрения.",
    image: "/media/home/soglasovanie-maketa-wedfotobook-ru.webp",
  },
  {
    number: "04.",
    title: "Печатаем и доставляем",
    text: "После утверждения отправляем макет в профессиональную типографию. Доставляем в пункт выдачи, курьером или почтой.",
    image: "/media/home/print-fotoknig-wedfotobook-ru.webp",
  },
] as const;

export function HomePage() {
  const reviewImages = getMediaGroup("reviews").slice(0, 8);

  return (
    <main>
      <section className="hero">
        <div className="hero-glow" />
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Фотокниги ручной работы · Москва</span>
            <h1>Фотокнига на заказ<br /><em>«под ключ»</em> за 7 дней</h1>
            <p className="hero-lead">Вы присылаете фотографии — мы отбираем лучшие кадры, создаём дизайн, согласовываем макет и печатаем готовую книгу.</p>
            <ul className="hero-list">
              <li>Три разворота до оплаты</li>
              <li>Правки без ограничений</li>
              <li>Обработка фото включена</li>
            </ul>
            <div className="hero-cta">
              <button className="button button-large" data-order-open type="button">Рассчитать стоимость</button>
              <a className="text-link" href={contacts.phoneHref}>или позвонить {contacts.phoneDisplay}</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-frame">
              <Image
                src="/media/home/fotokniga-na-zakaz-wedfotobook-ru.webp"
                alt="Фотокнига на заказ с индивидуальным дизайном"
                width={960}
                height={518}
                priority
              />
              <div className="hero-price"><span>от</span><strong>8 900 ₽</strong></div>
            </div>
            <div className="hero-note"><strong>17 лет</strong><span>создаём фотокниги<br />для важных историй</span></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Преимущества">
        <div className="shell trust-grid">
          <div><strong>17 лет</strong><span>опыта работы</span></div>
          <div><strong>100%</strong><span>индивидуальный дизайн</span></div>
          <div><strong>7 дней</strong><span>средний срок изготовления</span></div>
          <div><strong>0 ₽</strong><span>за обработку фотографий</span></div>
        </div>
      </section>

      <section className="section section-craft">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">От снимков к семейной реликвии</span><h2>Как мы делаем фотокниги</h2></div>
            <p>Каждый этап выполняют люди — от отбора фотографий и дизайна до финальной проверки перед печатью.</p>
          </div>
          <div className="craft-list">
            {craft.map((item, index) => (
              <article className={`craft-item ${index % 2 ? "reverse" : ""}`} key={item.title}>
                <div className="craft-image"><Image src={item.image} alt={item.title} width={996} height={561} /></div>
                <div className="craft-copy"><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-ink">
        <div className="shell">
          <div className="section-heading center-heading">
            <span className="eyebrow eyebrow-light">Каталог</span>
            <h2>Для каждой истории — своя фотокнига</h2>
            <p>Свадьба, первый год малыша, юбилей, выпускной или путешествие — мы найдём визуальный язык для любого события.</p>
          </div>
          <div className="catalog-grid">
            {catalogItems.map((item) => (
              <Link className="catalog-card" href={`/${item.slug}/`} key={item.slug}>
                <Image src={item.cover} alt={item.title} width={500} height={500} />
                <div><h3>{item.title}</h3><p>{item.description}</p><span>Посмотреть работы →</span></div>
              </Link>
            ))}
          </div>
          <div className="center-action"><Link className="button button-light" href="/katalog/">Открыть весь каталог</Link></div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">Почему нам доверяют</span><h2>Спокойный путь к идеальному результату</h2></div>
            <p>Вы видите будущую книгу ещё до оплаты и участвуете в создании ровно настолько, насколько хотите.</p>
          </div>
          <div className="benefit-grid">
            {benefits.map(([icon, title, text]) => (
              <article className="benefit-card" key={title}>
                <Image src={`/media/benefits/${icon}`} alt="" width={118} height={122} />
                <h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-warm">
        <div className="shell">
          <div className="section-heading center-heading">
            <span className="eyebrow">Стоимость</span><h2>Выберите формат будущей книги</h2>
            <p>Обработка фотографий, индивидуальный дизайн, согласование и печать уже включены.</p>
          </div>
          <div className="pricing-grid">
            {pricing.map((item, index) => (
              <article className={`price-card ${index === 0 ? "featured" : ""}`} key={item.title}>
                {index === 0 && <span className="price-badge">Чаще выбирают</span>}
                <Image src={item.image} alt={item.title} width={960} height={518} />
                <div className="price-card-copy"><h3>{item.title}</h3><strong>{item.price}</strong><ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><Link href={item.href}>Подробнее →</Link></div>
              </article>
            ))}
          </div>
          <p className="pricing-note">Можно заказать фотокнигу в кожаной или тканевой обложке. Точную стоимость рассчитаем после короткой консультации.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">Семь простых шагов</span><h2>Как проходит заказ</h2></div>
            <p>Вся работа идёт онлайн, без поездок в офис и долгих встреч.</p>
          </div>
          <ol className="steps-grid">
            {steps.map(([icon, title, text], index) => (
              <li key={title}><span className="step-number">0{index + 1}</span><Image src={`/media/steps/${icon}`} alt="" width={41} height={39} /><h3>{title}</h3><p>{text}</p></li>
            ))}
          </ol>
          <div className="center-action"><button className="button" data-order-open type="button">Заказать</button></div>
        </div>
      </section>

      <section className="section section-reviews">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">Отзывы</span><h2>Книги уже стали подарками</h2></div>
            <p>Сохраняем живые отзывы клиентов без пересказа и редакторских правок.</p>
          </div>
          <div className="review-strip">
            {reviewImages.map((image) => (
              <figure key={image.src}><Image src={image.src} alt={image.alt || "Отзыв клиента о фотокниге"} width={image.width} height={image.height} loading="lazy" /></figure>
            ))}
          </div>
          <div className="center-action action-row"><Link className="button button-ghost" href="/otzyvy/">Все отзывы</Link><a className="text-link" href={contacts.yandex} target="_blank" rel="noreferrer">Отзывы на Яндекс Услугах →</a></div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="shell faq-layout">
          <div className="faq-intro"><span className="eyebrow">Частые вопросы</span><h2>Всё, что важно знать до заказа</h2><p>Не нашли ответ? Напишите нам в мессенджер — отвечаем ежедневно.</p><button className="button" data-order-open type="button">Задать вопрос</button></div>
          <div className="faq-list">
            {faqs.map(([question, answer], index) => (
              <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="shell final-cta-grid">
          <div><span className="eyebrow eyebrow-light">Начнём с фотографий</span><h2>Ваши воспоминания достойны фотокниги</h2><p>Пришлите снимки — в течение консультации определим формат, количество разворотов и точную стоимость.</p></div>
          <div className="final-cta-actions"><button className="button button-light button-large" data-order-open type="button">Рассчитать стоимость</button><a href={contacts.phoneHref}>{contacts.phoneDisplay}</a><span>Ежедневно с 9:00 до 21:00</span></div>
        </div>
      </section>
    </main>
  );
}
