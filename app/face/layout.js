import { SITE } from "@/lib/site";

// 닮은꼴 테스트 페이지(page.js)는 화면 조작이 많아 "use client"라서, 검색·공유용 정보는
// 이 layout에서 대신 내보냅니다.
const TITLE = "닮았네 — 사진 두 장으로 보는 닮은꼴 테스트";
const DESCRIPTION =
  "사진 두 장으로 눈·코·입·얼굴형 등 부위별 닮음도를 알려주는 무료 닮은꼴 테스트. 사진은 서버에 저장되지 않아요.";

export const metadata = {
  title: { absolute: `${TITLE} | ${SITE.name}` },
  description: DESCRIPTION,
  keywords: [
    "닮은꼴 테스트",
    "얼굴 비교",
    "닮음 테스트",
    "얼굴 유사도",
    "커플 닮음",
    "가족 닮음",
    "닮았네",
  ],
  alternates: { canonical: "/face" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
    url: `${SITE.url}/face`,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const WEBAPP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "닮았네",
  url: `${SITE.url}/face`,
  description: DESCRIPTION,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any",
  browserRequirements: "requires JavaScript",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
};

export default function FaceLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBAPP_JSONLD) }}
      />
      {children}
    </>
  );
}
