import photoSources from "@/data/photo-sources.json";
import responsivePhotos from "@/data/responsive-photos.json";
import responsiveLogo from "@/data/responsive-logo.json";

const originalPhotos: Record<string, string> = photoSources;
const PHOTO_VERSION = "20260831";
const photoVariants: Record<string, { id: string; width: number; widths: number[]; avifId: string; avifWidths: number[] }> = responsivePhotos;

export const HOME_HERO_SOURCE = "/media/home/Fotokniga na zakaz wedfotobook ru.webp";
// Matches the existing stacked / two-column mobile hero, including its frame.
export const HOME_HERO_SIZES = "(max-width: 359px) calc(100vw - 58px), (max-width: 559px) calc(61vw - 44px), (max-width: 767px) 298px, 50vw";

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

export function responsivePhotoProps(src: string, sizes = "100vw") {
  const original = photoMediaUrl(src);
  const pathname = decodeURIComponent(new URL(original, "https://wedfotobook.ru").pathname);
  const photo = photoVariants[pathname];
  if (!photo) return { src: original };
  const candidates = photo.widths.map((width) => `/media/responsive/${photo.id}-${width}.webp ${width}w`);
  candidates.push(`${encodeURI(original)} ${photo.width}w`);
  return { src: original, srcSet: candidates.join(", "), sizes };
}

export function avifPhotoSrcSet(src: string) {
  const pathname = decodeURIComponent(new URL(photoMediaUrl(src), "https://wedfotobook.ru").pathname);
  const photo = photoVariants[pathname];
  return photo?.avifWidths.map((width) => `/media/responsive/${photo.avifId}-${width}.avif ${width}w`).join(", ");
}

export function responsiveLogoProps() {
  return {
    srcSet: responsiveLogo.widths.map((width) => `/media/responsive/${responsiveLogo.id}-${width}.webp ${width}w`).join(", "),
    sizes: "150px",
  };
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
