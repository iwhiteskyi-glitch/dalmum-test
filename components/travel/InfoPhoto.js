import styles from "./travel.module.css";
import PHOTOS from "@/lib/travel/photos.json";

/** 도시 페이지 명소·음식 사진. 위키미디어 공용 자유 이용 사진만 쓰고, 라이선스 조건대로 작가·라이선스·출처를 함께 표시합니다. */
export function photoFor(country, city, type, name) {
  return PHOTOS[`${country}/${city}/${type}/${name}`] || null;
}

export default function InfoPhoto({ photo, alt }) {
  return (
    <figure className={styles.infoPhoto}>
      <img src={photo.src} width={photo.w} height={photo.h} alt={alt} loading="lazy" decoding="async" />
      <figcaption>
        사진:{" "}
        <a href={photo.page} target="_blank" rel="noopener noreferrer">
          {photo.author}
        </a>
        {" · "}
        {photo.licenseUrl ? (
          <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer license">
            {photo.license}
          </a>
        ) : (
          photo.license
        )}
        {" · 위키미디어 공용"}
      </figcaption>
    </figure>
  );
}
