import Image from "next/image";
import Link from "next/link";
import { contacts, getMediaGroup } from "@/lib/site-data";

const craft = [
  {
    title: "1. Профессиональная обработка фотографий",
    image: "/media/home/obrabotka-foto-wedfotobook-ru.webp",
    text: [
      "⋅ Хотите, чтобы ваша фотокнига выглядела как топовое издание? Доверьте обработку снимков нам.",
      "⋅ Фото на страницах будут естественными — светлыми и не тусклыми.",
      "⋅ Мы увеличиваем размеры маленьких снимков с помощью ИИ.",
      "И это уже входит в стоимость!",
    ],
  },
  {
    title: "2. Дизайн фотокниги",
    image: "/media/home/dizain-fotoknigi-wedfotobook-ru.webp",
    text: [
      "⋅ Создаём фотокниги с уникальным дизайном — без использования шаблонов.",
      "⋅ Мы настолько уверены в результате, что готовы начать работу без предоплаты. Мы бесплатно подготовим для вас дизайн первых 3 разворотов.",
      "⋅ Хотите добавить в фотокнигу надписи? Вы можете прислать свои тексты или мы подберём подходящие фразы. Без доплат!",
    ],
  },
  {
    title: "3. Согласование макета",
    image: "/media/home/soglasovanie-maketa-wedfotobook-ru.webp",
    text: [
      "⋅ После того как макет будет готов, вы получите его для просмотра. Проверьте, все ли фотографии на месте, нет ли опечаток в тексте.",
      "⋅ Если что‑то хочется поменять, просто сообщите — мы внесём правки.",
      "⋅ Обычно доступно 1–2 круга корректировок. У нас такого нет. Правки можно вносить без ограничений.",
      "Безлимитные правки до вашего «идеально» без доплат!",
    ],
  },
  {
    title: "4. Печать фотокниги и доставка",
    image: "/media/home/print-fotoknig-wedfotobook-ru.webp",
    text: [
      "⋅ После утверждения макета, мы сразу отправляем его в печать.",
      "⋅ Мы используем качественные материалы и современные технологии — так каждая страница получается яркой, чёткой и долговечной.",
      "⋅ Получить готовую фотокнигу можно в любом пункте Яндекс маркета или курьером в пределах МКАД.",
    ],
  },
] as const;

const catalog = [
  ["wedding-fotoknig", "Свадебная фотокнига", "с индивидуальным дизайном сохранит память об этом прекрасном событии!", "/media/covers/svadba-fotokniga-wedfotobook-ru.webp"],
  ["detskaya-fotokniga", "Детская фотокнига", "от рождения до года или от рождения до 18 — это память о детстве.", "/media/covers/dety-fotokniga-wedfotobook-ru.webp"],
  ["yubilejnaya-fotokniga", "Фотокнига на юбилей", "станет настоящим семейным сокровищем, хранящим воспоминания.", "/media/covers/ubiley-fotokniga-wedfotobook-ru.webp"],
  ["fotokniga-o-puteshestvii", "Фотокнига путешествий", "— это прекрасный способ сохранить яркие моменты вашего путешествия.", "/media/covers/fotokniga-puteshedtvij-wedfotobook-ru.webp"],
  ["vypusknye-fotoknigi", "Выпускной альбом", "— это напоминание об учебе в школе, университете или колледже.", "/media/covers/vipusk-albom-wedfotobook-ru.webp"],
  ["genealogicheskaya-fotokniga", "Родословная книга", "об истории семье может передаваться из поколения в поколение.", "/media/covers/fotokniga-genealogia-wedfotobook-ru.webp"],
  ["fotokniga-na-lyubuyu-temu", "Другая фотокнига", "(корпоративная, семейная, о животных, даче и т.д.)", "/media/covers/fotokbiga-drugaj-wedfotobook-ru.webp"],
  ["fotokniga-s-dopolnennoj-realnostyu", "Фотокнига с оживающими фото.", "Наведите камеру телефона на фотографии и они оживут.", "/media/covers/fotokniga-alive-photo-wedfotobook-ru.webp"],
] as const;

