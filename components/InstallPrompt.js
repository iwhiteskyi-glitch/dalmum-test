"use client";

import { useEffect, useState } from "react";
import styles from "./InstallPrompt.module.css";

const DISMISS_KEY = "jaemirobom-install-dismissed";
const DISMISS_DAYS = 14;
// 이 폰에서 이미 설치했다고 알게 되면 다시는 보여 주지 않아요.
const INSTALLED_KEY = "jaemirobom-install-done";

function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch {}
}

function readDismissed() {
  try {
    if (localStorage.getItem(INSTALLED_KEY)) return true;
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
 *  - 카카오톡·네이버 같은 앱 안의 브라우저: 홈 화면 추가가 안 되니 크롬/사파리로 다시 열라고 안내
 */
export default function InstallPrompt() {
  const [mode, setMode] = useState(null); // null | "button" | "ios" | "menu" | "inapp-android" | "inapp-ios"
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
    // 카카오톡 같은 앱 안의 브라우저는 홈 화면 추가가 안 돼서, 다른 브라우저로 열라고 안내해요.
    const inApp = /KAKAOTALK|NAVER\(inapp|FBAN|FBAV|Instagram|Line\//i.test(ua);
    // 홈 화면 앱으로 열렸다면 이미 설치한 폰이니 기억해 두어요(브라우저로 다시 열어도 안 보이게).
    if (standalone) markInstalled();
    if (standalone || !mobile || readDismissed()) return;

    const ios = /iPhone|iPad|iPod/i.test(ua);
    if (inApp) {
      setMode(ios ? "inapp-ios" : "inapp-android");
      return;
    }
    setMode(ios ? "ios" : "menu");

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setMode("button");
    };
    const onInstalled = () => {
      markInstalled();
      setMode(null);
    };
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
    const choice = await deferred.userChoice.catch(() => null);
    if (choice && choice.outcome === "accepted") markInstalled();
    setDeferred(null);
    setMode(null);
  };

  // 안드로이드 앱 안 브라우저에서 크롬으로 현재 주소를 다시 여는 링크
  const openInChrome = () => {
    const url = window.location.href;
    if (/KAKAOTALK/i.test(navigator.userAgent)) {
      window.location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
    } else {
      const u = new URL(url);
      window.location.href =
        "intent://" + u.host + u.pathname + u.search + "#Intent;scheme=https;package=com.android.chrome;end";
    }
  };

  const inApp = mode === "inapp-android" || mode === "inapp-ios";

  return (
    <aside className={styles.card} aria-label={inApp ? "다른 브라우저로 열기 안내" : "홈 화면에 추가 안내"}>
      <img src="/icons/icon-192.png" alt="" width="44" height="44" className={styles.icon} />
      <div className={styles.body}>
        <p className={styles.title}>
          {inApp ? "크롬·사파리로 열면 홈 화면에 추가할 수 있어요" : "홈 화면에 추가하면 앱처럼 열려요"}
        </p>
        {mode === "inapp-android" ? (
          <p className={styles.desc}>지금은 앱 안의 화면이라 추가가 안 돼요. 아래 버튼으로 크롬에서 다시 열어 보세요.</p>
        ) : mode === "inapp-ios" ? (
          <p className={styles.desc}>
            지금은 앱 안의 화면이라 추가가 안 돼요. 화면의 메뉴(<span aria-hidden="true">⋯</span> 또는{" "}
            <span aria-hidden="true">□↑</span>)에서 <strong>Safari로 열기</strong>를 선택해 주세요.
          </p>
        ) : mode === "button" ? (
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
        {mode === "inapp-android" ? (
          <button type="button" className={styles.btn} onClick={openInChrome}>
            크롬으로 열기
          </button>
        ) : null}
      </div>
      <button type="button" className={styles.close} onClick={dismiss} aria-label="안내 닫기">
        ✕
      </button>
    </aside>
  );
}
