import Image from "@/components/SiteImage";
import type { MediaItem } from "@/lib/site-data";
import { avifPhotoSrcSet, responsivePhotoProps } from "@/lib/media-path";

export function ReviewCarousel({ images }: { images: MediaItem[] }) {
  if (!images.length) return null;

  return (
    <div className="review-carousel" data-carousel>
      <div className="review-carousel-viewport">
        <div id="review-carousel-track" className="review-carousel-track">
          {images.map((image, index) => {
            const alt = image.alt || `Отзыв клиента №${index + 1} о фотокниге`;
            const sizes = "(max-width: 767px) calc(100vw - 48px), 760px";
            const photo = responsivePhotoProps(image.src, sizes);
            return (
              <figure
                className="review-carousel-frame"
                style={{ aspectRatio: `${image.width} / ${image.height}` }}
                aria-hidden={index !== 0}
                data-carousel-src={photo.src}
                data-carousel-srcset={photo.srcSet}
                data-carousel-avif-srcset={avifPhotoSrcSet(image.src)}
                data-carousel-alt={alt}
                data-carousel-width={image.width}
                data-carousel-height={image.height}
                data-carousel-sizes={sizes}
                key={image.src}
              >
                {index === 0 && <Image src={image.src} alt={alt} width={image.width} height={image.height} sizes={sizes} loading="lazy" />}
              </figure>
            );
          })}
        </div>
      </div>
      <div className="review-navigation" aria-label="Переключение отзывов">
        <button type="button" data-carousel-prev aria-controls="review-carousel-track" disabled={images.length < 2}><span aria-hidden="true">←</span><span>Назад</span></button>
        <strong aria-live="polite"><span data-carousel-current>1</span> из {images.length}</strong>
        <button type="button" data-carousel-next aria-controls="review-carousel-track" disabled={images.length < 2}><span aria-hidden="true">→</span><span>Далее</span></button>
      </div>
    </div>
  );
}