const benefits = [
  ["dizain-bez-shablonov.webp", "Дизайн без шаблонов", "Только ваша история, ваш стиль, ваши эмоции"],
  ["proboval-sam.webp", "Пробовал сам, получилось плохо", "Не нужно ничего делать самому. Просто пришлите фото — дизайнеры все сделают за вас"],
  ["a-vdryg-ne-ponpavica.webp", "А вдруг не понравится?", "Вы увидите 3 разворота до внесения предоплаты"],
  ["pezultat-100.webp", "Результат на 100%", "Вносим правки до полного одобрения макета. Без ограничений"],
  ["bez-ploxix-foto.webp", "Без плохих фото", "Цветокоррекция фото. При низком качестве увеличение фото с помощью ИИ"],
  ["pabota-onlain.webp", "Вся работа онлайн", "В любое удобное время через любой мессенджер. Без выходных"],
  ["fotokniga-za-7-day.webp", "Фотокнига за 7 дней", "Пришлите фото и через 7 дней заберите готовую фотокнигу. Срочный заказ? Сделаем за 4 дня"],
  ["texnology-pechaty.webp", "Современные технологии", "Печать класса Премиум: твердая обложка, плотные листы, панорамный разворот"],
] as const;

const pricing = [
  {
    title: "Фотокнига «Премиум»",
    price: "от 8 900 руб.",
    href: "/fotokniga-premium/",
    image: "/media/home/fotokniga-premium-wedfotobook-ru.webp",
    features: ["⋅ Твердая фотообложка", "⋅ Плотные листы", "⋅ Панорамный разворот", "⋅ От 10 разворотов"],
  },
  {
    title: "Фотокнига «Стандарт»",
    price: "от 9 800 руб.",
    href: "/fotokniga-standart/",
    image: "/media/home/fotokniga-standart-wedfotobook-ru.webp",
    features: ["⋅ Твердая фотообложка", "⋅ Журнальные листы", "⋅ От 24 страниц"],
  },
  {
    title: "Выпускные альбомы",
    price: "от 1 500 руб.",
    href: "/vypusknye-fotoknigi-stoimost/",
    image: "/media/home/vipusk-albom-1-wedfotobook-ru.webp",
    features: ["⋅Твердая фотообложка", "⋅ Премиум или Стандарт", "⋅ От 1 разворота", "⋅ Заказ от 10 экз."],
  },
] as const;

const steps = [
  ["prishlite-foto.webp", "1. Пришлите фото", "На почту, WhatsApp/Телеграм/Макс или ссылку на Яндекс диск/Mail облако"],
  ["consultacia.webp", "2. Консультация", "Решаем по формату, количеству разворотов и стоимости"],
  ["tree-pasvorota.webp", "3. Три разворота", "Посмотрите и согласуйте первые 3 разворота"],
  ["oplata.webp", "4. Предоплата", "Внесите предоплату — 50%. Оплата по QR коду/счет для юр.лиц"],
  ["soglacovanie.webp", "5. Согласование", "Внесите правки в макет при желании"],
  ["oplata.webp", "6. Оплата", "Оплатите оставшиеся 50% и доставку. Оплата по QR коду/счет для юр.лиц"],
  ["print.webp", "7. Печать", "Определяемся с доставкой и отправляем в типографию"],
  ["fotokniga-gotova.webp", "8. Готово!", "Заберите готовую фотокнигу в удобном пункте выдачи Яндекс маркета"],
] as const;

