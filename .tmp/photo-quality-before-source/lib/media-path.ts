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
