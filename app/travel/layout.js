import { Gaegu } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import site from "@/components/site.module.css";
import styles from "@/components/travel/travel.module.css";

// 손글씨 제목 글꼴은 여행 섹션에서만 불러옵니다. (다른 페이지 로딩에는 영향 없음)
const gaegu = Gaegu({
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gaegu",
  preload: false,
});

// 개발 중에는 검색엔진 노출을 막습니다. 공개할 때 이 robots 설정만 지우면 됩니다.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function TravelLayout({ children }) {
  return (
    <div className={`${site.shell} ${gaegu.variable}`}>
      <SiteHeader />
      <main className={styles.main}>{children}</main>
      <AdSlot slot="content-bottom" />
      <SiteFooter />
    </div>
  );
}
