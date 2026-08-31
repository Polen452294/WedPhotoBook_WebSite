import type { ComponentProps } from "react";
import { isPhotoSource, photoMediaUrl, responsivePhotoProps } from "@/lib/media-path";

type SiteImageProps = ComponentProps<"img"> & {
  src: string;
  priority?: boolean;
  fill?: boolean;
  unoptimized?: boolean;
};

export default function SiteImage({ src, alt, sizes, priority, fill, unoptimized, loading, style, ...props }: SiteImageProps) {
  const imageProps = isPhotoSource(src)
    ? unoptimized ? { src: photoMediaUrl(src) } : responsivePhotoProps(src, sizes)
    : { src };

  // Native responsive delivery works on VPS and Cloudflare without an image
  // endpoint that might pass through the full JPEG or a client image runtime.
  return (
    // eslint-disable-next-line @next/next/no-img-element -- responsive assets are prepared from the original files
    <img
      {...props}
      {...imageProps}
      alt={alt}
      loading={priority ? "eager" : loading ?? "lazy"}
      fetchPriority={priority ? "high" : props.fetchPriority ?? "low"}
      decoding="async"
      style={{ color: "transparent", ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } as const : {}), ...style }}
    />
  );
}
