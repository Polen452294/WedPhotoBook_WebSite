import type { Metadata } from "next";
import { LegacyPage } from "@/components/LegacyPage";
import { OriginalFooter, OriginalHomeSections } from "@/components/OriginalHomeSections";
import { getSnapshot } from "@/lib/rendered-pages";

const page = getSnapshot("")!;

export const metadata: Metadata = {
  title: page.title,
  description: page.description || undefined,
  alternates: { canonical: "/" },
  openGraph: { title: page.title, description: page.description || undefined, url: "/", type: "website" },
};

export default function Home() {
  return (
    <>
      <LegacyPage page={page} />
      <div className="restored-first-version">
        <section className="home-redesign-facts-section" aria-label="Преимущества">
          <div className="shell home-redesign-facts">
            <div><strong>17 лет</strong><span>опыта работы</span></div>
            <div><strong>Всё включено</strong><span>обработка фото и печать</span></div>
            <div><strong>Без шаблонов</strong><span>индивидуальный дизайн</span></div>
          </div>
        </section>
        <OriginalHomeSections />
        <OriginalFooter />
      </div>
    </>
  );
}
