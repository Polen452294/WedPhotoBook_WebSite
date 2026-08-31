import Image from "next/image";
import Link from "next/link";
import { catalogItems, contacts } from "@/lib/site-data";
import { optimizedMediaUrl } from "@/lib/media-path";

const social = [
  [contacts.telegram, "/media/optimized/social/telegram-64.webp", "Написать в Telegram"],
  [contacts.whatsapp, "/media/optimized/social/whatsapp-64.webp", "Написать в WhatsApp"],
  [contacts.max, "/media/optimized/social/max-64.webp", "Написать в мессенджере MAX"],
  [contacts.vk, "/media/optimized/social/vk-64.webp", "Страница WedFotoBook во ВКонтакте"],
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Image src={optimizedMediaUrl("/media/optimized/brand/logo-256.webp")} alt="WedFotoBook — фотокниги на заказ" width={300} height={62} sizes="150px" />
          <p>Ваши фотографии становятся книгой, которую хочется перелистывать снова и снова.</p>
          <div className="social-row">
            {social.map(([href, src, label]) => (
              <a href={href} key={label} aria-label={label} target="_blank" rel="noreferrer">
                <Image src={optimizedMediaUrl(src)} alt={label} width={42} height={42} sizes="42px" />
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
            <li><Link href="/privacy-policy/">Политика конфиденциальности</Link></li>
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
