"use client";

import { useEffect, useState } from "react";
import styles from "./InstallPrompt.module.css";

const DISMISS_KEY = "jaemirobom-install-dismissed";
const DISMISS_DAYS = 14;

function readDismissed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY));
    return t && Date.now() - t < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

/**
 * 첫 화면의 "홈 화면에 추가" 안내 카드. 화면을 가리는 팝업이 아니라 글 사이에 놓이는 카드예요.
 *  - 폰·태블릿에서만, 이미 홈 화면 앱으로 열었거나 최근에 닫았다면 보이지 않아요.
 *  - 안드로이드 크롬: 브라우저가 알려 주는 설치 신호(beforeinstallprompt)가 오면 버튼 하나로 추가
 *  - 아이폰(사파리) 등: 직접 추가하는 방법을 글로 안내
 */
export default function InstallPrompt() {
  const [mode, setMode] = useState(null); // null | "button" | "ios" | "menu"
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
    // 카카오톡 같은 앱 안의 브라우저는 홈 화면 추가가 안 돼서 보여 주지 않아요.
    const inApp = /KAKAOTALK|NAVER\(inapp|FBAN|FBAV|Instagram|Line\//i.test(ua);
    if (standalone || !mobile || inApp || readDismissed()) return;

    setMode(/iPhone|iPad|iPod/i.test(ua) ? "ios" : "menu");

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setMode("button");
    };
    const onInstalled = () => setMode(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setMode(null);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
    setMode(null);
  };

  return (
    <aside className={styles.card} aria-label="홈 화면에 추가 안내">
      <img src="/icons/icon-192.png" alt="" width="44" height="44" className={styles.icon} />
      <div className={styles.body}>
        <p className={styles.title}>홈 화면에 추가하면 앱처럼 열려요</p>
        {mode === "button" ? (
          <p className={styles.desc}>매일 보는 운세를 아이콘 한 번으로 열어 보세요.</p>
        ) : mode === "ios" ? (
          <p className={styles.desc}>
            사파리 아래의 공유 버튼(<span aria-hidden="true">□↑</span>)을 누르고 <strong>홈 화면에 추가</strong>를
            선택하세요.
          </p>
        ) : (
          <p className={styles.desc}>
            브라우저 오른쪽 위 메뉴(<span aria-hidden="true">⋮</span>)에서 <strong>홈 화면에 추가</strong> 또는{" "}
            <strong>앱 설치</strong>를 선택하세요.
          </p>
        )}
        {mode === "button" ? (
          <button type="button" className={styles.btn} onClick={install}>
            홈 화면에 추가
          </button>
        ) : null}
      </div>
      <button type="button" className={styles.close} onClick={dismiss} aria-label="안내 닫기">
        ✕
      </button>
    </aside>
  );
}
