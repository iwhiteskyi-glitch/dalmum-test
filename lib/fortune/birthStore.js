"use client";

/**
 * 운세 코너의 페이지들(/fortune 오늘의 운세, /fortune/saju 내 사주)이 함께 쓰는 생년월일.
 *
 * 생년월일은 서버로 보내지 않고 이 브라우저 메모리에만 둡니다. 그래서 코너 안에서 페이지를
 * 옮겨 다녀도 다시 입력하지 않아도 되고, 창을 닫으면 사라집니다.
 * "이 기기에 기억하기"를 직접 켠 경우에만 localStorage에 남기고, 언제든 지울 수 있어요.
 */
import { useSyncExternalStore } from "react";
import { calcSaju } from "./saju";

const STORE_KEY = "jaemirobom.fortune.birth";

const EMPTY_STATE = { input: null, saju: null, remembered: false, loaded: false };
let state = EMPTY_STATE;
const listeners = new Set();

function emit(next) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
}

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeStore(v) {
  try {
    if (v) window.localStorage.setItem(STORE_KEY, JSON.stringify(v));
    else window.localStorage.removeItem(STORE_KEY);
  } catch {
    /* 사생활 보호 모드 등에서는 저장이 안 될 수 있어요. 그래도 화면은 그대로 동작합니다. */
  }
}

/** 처음 한 번, 기억해 둔 생년월일이 있으면 불러옵니다. */
export function loadRemembered() {
  if (state.loaded) return;
  const saved = readStore();
  const r = saved ? calcSaju(saved) : null;
  if (saved && !r.ok) writeStore(null);
  if (r?.ok) emit({ input: saved, saju: r, remembered: true, loaded: true });
  else emit({ loaded: true });
}

/** 생년월일 입력. 계산에 실패하면 { ok:false, error } 를 돌려줍니다. */
export function setBirth(input, remember) {
  const r = calcSaju(input);
  if (!r.ok) return r;
  if (remember) writeStore(input);
  else if (state.remembered) writeStore(null);
  emit({ input, saju: r, remembered: Boolean(remember) });
  return r;
}

/** 이 기기에 기억한 생년월일 지우기 (지금 보고 있는 결과는 그대로) */
export function forgetBirth() {
  writeStore(null);
  emit({ remembered: false });
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useBirth() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY_STATE,
  );
}
