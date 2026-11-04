"use client";

import { streakOf, todayKey } from "@/lib/games/daily";

/**
 * 슬라이드 퍼즐 기록과 오늘의 판. 기록은 이 브라우저에만 저장해요(서버 저장 없음).
 *  - 최고 기록: 칸 수마다, 숫자 판 "5" / 그림 판 "p5" / 번호 붙은 그림 판 "pn5"를 따로 남겨요
 *  - 오늘의 판: 푼 날짜와 가장 빠른 시간만 남겨요(판은 slide.js의 dailyBoard)
 */
const BEST_KEY = "jmb-slide-best-v1";
const DAILY_KEY = "jmb-slide-daily-v1";

function read(key) {
  try {
    const v = JSON.parse(window.localStorage.getItem(key) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장이 안 되는 환경이면 기록만 남지 않아요 */
  }
}

export const recordKey = (size, picture, numbers) => (picture ? `${numbers ? "pn" : "p"}${size}` : `${size}`);

export function loadBest() {
  const raw = read(BEST_KEY);
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v?.ms === "number" && v.ms > 0) out[k] = { ms: v.ms };
  return out;
}

/** 한 판 기록을 더해요. 새 기록이면 true */
export function saveBest(key, ms) {
  const best = loadBest();
  if (best[key] && ms >= best[key].ms) return false;
  best[key] = { ms };
  write(BEST_KEY, best);
  return true;
}

/* ---------- 오늘의 판 ---------- */

/** { [날짜]: { ms } } — 그날 푼 판의 가장 빠른 시간 */
export function loadDaily() {
  const raw = read(DAILY_KEY);
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v?.ms === "number" && v.ms > 0) out[k] = { ms: v.ms };
  return out;
}

/** 오늘 판 시간을 남겨요. 이전 기록을 깼거나 처음이면 true */
export function saveDaily(key, ms) {
  const all = loadDaily();
  if (all[key] && ms >= all[key].ms) return false;
  all[key] = { ms };
  write(DAILY_KEY, all);
  return true;
}

/** 오늘 푼 기록과 며칠 연속으로 풀었는지 */
export function dailyStatus(now = Date.now()) {
  const today = todayKey(now);
  const all = loadDaily();
  return { today, done: all[today] || null, streak: streakOf(all, today) };
}
