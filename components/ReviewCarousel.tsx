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

  return (
    <div className="review-carousel">
      <div className="review-carousel-viewport">
        <div id="review-carousel-track" className="review-carousel-track" style={{ transform: `translate3d(-${selected * 100}%, 0, 0)` }}>
          {images.map((image, index) => (
            <figure className="review-carousel-frame" aria-hidden={index !== selected} key={image.src}>
              <Image src={image.src} alt={image.alt || `Отзыв клиента №${index + 1} о фотокниге`} width={image.width} height={image.height} loading={index === 0 ? "eager" : "lazy"} />
            </figure>
          ))}
        </div>
      </div>
      <div className="review-navigation" aria-label="Переключение отзывов">
        <button type="button" onClick={() => move(-1)} aria-controls="review-carousel-track" aria-label="Предыдущий отзыв" disabled={images.length < 2}><span aria-hidden="true">←</span><span>Назад</span></button>
        <strong aria-live="polite"><span>{selected + 1}</span> из {images.length}</strong>
        <button type="button" onClick={() => move(1)} aria-controls="review-carousel-track" aria-label="Следующий отзыв" disabled={images.length < 2}><span aria-hidden="true">→</span><span>Далее</span></button>
      </div>
    </div>
  );
}
