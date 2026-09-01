import Image from "@/components/SiteImage";
import { avifPhotoSrcSet, responsivePhotoProps } from "@/lib/media-path";

const galleryCategories = [
  { from: 1, to: 5, altPrefix: "Юбилейная фотокнига на заказ — пример разворота с индивидуальным дизайном" },
  { from: 6, to: 9, altPrefix: "Свадебная фотокнига на заказ — пример разворота с индивидуальным дизайном" },
  { from: 10, to: 13, altPrefix: "Детская фотокнига на заказ — пример разворота с индивидуальным дизайном" },
  { from: 14, to: 18, altPrefix: "Фотокнига о путешествии на заказ — пример разворота с индивидуальным дизайном" },
  { from: 19, to: 23, altPrefix: "Свадебная фотокнига на заказ — пример разворота с индивидуальным дизайном" },
  { from: 24, to: 27, altPrefix: "Родословная фотокнига на заказ — пример семейного разворота" },
  { from: 28, to: 34, altPrefix: "Фотокнига на заказ с индивидуальным дизайном — пример готового разворота" },
] as const;

const galleryFiles = [
  "01_Ubiley_fotokniga_wedfotobook_ru-converted.webp",
  "02_Ubiley_fotokniga_wedfotobook_ru-converted.webp",
  "03_Ubiley_fotokniga_wedfotobook_ru-converted.webp",
  "04_Ubiley_fotokniga_wedfotobook_ru-converted.webp",
  "05_Ubiley_fotokniga_wedfotobook_ru-converted.webp",
  "06_Svadba_fotokniga_wedfotobook_ru-converted.webp",
  "07_Svadba_fotokniga_wedfotobook_ru-converted.webp",
  "08_Svadba_fotokniga_wedfotobook_ru-converted.webp",
  "09_Svadba_fotokniga_wedfotobook_ru-converted.webp",
  "10_Dety_fotokniga_wedfotobook_ru-converted.webp",
  "11_Dety_fotokniga_wedfotobok_ru-converted.webp",
  "12_Dety_fotokniga_wedfotobok_ru-converted.webp",
  "13_Dety_fotokniga_wedfotobok_ru-converted.webp",
  "14_Fotokniga_puteshedtvij_wedfotobook_ru-converted.webp",
  "15_Fotokniga_puteshedtvij_wedfotobook_ru-converted.webp",
  "16_Fotokniga_puteshedtvij_wedfotobook_ru-converted.webp",
  "17_Fotokniga_puteshedtvij_wedfotobook_ru-converted.webp",
  "18_Fotokniga_puteshedtvij_wedfotobook_ru-converted.webp",
  "19_Svadba_fotokniga_wedfotobook_ru-converted.webp",
  "20_Svadba_fotokniga_wedfotobook_ru-converted.webp",
  "21_Svadba_fotokniga_wedfotobook_ru-converted.webp",
  "22_Svadba_fotokniga_wedfotobook_ru-converted.webp",
  "23_Svadba_fotokniga_wedfotobook_ru-converted.webp",
  "24_Fotokniga_genealogia_wedfotobook_ru-converted.webp",
  "25_Fotokniga_genealogia_wedfotobook_ru-converted.webp",
  "26_Fotokniga_genealogia_wedfotobook_ru-converted.webp",
  "27_Fotokniga_genealogia_wedfotobook_ru-converted.webp",
  "28_Fotokbiga_zakaz_wedfotobook_ru-converted.webp",
  "29_Fotokbiga_zakaz_wedfotobook_ru-converted.webp",
  "30_Fotokbiga_zakaz_wedfotobook_ru-converted.webp",
  "31_Fotokbiga_zakaz_wedfotobook_ru-converted.webp",
  "32_Fotokbiga_zakaz_wedfotobook_ru-converted.webp",
  "33_Fotokbiga_zakaz_wedfotobook_ru-converted.webp",
  "34_Fotokbiga_zakaz_wedfotobook_ru-converted.webp",
] as const;

const galleryImages = galleryFiles.map((fileName, index) => {
  const number = index + 1;
  const category = galleryCategories.find(({ from, to }) => number >= from && number <= to);

  return {
    src: `/media/home-gallery/${fileName}`,
    alt: `${category?.altPrefix ?? "Фотокнига на заказ — пример готового разворота"} №${number}`,
  };
});

export function HomeGalleryCarousel() {
  return (
    <div className="home-gallery-carousel" data-carousel>
      <div className="home-gallery-carousel-viewport">
        <div
          id="home-gallery-carousel-track"
          className="home-gallery-carousel-track"
        >
          {galleryImages.map((image, index) => {
            const sizes = "(max-width: 1048px) calc(100vw - 48px), 1000px";
            const photo = responsivePhotoProps(image.src, sizes);
            return (
              <figure
                className="home-gallery-carousel-frame"
                style={{ aspectRatio: "1000 / 497" }}
                aria-hidden={index !== 0}
                data-carousel-src={photo.src}
                data-carousel-srcset={photo.srcSet}
                data-carousel-avif-srcset={avifPhotoSrcSet(image.src)}
                data-carousel-alt={image.alt}
                data-carousel-width="1000"
                data-carousel-height="497"
                data-carousel-sizes={sizes}
                key={image.src}
              >
                {index < 2 && <Image src={image.src} alt={image.alt} width={1000} height={497} sizes={sizes} loading="lazy" />}
              </figure>
            );
          })}
        </div>
      </div>
      <div className="review-navigation" aria-label="Переключение фотографий галереи">
        <button type="button" data-carousel-prev aria-controls="home-gallery-carousel-track">
          <span aria-hidden="true">←</span><span>Назад</span>
        </button>
        <strong aria-live="polite"><span data-carousel-current>1</span> из {galleryImages.length}</strong>
        <button type="button" data-carousel-next aria-controls="home-gallery-carousel-track">
          <span aria-hidden="true">→</span><span>Далее</span>
        </button>
      </div>
    </div>
  );
}
