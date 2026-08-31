"use client";

import Image, { type ImageProps } from "next/image";
import { isPhotoSource, photoMediaUrl } from "@/lib/media-path";

export default function SiteImage({ src, unoptimized, ...props }: ImageProps) {
  const isPhoto = typeof src === "string" && isPhotoSource(src);

  // Keep photobook details and faces at the full source resolution and quality.
  return (
    <Image
      {...props}
      src={isPhoto ? photoMediaUrl(src as string) : src}
      unoptimized={isPhoto || unoptimized}
    />
  );
}
