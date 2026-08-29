import { articles } from "@/lib/articles";
import { snapshots } from "@/lib/rendered-pages";

export type EditablePage = { path: string; title: string };

const pageMap = new Map<string, string>();
for (const page of snapshots) pageMap.set(page.slug ? `/${page.slug}/` : "/", page.title);
for (const article of articles) if (!pageMap.has(`/${article.slug}/`)) pageMap.set(`/${article.slug}/`, article.title);
pageMap.set("/politika-konfidencialnosti/", "Политика конфиденциальности");

export const editablePages: readonly EditablePage[] = [...pageMap]
  .map(([path, title]) => ({ path, title }))
  .sort((a, b) => a.path === "/" ? -1 : b.path === "/" ? 1 : a.title.localeCompare(b.title, "ru"));

const editablePagePaths = new Set(editablePages.map((page) => page.path));

export function normalizeEditablePagePath(value: unknown): string | null {
  const raw = String(value ?? "");
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.length > 300) return null;
  try {
    const pathname = new URL(raw, "https://site.local").pathname;
    const normalized = pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`;
    return editablePagePaths.has(normalized) ? normalized : null;
  } catch {
    return null;
  }
}
