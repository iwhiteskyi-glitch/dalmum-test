/**
 * 상징 그림(밤하늘 금빛 선화, public/dream/art).
 * small이면 장면 고르기 칸·결과 목록용 작은 그림(160px)을, 아니면 큰 그림(512px)을 씁니다.
 * 화면에 보일 때만 불러와요(loading="lazy").
 */
export default function DreamArt({ id, small = false, alt = "", className, eager = false }) {
  const size = small ? 160 : 512;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/dream/art/${small ? "s/" : ""}${id}.webp`}
      width={size}
      height={size}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}
