import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE, ADS } from "@/lib/site";

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
    "닮았네",
    "얼굴 비교",
    "닮은꼴",
    "닮은꼴 테스트",
    "유사도 분석",
    "누구랑 닮았을까",
    "커플 닮음",
    "가족 닮음",
  ],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
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
  verification: {
    google: "DcgMot_9dJlqREYWtLv5-tuwX3O5CTJoPSzhHBUCGPU",
    other: {
      "naver-site-verification": "5a159ab7b2f21ba11be0a02f248a30dd25ffa76a",
    },
  },
};

export const viewport = {
  themeColor: "#faf7f3",
  width: "device-width",
  initialScale: 1,
};

// 검색엔진이 사이트 성격을 더 잘 이해하도록 돕는 구조화 데이터(JSON-LD).
// 순위를 직접 올려주진 않지만, 사이트명 검색 시 정확한 결과로 뜨거나
// 리치 결과(예: FAQ 펼침) 후보가 되는 데 도움이 됩니다.
const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "ko",
};

const WEBAPP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any",
  browserRequirements: "requires JavaScript",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBAPP_JSONLD) }}
        />
        {children}
        <Analytics />
        {ADS.client ? (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`}
          />
        ) : null}
      </body>
    </html>
  );
}
