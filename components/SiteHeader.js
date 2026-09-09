import Link from "next/link";
import styles from "./site.module.css";
import { NAV, SITE } from "@/lib/site";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        {SITE.name}
      </Link>
      <nav className={styles.nav} aria-label="주요 메뉴">
        {NAV.filter((n) => n.href !== "/").map((n) => (
          <Link key={n.href} href={n.href} className={styles.navLink}>
            {n.label}
          </Link>
        ))}
        <Link href="/" className={styles.cta}>
          테스트 하러가기
        </Link>
      </nav>
    </header>
  );
}
