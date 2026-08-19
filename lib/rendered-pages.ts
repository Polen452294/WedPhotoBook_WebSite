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

function withUpdatedGenealogyNaming(text: string): string {
  return text
    .replaceAll("Родословные фотокниги", "Родословная фотокнига")
    .replaceAll("Родословная (генеалогическая) книга", "Родословная фотокнига")
    .replaceAll("Родословная книга", "Родословная фотокнига");
}

export const snapshots = (renderedPages as RenderedPage[]).map((page) => ({
  ...page,
  title: withUpdatedGenealogyNaming(page.title),
  description: withUpdatedGenealogyNaming(page.description),
  bodyHtml: withUpdatedGenealogyNaming(page.bodyHtml),
  visibleText: withUpdatedGenealogyNaming(page.visibleText),
}));

export function getSnapshot(slug: string): RenderedPage | undefined {
  return snapshots.find((page) => page.slug === slug);
}
