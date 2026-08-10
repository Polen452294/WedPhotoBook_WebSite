import Image from "next/image";
import Link from "next/link";
import { catalogItems, contacts } from "@/lib/site-data";

const social = [
  [contacts.telegram, "/media/social/tg-wedfotobook.png", "Telegram"],
  [contacts.whatsapp, "/media/social/wapp-wedfotobook.png", "WhatsApp"],
  [contacts.max, "/media/social/max-wedfotobook.png", "Max"],
  [contacts.vk, "/media/social/vk-wedfotobook.png", "ВКонтакте"],
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Image src="/media/brand/logo-wedfotobook.png" alt="Фотокниги под ключ" width={300} height={62} />
          <p>Ваши фотографии становятся книгой, которую хочется перелистывать снова и снова.</p>
          <div className="social-row">
            {social.map(([href, src, label]) => (
              <a href={href} key={label} aria-label={label} target="_blank" rel="noreferrer">
                <Image src={src} alt="" width={42} height={42} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2>Каталог</h2>
          <ul>
            {catalogItems.slice(0, 6).map((item) => (
              <li key={item.slug}><Link href={`/${item.slug}/`}>{item.title}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Информация</h2>
          <ul>
            <li><Link href="/company/">О компании</Link></li>
            <li><Link href="/otzyvy/">Отзывы</Link></li>
            <li><Link href="/blog_fotoknigi/">Блог</Link></li>
            <li><Link href="/kontakty/">Контакты</Link></li>
            <li><Link href="/politika-obrabotki-personalnyh-dannyh/">Политика конфиденциальности</Link></li>
          </ul>
        </div>

        <div className="footer-contacts">
          <h2>Связаться</h2>
          <a href={contacts.phoneHref}>{contacts.phoneDisplay}</a>
          <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
          <p>Москва<br />Ежедневно с 9:00 до 21:00</p>
          <button className="button button-light" data-order-open type="button">Оставить заявку</button>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} ИП Ардашева Елена Викторовна</span>
        <span>ИНН 772008137237 · ОГРНИП 325774600377441</span>
      </div>
    </footer>
  );
}
