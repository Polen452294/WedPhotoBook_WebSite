import { contacts } from "@/lib/site-data";

export function CompanyPage() {
  return (
    <main className="company-page">
      <section className="company-intro">
        <div className="shell company-intro-grid">
          <h1>О компании</h1>
          <p>Wedfotobook.ru — компания, которая создаёт фотокниги на заказ «под ключ» в Москве. Компания предлагает превратить разрозненные фотографии в цельное произведение, которое станет семейной реликвией или эффектным подарком.</p>
        </div>
      </section>

      <section className="company-details">
        <div className="shell company-details-grid">
          <article className="company-story">
            <h2>О нас</h2>
            <p>Компания работает на рынке более 17 лет, что подтверждает её опыт и надёжность. Владелец — ИП Ардашева Елена Викторовна. ИНН: 772008137237, ОГРНИП: 325774600377441.</p>
          </article>

          <article className="company-contacts">
            <h2>Контакты:</h2>
            <ul>
              <li><span aria-hidden="true">•</span><span>Телефон: <a href={contacts.phoneHref}>+7 985 434-23-67</a> (ежедневно с 9:00 до 21:00 по московскому времени).</span></li>
              <li><span aria-hidden="true">•</span><span>Почта: <a href={`mailto:${contacts.email}`}>79854342367@yandex.ru</a></span></li>
              <li><span aria-hidden="true">•</span><span>Социальные сети: <a href={contacts.telegram}>Telegram (@photokniga_na_zakaz)</a>, <a href={contacts.whatsapp}>WhatsApp</a>, <a href={contacts.max}>Max</a>.</span></li>
            </ul>
          </article>
        </div>
      </section>

      <section className="company-map-section" aria-labelledby="company-map-title">
        <div className="shell company-map-grid">
          <div className="company-map-copy">
            <span className="section-kicker">Адрес</span>
            <h2 id="company-map-title">Мы на карте</h2>
            <p>Москва, Свободный проспект, д. 33</p>
            <a
              href="https://yandex.ru/maps/?mode=search&text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%A1%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%BD%D1%8B%D0%B9%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%2C%20%D0%B4.%2033"
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть в Яндекс Картах <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="company-map-visual">
            <div className="company-map-frame">
              <iframe
                src="https://yandex.ru/map-widget/v1/?mode=search&text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%A1%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%BD%D1%8B%D0%B9%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%2C%20%D0%B4.%2033&z=16"
                title="Яндекс Карта: Москва, Свободный проспект, д. 33"
                loading="lazy"
                allowFullScreen
              />
            </div>
            <p className="company-map-notice">Пожалуйста, не приезжайте без предварительного звонка.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
