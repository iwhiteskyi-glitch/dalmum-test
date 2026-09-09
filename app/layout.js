import "./globals.css";

const SITE_NAME = "닮음테스트";
const DESCRIPTION =
  "사진 두 장을 올리면 눈·코·입·얼굴형까지 부위별로 얼마나 닮았는지, 전체 닮음도 몇 %인지 알려주는 재미용 서비스. 사진은 서버로 전송되지 않고 브라우저에서만 분석돼요.";

export const metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: `${SITE_NAME} — 사진 두 장으로 부위별 닮은 정도 확인`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: ["닮음 테스트", "얼굴 비교", "닮은꼴", "유사도 분석", "누구랑 닮았을까"],
  openGraph: {
    title: `${SITE_NAME} — 사진 두 장으로 부위별 닮은 정도 확인`,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#fffbf3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
