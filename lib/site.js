/**
 * 사이트 공통 설정.
 *  - NEXT_PUBLIC_CONTACT_EMAIL : 문의 받을 이메일 주소 (Vercel → Project → Settings → Environment Variables)
 */
export const SITE = {
  name: "재미로봄",
  nameEn: "Jaemirobom",
  shortDesc: "재미로 알아보는 나와 우리",
  // 네이버 서치어드바이저가 페이지/OG 설명은 80자 이내를 권장해서 짧게 유지합니다.
  description:
    "닮은꼴·관상·운세·궁합·꿈해몽·여행 이름까지, 재미로 알아보는 나와 우리. 사진과 입력한 정보는 저장되지 않아요.",
  // 대표 주소. 예전에는 Vercel 환경변수(NEXT_PUBLIC_SITE_URL)로 받았지만, 주소를
  // jaemirobom.com으로 옮기면서 코드에 직접 적어 둡니다. (환경변수를 깜빡 안 바꿔서
  // 검색엔진에 옛 주소가 알려지는 실수를 막기 위해서예요.)
  url: "https://www.jaemirobom.com",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "your-email@example.com",
  // 최초 게시일 / 최종 수정일 (약관·개인정보처리방침 표기에 사용)
  effectiveDate: "2026-10-02",
};

/** 화면에 주소를 보여줄 때 쓰는 짧은 형태 (예: 공유 카드 하단) */
export const SITE_DOMAIN = "jaemirobom.com";

/**
 * 재미로봄 안의 코너(테스트) 목록. 첫 화면 카드, 상단 탭, 푸터가 모두 이 목록을 씁니다.
 * 새 코너(예: 오늘의 운세)를 만들면 여기에 한 줄 추가하고, 색은 globals.css의
 * --c-<key> 변수로 정합니다.
 */
export const CORNERS = [
  {
    key: "face",
    href: "/face",
    tab: "닮은꼴",
    name: "닮았네",
    title: "우리, 얼마나 닮았을까?",
    desc: "사진 두 장을 올리면 눈·코·입·얼굴형까지 부위별로 얼마나 닮았는지 알려줘요.",
    chips: ["사진 2장", "30초", "가족·커플·반려동물"],
    cta: "닮은꼴 테스트 하기",
  },
  {
    key: "travel",
    href: "/travel",
    tab: "여행 이름",
    name: "여행가면 내 이름은?",
    title: "여행지에서 불릴 내 이름은?",
    desc: "여행 갈 나라와 도시를 고르면 그곳 감성의 현지 이름을 캐릭터 카드로 만들어 줘요.",
    // 나라·도시 수는 lib/travel/data 를 늘리면 여기도 함께 고쳐 주세요. (이 목록은 헤더에서도 쓰여서
    // 여행 데이터 전체를 불러오지 않으려고 숫자를 직접 적어 둡니다.)
    chips: ["사진 없이", "1분", "25개국 83개 도시"],
    cta: "여행 이름 받기",
  },
  {
    key: "fortune",
    href: "/fortune",
    tab: "운세",
    name: "오늘의 운세 · 사주",
    title: "오늘 나의 하루는 어떨까?",
    desc: "생년월일로 내 사주 팔자를 계산하고, 오늘 일진과의 관계로 하루 흐름을 풀어 줘요. 날마다 바뀌어요.",
    chips: ["생년월일만", "매일 새로", "내 사주 팔자까지"],
    cta: "오늘의 운세 보기",
  },
  {
    key: "gunghap",
    href: "/gunghap",
    tab: "궁합",
    name: "궁합",
    title: "우리 둘은 어떤 사이일까?",
    desc: "두 사람의 생년월일로 사주 궁합 점수와 오행 궁합, 연애·우정·업무 영역별 풀이를 보여줘요.",
    chips: ["생년월일 2개", "종합 점수", "연애·우정·업무"],
    cta: "궁합 보기",
  },
  {
    key: "gwansang",
    href: "/gwansang",
    tab: "관상",
    name: "관상",
    title: "내 얼굴은 어떤 인상일까?",
    desc: "사진 한 장으로 눈·눈썹·코·입·턱선·이목구비 배치를 짚어, 전통 관상학 방식으로 인상을 풀어 줘요.",
    chips: ["사진 1장", "30초", "눈·눈썹·코·입·턱선"],
    cta: "관상 보기",
  },
  {
    key: "dream",
    href: "/dream",
    tab: "꿈해몽",
    name: "꿈해몽",
    title: "지난밤 꿈, 무슨 뜻이었을까?",
    desc: "기억나는 꿈속 장면을 고르면, 전통 해몽 방식으로 상징별 의미와 종합 흐름을 풀어 줘요.",
    chips: ["사진 없이", "1분", "99가지 상징"],
    cta: "꿈해몽 보기",
  },
  {
    key: "games",
    href: "/games",
    tab: "미니게임",
    name: "미니게임",
    title: "컴퓨터를 이겨 볼까?",
    desc: "단계마다 점점 강해지는 컴퓨터와 오목 한 판. 몇 단계까지 깼는지 친구에게 자랑해 보세요.",
    chips: ["설치 없이", "10단계 도전", "오목부터"],
    cta: "미니게임 하러 가기",
  },
];

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
    side: process.env.NEXT_PUBLIC_AD_SLOT_SIDE || "", // PC 양옆 세로 광고(넓은 화면에서만)
  },
};
export const adsEnabled = () => Boolean(ADS.client);

/**
 * Google Analytics(GA4) 설정. 측정 ID를 아직 안 만들었다면 비워두세요.
 * (빈 값이면 추적 코드 자체가 삽입되지 않아 아무 영향 없습니다.)
 *  - NEXT_PUBLIC_GA_ID : "G-XXXXXXXXXX" 형식의 GA4 측정 ID
 */
export const GA = {
  id: process.env.NEXT_PUBLIC_GA_ID || "",
};

/** 하단/상단 공통 내비게이션 */
export const NAV = [
  { href: "/about", label: "서비스 소개" },
  { href: "/reads", label: "읽을거리" },
  { href: "/faq", label: "자주 묻는 질문" },
];

export const FOOTER_LINKS = [
  { href: "/", label: "홈" },
  { href: "/face", label: "닮은꼴 테스트" },
  { href: "/travel", label: "여행 이름" },
  { href: "/fortune", label: "오늘의 운세" },
  { href: "/gunghap", label: "궁합" },
  { href: "/gwansang", label: "관상" },
  { href: "/dream", label: "꿈해몽" },
  { href: "/games", label: "미니게임" },
  { href: "/about", label: "서비스 소개" },
  { href: "/guide", label: "닮은꼴 사용법" },
  { href: "/reads", label: "읽을거리" },
  { href: "/faq", label: "자주 묻는 질문" },
  { href: "/maker", label: "만든 사람" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/contact", label: "문의하기" },
];
