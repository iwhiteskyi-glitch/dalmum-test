import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE, ADS, GA } from "@/lib/site";
import KakaoBrowserBanner from "@/components/KakaoBrowserBanner";

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
    "재미로봄",
    "재미 테스트",
    "닮은꼴 테스트",
    "얼굴 비교",
    "여행 이름",
    "현지 이름 추천",
    "커플 테스트",
    "친구 테스트",
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
      // 네이버 서치어드바이저 소유확인. 앞: 옛 주소(dalmum.com)용, 뒤: 새 주소(www.jaemirobom.com)용
      "naver-site-verification": [
        "5a159ab7b2f21ba11be0a02f248a30dd25ffa76a",
        "23f5c10f95c5e9f0f471034083f364a0ec60d001",
      ],
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
  alternateName: SITE.nameEn,
  description: SITE.description,
  inLanguage: "ko",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
        <KakaoBrowserBanner />
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
        {GA.id ? (
          <>
            <Script
              id="ga4-lib"
              async
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA.id}`}
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA.id}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
