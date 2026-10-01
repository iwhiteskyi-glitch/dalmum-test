/**
 * 읽을거리(짧은 소개/안내 글) 목록. 실제 본문은 app/(content)/reads/<slug>/page.js 에 있습니다.
 * corner: 글과 관련된 코너(lib/site.js의 CORNERS key). 글 아래 "바로 해볼까요?" 안내와
 * 목록의 코너 표시에 씁니다. 새 글은 목록 맨 위에 추가하세요(첫 화면엔 앞의 3개가 나옵니다).
 */
export const READS = [
  {
    slug: "family-resemblance",
    title: "가족은 왜 닮을까? 얼굴 닮음과 유전 이야기",
    description:
      "쌍둥이 연구와 유전학으로 본 가족 닮음. 형제자매가 서로 다르게 닮는 이유, 아기 때와 커서 닮은 사람이 바뀌는 이유까지 알아봐요.",
    date: "2026-10-01",
    corner: "face",
  },
  {
    slug: "travel-greetings",
    title: "여행 가서 꼭 쓰는 현지 인사말, 나라별 비교와 발음 팁",
    description:
      "일본부터 튀르키예까지, 안녕하세요·감사합니다를 나라별로 비교하고 발음할 때 주의할 점과 인사 매너를 모아봤어요.",
    date: "2026-10-01",
    corner: "travel",
  },
  {
    slug: "couples-look-alike",
    title: "오래 산 부부는 정말 닮아갈까? 연구로 본 진실",
    description:
      "부부는 닮아간다는 말, 정말일까요? 1987년 연구와 517쌍을 다시 살펴본 2020년 연구를 비교하고 부부가 닮아 보이는 이유를 짚어봤어요.",
    date: "2026-10-01",
    corner: "face",
  },
  {
    slug: "japanese-names",
    title: "일본 이름은 어떻게 지을까? 한자 뜻과 읽는 법 이야기",
    description:
      "일본 이름의 순서, 같은 한자를 여러 가지로 읽는 까닭, 이름에 쓸 수 있는 한자 규칙과 요즘 인기 이름까지 알아봐요.",
    date: "2026-10-01",
    corner: "travel",
  },
  {
    slug: "vietnam-thai-names",
    title: "성이 먼저? 별명이 따로? 베트남·태국 이름 문화",
    description:
      "베트남은 성이 맨 앞, 태국은 성이 생긴 지 110여 년. 두 나라 이름 구조와 여행에서 이름 부를 때의 매너를 알아봐요.",
    date: "2026-10-01",
    corner: "travel",
  },
  {
    slug: "english-nicknames",
    title: "알렉산더는 왜 알렉스가 될까? 영어 이름과 애칭",
    description:
      "영어권에서 애칭을 쓰는 이유, 로버트가 밥이 되는 사연, 영어 이름을 지을 때 참고할 점을 알아봐요.",
    date: "2026-10-01",
    corner: "travel",
  },
  {
    slug: "how-similarity-works",
    title: "닮은꼴은 어떻게 판단할까? — 얼굴 유사도 분석의 원리",
    description:
      "닮았네가 눈·코·입 점수를 매기는 방식을 비전문가도 이해할 수 있게 풀어서 설명합니다.",
    date: "2026-09-10",
    corner: "face",
  },
  {
    slug: "photo-tips",
    title: "닮았네, 이런 사진으로 하면 결과가 잘 나와요",
    description:
      "정면·조명·표정 등 사진 한 장 차이로 점수가 얼마나 달라지는지, 좋은 사진 고르는 법을 정리했습니다.",
    date: "2026-09-10",
    corner: "face",
  },
  {
    slug: "ways-to-enjoy",
    title: "가족·커플·반려동물… 닮은꼴 테스트 재밌게 즐기는 방법",
    description:
      "가족 닮은꼴, 커플 닮은꼴, 반려동물 닮은꼴까지 — 닮았네를 즐기는 아이디어와 SNS 공유 팁을 모았습니다.",
    date: "2026-09-10",
    corner: "face",
  },
];

export const getRead = (slug) => READS.find((r) => r.slug === slug);
