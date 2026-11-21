"use client";

import { makeMatchRecord } from "../matchRecord.js";
import { LIVES_OPTIONS } from "./match.js";

/** 도둑잡기 기록(이 브라우저에만): 고른 설정 · 판 수와 도둑이 안 된 판 · 경기 수와 꼴찌를 피한 경기 */
export const { EMPTY_RECORD, loadRecord, saveSetup, addRound, addMatch } = makeMatchRecord("jmb-thief-v1", { lives: LIVES_OPTIONS }, { bots: 2, lives: 3 });
