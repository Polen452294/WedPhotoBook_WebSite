"use client";

import Image from "next/image";
import { useState } from "react";

const galleryCategories = [
  { from: 1, to: 5, label: "Фотокнига на юбилей" },
  { from: 6, to: 9, label: "Свадебная фотокнига" },
  { from: 10, to: 13, label: "Детская фотокнига" },
  { from: 14, to: 18, label: "Фотокнига о путешествии" },
  { from: 19, to: 23, label: "Свадебная фотокнига" },
  { from: 24, to: 27, label: "Родословная фотокнига" },
  { from: 28, to: 34, label: "Фотокнига на заказ" },
] as const;

const galleryImages = Array.from({ length: 34 }, (_, index) => {
  const number = index + 1;
  const category = galleryCategories.find(({ from, to }) => number >= from && number <= to);

  return {
    src: `/media/home-gallery/${String(number).padStart(2, "0")}.webp`,
    alt: `${category?.label ?? "Фотокнига"} — пример готовой работы ${number}`,
  };
});

export function HomeGalleryCarousel() {
  const [selected, setSelected] = useState(0);

  function move(delta: number) {
    setSelected((current) => (current + delta + galleryImages.length) % galleryImages.length);
  }

  return (
    <div className="home-gallery-carousel">
      <div className="home-gallery-carousel-viewport">
        <div
          id="home-gallery-carousel-track"
          className="home-gallery-carousel-track"
          style={{ transform: `translate3d(-${selected * 100}%, 0, 0)` }}
        >
          {galleryImages.map((image, index) => (
            <figure className="home-gallery-carousel-frame" aria-hidden={index !== selected} key={image.src}>
              <Image
                src={image.src}
                alt={image.alt}
                width={1000}
                height={497}
                sizes="(max-width: 1048px) calc(100vw - 48px), 1000px"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </figure>
          ))}
        </div>
      </div>
      <div className="review-navigation" aria-label="Переключение фотографий галереи">
        <button type="button" onClick={() => move(-1)} aria-controls="home-gallery-carousel-track" aria-label="Предыдущая фотография">
          <span aria-hidden="true">←</span><span>Назад</span>
        </button>
        <strong aria-live="polite"><span>{selected + 1}</span> из {galleryImages.length}</strong>
        <button type="button" onClick={() => move(1)} aria-controls="home-gallery-carousel-track" aria-label="Следующая фотография">
          <span aria-hidden="true">→</span><span>Далее</span>
        </button>
      </div>
    </div>
  );
}
