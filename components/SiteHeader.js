"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./site.module.css";
import { NAV, SITE } from "@/lib/site";

// 한국어 페이지 공통 헤더. 가운데에 두 테스트(닮은꼴 / 여행 이름)를 탭처럼 나란히 두고,
// 소개·사용법 같은 나머지 메뉴는 넓은 화면에선 옆에, 휴대폰에선 ☰ 메뉴 안에 넣습니다.
export default function SiteHeader({ wide = false }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  // 현재 보고 있는 페이지와 짝이 되는 영문 페이지로 이동합니다.
  // (예: /guide → /en/guide, / → /en) 여행 섹션은 영문판이 없어서 영문 홈으로 보냅니다.
  const enHref =
    pathname === "/" || pathname.startsWith("/travel") ? "/en" : `/en${pathname}`;
  const onTravel = pathname.startsWith("/travel");
  const onFace = pathname === "/";
  const links = NAV.filter((n) => n.href !== "/");

  const secondary = (
    <>
      {links.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`${styles.navLink} ${pathname === n.href ? styles.navLinkActive : ""}`}
        >
          {n.label}
        </Link>
      ))}
      <Link href={enHref} className={styles.langSwitch} aria-label="Switch to English">
        EN
      </Link>
    </>
  );

  return (
    <header className={styles.header}>
      <div className={`${styles.headerInner} ${wide ? styles.headerWide : ""}`}>
        <Link href="/" className={styles.brand}>
          <img src="/logo.png" alt="" width={26} height={15} className={styles.brandLogo} />
          <span className={styles.brandText}>{SITE.name}</span>
        </Link>

        <nav className={styles.testTabs} aria-label="테스트 선택">
          <Link
            href="/"
            className={`${styles.testTab} ${onFace ? styles.testTabOn : ""}`}
            aria-current={onFace ? "page" : undefined}
          >
            닮은꼴
          </Link>
          <Link
            href="/travel"
            className={`${styles.testTab} ${onTravel ? styles.testTabOn : ""}`}
            aria-current={onTravel ? "page" : undefined}
          >
            여행 이름
          </Link>
        </nav>

        <nav className={styles.desktopLinks} aria-label="주요 메뉴">
          {secondary}
        </nav>

        <button
          type="button"
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav id="site-menu" className={styles.menuPanel} aria-label="주요 메뉴">
          {secondary}
        </nav>
      )}
    </header>
  );
}