const faqs = [
  ["1. Если у вас конструктор для создания фотокниг?", "Нет, все макеты делаются вручную с индивидуальным дизайном. Мы создаем красивые истории из ваших фотографий."],
  ["2. Что значит обработка фотографий?", "Мы делаем цветокоррекцию фотографий, чтобы в фотокниге не было темных или неярких фотографий. Также делаем кадрирование, т.е. при необходимости обрезаем лишнее пустое пространство."],
  ["3. У меня фотографии только в телефоне, подойдет они для фотокниги?", "Сейчас практически у всех фотографии только из телефона. Современное качество смартфонов позволяет делать снимки хорошего качества. Если разрешения фотографии недостаточно, мы можем увеличить ее с помощью искусственного интеллекта."],
  ["5. Что нужно при заказе фотокниги у вас?", "Прислать фотографии на вотсап, телеграмм, почту 79854342367@yandex.ru или ссылку на яндекс диск/Мейл облако. Согласовать макет. Забрать фотокнигу в удобном пункте Яндекс маркета. Все остальное мы сделаем за вас!"],
  ["4. Сколько стоит добавить тексты в фотокнигу?", "Это бесплатно. Вы можете прислать свои тексты, и мы добавим их в фотокнигу. Если вы хотите сделать надписи на страницах, но не можете придумать их, мы сами подберем красивые надписи и разместим в фотокниге."],
  ["6. Могу я увидеть макет до оплаты?", "После того, как вы пришлете фотографии, мы сделаем 3 разворота до внесения предоплаты, чтобы вы увидели, как будет выглядеть ваша фотокнига по стилю. Если что-то не понравится, можно внести правки. Вы нечем не рискуете!"],
  ["7. Можно ли что-то изменить в макете?", "Да, конечно, вы можете написать нам что хотите изменить, и мы внесем правки. Изменения можно вносить в любой момент до отправки фотокниги в печать."],
  ["8. Как происходит работа над фотокнигой?", "Все работа происходит онлайн в удобное для вас время. Мы делаем макет, отправляем его вам на WhatsApp. Вы смотрите, пишите поправкам. Мы вносим правки, высылаем вам макет с правками."],
  ["9. Сколько раз можно вносить правки?", "У большинства компаний правки можно вносить 3 раза. У нас такого нет. Кому-то достаточно 1 раз внести правки, кому-то нужно 10 раз. Все люди разные, поэтому мы не ограничивает вас. Мы работаем на результат, добиваюсь того, чтобы фотокнига понравилась вам на 100%."],
  ["10. Какие сроки создания фотокниги?", "Обычно на создание фотокниги уходит в среднем 7 дней."],
  ["11. Я забыл, что у моей мамы/папы/брата/друга день рождения в субботу, можно ли сделать фотокнигу быстрее?", "У нас есть срочный заказ, фотокнига за 4 дня. Быстрее, к сожалению, сделать фотокнигу нельзя, т.к. процесс печати включает проклейку, просушки и т.д., а их ускорить нельзя. Срочный заказ дороже на 50%"],
  ["12. Где вы печатаете фотокниги?", "Мы печатает фотокниги в профессиональной типографии."],
  ["13. Можете отрисовать генеалогическое древо?", "Да, конечно. Мы может отрисовать генеалогическое древо, как для фотокниги, так и просто для печати в большом формате."],
  ["14. Где я заберу фотокнигу?", "В любом удобном пункте выдачи Яндекс Маркета. Можно заказать курьерскую доставку в пределах МКАД. Или Почтой России."],
  ["15. Вы работаете с юр. лицами?", "Да, конечно. Можем прислать договор, выставить счет на оплату и т.д."],
] as const;

