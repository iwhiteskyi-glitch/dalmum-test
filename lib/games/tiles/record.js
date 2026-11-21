"use client";

import { makeMatchRecord } from "../matchRecord.js";
import { WINS_OPTIONS } from "./match.js";

/** 숫자 타일 기록(이 브라우저에만): 고른 설정(컴퓨터 수·승수·첫 등록 30) · 판 수와 이긴 판 · 경기 수와 우승 */
export const { EMPTY_RECORD, loadRecord, saveSetup, addRound, addMatch } = makeMatchRecord("jmb-tiles-v1", { winsToChampion: WINS_OPTIONS, meld30: [true, false] }, { bots: 1, winsToChampion: 1, meld30: true });
