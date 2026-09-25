import { SITE } from "@/lib/site";

const OG_IMAGE = {
  url: "/og-travel.png",
  width: 1200,
  height: 630,
  alt: "여행가면 내 이름은? — 여행지와 분위기로 받는 현지 감성 이름 카드",
};

// 최상위 레이아웃의 링크 미리보기(openGraph/twitter)는 닮은꼴 테스트용이라, 여행 페이지마다
// 제목·설명·주소·이미지를 새로 지정합니다. (Next.js는 openGraph를 통째로 덮어써서, 이미지 같은
// 공통 값도 페이지마다 함께 넣어야 빠지지 않습니다.)
export function travelMetadata({ title, description, path }) {
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

/** 검색엔진이 "여행 이름 › 일본 › 도쿄" 같은 위치를 이해하도록 돕는 구조화 데이터 */
export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path}`,
    })),
  };
}
