import Image from "next/image";
import Link from "next/link";
import { contacts } from "@/lib/site-data";

const nav = [
  ["Главная", "/"],
  ["Каталог", "/katalog/"],
  ["Стоимость", "/stoimost/"],
  ["Отзывы", "/otzyvy/"],
  ["Контакты", "/kontakty/"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="Фотокниги под ключ — главная">
          <Image
            src="/media/brand/logo-wedfotobook.png"
            alt="Фотокниги под ключ"
            width={300}
            height={62}
            priority
          />
        </Link>

        <nav className="desktop-nav" aria-label="Основная навигация">
          {nav.map(([label, href]) => (
            <Link href={href} key={href}>{label}</Link>
          ))}
        </nav>

        <div className="header-actions">
          <a className="header-phone" href={contacts.phoneHref}>
            <span>{contacts.phoneDisplay}</span>
            <small>Ежедневно с 9:00 до 21:00</small>
          </a>
          <button className="button button-small" data-order-open type="button">
            Заказать звонок
          </button>
        </div>

        <details className="mobile-nav">
          <summary aria-label="Открыть меню"><span /><span /><span /></summary>
          <div className="mobile-nav-panel">
            {nav.map(([label, href]) => (
              <Link href={href} key={href}>{label}</Link>
            ))}
            <a href={contacts.phoneHref}>{contacts.phoneDisplay}</a>
            <button className="button" data-order-open type="button">Заказать звонок</button>
          </div>
        </details>
      </div>
    </header>
  );
}
