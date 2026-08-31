import Image from "next/image";
import Link from "next/link";

const catalogItems = [
  ["wedding-fotoknig", "Свадебная фотокнига", "С индивидуальным дизайном сохранит память об этом прекрасном событии!", "/media/covers/Svadba fotokniga wedfotobook ru.webp", "Обложка свадебной фотокниги с индивидуальным дизайном"],
  ["detskaya-fotokniga", "Детская фотокнига", "От рождения до года или от рождения до 18 — это память о детстве.", "/media/covers/Dety fotokniga wedfotobook ru.webp", "Обложка детской фотокниги с индивидуальным дизайном"],
  ["yubilejnaya-fotokniga", "Фотокнига на юбилей", "Станет настоящим семейным сокровищем, хранящим воспоминания.", "/media/covers/Ubiley fotokniga wedfotobook ru.webp", "Обложка фотокниги на юбилей"],
  ["fotokniga-o-puteshestvii", "Фотокнига путешествий", "Это прекрасный способ сохранить яркие моменты вашего путешествия.", "/media/covers/Fotokniga puteshedtvij wedfotobook ru.webp", "Обложка фотокниги о путешествии"],
  ["vypusknye-fotoknigi", "Выпускной альбом", "Это напоминание об учебе в школе, университете или колледже.", "/media/covers/Vipusk albom wedfotobook ru.webp", "Обложка выпускного альбома"],
  ["genealogicheskaya-fotokniga", "Родословная фотокнига", "Об истории семье может передаваться из поколения в поколение.", "/media/covers/Fotokniga genealogia wedfotobook ru.webp", "Обложка родословной фотокниги с семейной историей"],
  ["fotokniga-na-lyubuyu-temu", "Другая фотокнига", "Корпоративная, семейная, о животных, даче и т.д.", "/media/covers/Fotokbiga drugaj wedfotobook ru.webp", "Обложка фотокниги на любую тему с индивидуальным дизайном"],
  ["fotokniga-s-dopolnennoj-realnostyu", "Фотокнига с оживающими фото", "Наведите камеру телефона на фотографии и они оживут.", "/media/home/Fotokniga alive photo blok wedfotobook ru.webp", "Фотокнига с оживающими фотографиями"],
] as const;

export function CatalogPage() {
  return (
    <main className="catalog-page">
      <section className="catalog-page-section">
        <div className="shell">
          <header className="catalog-page-heading">
            <span className="eyebrow">Каталог</span>
            <h1>Примеры фотокниг</h1>
            <p>Здесь показаны примеры фотокниг. Мы создаем уникальные фотокниги на любые темы, предоставляя услуги по обработка фотографий, дизайну и печати. У нас нет шаблонов, только индивидуальный дизайн фотокниг.{"\u00a0"} Каждый проект проходит утверждение макета перед печатью, что гарантирует безупречное качество.</p>
          </header>

          <div className="catalog-grid">
            {catalogItems.map(([slug, title, description, cover, coverAlt]) => (
              <Link className="catalog-card" href={`/${slug}/`} key={slug}>
                <Image src={cover} alt={coverAlt} width={500} height={500} />
                <div><h2>{title}</h2><small className="catalog-card-description">{description}</small></div>
              </Link>
            ))}
          </div>

          <div className="center-action catalog-page-action">
            <button className="button" data-order-open type="button">Заказать</button>
          </div>
        </div>
      </section>
    </main>
  );
}
