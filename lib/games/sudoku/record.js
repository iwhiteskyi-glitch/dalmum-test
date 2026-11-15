"use client";

import { streakOf, todayKey } from "@/lib/games/daily";
import { STAGE_COUNT } from "./play";

/**
 * 스도쿠 기록. 이 브라우저에만 저장해요(서버 저장 없음).
 *  - 단계마다 깼는지 · ★(힌트 없이 깸) · 가장 빠른 시간
 *  - 무한 도전: 최고 연속, 이어서 할 자리(문제를 풀고 나간 때까지 연속으로 푼 수)
 *  - 오늘의 스도쿠: 푼 날짜와 가장 빠른 시간
 */
const KEY = "jmb-sudoku-v1";
const DAILY_KEY = "jmb-sudoku-daily-v1";
const CLASH_KEY = "jmb-sudoku-clash-v1";

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

export const EMPTY_RECORD = { stages: {}, endlessBest: 0, endlessSaved: 0 };

/** 저장된 기록(망가진 값은 버려요) */
export function loadRecord() {
  const raw = read(KEY);
  const out = { stages: {}, endlessBest: 0, endlessSaved: 0 };
  for (const [key, v] of Object.entries(raw.stages || {})) {
    const stage = Number(key);
    if (!Number.isInteger(stage) || stage < 1 || stage > STAGE_COUNT || !v) continue;
    out.stages[stage] = {
      cleared: v.cleared === true,
      star: v.star === true,
      bestMs: typeof v.bestMs === "number" && v.bestMs > 0 ? v.bestMs : null,
    };
  }
  if (Number.isInteger(raw.endlessBest) && raw.endlessBest > 0) out.endlessBest = raw.endlessBest;
  if (Number.isInteger(raw.endlessSaved) && raw.endlessSaved > 0) out.endlessSaved = raw.endlessSaved;
  return out;
}
const saveRecord = (record) => write(KEY, record);

/** 1단계는 늘, 그다음은 앞 단계를 깨야 열려요 */
export const isStageOpen = (record, stage) => stage === 1 || record.stages[stage - 1]?.cleared === true;
/** 10단계를 깨면 무한 도전 */
export const isEndlessOpen = (record) => record.stages[STAGE_COUNT]?.cleared === true;
export const clearedCount = (record) => Object.values(record.stages).filter((r) => r.cleared).length;
export const starTotal = (record) => Object.values(record.stages).filter((r) => r.star).length;

/** 처음 열어 줄 단계: 아직 안 깬 가장 앞 단계(다 깼으면 마지막) */
export function nextStage(record) {
  for (let stage = 1; stage <= STAGE_COUNT; stage++) if (!record.stages[stage]?.cleared) return stage;
  return STAGE_COUNT;
}

/** 단계를 깼을 때. ★은 힌트 없이 깨면(한 번 받으면 그대로), 시간은 더 빠를 때만 */
export function addStageClear(stage, ms, usedHint) {
  const record = loadRecord();
  const old = record.stages[stage] || { cleared: false, star: false, bestMs: null };
  const newBest = old.bestMs === null || ms < old.bestMs;
  const newStar = !usedHint && !old.star;
  record.stages[stage] = { cleared: true, star: old.star || !usedHint, bestMs: newBest ? ms : old.bestMs };
  saveRecord(record);
  return { newBest, newStar };
}

/** 무한 도전에서 한 문제 풂: 최고 연속(더 많을 때만)과 이어서 할 자리를 바꿔요 */
export function addEndlessStreak(streak) {
  const record = loadRecord();
  const newBest = streak > record.endlessBest;
  saveRecord({ ...record, endlessBest: newBest ? streak : record.endlessBest, endlessSaved: streak });
  return { newBest };
}

/** 무한 도전 문제를 시작함: 이어서 할 자리를 지워요(풀면 다시 저장). 중간에 나가면 연속이 끝나요 */
export function clearEndlessSaved() {
  const record = loadRecord();
  if (record.endlessSaved) saveRecord({ ...record, endlessSaved: 0 });
}

/* ---------- 오늘의 스도쿠 ---------- */

/** { [날짜]: { ms } } — 그날 푼 판의 가장 빠른 시간 */
export function loadDaily() {
  const raw = read(DAILY_KEY);
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v?.ms === "number" && v.ms > 0) out[k] = { ms: v.ms };
  return out;
}

/** 오늘 판 시간을 남겨요. 처음이거나 더 빠르면 true */
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

/* ---------- 설정 ---------- */

/** 겹친 숫자를 빨갛게 보일지(처음엔 켜짐) */
export const loadShowClashes = () => {
  try {
    return window.localStorage.getItem(CLASH_KEY) !== "off";
  } catch {
    return true;
  }
};
export const saveShowClashes = (on) => {
  try {
    window.localStorage.setItem(CLASH_KEY, on ? "on" : "off");
  } catch {
    /* 그대로 */
  }
};

/** 시계 글자: 3:07 (1시간 넘으면 61:00처럼 분으로 세요) */
export function formatClock(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
