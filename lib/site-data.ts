import mediaManifest from "@/public/media/manifest.json";
import wordpressPages from "@/data/pages.json";

export type SitePage = {
  slug: string;
  wpSlug: string;
  postType: "page" | "post";
  kind: "home" | "pricing" | "catalog" | "article" | "legal" | "service";
  name: string;
  title: string;
  description: string;
  canonical: string;
  publishedAt: string;
  modifiedAt: string;
  bodyHtml: string;
};

export type MediaItem = {
  src: string;
  group: string;
  width: number;
  height: number;
  alt: string;
};

const metaOverrides: Record<string, Pick<SitePage, "title" | "description">> = {
  "": {
    title: "Фотокнига на заказ в Москве — под ключ за 7 дней",
    description:
      "Заказать фотокнигу на заказ в Москве — от 8 900 руб. Индивидуальный дизайн, от 1 экз. Пришлите фото — сделаем под ключ за 7 дней. Консультация бесплатно!",
  },
  otzyvy: {
    title: "Отзывы о фотокнигах",
    description:
      "Реальные отзывы клиентов о фотокнигах на свадьбу, юбилей, выпускной и другие важные события.",
  },
  katalog: {
    title: "Каталог фотокниг на заказ — примеры работ | Москва",
    description:
      "Каталог фотокниг на заказ в Москве: свадебные, детские, семейные и выпускные. Индивидуальный дизайн, изготовление под ключ за 7 дней.",
  },
  kontakty: {
    title: "Фотокниги в Москве на заказ | Контакты | 8-985-434-23-67",
    description:
      "Фотокниги в Москве на заказ: звоните 8-985-434-23-67 ежедневно с 9:00 до 21:00. Пишите в удобный мессенджер или на почту.",
  },
  "wedding-fotoknig": {
    title: "Свадебная фотокнига на заказ в Москве — под ключ от 8 900 руб",
    description:
      "Свадебная фотокнига с индивидуальным дизайном из ваших фотографий. От одного экземпляра, готовность в среднем за 7 дней.",
  },
};

export const pages: SitePage[] = (wordpressPages as SitePage[]).map((page) => ({
  ...page,
  ...(metaOverrides[page.slug] ?? {}),
  canonical: page.slug ? `https://wedfotobook.ru/${page.slug}/` : "https://wedfotobook.ru/",
}));

export const media = mediaManifest as MediaItem[];

export function getPage(slug: string): SitePage | undefined {
  return pages.find((page) => page.slug === slug);
}

export function getMediaGroup(group: string): MediaItem[] {
  return media.filter((item) => item.group === group);
}

export const contacts = {
  phoneDisplay: "8 (985) 434-23-67",
  phoneHref: "tel:+79854342367",
  email: "79854342367@yandex.ru",
  telegram: "https://t.me/photokniga_na_zakaz",
  whatsapp: "https://api.whatsapp.com/send?phone=79854342367",
  max: "https://max.ru/u/f9LHodD0cOJ5Zl6txMz3n1Zb4S1hvEYLBFyEYIW5xpVEobXBYyFg-w8iOM4",
  vk: "https://vk.com/club41282892",
  yandex:
    "https://uslugi.yandex.ru/profile/ElenaArdasheva-131798?occupationId=%2Fdizajnery",
};

export const catalogItems = [
  {
    slug: "wedding-fotoknig",
    title: "Свадебные фотокниги",
    description: "История вашей свадьбы в книге с индивидуальным дизайном.",
    cover: "/media/covers/svadba-fotokniga-wedfotobook-ru.webp",
    gallery: "gallery/wedding",
  },
  {
    slug: "detskaya-fotokniga",
    title: "Детские фотокниги",
    description: "От первых дней до совершеннолетия — самые важные моменты детства.",
    cover: "/media/covers/dety-fotokniga-wedfotobook-ru.webp",
    gallery: "gallery/children",
  },
  {
    slug: "yubilejnaya-fotokniga",
    title: "Фотокниги на юбилей",
    description: "Тёплый подарок, собранный из семейных снимков и воспоминаний.",
    cover: "/media/covers/ubiley-fotokniga-wedfotobook-ru.webp",
    gallery: "gallery/anniversary",
  },
  {
    slug: "fotokniga-o-puteshestvii",
    title: "Фотокниги путешествий",
    description: "Маршруты, эмоции и лучшие кадры поездки в одном издании.",
    cover: "/media/covers/fotokniga-puteshedtvij-wedfotobook-ru.webp",
    gallery: "gallery/travel",
  },
  {
    slug: "vypusknye-fotoknigi",
    title: "Выпускные альбомы",
    description: "Современные альбомы для школы, колледжа и университета.",
    cover: "/media/covers/vipusk-albom-wedfotobook-ru.webp",
    gallery: "gallery/graduation",
  },
  {
    slug: "genealogicheskaya-fotokniga",
    title: "Родословные фотокниги",
    description: "Семейная история с генеалогическим древом и архивными фотографиями.",
    cover: "/media/covers/fotokniga-genealogia-wedfotobook-ru.webp",
    gallery: "gallery/genealogy",
  },
  {
    slug: "fotokniga-na-lyubuyu-temu",
    title: "Фотокниги на любую тему",
    description: "Любая ваша история — без шаблонов и ограничений по сюжету.",
    cover: "/media/covers/fotokbiga-drugaj-wedfotobook-ru.webp",
    gallery: "gallery/other",
  },
  {
    slug: "fotokniga-s-dopolnennoj-realnostyu",
    title: "Фотокниги с оживающими фото",
    description: "Наведите камеру телефона на страницу — и фотография оживёт.",
    cover: "/media/covers/fotokniga-alive-photo-wedfotobook-ru.webp",
    gallery: "gallery/other",
  },
] as const;

