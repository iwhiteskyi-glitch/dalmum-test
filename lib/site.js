/**
 * 사이트 공통 설정.
 * 배포할 때 실제 값으로 바꾸세요. (Vercel → Project → Settings → Environment Variables)
 *  - NEXT_PUBLIC_SITE_URL   : 실제 도메인 (예: https://dalmum.example.com)
 *  - NEXT_PUBLIC_CONTACT_EMAIL : 문의 받을 이메일 주소
 */
export const SITE = {
  name: "닮았네",
  shortDesc: "사진 두 장으로 부위별 닮은 정도 확인",
  description:
    "사진 두 장을 올리면 눈·코·입·얼굴형까지 부위별로 얼마나 닮았는지, 전체 닮음도 몇 %인지 알려주는 재미용 서비스. 사진은 서버로 전송되지 않고 브라우저에서만 분석돼요.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "your-email@example.com",
  // 최초 게시일 / 최종 수정일 (약관·개인정보처리방침 표기에 사용)
  effectiveDate: "2026-09-10",
};

/**
 * Google AdSense 설정. 승인 전에는 비워두세요. (빈 값이면 광고 대신 자리표시만 보입니다.)
 *  - NEXT_PUBLIC_ADSENSE_CLIENT : "ca-pub-0000000000000000" 형식의 게시자 ID
 *  - NEXT_PUBLIC_AD_SLOT_*      : AdSense에서 광고 단위를 만들면 나오는 10자리 슬롯 ID
 */
export const ADS = {
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
  slots: {
    "content-bottom": process.env.NEXT_PUBLIC_AD_SLOT_CONTENT || "",
    "result-bottom": process.env.NEXT_PUBLIC_AD_SLOT_RESULT || "",
  },
};
export const adsEnabled = () => Boolean(ADS.client);

/** 하단/상단 공통 내비게이션 */
export const NAV = [
  { href: "/", label: "닮았네" },
  { href: "/about", label: "서비스 소개" },
  { href: "/guide", label: "사용법" },
  { href: "/reads", label: "읽을거리" },
  { href: "/faq", label: "자주 묻는 질문" },
];

export const FOOTER_LINKS = [
  { href: "/about", label: "서비스 소개" },
  { href: "/guide", label: "사용법" },
  { href: "/reads", label: "읽을거리" },
  { href: "/faq", label: "자주 묻는 질문" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/contact", label: "문의하기" },
];
