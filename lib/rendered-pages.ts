import renderedPages from "@/data/rendered-pages.json";

export type RenderedPage = {
  slug: string;
  title: string;
  description: string;
  bodyClass: string;
  bodyHtml: string;
  sourceUrl: string;
  visibleText: string;
};

export const snapshots = renderedPages as RenderedPage[];

export function getSnapshot(slug: string): RenderedPage | undefined {
  return snapshots.find((page) => page.slug === slug);
}
