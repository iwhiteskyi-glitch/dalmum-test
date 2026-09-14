"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./KakaoBrowserBanner.module.css";

/**
 * 카카오톡 인앱 브라우저 안내 배너.
 *
 * 카카오톡으로 공유된 링크를 눌러 들어오면, 카카오톡 자체 내장 브라우저로
 * 열리는데, 이 브라우저는 "사진과 함께 바로 공유하기(Web Share API)" 같은
 * 최신 기능을 제한적으로 지원해서 결과 공유가 실패할 수 있습니다.
 * (userAgent에 "KAKAOTALK"이 포함되는 걸로 감지 — 카카오톡 인앱 브라우저의
 * 공식적인 특징입니다.)
 *
 * "다른 브라우저로 열기" 버튼은 카카오톡 자체가 제공하는 전용 URL 스킴
 * (kakaotalk://web/openExternal?url=...)을 사용해 기기의 기본 브라우저로
 * 즉시 넘겨줍니다. 혹시 이 방식이 안 먹는 구버전 카카오톡 대비, 수동으로
 * 여는 방법도 함께 안내합니다.
 */
export default function KakaoBrowserBanner() {
  const pathname = usePathname() || "/";
  const isEn = pathname.startsWith("/en");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (/KAKAOTALK/i.test(navigator.userAgent)) setShow(true);
  }, []);

  if (!show) return null;

  const openExternal = () => {
    const url = window.location.href;
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
  };

  return (
    <div className={styles.bar} role="note">
      <span className={styles.text}>
        {isEn
          ? "Sharing works better outside KakaoTalk's built-in browser."
          : "카카오톡 안에서는 사진 공유가 잘 안 될 수 있어요."}
        <span className={styles.hint}>
          {isEn
            ? "If tapping the button doesn't work, use the ⋮ menu above → \"Open in browser.\""
            : "버튼이 안 먹으면 위쪽 메뉴(⋮)에서 \"다른 브라우저로 열기\"를 눌러주세요."}
        </span>
      </span>
      <button type="button" onClick={openExternal} className={styles.btn}>
        {isEn ? "Open in browser" : "다른 브라우저로 열기"}
      </button>
      <button
        type="button"
        onClick={() => setShow(false)}
        className={styles.close}
        aria-label={isEn ? "Close" : "닫기"}
      >
        ✕
      </button>
    </div>
  );
}
