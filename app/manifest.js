import { SITE } from "@/lib/site";

// 폰에서 "홈 화면에 추가"를 했을 때 앱처럼 열리게 해 주는 설정 파일(웹 앱 매니페스트)입니다.
export default function manifest() {
  return {
    name: `${SITE.name} — ${SITE.shortDesc}`,
    short_name: SITE.name,
    description: SITE.description,
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf7f3",
    theme_color: "#faf7f3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
