/** lib/reads.js의 영문판. 슬러그는 한국어 버전과 동일하게 맞춰서
 *  /reads/<slug> ↔ /en/reads/<slug>가 서로 짝이 되도록 합니다. */
export const READS_EN = [
  {
    slug: "how-similarity-works",
    title: "How Do We Judge a Look-Alike? — The Science Behind Face Similarity",
    description:
      "A plain-English explanation of how Dalmum scores your eyes, nose, and mouth — no technical background needed.",
    date: "2026-09-10",
  },
  {
    slug: "photo-tips",
    title: "Dalmum: Use These Kinds of Photos for the Best Results",
    description:
      "How angle, lighting, and expression can change your score, and tips for picking the right photo.",
    date: "2026-09-10",
  },
  {
    slug: "ways-to-enjoy",
    title: "Family, Couples, Pets… Fun Ways to Enjoy the Look-Alike Test",
    description:
      "From family to couples to pets — ideas for enjoying Dalmum and tips for sharing your results.",
    date: "2026-09-10",
  },
];

export const getReadEn = (slug) => READS_EN.find((r) => r.slug === slug);
