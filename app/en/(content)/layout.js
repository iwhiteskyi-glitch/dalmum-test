import SiteHeaderEn from "@/components/SiteHeaderEn";
import SiteFooterEn from "@/components/SiteFooterEn";
import AdSlot from "@/components/AdSlot";
import styles from "@/components/site.module.css";

export default function EnContentLayout({ children }) {
  return (
    <div className={styles.shell}>
      <SiteHeaderEn />
      <main className={styles.main}>{children}</main>
      <AdSlot slot="content-bottom" locale="en" />
      <SiteFooterEn />
    </div>
  );
}
