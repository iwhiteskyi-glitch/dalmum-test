"use client";

import { makeMatchRecord } from "../matchRecord.js";
import { WINS_OPTIONS } from "./match.js";

/** 원카드 기록(이 브라우저에만): 고른 설정 · 판 수와 이긴 판 · 경기 수와 우승 */
export const { EMPTY_RECORD, loadRecord, saveSetup, addRound, addMatch } = makeMatchRecord("jmb-onecard-v1", WINS_OPTIONS, { bots: 2, winsToChampion: 2 });