export const pricing = [
  {
    title: "Премиум",
    price: "от 8 900 ₽",
    href: "/fotokniga-premium/",
    image: "/media/home/fotokniga-premium-wedfotobook-ru.webp",
    features: ["Твёрдая фотообложка", "Плотные листы", "Панорамный разворот", "От 10 разворотов"],
  },
  {
    title: "Стандарт",
    price: "от 9 800 ₽",
    href: "/fotokniga-standart/",
    image: "/media/home/fotokniga-standart-wedfotobook-ru.webp",
    features: ["Твёрдая фотообложка", "Журнальные листы", "От 24 страниц", "Индивидуальный дизайн"],
  },
  {
    title: "Выпускные альбомы",
    price: "от 1 500 ₽",
    href: "/vypusknye-fotoknigi-stoimost/",
    image: "/media/home/vipusk-albom-1-wedfotobook-ru.webp",
    features: ["Премиум или Стандарт", "Заказ от 10 экземпляров", "Единый стиль класса", "Под ключ"],
  },
  {
    title: "Оживающие фото",
    price: "от 9 200 ₽",
    href: "/fotoknigi-s-dopolnennoj-realnostju-stoim/",
    image: "/media/home/fotokniga-alive-photo-stoimost-wedfotobook-ru.webp",
    features: ["Связываем фото и видео", "Эффект дополненной реальности", "Работает со смартфона", "Можно оживить фото с ИИ"],
  },
] as const;

export const benefits = [
  ["dizain-bez-shablonov.webp", "Дизайн без шаблонов", "Только ваша история, стиль и эмоции."],
  ["proboval-sam.webp", "Всё сделаем за вас", "Отберите фотографии — остальное берём на себя."],
  ["a-vdryg-ne-ponpavica.webp", "Сначала покажем результат", "Три разворота до внесения предоплаты."],
  ["pezultat-100.webp", "Правки без ограничений", "Дорабатываем макет до полного одобрения."],
  ["bez-ploxix-foto.webp", "Исправим фотографии", "Цветокоррекция и увеличение маленьких снимков с ИИ."],
  ["pabota-onlain.webp", "Вся работа онлайн", "Общаемся в удобном мессенджере без выходных."],
  ["fotokniga-za-7-day.webp", "В среднем за 7 дней", "Срочный заказ можно выполнить за четыре дня."],
  ["texnology-pechaty.webp", "Современная печать", "Плотные материалы, яркие цвета и панорамные развороты."],
] as const;

export const steps = [
  ["prishlite-foto.webp", "Пришлите фото", "В мессенджер, на почту или ссылкой на облако."],
  ["consultacia.webp", "Консультация", "Определяем формат, количество разворотов и стоимость."],
  ["tree-pasvorota.webp", "Три разворота", "Показываем первые страницы до оплаты."],
  ["oplata.webp", "Предоплата", "После согласования первых разворотов — 50%."],
  ["soglacovanie.webp", "Согласование", "Вносим правки до вашего полного одобрения."],
  ["print.webp", "Печать", "Отправляем утверждённый макет в типографию."],
  ["fotokniga-gotova.webp", "Готово", "Доставка в удобный пункт выдачи или курьером."],
] as const;

export const faqs = [
  ["У вас есть конструктор фотокниг?", "Нет. Каждый макет мы создаём вручную с индивидуальным дизайном."],
  ["Что входит в обработку фотографий?", "Цветокоррекция, кадрирование и при необходимости увеличение снимков с помощью ИИ."],
  ["Подойдут фотографии с телефона?", "Да. Современные смартфоны дают достаточное качество, а маленькие снимки мы умеем увеличивать."],
  ["Что нужно для заказа?", "Прислать фотографии, согласовать макет и выбрать удобный способ получения готовой книги."],
  ["Можно добавить надписи?", "Да, бесплатно. Пришлите свои тексты или попросите нас подобрать подходящие фразы."],
  ["Можно увидеть макет до оплаты?", "Да. Мы подготовим три первых разворота до внесения предоплаты."],
  ["Сколько раз можно вносить правки?", "Без ограничений — работаем до вашего полного одобрения."],
  ["Как проходит работа?", "Полностью онлайн: отправляем макет в мессенджер, получаем комментарии и вносим изменения."],
  ["Сколько времени занимает изготовление?", "В среднем семь дней. Срочный заказ можно выполнить за четыре дня с доплатой 50%."],
  ["Где печатаются фотокниги?", "В профессиональной типографии на современных материалах."],
  ["Можно заказать генеалогическое древо?", "Да, для фотокниги или отдельно для печати в большом формате."],
  ["Как получить заказ?", "В пункте выдачи Яндекс Маркета, курьером в пределах МКАД или Почтой России."],
  ["Вы работаете с юридическими лицами?", "Да. Предоставляем договор, счёт и необходимые документы."],
] as const;

export function safeContent(html: string): string {
  return html
    .replace(/<h1(\s|>)/gi, "<h2$1")
    .replace(/<\/h1>/gi, "</h2>")
    .replace(/https?:\/\/wedfotobook\.ru\//gi, "/")
    .replace(/\/wp-content\/uploads\/2026\/08\/01-kopiya\.png/gi, "/wp-content/uploads/2026/08/01-3.png");
}
