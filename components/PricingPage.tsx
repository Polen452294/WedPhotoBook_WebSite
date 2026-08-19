import Image from "next/image";
import Link from "next/link";
import { pricing } from "@/lib/site-data";

export function PricingPage() {
  return (
    <main className="pricing-page">
      <section className="pricing-page-section">
        <div className="shell">
          <header className="pricing-page-heading">
            <span className="eyebrow">Стоимость</span>
            <h1>Цены на фотокниги на заказ</h1>
            <p>Цена фотокниги зависит от вида печати.</p>
          </header>

          <div className="pricing-grid">
            {pricing.map((item, index) => (
              <article className={index === 0 ? "price-card featured" : "price-card"} key={item.title}>
                {index === 0 && <span className="price-badge">Чаще выбирают</span>}
                <Image src={item.image} alt={item.title} width={960} height={518} />
                <div className="price-card-copy">
                  <h3>{item.title}</h3>
                  <strong>{item.price}</strong>
                  <ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                  <Link href={item.href}>Подробнее →</Link>
                </div>
              </article>
            ))}
          </div>

          <div className="center-action pricing-page-action">
            <button className="button" data-order-open type="button">Заказать</button>
          </div>
        </div>
      </section>
    </main>
  );
}
