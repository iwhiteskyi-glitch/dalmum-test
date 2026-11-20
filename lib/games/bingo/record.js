"use client";

import { DEFAULT_SETTINGS, isValidSettings } from "./bingo.js";

/**
 * 빙고 기록과 고른 설정. 이 브라우저에만 저장해요(서버 저장 없음).
 *  - settings: 마지막으로 고른 설정(컴퓨터 수 포함)
 *  - rounds·roundWins: 끝까지 한 판 수와 이긴 판 수(공동 승리도 이긴 판)
 *  - matches·champions: 끝까지 한 경기 수와 우승한 경기 수
 *  - fastest: 설정(숫자 범위/줄 수)마다 내가 이긴 판에서 가장 적게 불린 숫자 개수
 */
const KEY = "jmb-bingo-v1";

export const BOT_COUNTS = [1, 2, 3];
export const DEFAULT_SETUP = { ...DEFAULT_SETTINGS, turnSeconds: undefined, bots: 2 };
export const EMPTY_RECORD = { setup: DEFAULT_SETUP, rounds: 0, roundWins: 0, matches: 0, champions: 0, fastest: {} };

const count = (v) => (Number.isInteger(v) && v > 0 && v < 1e7 ? v : 0);
export const fastestKey = (s) => `${s.maxNumber}/${s.lineTarget}`;

function read() {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
function write(value) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* 저장이 안 되는 환경이면 기록만 남지 않아요 */
  }
}

/** 저장된 기록(망가진 값은 버려요) */
export function loadRecord() {
  const raw = read();
  const s = raw.setup && typeof raw.setup === "object" ? raw.setup : {};
  const settings = {
    maxNumber: s.maxNumber,
    lineTarget: s.lineTarget,
    winsToChampion: s.winsToChampion,
    fillMode: s.fillMode,
  };
  const setup = isValidSettings(settings) && BOT_COUNTS.includes(s.bots) ? { ...settings, turnSeconds: undefined, bots: s.bots } : DEFAULT_SETUP;
  const fastest = {};
  for (const [k, v] of Object.entries(raw.fastest || {})) if (/^\d+\/\d+$/.test(k) && count(v)) fastest[k] = v;
  const rounds = count(raw.rounds);
  const matches = count(raw.matches);
  return {
    setup,
    rounds,
    roundWins: Math.min(rounds, count(raw.roundWins)),
    matches,
    champions: Math.min(matches, count(raw.champions)),
    fastest,
  };
}
const update = (change) => {
  const next = change(loadRecord());
  write(next);
  return next;
};

/** 고른 설정을 기억해요 */
export const saveSetup = (setup) => update((r) => ({ ...r, setup }));

/** 한 판이 끝났을 때. won이면 이 설정의 최단 기록(불린 숫자 개수)을 더 적을 때만 바꿔요 */
export function addRound(settings, won, calledCount) {
  let newBest = false;
  update((r) => {
    const key = fastestKey(settings);
    const fastest = { ...r.fastest };
    if (won && (!fastest[key] || calledCount < fastest[key])) {
      newBest = Boolean(fastest[key]);
      fastest[key] = calledCount;
    }
    return { ...r, rounds: r.rounds + 1, roundWins: r.roundWins + (won ? 1 : 0), fastest };
  });
  return { newBest };
}

/** 경기(우승자가 나올 때까지)가 끝났을 때 */
export const addMatch = (champion) => update((r) => ({ ...r, matches: r.matches + 1, champions: r.champions + (champion ? 1 : 0) }));
