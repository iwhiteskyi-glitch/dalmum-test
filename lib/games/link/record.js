"use client";

import { levelOf, streakOf, todayKey } from "../daily.js";
import { seededRandom } from "../slide/slide.js";
import { LEVELS, makeBoard } from "./link.js";

/**
 * 짝꿍 잇기 기록과 오늘의 짝꿍 잇기. 기록은 이 브라우저에만 저장해요(서버 저장 없음).
 *  - 단계마다 깼는지 · ★(남은 시간으로 1~3개, 가장 많이 받은 것) · 가장 빠른 시간
 *  - 무한 도전: 최고 연속, 이어서 할 자리(판을 깨고 나간 때까지 연속으로 깬 수)
 *  - 오늘의 짝꿍 잇기: 푼 날짜와 가장 빠른 시간
 */
const KEY = "jmb-link-v1";
const DAILY_KEY = "jmb-link-daily-v1";

export const STAGE_COUNT = LEVELS.length;

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
    if (typeof v.stars !== "number" || v.stars < 1) continue;
    out.stages[stage] = {
      stars: Math.min(3, Math.floor(v.stars)),
      bestMs: typeof v.bestMs === "number" && v.bestMs > 0 ? v.bestMs : null,
    };
  }
  if (Number.isInteger(raw.endlessBest) && raw.endlessBest > 0) out.endlessBest = raw.endlessBest;
  if (Number.isInteger(raw.endlessSaved) && raw.endlessSaved > 0) out.endlessSaved = raw.endlessSaved;
  return out;
}
const saveRecord = (record) => write(KEY, record);

/** ★ 경계(남은 시간 비율): 절반 넘게 남으면 ★3, 4분의 1 넘게 남으면 ★2. 시간 막대에 선으로도 그려요(앱과 같아요) */
export const STAR_LINES = [0.5, 0.25];

/** 걸린 시간으로 ★ 1~3개 */
export function starsFor(ms, seconds) {
  const left = 1 - ms / (seconds * 1000);
  return left >= STAR_LINES[0] ? 3 : left >= STAR_LINES[1] ? 2 : 1;
}

export const isCleared = (record, stage) => (record.stages[stage]?.stars ?? 0) > 0;
/** 1단계는 늘, 그다음은 앞 단계를 깨야 열려요 */
export const isStageOpen = (record, stage) => stage === 1 || isCleared(record, stage - 1);
/** 10단계를 깨면 무한 도전 */
export const isEndlessOpen = (record) => isCleared(record, STAGE_COUNT);
export const clearedCount = (record) => Object.keys(record.stages).length;
export const starTotal = (record) => Object.values(record.stages).reduce((sum, r) => sum + r.stars, 0);

/** 처음 열어 줄 단계: 아직 안 깬 가장 앞 단계(다 깼으면 마지막) */
export function nextStage(record) {
  for (let stage = 1; stage <= STAGE_COUNT; stage++) if (!isCleared(record, stage)) return stage;
  return STAGE_COUNT;
}

/** 단계를 깼을 때. ★과 시간은 더 좋을 때만 바꿔요 */
export function addStageClear(stage, ms, stars) {
  const record = loadRecord();
  const old = record.stages[stage] || { stars: 0, bestMs: null };
  const newBest = old.bestMs === null || ms < old.bestMs;
  record.stages[stage] = { stars: Math.max(old.stars, stars), bestMs: newBest ? ms : old.bestMs };
  saveRecord(record);
  return { newBest, moreStars: stars > old.stars };
}

/** 무한 도전에서 한 판 깸: 최고 연속(더 많을 때만)과 이어서 할 자리를 바꿔요 */
export function addEndlessStreak(streak) {
  const record = loadRecord();
  const newBest = streak > record.endlessBest;
  saveRecord({ ...record, endlessBest: newBest ? streak : record.endlessBest, endlessSaved: streak });
  return { newBest };
}

/** 무한 도전 판을 시작함·시간이 다 됨: 이어서 할 자리를 지워요(판을 깨면 다시 저장). 중간에 나가면 연속이 끝나요 */
export function clearEndlessSaved() {
  const record = loadRecord();
  if (record.endlessSaved) saveRecord({ ...record, endlessSaved: 0 });
}

/* ---------- 오늘의 짝꿍 잇기 ---------- */

/**
 * 난이도별 판(앱의 오늘의 퍼즐과 같은 크기): 보통은 미끄러짐 없이 8×10, 어려움(금~일)은 8×12에 미끄러짐 무작위.
 * 사이트는 시간 제한 없이 걸린 시간을 남겨요(스도쿠·틀린 그림과 같은 방식)
 */
export const DAILY_SPECS = {
  easy: { cols: 6, rows: 8, kinds: 12, slide: "none" },
  medium: { cols: 8, rows: 10, kinds: 20, slide: "none" },
  hard: { cols: 8, rows: 12, kinds: 24, slide: "random" },
};

const dayIndex = (key) => Math.round((Date.parse(`${key}T00:00:00Z`) - Date.parse("2026-10-01T00:00:00Z")) / 86400000);

/**
 * 이 날의 판. 같은 날에는 누구나 같은 판이 나와요.
 * 주의: 판 만들기(makeBoard)·그림 순서(TILE_PICTURES)·이 씨앗을 바꾸면 지난 날짜의 판도 바뀌어요
 */
export function dailyLinkBoard(key) {
  return makeBoard(DAILY_SPECS[levelOf(key)], seededRandom(dayIndex(key) * 7919 + 1303));
}
/** 섞을 때 쓰는 무작위도 날짜에서 나오게 해요(같은 날에는 막혔을 때 섞이는 모양도 같아요) */
export const dailyShuffleRandom = (key) => seededRandom(dayIndex(key) * 104729 + 77);

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

/** 시계 글자: 3:07 */
export function formatClock(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
