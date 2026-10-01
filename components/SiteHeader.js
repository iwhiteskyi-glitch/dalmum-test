"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./site.module.css";
import { CORNERS, NAV, SITE } from "@/lib/site";
import BrandLogo from "./BrandLogo";

// 한국어 페이지 공통 헤더. 로고(재미로봄 → 첫 화면) 옆에 코너(닮은꼴 / 여행 이름 …)를 탭처럼
// 나란히 두고, 소개·읽을거리 같은 나머지 메뉴는 넓은 화면에선 옆에, 휴대폰에선 ☰ 메뉴 안에 넣습니다.
// 지금 보고 있는 코너의 탭은 그 코너의 포인트 색(globals.css의 --c-<key>)으로 표시됩니다.
export default function SiteHeader({ wide = false }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  // 현재 보고 있는 페이지와 짝이 되는 영문 페이지로 이동합니다. (예: /guide → /en/guide)
  // 영문판은 닮은꼴 테스트만 있어서, 첫 화면과 닮은꼴 페이지는 영문 닮은꼴(/en)로 보냅니다.
  const enHref = pathname === "/" || pathname === "/face" ? "/en" : `/en${pathname}`;
  const onTravel = pathname.startsWith("/travel");
  const current = CORNERS.find((c) => pathname === c.href || pathname.startsWith(`${c.href}/`));
  const links = NAV;

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
      {/* 여행 이름 섹션은 영문판이 없어서, EN 버튼이 있으면 "여행 이름도 영문으로 볼 수 있다"고
          오해하기 쉽습니다. 그래서 이 섹션에서는 EN 버튼 자체를 아예 보여주지 않습니다. */}
      {!onTravel && (
        <Link href={enHref} className={styles.langSwitch} aria-label="Switch to English">
          EN
        </Link>
      )}
    </>
  );

  return (
    <header className={styles.header}>
      <div className={`${styles.headerInner} ${wide ? styles.headerWide : ""}`}>
        <Link href="/" className={styles.brand} aria-label={`${SITE.name} 첫 화면`}>
          <BrandLogo size={28} className={styles.brandLogo} />
          <span className={styles.brandText}>{SITE.name}</span>
        </Link>

        <nav className={styles.testTabs} aria-label="코너 선택">
          {CORNERS.map((c) => {
            const on = current?.key === c.key;
            return (
              <Link
                key={c.key}
                href={c.href}
                className={`${styles.testTab} ${on ? styles.testTabOn : ""}`}
                style={{ "--tab-c": `var(--c-${c.key})` }}
                aria-current={on ? "page" : undefined}
              >
                {c.tab}
              </Link>
            );
          })}
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
