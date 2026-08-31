"use client";

import Image from "@/components/SiteImage";
import { useRef, useState } from "react";
import type { MediaItem } from "@/lib/site-data";

export function Gallery({ images, title }: { images: MediaItem[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open(index: number) {
    setSelected(index);
    dialogRef.current?.showModal();
  }

  function move(delta: number) {
    setSelected((value) => (value + delta + images.length) % images.length);
  }

  if (!images.length) return null;

  return (
    <>
      <div className="gallery-grid">
        {images.map((image, index) => (
          <button type="button" onClick={() => open(index)} key={image.src} aria-label={`Открыть: ${image.alt}`}>
            <Image src={image.src} alt={image.alt || title} width={image.width} height={image.height} loading="lazy" />
          </button>
        ))}
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- native dialog backdrop click closes the modal */}
      <dialog className="lightbox" ref={dialogRef} onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}>
        <button className="dialog-close" type="button" aria-label="Закрыть" onClick={() => dialogRef.current?.close()}>×</button>
        <button className="lightbox-arrow previous" type="button" onClick={() => move(-1)} aria-label="Предыдущее фото">‹</button>
        <Image
          src={images[selected].src}
          alt={images[selected].alt || title}
          width={images[selected].width}
          height={images[selected].height}
        />
        <button className="lightbox-arrow next" type="button" onClick={() => move(1)} aria-label="Следующее фото">›</button>
        <p>{selected + 1} / {images.length}</p>
      </dialog>
    </>
  );
}
