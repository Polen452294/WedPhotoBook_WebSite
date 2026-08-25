import Image from "next/image";
import Link from "next/link";

const catalogItems = [
  ["wedding-fotoknig", "Свадебная фотокнига", "С индивидуальным дизайном сохранит память об этом прекрасном событии!", "/media/covers/svadba-fotokniga-wedfotobook-ru.webp"],
  ["detskaya-fotokniga", "Детская фотокнига", "От рождения до года или от рождения до 18 — это память о детстве.", "/media/covers/dety-fotokniga-wedfotobook-ru.webp"],
  ["yubilejnaya-fotokniga", "Фотокнига на юбилей", "Станет настоящим семейным сокровищем, хранящим воспоминания.", "/media/covers/ubiley-fotokniga-wedfotobook-ru.webp"],
  ["fotokniga-o-puteshestvii", "Фотокнига путешествий", "Это прекрасный способ сохранить яркие моменты вашего путешествия.", "/media/covers/fotokniga-puteshedtvij-wedfotobook-ru.webp"],
  ["vypusknye-fotoknigi", "Выпускной альбом", "Это напоминание об учебе в школе, университете или колледже.", "/media/covers/vipusk-albom-wedfotobook-ru.webp"],
  ["genealogicheskaya-fotokniga", "Родословная фотокнига", "Об истории семье может передаваться из поколения в поколение.", "/media/covers/fotokniga-genealogia-wedfotobook-ru.webp"],
  ["fotokniga-na-lyubuyu-temu", "Другая фотокнига", "Корпоративная, семейная, о животных, даче и т.д.", "/media/covers/fotokbiga-drugaj-wedfotobook-ru.webp"],
  ["fotokniga-s-dopolnennoj-realnostyu", "Фотокнига с оживающими фото", "Наведите камеру телефона на фотографии и они оживут.", "/media/home/fotokniga-alive-photo-blok-wedfotobook-ru.webp"],
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
            {catalogItems.map(([slug, title, description, cover]) => (
              <Link className="catalog-card" href={`/${slug}/`} key={slug}>
                <Image src={cover} alt={title} width={500} height={500} />
                <div><h3>{title} <small>{description}</small></h3></div>
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
