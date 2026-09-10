import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import styles from "@/components/site.module.css";

export default function ContentLayout({ children }) {
  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main className={styles.main}>{children}</main>
      <AdSlot slot="content-bottom" />
      <SiteFooter />
    </div>
  );
}