export function OriginalHomeSections() {
  const reviewImages = getMediaGroup("reviews");

  return (
    <main className="original-home-sections">
      <section className="section section-craft">
        <div className="shell">
          <div className="section-heading"><h2>Как мы делаем фотокниги?</h2></div>
          <div className="craft-list">
            {craft.map((item, index) => (
              <article className={`craft-item ${index % 2 ? "reverse" : ""}`} key={item.title}>
                <div className="craft-image"><Image src={item.image} alt="" width={996} height={561} /></div>
                <div className="craft-copy"><h3>{item.title}</h3><div className="craft-body">{item.text.map((text) => <p key={text}>{text}</p>)}</div></div>
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

      <section className="section section-reviews">
        <div className="shell">
          <div className="section-heading"><h2>Отзывы о фотокнигах</h2></div>
          <div className="review-strip">
            {reviewImages.map((image) => <figure key={image.src}><Image src={image.src} alt={image.alt || ""} width={image.width} height={image.height} loading="lazy" /></figure>)}
          </div>
          <div className="review-navigation"><span>Назад</span><span>1 от 38</span><span>Далее</span></div>
          <div className="center-action action-row"><a className="text-link yandex-review-link" href={contacts.yandex} target="_blank" rel="noreferrer"><span>Отзывы на яндекс услугах</span><strong>ЧИТАТЬ ЗДЕСЬ</strong></a></div>
        </div>
      </section>

      <section className="section section-ink">
        <div className="shell">
          <div className="section-heading center-heading"><h2>Какие фотокниги мы делаем? Любые!</h2></div>
          <div className="catalog-grid">
            {catalog.map(([slug, title, description, cover]) => (
              <Link className="catalog-card" href={`/${slug}/`} key={slug}>
                <Image src={cover} alt={title} width={500} height={500} />
                <div><h3>{title} <small>{description}</small></h3></div>
              </Link>
            ))}
          </div>
          <div className="center-action"><button className="button button-light" data-order-open type="button">Хочу фотокнигу</button></div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading"><h2>Почему нам можно доверять?</h2></div>
          <div className="benefit-grid">
            {benefits.map(([icon, title, text]) => <article className="benefit-card" key={title}><Image src={`/media/benefits/${icon}`} alt="" width={118} height={122} /><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section section-warm">
        <div className="shell">
          <div className="section-heading center-heading"><h2>Хотите узнать стоимость фотокниги до начала работы?</h2></div>
          <div className="pricing-grid">
            {pricing.map((item) => <article className="price-card" key={item.title}><Image src={item.image} alt={item.title} width={960} height={518} /><div className="price-card-copy"><h3>{item.title}</h3><ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><strong>{item.price}</strong><Link href={item.href}>Подробнее</Link></div></article>)}
          </div>
          <p className="pricing-note">Можем сделать фотокнигу в кожаной или тканевой обложке.</p>
        </div>
      </section>

      <section className="section section-ink alive-section">
        <div className="shell craft-item">
          <div className="craft-image"><Image src="/media/home/fotokniga-alive-photo-blok-wedfotobook-ru.webp" alt="" width={960} height={518} /></div>
          <div className="craft-copy"><h2>Фотокниги с оживающими фото</h2><p>В такой фотокниге обычный снимок превращается в маленький видеоролик: стоит навести камеру смартфона на страницу — и перед глазами оживут смех ребёнка, первый танец молодожёнов или трогательное поздравление.</p><p>Мы можем связать фото и видео. Если видео нет, можем оживать фотографии с помощью ИИ.</p><p>Это отличный подарок: он удивляет, вызывает восторг и надолго остаётся в памяти!</p><strong>от 9 200 руб.</strong><button className="button button-light" data-order-open type="button">Заказать</button></div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading"><h2>Фотокнига на заказ всего за 7 дней!</h2></div>
          <ol className="steps-grid">
            {steps.map(([icon, title, text]) => <li key={title}><Image src={`/media/steps/${icon}`} alt="" width={41} height={39} /><h3>{title}</h3><p>{text}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="section faq-section">
        <div className="shell faq-layout">
          <div className="faq-intro"><h2>Остались вопросы?</h2></div>
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
        <div className="footer-brand">
          <Image src="/media/brand/logo-wedfotobook.png" alt="Фотокниги под ключ" width={300} height={62} />
          <div className="social-row">
            <a href={contacts.telegram} aria-label="Telegram"><Image src="/media/social/tg-wedfotobook.png" alt="" width={42} height={42} /></a>
            <a href={contacts.whatsapp} aria-label="WhatsApp"><Image src="/media/social/wapp-wedfotobook.png" alt="" width={42} height={42} /></a>
            <a href={contacts.max} aria-label="Max"><Image src="/media/social/max-wedfotobook.png" alt="" width={42} height={42} /></a>
            <a href={contacts.vk} aria-label="ВКонтакте"><Image src="/media/social/vk-wedfotobook.png" alt="" width={42} height={42} /></a>
          </div>
          <p>ИП Ардашева Елена Викторовна <br />ИНН 772008137237 <br />ОГРНИП 325774600377441</p>
        </div>
        <div><h2>Каталог</h2><ul><li><Link href="/wedding-fotoknig/">Свадебные фотокниги</Link></li><li><Link href="/detskaya-fotokniga/">Детские фотокниги</Link></li><li><Link href="/yubilejnaya-fotokniga/">Фотокниги на юбилей</Link></li><li><Link href="/fotokniga-o-puteshestvii/">Фотокниги путешествий</Link></li><li><Link href="/vypusknye-fotoknigi/">Выпускные альбомы</Link></li><li><Link href="/genealogicheskaya-fotokniga/">Родословные фотокниги</Link></li><li><Link href="/fotokniga-na-lyubuyu-temu/">Фотокниги на любую тему</Link></li><li><Link href="/fotokniga-s-dopolnennoj-realnostyu/">Фотокниги с оживающими фото</Link></li></ul></div>
        <div><h2>Стоимость</h2><ul><li><Link href="/fotokniga-premium/">Фотокниги Премиум</Link></li><li><Link href="/fotokniga-standart/">Фотокниги Стандарт</Link></li><li><Link href="/vypusknye-fotoknigi-stoimost/">Выпускные альбомы</Link></li><li><Link href="/fotoknigi-s-dopolnennoj-realnostju-stoim/">Фотокниги с оживающими фото</Link></li></ul><h2 className="footer-subheading">Сервисы</h2><ul><li><Link href="/company/">О компании</Link></li><li><Link href="/otzyvy/">Отзывы о фотокнигах</Link></li><li><Link href="/blog_fotoknigi/">Блог о фотокнигах</Link></li><li><Link href="/kontakty/">Контакты</Link></li></ul></div>
        <div className="footer-contacts"><h2>Соглашения</h2><ul><li><Link href="/polzovatelskoe-soglashenie/">Пользовательское соглашение</Link></li><li><Link href="/politika-obrabotki-personalnyh-dannyh/">Политика обработки персональных данных</Link></li><li><Link href="/soglashenie/">Согласие на обработку персональных данных</Link></li></ul><p>Телефон: <a href={contacts.phoneHref}>8 (985) 434-23-67</a><br />Почта: <a href={`mailto:${contacts.email}`}>{contacts.email}</a><br />Режим работы: с 9 до 21, без выходных</p></div>
      </div>
    </footer>
  );
}
