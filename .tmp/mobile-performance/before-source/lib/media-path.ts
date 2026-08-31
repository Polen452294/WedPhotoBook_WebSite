import photoSources from "@/data/photo-sources.json";

const originalPhotos: Record<string, string> = photoSources;
const PHOTO_VERSION = "20260831";

export function isPhotoSource(src: string) {
  const pathname = src.split(/[?#]/, 1)[0];
  return /^\/media\/(?:home|covers|gallery|home-gallery|pricing-details|reviews-selected|originals)\//.test(pathname)
    || /^\/wp-content\/uploads\/.*\.(?:jpe?g|webp)$/i.test(pathname);
}

export function photoMediaUrl(src: string) {
  if (!isPhotoSource(src)) return src;

  const url = new URL(src, "https://wedfotobook.ru");
  const pathname = decodeURIComponent(url.pathname);
  const source = originalPhotos[pathname] ?? pathname;
  url.searchParams.set("v", PHOTO_VERSION);
  return `${source}?${url.searchParams}${url.hash}`;
}

export function optimizedMediaUrl(src: string) {
  // A new URL also refreshes failed image responses cached before asset recovery.
  return `${src}?v=20260830`;
}

export function directMediaImageProps(src: string) {
  if (!src.includes("%")) return { src };

  // Vinext's local static handler decodes the URL twice. Double-encode only the
  // exceptional source filename containing a literal percent sign.
  return {
    src: src.replaceAll("%", "%2525").replaceAll(" ", "%2520"),
    unoptimized: true,
  };
}
