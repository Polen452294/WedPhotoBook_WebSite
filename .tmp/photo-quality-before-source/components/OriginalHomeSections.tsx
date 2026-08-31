import Image from "next/image";
import Link from "next/link";
import { HomeGalleryCarousel } from "@/components/HomeGalleryCarousel";
import { ReviewCarousel } from "@/components/ReviewCarousel";
import { directMediaImageProps, optimizedMediaUrl } from "@/lib/media-path";
import { contacts, getMediaGroup } from "@/lib/site-data";

/* eslint-disable @next/next/no-html-link-for-pages -- plain anchors preserve the captured footer markup and remain fully functional */
/* eslint-disable @next/next/no-img-element -- pre-generated srcsets are required because the Vinext VPS image endpoint is passthrough-only */

const optimizedHomeImageStems: Record<string, string> = {
  "/media/home/Obrabotka foto wedfotobook ru.webp": "/media/optimized/home/craft-processing",
  "/media/home/Dizain fotoknigi wedfotobook ru.webp": "/media/optimized/home/craft-design",
  "/media/home/soglasovanie-maketa-optimized.webp": "/media/optimized/home/craft-approval",
  "/media/home/Print fotoknig wedfotobook ru.webp": "/media/optimized/home/craft-print",
  "/media/home/Fotokniga Premium wedfotobook ru.webp": "/media/optimized/home/price-premium",
  "/media/home/Fotokniga Standart wedfotobook ru.webp": "/media/optimized/home/price-standard",
  "/media/home/Vipusk albom stoimost wedfotobook ru.webp": "/media/optimized/home/price-graduation",
  "/media/home/Fotokniga alive photo stoimost wedfotobook ru.webp": "/media/optimized/home/price-alive",
  "/media/covers/Svadba fotokniga wedfotobook ru.webp": "/media/optimized/covers/wedding",
  "/media/covers/Dety fotokniga wedfotobook ru.webp": "/media/optimized/covers/children",
  "/media/covers/Ubiley fotokniga wedfotobook ru.webp": "/media/optimized/covers/anniversary",
  "/media/covers/Fotokniga puteshedtvij wedfotobook ru.webp": "/media/optimized/covers/travel",
  "/media/covers/Vipusk albom wedfotobook ru.webp": "/media/optimized/covers/graduation",
  "/media/covers/Fotokniga genealogia wedfotobook ru.webp": "/media/optimized/covers/genealogy",
  "/media/covers/Fotokbiga drugaj wedfotobook ru.webp": "/media/optimized/covers/custom",
  "/media/home/Fotokniga alive photo blok wedfotobook ru.webp": "/media/optimized/covers/alive",
};

