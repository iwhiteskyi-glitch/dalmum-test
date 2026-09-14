/** 읽을거리(짧은 소개/안내 글) 목록. 실제 본문은 app/(content)/reads/<slug>/page.js 에 있습니다. */
export const READS = [
  {
    slug: "how-similarity-works",
    title: "닮은꼴은 어떻게 판단할까? — 얼굴 유사도 분석의 원리",
    description:
      "닮았네가 눈·코·입 점수를 매기는 방식을 비전문가도 이해할 수 있게 풀어서 설명합니다.",
    date: "2026-09-10",
  },
  {
    slug: "photo-tips",
    title: "닮았네, 이런 사진으로 하면 결과가 잘 나와요",
    description:
      "정면·조명·표정 등 사진 한 장 차이로 점수가 얼마나 달라지는지, 좋은 사진 고르는 법을 정리했습니다.",
    date: "2026-09-10",
  },
  {
    slug: "ways-to-enjoy",
    title: "가족·커플·반려동물… 닮은꼴 테스트 재밌게 즐기는 방법",
    description:
      "가족 닮은꼴, 커플 닮은꼴, 반려동물 닮은꼴까지 — 닮았네를 즐기는 아이디어와 SNS 공유 팁을 모았습니다.",
    date: "2026-09-10",
  },
];

export const getRead = (slug) => READS.find((r) => r.slug === slug);
