import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import styles from "@/components/site.module.css";

export const metadata = {
  title: "페이지를 찾을 수 없어요",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main className={styles.main}>
        <p className={styles.kicker}>404</p>
        <h1 className={styles.pageTitle}>페이지를 찾을 수 없어요</h1>
        <p className={styles.lead}>
          주소가 바뀌었거나 없는 페이지예요. 아래 버튼으로 돌아가 주세요.
        </p>
        <Link href="/" className={styles.primaryBtn}>
          닮았네로 가기
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
