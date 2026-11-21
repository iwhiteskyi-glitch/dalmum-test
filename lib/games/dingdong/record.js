"use client";

import { makeMatchRecord } from "../matchRecord.js";
import { BOT_SPEEDS, TURN_SECONDS, WINS_OPTIONS } from "./match.js";

/** 띵동 다섯 기록(이 브라우저에만): 고른 설정 · 판 수와 이긴 판 · 경기 수와 우승 */
export const { EMPTY_RECORD, loadRecord, saveSetup, addRound, addMatch } = makeMatchRecord(
  "jmb-dingdong-v1",
  { winsToChampion: WINS_OPTIONS, turnSeconds: TURN_SECONDS, botSpeed: BOT_SPEEDS },
  { bots: 2, winsToChampion: 2, turnSeconds: 5, botSpeed: "normal" },
);

/** 가장 빨리 맞게 누른 반응 시간(ms). 이 브라우저에만 */
const BEST_KEY = "jmb-dingdong-best-v1";
export function loadBestReact() {
  try {
    const v = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) && v > 0 && v < 60000 ? v : null;
  } catch {
    return null;
  }
}
/** 더 빠를 때만 바꿔요. 새 기록이면 true */
export function addReact(ms) {
  const best = loadBestReact();
  if (best !== null && ms >= best) return false;
  try {
    window.localStorage.setItem(BEST_KEY, String(Math.round(ms)));
  } catch {
    /* 저장이 안 되는 환경이면 기록만 남지 않아요 */
  }
  return true;
}
