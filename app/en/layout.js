/**
 * /en 영문 버전. 검토를 마치고 공개하기로 해서 검색엔진 노출 차단을 해제했습니다.
 */
export const metadata = {
  title: {
    default: "Jaemirobom — How much do you look alike?",
    template: "%s — Jaemirobom",
  },
  description:
    "Compare two photos and see how similar your eyes, nose, mouth, and face shape are — a free, just-for-fun look-alike test. Photos are never uploaded or stored.",
  robots: { index: true, follow: true },
  // 영문 페이지를 공유하면 영어 제목·설명·그림(app/en/opengraph-image.png)이 뜨게 합니다.
  // (지정하지 않으면 최상위의 한국어 첫 화면 미리보기가 그대로 쓰여요.)
  openGraph: {
    title: "Jaemirobom — How much do you look alike?",
    description:
      "Compare two photos and see how alike you are, feature by feature. A free, just-for-fun look-alike test.",
    type: "website",
    siteName: "Jaemirobom",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jaemirobom — How much do you look alike?",
    description: "A free, just-for-fun look-alike test. Photos are never uploaded or stored.",
  },
};

export default function EnLayout({ children }) {
  return children;
}
