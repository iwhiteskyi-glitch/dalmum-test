"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./site.module.css";
import { NAV, SITE } from "@/lib/site";

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  // 현재 보고 있는 페이지와 짝이 되는 영문 페이지로 이동합니다.
  // (예: /guide → /en/guide, / → /en)
  const enHref = pathname === "/" ? "/en" : `/en${pathname}`;

  return (
    <header className={styles.header}>
      <div className={styles.brandRow}>
        <Link href="/" className={styles.brand}>
          <img
            src="/logo.png"
            alt=""
            width={26}
            height={15}
            className={styles.brandLogo}
          />
          {SITE.name}
        </Link>
      </div>
      <nav className={styles.nav} aria-label="주요 메뉴">
        {NAV.filter((n) => n.href !== "/").map((n) => (
          <Link key={n.href} href={n.href} className={styles.navLink}>
            {n.label}
          </Link>
        ))}
        <Link href="/" className={styles.cta}>
          테스트 하러가기
        </Link>
        <Link href={enHref} className={styles.langSwitch} aria-label="Switch to English">
          EN
        </Link>
      </nav>
    </header>
  );
}
