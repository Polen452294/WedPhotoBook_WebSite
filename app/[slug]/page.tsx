import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegacyPage } from "@/components/LegacyPage";
import { OriginalFooter } from "@/components/OriginalHomeSections";
import { getSnapshot, snapshots } from "@/lib/rendered-pages";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return snapshots.filter((page) => page.slug).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getSnapshot(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description || undefined,
    alternates: { canonical: `/${page.slug}/` },
    openGraph: { title: page.title, description: page.description || undefined, url: `/${page.slug}/`, type: "website" },
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getSnapshot(slug);
  if (!page) notFound();
  return (
    <>
      <LegacyPage page={page} />
      <div className="restored-first-version"><OriginalFooter /></div>
    </>
  );
}
