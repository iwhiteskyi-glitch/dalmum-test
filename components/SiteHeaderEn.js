import Link from "next/link";
import styles from "./site.module.css";

/** 영문(/en) 페이지 전용 헤더. SiteHeader.js의 영문판 — 링크가 /en/* 경로를 가리킵니다. */
const NAV_EN = [
  { href: "/en/about", label: "About" },
  { href: "/en/guide", label: "Guide" },
  { href: "/en/reads", label: "Reads" },
  { href: "/en/faq", label: "FAQ" },
];

export default function SiteHeaderEn() {
  return (
    <header className={styles.header}>
      <Link href="/en" className={styles.brand}>
        <img src="/logo.png" alt="" width={26} height={15} className={styles.brandLogo} />
        Dalmum
      </Link>
      <nav className={styles.nav} aria-label="Main menu">
        {NAV_EN.map((n) => (
          <Link key={n.href} href={n.href} className={styles.navLink}>
            {n.label}
          </Link>
        ))}
        <Link href="/en" className={styles.cta}>
          Take the test
        </Link>
      </nav>
    </header>
  );
}
