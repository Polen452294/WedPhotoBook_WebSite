import Image from "next/image";
import Link from "next/link";
import { ReviewCarousel } from "@/components/ReviewCarousel";
import { contacts, getMediaGroup } from "@/lib/site-data";

const craft = [
  {
    number: "01",
    title: "Профессиональная обработка фотографий",
    image: "/media/home/obrabotka-foto-wedfotobook-ru.webp",
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
    image: "/media/home/dizain-fotoknigi-wedfotobook-ru.webp",
    text: [
      "⋅ Создаём фотокниги с уникальным дизайном — без использования шаблонов.",
      "⋅ Мы настолько уверены в результате, что готовы начать работу без предоплаты. Мы бесплатно подготовим для вас дизайн первых 3 разворотов.",
      "⋅ Хотите добавить в фотокнигу надписи? Вы можете прислать свои тексты или мы подберём подходящие фразы. Без доплат!",
    ],
  },
  {
    number: "03",
    title: "Согласование макета",
    image: "/media/home/soglasovanie-maketa-wedfotobook-ru.webp",
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
  {
    title: "Фотокниги с оживающими фото",
    price: "от 9 200 руб.",
    href: "/fotoknigi-s-dopolnennoj-realnostju-stoim/",
    image: "/media/home/fotokniga-alive-photo-stoimost-wedfotobook-ru.webp",
    features: ["Мы можем связать фото и видео.", "Если видео нет, можем оживать фотографии с помощью ИИ."],
  },
] as const;

const steps = [
  ["prishlite-foto.webp", "Пришлите фото", "В мессенджер, на почту или ссылкой на облако."],
  ["consultacia.webp", "Консультация", "Определяем формат, количество разворотов и стоимость."],
  ["tree-pasvorota.webp", "Три разворота", "Показываем первые страницы до оплаты."],
  ["oplata.webp", "Предоплата", "После согласования первых разворотов — 50%."],
  ["soglacovanie.webp", "Согласование", "Вносим правки до вашего полного одобрения."],
  ["print.webp", "Печать", "Отправляем утверждённый макет в типографию."],
  ["fotokniga-gotova.webp", "Готово", "Доставка в удобный пункт выдачи или курьером."],
] as const;

const faqs = [
  ["1. Есть ли у вас конструктор по созданию фотокниг?", "Конструктора у нас нет. Все макеты делаются дизайнерами вручную, без шаблонов, только с индивидуальным дизайном. Мы создаем красивые истории из ваших фотографий."],
  ["2. Что значит обработка фотографий?", "Мы делаем цветокоррекцию фотографий, чтобы в фотокниге не было темных или неярких фотографий. Также делаем кадрирование, т.е. при необходимости обрезаем лишнее пустое пространство."],
  ["3. У меня фотографии только в телефоне. Подойдут ли они для фотокниги?", "Сейчас практически у всех фотографии только из телефона. Современное качество смартфонов позволяет делать снимки хорошего качества. Если разрешения фотографии недостаточно, мы можем увеличить ее с помощью искусственного интеллекта."],
  ["4. Сколько стоит добавить тексты в фотокнигу?", "Это бесплатно. Вы можете прислать свои тексты, и мы добавим их в фотокнигу. Если вы хотите сделать надписи на страницах, но не можете придумать их, мы сами подберем красивые надписи и разместим в фотокниге."],
  ["5. Что нужно при заказе фотокниги у вас?", "Прислать фотографии на вотсап, телеграмм, почту 79854342367@yandex.ru или ссылку на яндекс диск/Мейл облако. Согласовать макет. Забрать фотокнигу в удобном пункте Яндекс маркета. Все остальное мы сделаем за вас!"],
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
                <div className="craft-image"><Image src={item.image} alt="" width={996} height={561} /></div>
                <div className="craft-copy"><span className="craft-number">{item.number}</span><h3>{item.title}</h3><div className="craft-body">{item.text.map((text) => <p key={text}>{text}</p>)}</div></div>
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
          <div className="section-heading center-heading"><span className="eyebrow eyebrow-light">Каталог</span><h2>Какие фотокниги мы делаем? Любые!</h2><p>Свадьба, первый год малыша, юбилей, выпускной или путешествие — мы найдём визуальный язык для любого события.</p></div>
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
          <div className="section-heading split-heading"><div><span className="eyebrow">Почему нам доверяют</span><h2>Почему нам можно доверять?</h2></div><p>Вы видите будущую книгу ещё до оплаты и участвуете в создании ровно настолько, насколько хотите.</p></div>
          <div className="benefit-grid">
            {benefits.map(([icon, title, text]) => <article className="benefit-card" key={title}><Image src={`/media/benefits/${icon}`} alt="" width={118} height={122} /><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section section-warm">
        <div className="shell">
          <div className="section-heading center-heading">
            <span className="eyebrow">Стоимость</span>
            <h2>Хотите узнать стоимость фотокниги до начала работы?</h2>
            <p>Можем сделать фотокнигу в кожаной или тканевой обложке.</p>
          </div>
          <div className="pricing-grid">
            {pricing.map((item, index) => <article className={`price-card ${index === 0 ? "featured" : ""}`} key={item.title}>{index === 0 && <span className="price-badge">Чаще выбирают</span>}<Image src={item.image} alt={item.title} width={960} height={518} /><div className="price-card-copy"><h3>{item.title}</h3><strong>{item.price}</strong><ul>{item.features.map((feature) => <li key={feature}>{feature.replace(/^⋅\s*/, "")}</li>)}</ul><Link href={item.href}>Подробнее →</Link></div></article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading split-heading"><div><span className="eyebrow">Восемь простых шагов</span><h2>Как проходит заказ</h2></div><p>Вся работа идёт онлайн, без поездок в офис и долгих встреч.</p></div>
          <ol className="steps-grid">
            {steps.map(([icon, title, text], index) => <li key={title}><span className="step-number">0{index + 1}</span><Image src={`/media/steps/${icon}`} alt="" width={41} height={39} /><h3>{title}</h3><p>{text}</p></li>)}
          </ol>
          <div className="center-action"><button className="button" data-order-open type="button">Начать заказ</button></div>
        </div>
      </section>

      <section className="section section-reviews">
        <div className="shell">
          <div className="section-heading split-heading"><div><span className="eyebrow">Отзывы</span><h2>Отзывы о фотокнигах</h2></div><p>Сохраняем живые отзывы клиентов без пересказа и редакторских правок.</p></div>
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
        <div className="footer-catalog"><p><strong>Каталог</strong><br /><a href="/wedding-fotoknig/">Свадебные фотокниги</a><br /><a href="/detskaya-fotokniga/">Детские фотокниги</a><br /><a href="/yubilejnaya-fotokniga/">Фотокниги на юбилей</a><br /><a href="/fotokniga-o-puteshestvii/">Фотокниги путешествий</a><br /><a href="/vypusknye-fotoknigi/">Выпускные альбомы</a><br /><a href="/genealogicheskaya-fotokniga/">Родословные фотокниги</a><br /><a href="/fotokniga-na-lyubuyu-temu/">Фотокниги на любую тему</a><br /><a href="/fotokniga-s-dopolnennoj-realnostyu/">Фотокниги с оживающими фото</a></p></div>
        <div className="footer-pricing"><p><strong>Стоимость</strong><br /><a href="/fotokniga-premium/">Фотокниги Премиум</a><br /><a href="/fotokniga-standart/">Фотокниги Стандарт</a><br /><a href="/vypusknye-fotoknigi-stoimost/">Выпускные альбомы</a><br /><a href="/fotoknigi-s-dopolnennoj-realnostju-stoim/">Фотокниги с оживающими фото</a></p><p className="footer-subheading"><strong>Сервисы</strong></p><p className="footer-service-links"><a href="/company/">О компании</a><br /><a href="/otzyvy/">Отзывы о фотокнигах</a><br /><a href="/blog_fotoknigi/">Блог о фотокнигах</a><br /><a href="/kontakty/">Контакты</a></p></div>
        <div className="footer-agreements"><p><strong>Соглашения</strong></p><p><a href="/polzovatelskoe-soglashenie/">Пользовательское соглашение</a><br /><a href="/politika-obrabotki-personalnyh-dannyh/">Политика обработки персональных данных</a><br /><a href="/soglashenie/">Согласие на обработку персональных данных</a></p><p><br />ИП Ардашева Елена Викторовна<br />ИНН 772008137237&nbsp;ОГРНИП&nbsp;325774600377441</p></div>
        <div className="footer-contacts"><p>Телефон:&nbsp; <a href={contacts.phoneHref}>8 (985) 434-23-67</a></p><p>Почта: <a href={`mailto:${contacts.email}`}>{contacts.email}</a></p><p>Режим работы: с 9 до 21, без выходных</p><p className="footer-socials"><a href={contacts.yandex} target="_blank" rel="noopener noreferrer"><Image src="/wp-content/uploads/2021/04/icon6-optimized.png" alt="Фотокниги на заказ в Москве — wedfotobook" width={40} height={40} /></a><a href={contacts.vk} target="_blank" rel="noopener noreferrer"><Image src="/wp-content/uploads/2021/03/icos1-optimized.png" alt="Фотокниги на заказ в Москве — wedfotobook" width={40} height={40} /></a><a href={contacts.telegram} target="_blank" rel="noopener noreferrer"><Image src="/wp-content/uploads/2021/03/icos3-optimized.png" alt="Телеграм" width={40} height={40} /></a><a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer"><Image src="/wp-content/uploads/2021/03/icos5-optimized.png" alt="Вотсап" width={40} height={40} /></a><a href={contacts.max} target="_blank" rel="noopener noreferrer"><Image src="/wp-content/uploads/2026/01/logotip_max.svg_-optimized.png" alt="Max" width={40} height={40} /></a></p></div>
      </div>
    </footer>
  );
}
