import "./globals.css";
import { SITE } from "@/lib/site";

const TITLE_DEFAULT = `${SITE.name} — ${SITE.shortDesc}`;

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: TITLE_DEFAULT,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "닮음 테스트",
    "얼굴 비교",
    "닮은꼴",
    "닮은꼴 테스트",
    "유사도 분석",
    "누구랑 닮았을까",
    "커플 닮음",
    "가족 닮음",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE_DEFAULT,
    description: SITE.description,
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
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
