"use client";

import { levelOf, PUZZLE_EPOCH, streakOf, todayKey } from "../daily.js";
import { seededRandom } from "../slide/slide.js";
import { isValidNumber, judge, LEVELS, randomNumber } from "./baseball.js";
import { VS_LEVELS } from "./vs.js";

/**
 * 숫자 야구 기록과 오늘의 숫자. 기록은 이 브라우저에만 저장해요(서버 저장 없음).
 *  - 숫자 맞히기 단계: 깼는지 · ★(부른 횟수로 1~3개, 가장 많이 받은 것) · 가장 적게 부른 횟수
 *  - 무한 도전: 최고 연속, 이어서 할 자리(판을 깨고 나간 때까지 연속으로 깬 수)
 *  - 컴퓨터와 대결: 이긴 가장 높은 단계, 무한 연승 최고·이어서 할 연승
 *  - 오늘의 숫자: 날짜마다 부른 숫자들(부를 때마다 저장해서, 나갔다 와도 이어서 하고 다시 시작하는 꼼수를 막아요)
 */
const KEY = "jmb-baseball-v1";
const DAILY_KEY = "jmb-baseball-daily-v1";

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
const positiveInt = (v) => Number.isInteger(v) && v > 0;

export const EMPTY_RECORD = { stages: {}, endlessBest: 0, endlessSaved: 0, vsCleared: 0, vsStreakBest: 0, vsStreakSaved: 0 };

/** 저장된 기록(망가진 값은 버려요) */
export function loadRecord() {
  const raw = read(KEY);
  const out = { ...EMPTY_RECORD, stages: {} };
  for (const [key, v] of Object.entries(raw.stages || {})) {
    const stage = Number(key);
    if (!Number.isInteger(stage) || stage < 1 || stage > STAGE_COUNT || !v || !positiveInt(v.stars)) continue;
    out.stages[stage] = { stars: Math.min(3, v.stars), bestUsed: positiveInt(v.bestUsed) ? v.bestUsed : null };
  }
  for (const k of ["endlessBest", "endlessSaved", "vsStreakBest", "vsStreakSaved"]) if (positiveInt(raw[k])) out[k] = raw[k];
  if (positiveInt(raw.vsCleared)) out.vsCleared = Math.min(VS_LEVELS, raw.vsCleared);
  return out;
}
const update = (change) => {
  const next = change(loadRecord());
  write(KEY, next);
  return next;
};

/* ---------- 숫자 맞히기 단계 ---------- */

export const isStageCleared = (record, stage) => (record.stages[stage]?.stars ?? 0) > 0;
/** 1단계는 늘, 그다음은 앞 단계를 깨야 열려요 */
export const isStageOpen = (record, stage) => stage === 1 || isStageCleared(record, stage - 1);
/** 10단계를 깨면 무한 도전 */
export const isEndlessOpen = (record) => isStageCleared(record, STAGE_COUNT);
export const clearedCount = (record) => Object.keys(record.stages).length;
export const starTotal = (record) => Object.values(record.stages).reduce((sum, r) => sum + r.stars, 0);
export function nextStage(record) {
  for (let stage = 1; stage <= STAGE_COUNT; stage++) if (!isStageCleared(record, stage)) return stage;
  return STAGE_COUNT;
}

/** 단계를 깼을 때. ★과 횟수는 더 좋을 때만 바꿔요 */
export function addStageClear(stage, used, stars) {
  let newBest = false;
  update((record) => {
    const old = record.stages[stage] || { stars: 0, bestUsed: null };
    newBest = old.bestUsed === null || used < old.bestUsed;
    return { ...record, stages: { ...record.stages, [stage]: { stars: Math.max(old.stars, stars), bestUsed: newBest ? used : old.bestUsed } } };
  });
  return { newBest };
}

/** 무한 도전에서 한 판 깸: 최고 연속(더 많을 때만)과 이어서 할 자리 */
export function addEndlessStreak(streak) {
  let newBest = false;
  update((record) => {
    newBest = streak > record.endlessBest;
    return { ...record, endlessBest: newBest ? streak : record.endlessBest, endlessSaved: streak };
  });
  return { newBest };
}
/** 무한 도전 판을 시작함·기회를 다 씀: 이어서 할 자리를 지워요(판을 깨면 다시 저장) */
export const clearEndlessSaved = () => update((record) => ({ ...record, endlessSaved: 0 }));

/* ---------- 컴퓨터와 대결 ---------- */

