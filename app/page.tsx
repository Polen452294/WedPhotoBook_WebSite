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
        <OriginalHomeSections />
        <OriginalFooter />
      </div>
    </>
  );
}
