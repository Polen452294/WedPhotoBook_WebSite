"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaItem } from "@/lib/site-data";

export function ReviewCarousel({ images }: { images: MediaItem[] }) {
  const [selected, setSelected] = useState(0);

  if (!images.length) return null;

  function move(delta: number) {
    setSelected((current) => (current + delta + images.length) % images.length);
  }

  const image = images[selected];

  return (
    <div className="review-carousel">
      <figure className="review-carousel-frame">
        <Image src={image.src} alt={image.alt || `Отзыв клиента №${selected + 1} о фотокниге`} width={image.width} height={image.height} loading="lazy" />
      </figure>
      <div className="review-navigation" aria-label="Переключение отзывов">
        <button type="button" onClick={() => move(-1)} aria-label="Предыдущий отзыв"><span aria-hidden="true">←</span><span>Назад</span></button>
        <strong><span>{selected + 1}</span> из {images.length}</strong>
        <button type="button" onClick={() => move(1)} aria-label="Следующий отзыв"><span aria-hidden="true">→</span><span>Далее</span></button>
      </div>
    </div>
  );
}