/** 1단계는 늘, 그다음은 앞 단계를 이겨야 열려요 */
export const isVsOpen = (record, level) => level <= record.vsCleared + 1;
/** 10단계를 이기면 무한 연승 */
export const isVsLegend = (record) => record.vsCleared >= VS_LEVELS;
/** 단계를 이김(더 높은 단계일 때만 바뀌어요) */
export const addVsWin = (level) => update((record) => (level > record.vsCleared ? { ...record, vsCleared: Math.min(VS_LEVELS, level) } : record));
/** 무한 연승에서 한 판 끝남(이기거나 비김): 최고 연승과 이어서 할 연승 */
export function addVsStreak(streak) {
  let newBest = false;
  update((record) => {
    newBest = streak > record.vsStreakBest;
    return { ...record, vsStreakBest: newBest ? streak : record.vsStreakBest, vsStreakSaved: streak };
  });
  return { newBest };
}
/** 무한 연승 판을 시작함: 이어서 할 자리를 지워요(판이 끝나면 다시 저장). 판 중간에 나가면 연승이 끝나요 */
export const clearVsSaved = () => update((record) => ({ ...record, vsStreakSaved: 0 }));

/* ---------- 오늘의 숫자 ---------- */

/**
 * 난이도별(앱의 오늘의 숫자와 같은 규칙): 보통(월~목)은 4자리 기회 12번, 어려움(금~일)은 4자리 기회 10번.
 * (쉬움 날은 2026-11-04부터 없어요. 혹시 쉬움이 나오면 보통)
 * 하루 한 번 도전: 기회를 다 쓰면 숫자를 공개하고 그날은 끝이에요.
 */
export const DAILY_SPECS = {
  medium: { count: 4, chances: 12 },
  hard: { count: 4, chances: 10 },
};
export const dailySpec = (key) => DAILY_SPECS[levelOf(key)] ?? DAILY_SPECS.medium;

const dayIndex = (key) => Math.round((Date.parse(`${key}T00:00:00Z`) - Date.parse(`${PUZZLE_EPOCH}T00:00:00Z`)) / 86400000);

/** 이 날의 숨긴 숫자. 같은 날에는 누구나 같은 숫자예요. 주의: 씨앗을 바꾸면 지난 날짜의 숫자도 바뀌어요 */
export const dailyNumber = (key) => randomNumber(dailySpec(key).count, seededRandom(dayIndex(key) * 6151 + 97));

/** 저장해 두는 날 수. 더 오래된 날은 지워요 */
const KEEP_DAYS = 60;

/** { [날짜]: ["0123", …] } — 그날 부른 숫자들(망가진 값은 버려요) */
export function loadDailyTries() {
  const raw = read(DAILY_KEY);
  const out = {};
  for (const [date, guesses] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(guesses)) continue;
    const spec = dailySpec(date);
    const clean = [...new Set(guesses.filter((g) => typeof g === "string" && isValidNumber(g, spec.count)))].slice(0, spec.chances);
    if (clean.length) out[date] = clean;
  }
  return out;
}

/** 이 날 부른 기록(결과까지) */
export function dailyCalls(key, tries = loadDailyTries()) {
  const secret = dailyNumber(key);
  return (tries[key] || []).map((guess) => ({ guess, judge: judge(secret, guess) }));
}

/** 이 날 도전 상태: new · playing(used) · solved(used) · failed */
export function dailyStateOf(key, tries = loadDailyTries()) {
  const calls = dailyCalls(key, tries);
  const spec = dailySpec(key);
  if (!calls.length) return { kind: "new" };
  const hitAt = calls.findIndex((c) => c.judge.strike === spec.count);
  if (hitAt >= 0) return { kind: "solved", used: hitAt + 1 };
  if (calls.length >= spec.chances) return { kind: "failed" };
  return { kind: "playing", used: calls.length };
}

/** 부른 숫자를 더해요. 끝난 날이거나 이미 부른 숫자면 그대로 */
export function addDailyTry(key, guess) {
  const tries = loadDailyTries();
  const state = dailyStateOf(key, tries);
  if (state.kind === "solved" || state.kind === "failed") return;
  if (!isValidNumber(guess, dailySpec(key).count) || (tries[key] || []).includes(guess)) return;
  const oldest = dayIndex(key) - KEEP_DAYS;
  const out = {};
  for (const [d, g] of Object.entries(tries)) if (dayIndex(d) >= oldest) out[d] = g;
  out[key] = [...(tries[key] || []), guess];
  write(DAILY_KEY, out);
}

/** 오늘 상태와 며칠 연속으로 맞혔는지(맞힌 날만 세요) */
export function dailyStatus(now = Date.now()) {
  const today = todayKey(now);
  const tries = loadDailyTries();
  const solved = {};
  for (const d of Object.keys(tries)) if (dailyStateOf(d, tries).kind === "solved") solved[d] = true;
  return { today, state: dailyStateOf(today, tries), streak: streakOf(solved, today) };
}
