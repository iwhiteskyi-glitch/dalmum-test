"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./site.module.css";
import { CORNERS, NAV, SITE } from "@/lib/site";
import BrandLogo from "./BrandLogo";
import ScrollHint from "./ScrollHint";
import { copyText } from "@/lib/fortune/shareResult";

// 한국어 페이지 공통 헤더. 로고(재미로봄 → 첫 화면) 옆에 코너(닮은꼴 / 여행 이름 …)를 탭처럼
// 나란히 두고, 소개·읽을거리 같은 나머지 메뉴는 넓은 화면에선 옆에, 휴대폰에선 ☰ 메뉴 안에 넣습니다.
// 지금 보고 있는 코너의 탭은 그 코너의 포인트 색(globals.css의 --c-<key>)으로 표시됩니다.
// 코너 수가 늘면서 좁은 화면에서는 이 탭 줄이 가로로 스크롤되는데(site.module.css
// .testTabs), 지금 보고 있는 코너의 탭이 스크롤 밖에 가려 있을 수 있어 자동으로
// 보이는 영역 안으로 스크롤해 줍니다.

export default function SiteHeader({ wide = false }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const activeTabRef = useRef(null);
  const [note, setNote] = useState(""); // 링크 복사·공유 결과 안내 문구
  const [canShare, setCanShare] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => setNote(""), [pathname, open]);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  // 지금 보고 있는 페이지 주소를 복사(카카오톡 등에 붙여넣기용). 복사 기능이 막힌 브라우저는 옛 방식으로 한 번 더 시도해요.
  const copyLink = async () => {
    const url = window.location.href;
    let ok = await copyText(url);
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {}
    }
    setNote(ok ? "링크를 복사했어요. 카카오톡 대화창에 붙여넣으세요." : "복사가 안 돼요. 주소창의 주소를 직접 복사해 주세요.");
  };

  const shareLink = async () => {
    try {
      await navigator.share({ title: document.title, url: window.location.href });
    } catch {}
  };

  const current = CORNERS.find((c) => pathname === c.href || pathname.startsWith(`${c.href}/`));
  const links = NAV;

  // scrollIntoView("nearest")는 탭이 끝에 걸쳐 반쯤 잘린 채로 멈춰서, 탭 줄 가운데로 직접 맞춥니다.
  useEffect(() => {
    const tab = activeTabRef.current;
    const bar = tab?.parentElement;
    if (!tab || !bar || bar.scrollWidth <= bar.clientWidth) return;
    const offset = tab.getBoundingClientRect().left - bar.getBoundingClientRect().left;
    bar.scrollLeft += offset - (bar.clientWidth - tab.offsetWidth) / 2;
  }, [current?.key]);

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
    </>
  );

  return (
    <header className={styles.header}>
      <div className={`${styles.headerInner} ${wide ? styles.headerWide : ""}`} data-content-width>
        <Link href="/" className={styles.brand} aria-label={`${SITE.name} 첫 화면`}>
          <BrandLogo size={28} className={styles.brandLogo} />
          <span className={styles.brandText}>{SITE.name}</span>
        </Link>

        <ScrollHint
          as="nav"
          className={styles.testTabs}
          wrapClassName={styles.testTabsWrap}
          bg="#f3ece8"
          radius="999px"
          aria-label="코너 선택"
        >
          {CORNERS.map((c) => {
            const on = current?.key === c.key;
            return (
              <Link
                key={c.key}
                href={c.href}
                ref={on ? activeTabRef : undefined}
                className={`${styles.testTab} ${on ? styles.testTabOn : ""}`}
                style={{ "--tab-c": `var(--c-${c.key})` }}
                aria-current={on ? "page" : undefined}
              >
                {c.tab}
              </Link>
            );
          })}
        </ScrollHint>

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
          <div className={styles.menuShare}>
            {canShare ? (
              <button type="button" className={styles.menuShareBtn} onClick={shareLink}>
                이 페이지 공유하기
              </button>
            ) : null}
            <button type="button" className={styles.menuShareBtn} onClick={copyLink}>
              링크 복사
            </button>
          </div>
          {note ? (
            <p className={styles.menuNote} role="status">
              {note}
            </p>
          ) : null}
        </nav>
      )}
    </header>
  );
}
