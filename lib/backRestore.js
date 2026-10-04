"use client";

/**
 * 결과를 본 뒤 결과 안의 링크로 다른 페이지에 갔다가 "뒤로 가기"로 돌아오면, 처음 화면 대신
 * 보던 결과를 그대로 다시 보여 주기 위한 보관함.
 *
 * 주소나 브라우저 저장소(localStorage 등)에는 남기지 않고 이 탭의 메모리에만 둡니다. 그래서
 * 새로고침하거나 창을 닫으면 사라지고, 사진·생년월일 같은 정보도 어디에도 기록되지 않아요.
 * 메뉴로 다시 들어온 경우(뒤로 가기가 아닌 경우)에는 평소처럼 처음 화면을 보여 줍니다.
 */
const store = new Map();
let lastPop = 0;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastPop = Date.now();
  });
}

export function keepResult(key, value) {
  store.set(key, value);
}

export function dropResult(key) {
  store.delete(key);
}

/** 방금 뒤로/앞으로 가기로 들어왔을 때만 보관해 둔 결과를 돌려줍니다. */
export function restoreOnBack(key) {
  if (typeof window === "undefined" || Date.now() - lastPop > 3000) return null;
  return store.get(key) ?? null;
}
