"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./site.module.css";
import BrandLogo from "./BrandLogo";
import { SITE } from "@/lib/site";

/** 영문(/en) 페이지 전용 헤더. SiteHeader.js의 영문판 — 링크가 /en/* 경로를 가리킵니다. */
const NAV_EN = [
  { href: "/en/about", label: "About" },
  { href: "/en/guide", label: "Guide" },
  { href: "/en/reads", label: "Reads" },
  { href: "/en/faq", label: "FAQ" },
];

export default function SiteHeaderEn() {
  const pathname = usePathname() || "/en";
  // 현재 보고 있는 영문 페이지와 짝이 되는 한국어 페이지로 이동합니다.
  // (예: /en/guide → /guide, /en → /face 한국어 닮은꼴 테스트)
  const koHref = pathname === "/en" ? "/face" : pathname.replace(/^\/en/, "") || "/face";

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.brandRow}>
          <Link href="/en" className={styles.brand}>
            <BrandLogo size={28} className={styles.brandLogo} />
            {SITE.nameEn}
          </Link>
        </div>
        <nav className={styles.nav} aria-label="Main menu">
          {NAV_EN.map((n) => (
            <Link key={n.href} href={n.href} className={styles.navLink}>
              {n.label}
            </Link>
          ))}
          <Link href="/en" className={styles.cta}>
            Take the test
          </Link>
          <Link href={koHref} className={styles.langSwitch} aria-label="한국어로 보기">
            한국어
          </Link>
        </nav>
      </div>
    </header>
  );
}
