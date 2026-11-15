"use client";

import { streakOf, todayKey } from "@/lib/games/daily";

/**
 * 틀린 그림 찾기 기록. 이 브라우저에만 저장해요(서버 저장 없음).
 *  - 연승 도전: 최고 연승
 *  - 본 그림: 50장이 한 바퀴 다 나오기 전에는 같은 그림이 다시 나오지 않게(앱과 같은 규칙)
 *  - 오늘의 그림: 푼 날짜와 가장 빠른 시간
 */
const BEST_KEY = "jmb-spot-best-v1";
const SEEN_KEY = "jmb-spot-seen-v1";
const DAILY_KEY = "jmb-spot-daily-v1";

function read(key, fallback) {
  try {
    const v = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장이 안 되는 환경이면 기록만 남지 않아요 */
  }
}

export function loadBest() {
  const n = read(BEST_KEY, 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}
/** 연승을 기록해요. 새 기록이면 true */
export function saveBest(streak) {
  if (streak <= loadBest()) return false;
  write(BEST_KEY, streak);
  return true;
}

export function loadSeen(count) {
  const v = read(SEEN_KEY, []);
  return Array.isArray(v) ? v.filter((n) => Number.isInteger(n) && n >= 0 && n < count) : [];
}
export const saveSeen = (list) => write(SEEN_KEY, list);

/* ---------- 오늘의 그림 ---------- */

/** { [날짜]: { ms } } — 그날 다 찾은 가장 빠른 시간 */
export function loadDaily() {
  const raw = read(DAILY_KEY, {});
  const out = {};
  if (raw && typeof raw === "object") for (const [k, v] of Object.entries(raw)) if (typeof v?.ms === "number" && v.ms > 0) out[k] = { ms: v.ms };
  return out;
}
/** 오늘 시간을 남겨요. 처음이거나 더 빠르면 true */
export function saveDaily(key, ms) {
  const all = loadDaily();
  if (all[key] && ms >= all[key].ms) return false;
  all[key] = { ms };
  write(DAILY_KEY, all);
  return true;
}
/** 오늘 찾은 기록과 며칠 연속으로 찾았는지 */
export function dailyStatus(now = Date.now()) {
  const today = todayKey(now);
  const all = loadDaily();
  return { today, done: all[today] || null, streak: streakOf(all, today) };
}
