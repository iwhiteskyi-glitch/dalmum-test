/**
 * /en 영문 버전 — 아직 검토 중인 미완성 버전입니다.
 * robots.index=false 로 막아둬서, main에 합쳐진 뒤에도 검색엔진에는 노출되지 않습니다.
 * (완전히 완성돼서 공개하기로 결정하면 그때 이 설정을 풀면 됩니다.)
 */
export const metadata = {
  title: {
    default: "Dalmum — How much do you look alike?",
    template: "%s — Dalmum",
  },
  description:
    "Compare two photos and see how similar your eyes, nose, mouth, and face shape are — a free, just-for-fun look-alike test. Photos are never uploaded or stored.",
  robots: { index: false, follow: false },
};

export default function EnLayout({ children }) {
  return children;
}
