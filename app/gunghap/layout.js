import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import site from "@/components/site.module.css";
import styles from "@/components/fortune/fortune.module.css";

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
