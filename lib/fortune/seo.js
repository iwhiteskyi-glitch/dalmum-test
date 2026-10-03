import { SITE } from "@/lib/site";

// 최상위 레이아웃의 링크 미리보기는 첫 화면용이라, 운세 페이지마다 제목·설명·주소를 새로 지정합니다.
// (Next.js는 openGraph를 통째로 덮어써서 이미지 같은 공통 값도 함께 넣어야 빠지지 않아요.)
const OG_IMAGE = {
  url: "/og-fortune.png",
  width: 1200,
  height: 630,
  alt: "재미로봄 오늘의 운세 — 생년월일로 보는 내 사주와 오늘의 흐름",
};

// 궁합 페이지들은 운세와 색이 달라서(코랄) 미리보기 이미지도 따로 둡니다.
const OG_IMAGE_GUNGHAP = {
  url: "/og-gunghap.png",
  width: 1200,
  height: 630,
  alt: "재미로봄 궁합 보기 — 두 사람의 생년월일로 보는 궁합 점수와 오행 궁합",
};

// 관상 페이지도 자기 색(황갈색)의 미리보기 이미지를 따로 둡니다.
const OG_IMAGE_GWANSANG = {
  url: "/og-gwansang.png",
  width: 1200,
  height: 630,
  alt: "재미로봄 관상 보기 — 사진 한 장으로 보는 눈·눈썹·코·입·턱선 인상 풀이",
};

const OG_IMAGES = { gunghap: OG_IMAGE_GUNGHAP, gwansang: OG_IMAGE_GWANSANG };

export function fortuneMetadata({ title, description, path, image }) {
  const og = OG_IMAGES[image] || OG_IMAGE;
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
      images: [og],
    },
    twitter: { card: "summary_large_image", title, description, images: [og.url] },
  };
}

/** 검색엔진이 "오늘의 운세 › 내 사주 › 갑목 일간" 같은 위치를 이해하도록 돕는 구조화 데이터 */
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
