import { SITE } from "@/lib/site";

// 최상위 레이아웃의 링크 미리보기는 첫 화면용이라, 운세 페이지마다 제목·설명·주소를 새로 지정합니다.
// (Next.js는 openGraph를 통째로 덮어써서 이미지 같은 공통 값도 함께 넣어야 빠지지 않아요.)
const OG_IMAGE = {
  url: "/og-fortune.png",
  width: 1200,
  height: 630,
  alt: "재미로봄 오늘의 운세 — 생년월일로 보는 내 사주와 오늘의 흐름",
};

export function fortuneMetadata({ title, description, path }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: SITE.name,
      locale: "ko_KR",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}
