import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import site from "@/components/site.module.css";
import styles from "@/components/fortune/fortune.module.css";

// 공개 게이트: 사용자 확인 전까지는 검색 노출 안 함(관상·궁합과 같은 방식).
export const metadata = { robots: { index: false, follow: false } };

export default function DreamLayout({ children }) {
  return (
    <div className={site.shell}>
      <SiteHeader />
      <main className={`${styles.main} ${styles.dreamTheme}`}>{children}</main>
      <AdSlot slot="content-bottom" />
      <SiteFooter />
    </div>
  );
}
