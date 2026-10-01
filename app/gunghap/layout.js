import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import site from "@/components/site.module.css";
import styles from "@/components/fortune/fortune.module.css";

// 개발 중에는 검색엔진에 노출하지 않습니다. 공개(main 병합) 직전에 robots 줄을 지우세요.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function GunghapLayout({ children }) {
  return (
    <div className={site.shell}>
      <SiteHeader />
      <main className={`${styles.main} ${styles.gunghapTheme}`}>{children}</main>
      <AdSlot slot="content-bottom" />
      <SiteFooter />
    </div>
  );
}
