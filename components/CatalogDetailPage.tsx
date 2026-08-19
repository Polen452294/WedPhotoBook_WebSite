import Image from "next/image";
import { HomePricingSection, HomeSevenDaysSection, HomeTrustSection } from "@/components/OriginalHomeSections";
import { catalogItems } from "@/lib/site-data";
import type { RenderedPage } from "@/lib/rendered-pages";

function extractEntryContent(bodyHtml: string) {
  const marker = /<div class="entry-content">/i.exec(bodyHtml);
  if (!marker) return bodyHtml;

  const start = marker.index + marker[0].length;
  const divTags = /<\/?div\b[^>]*>/gi;
  divTags.lastIndex = start;
  let depth = 1;
  let match: RegExpExecArray | null;

  while ((match = divTags.exec(bodyHtml))) {
    depth += /^<div\b/i.test(match[0]) ? 1 : -1;
    if (depth === 0) return bodyHtml.slice(start, match.index);
  }

  return bodyHtml.slice(start);
}

function plainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function prepareContent(bodyHtml: string) {
  const entryContent = extractEntryContent(bodyHtml)
    .replace(/https?:\/\/(?:www\.)?wedfotobook\.ru\//gi, "/");
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(entryContent);

  return {
    title: heading ? plainText(heading[1]) : "Фотокнига на заказ",
    html: heading ? entryContent.replace(heading[0], "") : entryContent,
  };
}

const weddingStory = [
  "Свадебная фотокнига — это не просто альбом с фотографиями, а настоящая история любви, бережно собранная на страницах. Хотите заказать свадебную фотокнигу, чтобы навсегда сохранить эмоции самого важного дня? Мы поможем превратить сотни снимков в стильное издание, которое будет радовать вас долгие годы.",
  "Наши дизайнеры знают, как выстроить повествование так, чтобы каждая страница раскрывала отдельную главу вашей истории — от трепетной подготовки до шумного торжества. Свадебный фотоальбом может быть минималистичным либо насыщенным деталями: с цитатами, клятвами или стихами.",
  "Свадебная фотокнига на заказ создаётся с учётом всех ваших пожеланий. Такая книга становится семейной реликвией, которую хочется перелистывать снова и снова, вспоминая улыбки, взгляды и атмосферу праздника. Свяжитесь с нами — и мы поможем воплотить вашу идею в жизнь!",
] as const;

const weddingGallery = Array.from({ length: 12 }, (_, index) =>
  `/media/gallery/wedding/svadba-fotokniga-${index + 1}-wedfotobook-ru.webp`,
);

type CatalogStory = {
  paragraphs: readonly string[];
  images: readonly string[];
  imageWidth: number;
  imageHeight: number;
};

const catalogStories: Record<string, CatalogStory> = {
  "detskaya-fotokniga": {
    paragraphs: [
      "Детская фотокнига — это способ сохранить самые трогательные моменты детства: первые улыбки, забавные гримасы, первые шаги и важные праздники. ",
      "Детская фотокнига на заказ гарантирует индивидуальный подход. Можно добавить подписи: возраст, рост, первые слова. Можно заказать детскую фотокнигу «От рождения до года», «От рождения до 16», «От рождения до 40» и т.д.",
      "Детский фотоальбом может быть ярким и игривым либо лаконичным и нежным — всё зависит от ваших пожеланий.  Пусть воспоминания о детстве останутся не в телефоне, а в красивой фотокниге, которую приятно листать и показывать близким. Свяжитесь с нами — поможем воплотить вашу идею!",
    ],
    images: [1, 2, 3, 7, 5, 6, 4, 8].map(
      (imageNumber) => `/media/gallery/children/children-${String(imageNumber).padStart(2, "0")}-wedfotobook-ru.webp`,
    ),
    imageWidth: 2000,
    imageHeight: 993,
  },
  "yubilejnaya-fotokniga": {
    paragraphs: [
      "Фотокнига на юбилей — отличный способ собрать воедино самые яркие моменты жизни и преподнести их в красивом, продуманном формате. Хотите заказать фотокнигу на юбилей и подарить близкому человеку путешествие в прошлое? Мы поможем превратить разрозненные снимки в цельную историю — от детских фотографий до кадров недавних торжеств.",
      "Фотоальбом на юбилей может отражать разные этапы: первые достижения, важные события, любимые места, тёплые моменты с родными. Фотокнига поможет сохранить не только изображения, но и атмосферу: можно добавить подписи, даты, трогательные цитаты и пожелания от близких — так книга станет по-настоящему личной.",
      "Фотокнига на юбилей на заказ станет лучшим подарком: её будут пересматривать снова и снова, каждый раз заново переживая счастливые мгновения. Свяжитесь с нами — создадим издание, которое станет семейной ценностью!",
    ],
    images: Array.from({ length: 8 }, (_, index) => `/media/gallery/anniversary/anniversary-${String(index + 1).padStart(2, "0")}-wedfotobook-ru.webp`),
    imageWidth: 2000,
    imageHeight: 1283,
  },
  "fotokniga-o-puteshestvii": {
    paragraphs: [
      "Фотокнига путешествий — способ заново пережить самые яркие моменты поездок и сохранить их на долгие годы. Мы поможем собрать из фотографий настоящее издание, которое станет любимой семейной реликвией.",
      "Фотокнига путешествий на заказ создаётся с вниманием к деталям. Дизайнеры выстраивают повествование — от первых впечатлений до финальных кадров. Фотоальбом путешествий может включать не только снимки, но и билеты, открытки, карты, рукописные заметки — всё, что делает воспоминания живыми. ",
      "Заказать фотокнигу путешествий стоит, чтобы не потерять ни одного важного кадра: в ней найдётся место и для панорамных видов, и для смешных бытовых моментов.",
      "Пусть каждое путешествие живёт не только в памяти, но и в красивой, тактильно приятной книге — обращайтесь, и мы воплотим вашу задумку в реальность!",
    ],
    images: Array.from({ length: 8 }, (_, index) => `/media/gallery/travel/travel-${String(index + 1).padStart(2, "0")}-wedfotobook-ru.webp`),
    imageWidth: 2000,
    imageHeight: 993,
  },
  "vypusknye-fotoknigi": {
    paragraphs: [
      "Выпускной альбом — лучший способ сохранить яркие моменты важного этапа жизни. Хотите заказать выпускной альбом для детского сада, 4, 9 или 11 класса? Мы создадим издание, которое будет радовать долгие годы.",
      "Выпускной альбом на заказ разрабатывается индивидуально: дизайнеры подберут композицию, гармонично разместят портреты и групповые снимки, добавят цитаты учеников, тёплые слова педагогов и памятные даты. Для детского сада сделаем оформление игривым и уютным, для 4 класса — лёгким и динамичным, а для 9 и 11 классов — стильным и современным, подчёркивающим взросление ребят.",
      "Заказать выпускной альбом стоит, чтобы сохранить не только образы, но и атмосферу праздника: в книгу можно включить фото с линейки, репетиций, творческих номеров и неформальных моментов.  Свяжитесь с нами — поможем воплотить идею и создать историю, которую захочется пересматривать снова и снова!",
    ],
    images: Array.from({ length: 12 }, (_, index) => `/media/gallery/graduation/graduation-${String(index + 1).padStart(2, "0")}-wedfotobook-ru.webp`),
    imageWidth: 2000,
    imageHeight: 1283,
  },
  "genealogicheskaya-fotokniga": {
    paragraphs: [
      "Родословная (генеалогическая) фотокнига — это способ бережно сохранить историю семьи и передать её следующим поколениям. ",
      "Родословная (генеалогическая) фотокнига на заказ позволяет объединить архивные фотографии, документы, письма и воспоминания в единую композицию. Наши дизайнеры помогут структурировать материал: отреставрировать старые снимки, отрисовать семейное древо, грамотно расположить тексты и изображения.",
      "Заказать родословную фотокнигу стоит, если вы хотите зафиксировать не только лица предков, но и их судьбы: добавить генеалогическое древо, краткие биографии, важные даты, описания традиций и даже рецепты, передающиеся из поколения в поколение.",
      "Родословная фотокнига — не просто альбом, а летопись рода. Закажите её, чтобы сохранить память о предках и подарить близким ощущение связи времён. Свяжитесь с нами — поможем воплотить семейную историю в красивой и долговечной книге!",
    ],
    images: Array.from({ length: 12 }, (_, index) => `/media/gallery/genealogy/genealogy-${String(index + 1).padStart(2, "0")}-wedfotobook-ru.webp`),
    imageWidth: 2000,
    imageHeight: 1283,
  },
  "fotokniga-na-lyubuyu-temu": {
    paragraphs: [
      "Фотокниги бывают не только свадебными или детскими — мы создаём издания на самые разные темы. Хотите оформить корпоративную фотокнигу, чтобы запечатлеть важные события компании, тимбилдинги и достижения команды? Или мечтаете собрать трогательную историю о любимом питомце, даче, автомобиле? Мы воплотим любую идею.",
      "Корпоративная фотокнига станет стильным подарком партнёрам и сотрудникам, подчеркнёт ценности и историю бренда. Фотокнига о животных сохранит забавные и душевные моменты: от первых дней в доме до любимых ритуалов. Также мы делаем фотокниги про хобби, спортивные достижения, тематические фотосессии и даже про любимые городские маршруты.",
      "Расскажите о своей задумке — и мы поможем превратить фотографии в уникальную историю!",
    ],
    images: Array.from({ length: 8 }, (_, index) => `/media/gallery/custom/custom-${String(index + 1).padStart(2, "0")}-wedfotobook-ru.webp`),
    imageWidth: 2000,
    imageHeight: 1283,
  },
  "fotokniga-s-dopolnennoj-realnostyu": {
    paragraphs: [
      "Фотокнига с оживающими фото — это новый уровень воспоминаний: статичные кадры превращаются в живые моменты прямо на страницах. Хотите заказать фотокнигу с оживающими фото, чтобы добавить в альбом не только изображения, но и эмоции, видео? ",
      "Фотокнига с оживающими фото на заказ создаётся так: вы присылаете видеофрагменты (первый танец, смех ребёнка, поздравления), а дизайнеры привязывают их к нужным снимкам. Достаточно навести камеру смартфона на страницу — и фото «оживает», проигрывая короткий ролик. ",
      "Если видео нет, не страшно, мы оживим фото с помощью ИИ.",
      "Заказать фотоальбом с оживающими фото стоит для свадьбы, выпускного, первого года малыша или семейного путешествия — там, где важны не только кадры, но и атмосфера. ",
      "Пусть воспоминания станут по-настоящему живыми — обращайтесь, и мы поможем превратить ваши фото и видео в уникальный альбом, который удивит каждого!",
    ],
    images: Array.from({ length: 2 }, (_, index) => `/media/gallery/alive/alive-${String(index + 1).padStart(2, "0")}-wedfotobook-ru.webp`),
    imageWidth: 1280,
    imageHeight: 720,
  },
};

function splitEvenly<T>(items: readonly T[], groupCount: number) {
  const groups: T[][] = [];
  const baseSize = Math.floor(items.length / groupCount);
  const remainder = items.length % groupCount;
  let start = 0;

  for (let index = 0; index < groupCount; index += 1) {
    const size = baseSize + (index < remainder ? 1 : 0);
    groups.push(items.slice(start, start + size));
    start += size;
  }

  return groups;
}

function extractPageFaq(html: string) {
  return /<section class="wfb-faq">[\s\S]*?<\/section>/i.exec(html)?.[0] ?? "";
}

export const catalogDetailDisplayTitles: Record<string, string> = {
  "detskaya-fotokniga": "Детская фотокнига",
  "yubilejnaya-fotokniga": "Фотокнига на юбилей",
  "fotokniga-o-puteshestvii": "Фотокнига путешествий",
  "vypusknye-fotoknigi": "Выпускные альбомы",
  "genealogicheskaya-fotokniga": "Родословная фотокнига",
  "fotokniga-na-lyubuyu-temu": "Фотокнига на любую тему",
  "fotokniga-s-dopolnennoj-realnostyu": "Фотокнига с оживающими фото",
};

export function CatalogDetailPage({ page }: { page: RenderedPage }) {
  const item = catalogItems.find((catalogItem) => catalogItem.slug === page.slug);
  if (!item) return null;

  const content = prepareContent(page.bodyHtml);
  const displayTitle = catalogDetailDisplayTitles[page.slug] ?? content.title;
  const heroButtonLabel = "Рассчитать стоимость";

  const hero = (
    <section className="catalog-detail-hero">
      <div className="shell catalog-detail-hero-grid">
        <div className="catalog-detail-hero-copy">
          <span className="eyebrow">Каталог фотокниг</span>
          <h1>{displayTitle}</h1>
          <p>{item.description}</p>
          <button className="button" data-order-open type="button">{heroButtonLabel}</button>
        </div>
        <div className="catalog-detail-cover">
          <Image src={item.cover} alt={displayTitle} width={720} height={720} priority />
        </div>
      </div>
    </section>
  );

  if (page.slug === "wedding-fotoknig") {
    const faqHtml = extractPageFaq(content.html);

    return (
      <main className="catalog-detail-page wedding-detail-page">
        {hero}

        <section className="wedding-story-section" aria-label="История свадебной фотокниги">
          <div className="shell wedding-story-list">
            {weddingStory.map((paragraph, chapterIndex) => (
              <article className={`wedding-story-chapter ${chapterIndex % 2 ? "reverse" : ""}`} key={paragraph}>
                <div className="wedding-story-copy">
                  <span className="wedding-story-number" aria-hidden="true">0{chapterIndex + 1}</span>
                  <p>{paragraph}</p>
                </div>
                <div className="wedding-story-gallery">
                  {weddingGallery.slice(chapterIndex * 4, chapterIndex * 4 + 4).map((image, imageIndex) => (
                    <figure key={image}>
                      <Image
                        src={image}
                        alt={`Пример свадебной фотокниги, разворот ${chapterIndex * 4 + imageIndex + 1}`}
                        width={2000}
                        height={993}
                        sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 34vw"
                      />
                    </figure>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <HomeTrustSection />
        <HomePricingSection />
        <HomeSevenDaysSection />

        {faqHtml && (
          <section className="section wedding-faq-section">
            <div className="shell wedding-faq-content" dangerouslySetInnerHTML={{ __html: faqHtml }} />
          </section>
        )}
      </main>
    );
  }

  const story = catalogStories[page.slug];
  if (story) {
    const chapterCount = Math.min(story.paragraphs.length, story.images.length);
    const paragraphGroups = splitEvenly(story.paragraphs, chapterCount);
    const imageGroups = splitEvenly(story.images, chapterCount);
    const faqHtml = extractPageFaq(content.html);

    return (
      <main className={`catalog-detail-page catalog-story-page catalog-story-page-${page.slug}`}>
        {hero}

        <section className="catalog-story-section" aria-label={`Подробнее: ${displayTitle}`}>
          <div className="shell catalog-story-list">
            {paragraphGroups.map((paragraphs, chapterIndex) => {
              const images = imageGroups[chapterIndex];

              return (
                <article className={`catalog-story-chapter ${chapterIndex % 2 ? "reverse" : ""}`} key={`${page.slug}-${chapterIndex}`}>
                  <div className="catalog-story-copy">
                    <span className="catalog-story-number" aria-hidden="true">{String(chapterIndex + 1).padStart(2, "0")}</span>
                    {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                  <div className={`catalog-story-gallery gallery-count-${images.length}`}>
                    {images.map((image, imageIndex) => (
                      <figure key={image}>
                        <Image
                          src={image}
                          alt={`${displayTitle}, пример ${imageGroups.slice(0, chapterIndex).flat().length + imageIndex + 1}`}
                          width={story.imageWidth}
                          height={story.imageHeight}
                          sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 34vw"
                        />
                      </figure>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <HomeTrustSection />
        <HomePricingSection />
        <HomeSevenDaysSection />

        {faqHtml && (
          <section className="section catalog-story-faq-section">
            <div className="shell catalog-story-faq-content" dangerouslySetInnerHTML={{ __html: faqHtml }} />
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="catalog-detail-page">
      {hero}

      <section className="catalog-detail-content-section">
        <div className="shell">
          <article className="catalog-detail-content" dangerouslySetInnerHTML={{ __html: content.html }} />
        </div>
      </section>
    </main>
  );
}