function OptimizedHomeImage({
  src,
  alt,
  width,
  height,
  widths,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  widths: readonly number[];
  sizes: string;
}) {
  const stem = optimizedHomeImageStems[src];
  const largestWidth = widths.at(-1)!;
  return (
    <img
      src={optimizedMediaUrl(`${stem}-${largestWidth}.webp`)}
      srcSet={widths.map((candidate) => `${optimizedMediaUrl(`${stem}-${candidate}.webp`)} ${candidate}w`).join(", ")}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}

const craft = [
  {
    number: "01",
    title: "Профессиональная обработка фотографий",
    image: "/media/home/Obrabotka foto wedfotobook ru.webp",
    text: [
      "⋅ Хотите, чтобы ваша фотокнига выглядела как топовое издание? Доверьте обработку снимков нам.",
      "⋅ Фото на страницах будут естественными — светлыми и не тусклыми.",
      "⋅ Мы увеличиваем размеры маленьких снимков с помощью ИИ.",
      "И это уже входит в стоимость!",
    ],
  },
  {
    number: "02",
    title: "Дизайн фотокниги",
    image: "/media/home/Dizain fotoknigi wedfotobook ru.webp",
    text: [
      "⋅ Создаём фотокниги с уникальным дизайном — без использования шаблонов.",
      "⋅ Мы настолько уверены в результате, что готовы начать работу без предоплаты. Мы бесплатно подготовим для вас дизайн первых 3 разворотов.",
      "⋅ Хотите добавить в фотокнигу надписи? Вы можете прислать свои тексты или мы подберём подходящие фразы. Без доплат!",
    ],
  },
  {
    number: "03",
    title: "Согласование макета",
    image: "/media/home/soglasovanie-maketa-optimized.webp",
    text: [
      "⋅ После того как макет будет готов, вы получите его для просмотра. Проверьте, все ли фотографии на месте, нет ли опечаток в тексте.",
      "⋅ Если что‑то хочется поменять, просто сообщите — мы внесём правки.",
      "⋅ Обычно доступно 1–2 круга корректировок. У нас такого нет. Правки можно вносить без ограничений.",
      "Безлимитные правки до вашего «идеально» без доплат!",
    ],
  },
  {
    number: "04",
    title: "Печать фотокниги и доставка",
    image: "/media/home/Print fotoknig wedfotobook ru.webp",
    text: [
      "⋅ После утверждения макета, мы сразу отправляем его в печать.",
      "⋅ Мы используем качественные материалы и современные технологии — так каждая страница получается яркой, чёткой и долговечной.",
      "⋅ Получить готовую фотокнигу можно в любом пункте Яндекс маркета или курьером в пределах МКАД.",
    ],
  },
] as const;

const catalog = [
  ["wedding-fotoknig", "Свадебная фотокнига", "С индивидуальным дизайном сохранит память об этом прекрасном событии!", "/media/covers/Svadba fotokniga wedfotobook ru.webp", "Обложка свадебной фотокниги с индивидуальным дизайном"],
  ["detskaya-fotokniga", "Детская фотокнига", "От рождения до года или от рождения до 18 — это память о детстве.", "/media/covers/Dety fotokniga wedfotobook ru.webp", "Обложка детской фотокниги с индивидуальным дизайном"],
  ["yubilejnaya-fotokniga", "Фотокнига на юбилей", "Станет настоящим семейным сокровищем, хранящим воспоминания.", "/media/covers/Ubiley fotokniga wedfotobook ru.webp", "Обложка фотокниги на юбилей"],
  ["fotokniga-o-puteshestvii", "Фотокнига путешествий", "Это прекрасный способ сохранить яркие моменты вашего путешествия.", "/media/covers/Fotokniga puteshedtvij wedfotobook ru.webp", "Обложка фотокниги о путешествии"],
  ["vypusknye-fotoknigi", "Выпускной альбом", "Это напоминание об учебе в школе, университете или колледже.", "/media/covers/Vipusk albom wedfotobook ru.webp", "Обложка выпускного альбома"],
  ["genealogicheskaya-fotokniga", "Родословная фотокнига", "Об истории семье может передаваться из поколения в поколение.", "/media/covers/Fotokniga genealogia wedfotobook ru.webp", "Обложка родословной фотокниги с семейной историей"],
  ["fotokniga-na-lyubuyu-temu", "Другая фотокнига", "Корпоративная, семейная, о животных, даче и т.д.", "/media/covers/Fotokbiga drugaj wedfotobook ru.webp", "Обложка фотокниги на любую тему с индивидуальным дизайном"],
  ["fotokniga-s-dopolnennoj-realnostyu", "Фотокнига с оживающими фото", "Наведите камеру телефона на фотографии и они оживут.", "/media/home/Fotokniga alive photo blok wedfotobook ru.webp", "Фотокнига с оживающими фотографиями"],
] as const;

const benefits = [
  ["Dizain bez shablonov.webp", "Дизайн без шаблонов", "Только ваша история, ваш стиль, ваши эмоции"],
  ["Proboval sam.webp", "Пробовал сам, получилось плохо", "Не нужно ничего делать самому. Просто пришлите фото — дизайнеры все сделают за вас"],
  ["A vdryg ne ponpavica.webp", "А вдруг не понравится?", "Вы увидите 3 разворота до внесения предоплаты"],
  ["Pezultat 100%.webp", "Результат на 100%", "Вносим правки до полного одобрения макета. Без ограничений"],
  ["Bez ploxix foto.webp", "Без плохих фото", "Цветокоррекция фото. При низком качестве увеличение фото с помощью ИИ"],
  ["Pabota onlain.webp", "Вся работа онлайн", "В любое удобное время через любой мессенджер. Без выходных"],
  ["Fotokniga za 7 day.webp", "Фотокнига за 7 дней", "Пришлите фото и через 7 дней заберите готовую фотокнигу. Срочный заказ? Сделаем за 4 дня"],
  ["Texnology pechaty.webp", "Современные технологии", "Печать класса Премиум: твердая обложка, плотные листы, панорамный разворот"],
] as const;

type PricingCard = {
  title: string;
  price: string;
  href: string;
  image: string;
  imageAlt: string;
  features: readonly string[];
};

export const homePricing: readonly PricingCard[] = [
  {
    title: "Фотокнига «Премиум»",
    price: "от 8 900 руб.",
    href: "/fotokniga-premium/",
    image: "/media/home/Fotokniga Premium wedfotobook ru.webp",
    imageAlt: "Фотокнига Премиум с плотными панорамными разворотами",
    features: ["⋅ Твердая фотообложка", "⋅ Плотные листы", "⋅ Панорамный разворот", "⋅ От 10 разворотов"],
  },
  {
    title: "Фотокнига «Стандарт»",
    price: "от 9 800 руб.",
    href: "/fotokniga-standart/",
    image: "/media/home/Fotokniga Standart wedfotobook ru.webp",
    imageAlt: "Фотокнига Стандарт с журнальными страницами",
    features: ["⋅ Твердая фотообложка", "⋅ Журнальные листы", "⋅ От 24 страниц"],
  },
  {
    title: "Выпускные альбомы",
    price: "от 1 500 руб.",
    href: "/vypusknye-fotoknigi-stoimost/",
    image: "/media/home/Vipusk albom stoimost wedfotobook ru.webp",
    imageAlt: "Выпускной альбом на заказ с индивидуальным дизайном",
    features: ["⋅Твердая фотообложка", "⋅ Премиум или Стандарт", "⋅ От 1 разворота", "⋅ Заказ от 10 экз."],
  },
  {
    title: "Фотокниги с оживающими фото",
    price: "от 9 200 руб.",
    href: "/fotoknigi-s-dopolnennoj-realnostju-stoim/",
    image: "/media/home/Fotokniga alive photo stoimost wedfotobook ru.webp",
    imageAlt: "Пример фотокниги с оживающими фотографиями",
    features: ["Мы можем связать фото и видео.", "Если видео нет, можем оживать фотографии с помощью ИИ."],
  },
] as const;

const homepagePricing: readonly PricingCard[] = [
  homePricing[0],
  { ...homePricing[1], features: [...homePricing[1].features, "⋅ Разные форматы"] },
  homePricing[2],
  {
    ...homePricing[3],
    features: [
      "Связываем фото и видео",
      "Эффект дополненной реальности",
      "Работает со смартфона",
      "Можно оживить фото с ИИ",
    ],
  },
] as const;

type HomeStep = readonly [string, string, string];

export const homeSteps: readonly HomeStep[] = [
  ["Prishlite foto.webp", "Пришлите фото", "В мессенджер, на почту или ссылкой на облако."],
  ["Tree pasvorota.webp", "Три разворота", "Показываем первые страницы до оплаты."],
  ["Oplata.webp", "Предоплата", "После согласования первых разворотов — 50%."],
  ["Soglacovanie.webp", "Согласование", "Вносим правки до вашего полного одобрения."],
  ["Oplata.webp", "Оплата", "Оплата оставшиихся 50% и доставки."],
  ["Print.webp", "Печать", "Отправляем утверждённый макет в типографию."],
  ["Fotokniga gotova.webp", "Готово", "Доставка в пункт выдачи яндекс маркета или курьером."],
] as const;

const homepageSteps: readonly HomeStep[] = homeSteps.map((step, index) =>
  index === 3
    ? ["Soglacovanie.webp", "Согласование макета", "Присылаем макет, вносим правки до вашего полного одобрения."]
    : step,
);

const faqs = [
  ["1. Есть ли у вас конструктор по созданию фотокниг?", "Конструктора у нас нет. Все макеты делаются дизайнерами вручную, без шаблонов, только с индивидуальным дизайном. Мы создаем красивые истории из ваших фотографий."],
  ["2. Что значит обработка фотографий?", "Мы делаем цветокоррекцию фотографий, чтобы в фотокниге не было темных или неярких фотографий. Также делаем кадрирование, т.е. при необходимости обрезаем лишнее пустое пространство."],
  ["3. У меня фотографии только в телефоне. Подойдут ли они для фотокниги?", "Сейчас практически у всех фотографии только из телефона. Современное качество смартфонов позволяет делать снимки хорошего качества. Если разрешения фотографии недостаточно, мы можем увеличить ее с помощью искусственного интеллекта."],
  ["4. Сколько стоит добавить тексты в фотокнигу?", "Это бесплатно. Вы можете прислать свои тексты, и мы добавим их в фотокнигу. Если вы хотите сделать надписи на страницах, но не можете придумать их, мы сами подберем красивые надписи и разместим в фотокниге."],
  ["5. Что нужно при заказе фотокниги у вас?", "Прислать фотографии на ватсап, телеграмм, макс, почту 79854342367@yandex.ru или ссылку на яндекс диск/Мейл облако. Согласовать макет. Забрать фотокнигу в удобном пункте Яндекс маркета. Все остальное мы сделаем за вас!"],
  ["6. Могу я увидеть макет до оплаты?", "После того, как вы пришлете фотографии, мы сделаем 3 разворота до внесения предоплаты, чтобы вы увидели, какой будет ваша фотокнига. Если что-то не понравится, можно внести правки. Вы ничем не рискуете!"],
  ["7. Можно ли что-то изменить в макете?", "Да, конечно, вы можете написать нам, что хотите изменить, и мы внесем правки. Изменения можно вносить в любой момент до отправки фотокниги в печать."],
  ["8. Как происходит работа над фотокнигой?", "Все работа происходит онлайн в удобное для вас время. Мы делаем макет, отправляем его вам (почта, вотсап, телеграм, макс). Вы оцениваете его, пишите правки. Мы их вносим и высылаем вам макет с правками еще раз. И так до полного одобрения."],
  ["9. Сколько раз можно вносить правки?", "У большинства компаний правки можно вносить 2-3 раза. У нас такого нет. Кому-то достаточно 1 раз внести правки, кому-то нужно 10 раз. Все люди разные, поэтому мы не ограничиваем вас. Мы работаем на результат, добиваясь того, чтобы фотокнига понравилась вам на 100%."],
  ["10. Какие сроки создания фотокниги?", "Обычно на создание и печать фотокниги уходит 7 дней."],
  ["11. Я забыл, что у моей мамы/папы/брата/друга день рождения в субботу, можно ли сделать фотокнигу быстрее?", "У нас есть срочный заказ: фотокнига за 4 дня. К сожалению, быстрее сделать фотокнигу не получится, т.к. процесс печати включает проклейку и просушку, которые нельзя ускорить. Срочный заказ дороже на 50%"],
  ["12. Где вы печатаете фотокниги?", "Мы печатаем фотокниги в профессиональной типографии в Москве."],
  ["13. Можете отрисовать генеалогическое древо?", "Да, конечно. Мы можем отрисовать генеалогическое древо, как для фотокниги, так и просто для печати в большом формате."],
  ["14. Где я заберу фотокнигу?", "В любом удобном пункте выдачи Яндекс Маркета. Можно заказать курьерскую доставку в пределах МКАД. Можем отправить Почтой России."],
  ["15. Вы работаете с юр. лицами?", "Да, конечно. Можем прислать договор, выставить счет на оплату и сделать закрывающие документы."],
] as const;

export function HomeTrustSection({ className = "" }: { className?: string } = {}) {
  return (
    <section className={`section ${className}`.trim()}>
      <div className="shell">
        <div className="section-heading split-heading"><div><span className="eyebrow">Почему нам доверяют</span><h2>Почему нам можно доверять?</h2></div><p>Вы видите будущую книгу ещё до оплаты и участвуете в создании ровно настолько, насколько хотите.</p></div>
        <div className="benefit-grid">
          {benefits.map(([icon, title, text]) => <article className="benefit-card" key={title}><Image {...directMediaImageProps(`/media/benefits/${icon}`)} alt={`Иконка преимущества: ${title.toLocaleLowerCase("ru-RU")}`} width={118} height={122} /><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </div>
    </section>
  );
}

export function HomePricingSection({ items = homePricing }: { items?: readonly PricingCard[] }) {
  return (
    <section className="section section-warm">
      <div className="shell">
        <div className="section-heading split-heading"><div><span className="eyebrow">Стоимость</span><h2 className="pricing-question-title">Хотите узнать стоимость фотокниги?</h2></div><p>Можем сделать фотокнигу в кожаной или тканевой обложке</p></div>
        <div className={`pricing-grid ${items.length === 3 ? "pricing-grid-three" : items.length === 1 ? "pricing-grid-one" : ""}`}>
          {items.map((item, index) => {
            const featured = index === 0 && items.length > 1;
            return <article className={featured ? "price-card featured" : "price-card"} key={item.title}>{featured && <span className="price-badge">Чаще выбирают</span>}<OptimizedHomeImage src={item.image} alt={item.imageAlt} width={960} height={518} widths={[320, 560, 800]} sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1199px) 50vw, 560px" /><div className="price-card-copy"><h3>{item.title}</h3><strong>{item.price}</strong><ul>{item.features.map((feature) => <li key={feature}>{feature.replace(/^⋅\s*/, "")}</li>)}</ul><Link href={item.href}>Подробнее →</Link></div></article>;
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeSevenDaysSection({ items = homeSteps }: { items?: readonly HomeStep[] }) {
  return (
    <section className="section section-seven-days">
      <div className="shell">
        <div className="section-heading split-heading"><div><span className="eyebrow">Семь простых шагов</span><h2>Как проходит заказ</h2></div><p>Вся работа идёт онлайн, без поездок в офис и долгих встреч.</p></div>
        <ol className="steps-grid">
          {items.map(([icon, title, text], index) => <li key={title}><span className="step-number">0{index + 1}</span><Image src={`/media/steps/${icon}`} alt={`Иконка этапа заказа: ${title.toLocaleLowerCase("ru-RU")}`} width={41} height={39} /><h3>{title}</h3><p>{text}</p></li>)}
        </ol>
        <div className="center-action"><button className="button" data-order-open type="button">Заказать</button></div>
      </div>
    </section>
  );
}

export function OriginalHomeSections() {
  const reviewImages = getMediaGroup("reviews");

  return (
    <main className="original-home-sections">
      <section className="section section-craft">
        <div className="shell">
          <div className="section-heading split-heading"><div><span className="eyebrow">От снимков к семейной реликвии</span><h2>Как мы делаем фотокниги?</h2></div><p>Каждый этап выполняют люди — от отбора фотографий и дизайна до финальной проверки перед печатью.</p></div>
          <div className="craft-list">
            {craft.map((item, index) => (
              <article className={`craft-item ${index % 2 ? "reverse" : ""}`} key={item.title}>
                <div className="craft-image"><OptimizedHomeImage src={item.image} alt={`${item.title} при создании фотокниги на заказ`} width={996} height={561} widths={[460, 690, 900]} sizes={`(max-width: 767px) calc(100vw - 48px), (max-width: 1199px) 50vw, ${index % 2 ? 460 : 690}px`} /></div>
                <div className="craft-copy"><span className="craft-number">{item.number}</span><h3>{item.title}</h3><div className="craft-body">{item.text.map((text) => text.startsWith("⋅ ") ? <p className="craft-point" key={text}><span className="craft-check" aria-hidden="true">✓</span><span>{text.slice(2)}</span></p> : <p key={text}>{text}</p>)}</div></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-warm original-story">
        <div className="shell center-heading">
          <h2>Фотокнига — это больше, чем просто фотографии</h2>
          <p>Фотокнига – это не альбом с фотографиями, это ваша личная история, рассказанная с любовью и заботой. Перелистывая страницы фотокниги, вы заново переживаете самые счастливые моменты, наполняя сердце теплом и радостью.</p>
          <h3>Ваши воспоминания достойны фотокниги!</h3>
        </div>
      </section>

      <section className="section section-ink">
        <div className="shell">
          <div className="section-heading split-heading"><div><span className="eyebrow eyebrow-light">Каталог</span><h2>Какие фотокниги мы делаем? Любые!</h2></div><p>Свадьба, первый год малыша, юбилей, выпускной или путешествие — мы найдём визуальный язык для любого события.</p></div>
          <div className="catalog-grid">
            {catalog.map(([slug, title, description, cover, coverAlt]) => (
              <Link className="catalog-card" href={`/${slug}/`} key={slug}>
                <OptimizedHomeImage src={cover} alt={coverAlt} width={500} height={500} widths={[320, 500]} sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1199px) 50vw, 290px" />
                <div><h3>{title}</h3><small className="catalog-card-description">{description}</small></div>
              </Link>
            ))}
          </div>
          <div className="center-action"><button className="button button-light" data-order-open type="button">Хочу фотокнигу</button></div>
        </div>
      </section>

      <HomeTrustSection className="home-trust-section" />

      <section className="section home-gallery-section" aria-labelledby="home-gallery-title">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">Галерея</span><h2 id="home-gallery-title">Посмотрите готовые фотокниги</h2></div>
            <p>Листайте фотографии, чтобы рассмотреть обложки и готовые развороты.</p>
          </div>
          <HomeGalleryCarousel />
        </div>
      </section>

      <HomePricingSection items={homepagePricing} />

      <HomeSevenDaysSection items={homepageSteps} />

      <section className="section section-reviews section-ink">
        <div className="shell">
          <div className="section-heading split-heading"><div><span className="eyebrow reviews-eyebrow">Отзывы</span><h2>Отзывы о фотокнигах</h2></div><p>Сохраняем живые отзывы клиентов без пересказа и редакторских правок.</p></div>
          <ReviewCarousel images={reviewImages} />
          <div className="center-action action-row"><a className="text-link yandex-review-link" href={contacts.yandex} target="_blank" rel="noreferrer"><span>Отзывы на яндекс услугах</span><strong>ЧИТАТЬ ЗДЕСЬ</strong></a></div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="shell faq-layout">
          <div className="faq-intro"><span className="eyebrow">Частые вопросы</span><h2>Остались вопросы?</h2><p>Не нашли ответ? Напишите нам в мессенджер — отвечаем ежедневно.</p><button className="button" data-order-open type="button">Задать вопрос</button></div>
          <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
        </div>
      </section>
    </main>
  );
}

export function OriginalFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid original-footer-grid">
        <div className="footer-catalog"><p><a className="footer-heading-link" href="/katalog/"><strong>Каталог</strong></a><br /><a href="/wedding-fotoknig/">Свадебные фотокниги</a><br /><a href="/detskaya-fotokniga/">Детские фотокниги</a><br /><a href="/yubilejnaya-fotokniga/">Фотокниги на юбилей</a><br /><a href="/fotokniga-o-puteshestvii/">Фотокниги путешествий</a><br /><a href="/vypusknye-fotoknigi/">Выпускные альбомы</a><br /><a href="/genealogicheskaya-fotokniga/">Родословная фотокнига</a><br /><a href="/fotokniga-na-lyubuyu-temu/">Фотокниги на любую тему</a><br /><a href="/fotokniga-s-dopolnennoj-realnostyu/">Фотокниги с оживающими фото</a></p></div>
        <div className="footer-pricing"><p><a className="footer-heading-link" href="/stoimost/"><strong>Стоимость</strong></a><br /><a href="/fotokniga-premium/">Фотокниги Премиум</a><br /><a href="/fotokniga-standart/">Фотокниги Стандарт</a><br /><a href="/vypusknye-fotoknigi-stoimost/">Выпускные альбомы</a><br /><a href="/fotoknigi-s-dopolnennoj-realnostju-stoim/">Фотокниги с оживающими фото</a></p><p className="footer-subheading"><a className="footer-heading-link" href="/company/"><strong>Сервисы</strong></a></p><p className="footer-service-links"><a href="/company/">О компании</a><br /><a href="/otzyvy/">Отзывы о фотокнигах</a><br /><a href="/blog_fotoknigi/">Блог о фотокнигах</a><br /><a href="/kontakty/">Контакты</a></p></div>
        <div className="footer-agreements"><p><a className="footer-heading-link" href="/polzovatelskoe-soglashenie/"><strong>Соглашения</strong></a></p><p><a href="/polzovatelskoe-soglashenie/">Пользовательское соглашение</a><br /><a href="/privacy-policy/">Политика конфиденциальности</a><br /><a href="/soglashenie/">Согласие на обработку персональных данных</a></p><p><br />ИП Ардашева Елена Викторовна<br />ИНН 772008137237<br />ОГРНИП 325774600377441</p></div>
        <div className="footer-contacts"><div className="footer-contact-card"><p>Телефон:&nbsp; <a href={contacts.phoneHref}>8 (985) 434-23-67</a></p><p>Почта: <a href={`mailto:${contacts.email}`}>{contacts.email}</a></p><p>Адрес: Москва, Свободный проспект, д. 33</p><p>Режим работы: с 9 до 21, без выходных</p><p className="footer-socials"><a href={contacts.yandex} target="_blank" rel="noopener noreferrer"><Image src={optimizedMediaUrl("/media/optimized/social/yandex-64.webp")} alt="Отзывы о WedFotoBook на Яндекс Услугах" width={40} height={40} sizes="40px" /></a><a href={contacts.vk} target="_blank" rel="noopener noreferrer"><Image src={optimizedMediaUrl("/media/optimized/social/vk-64.webp")} alt="Страница WedFotoBook во ВКонтакте" width={40} height={40} sizes="40px" /></a><a href={contacts.telegram} target="_blank" rel="noopener noreferrer"><Image src={optimizedMediaUrl("/media/optimized/social/telegram-64.webp")} alt="Написать в Telegram" width={40} height={40} sizes="40px" /></a><a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer"><Image src={optimizedMediaUrl("/media/optimized/social/whatsapp-64.webp")} alt="Написать в WhatsApp" width={40} height={40} sizes="40px" /></a><a href={contacts.max} target="_blank" rel="noopener noreferrer"><Image src={optimizedMediaUrl("/media/optimized/social/max-64.webp")} alt="Написать в мессенджере MAX" width={40} height={40} sizes="40px" /></a></p></div></div>
      </div>
    </footer>
  );
}
