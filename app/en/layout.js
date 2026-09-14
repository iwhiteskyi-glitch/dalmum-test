/**
 * /en 영문 버전. 검토를 마치고 공개하기로 해서 검색엔진 노출 차단을 해제했습니다.
 */
export const metadata = {
  title: {
    default: "Dalmum — How much do you look alike?",
    template: "%s — Dalmum",
  },
  description:
    "Compare two photos and see how similar your eyes, nose, mouth, and face shape are — a free, just-for-fun look-alike test. Photos are never uploaded or stored.",
  robots: { index: true, follow: true },
};

export default function EnLayout({ children }) {
  return children;
}
