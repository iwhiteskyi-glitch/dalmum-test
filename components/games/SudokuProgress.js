"use client";

import { useEffect, useState } from "react";
import { clearedCount, dailyStatus, formatClock, loadRecord, starTotal } from "@/lib/games/sudoku/record";

/** 게임 목록에 스도쿠 진행을 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function SudokuProgress({ className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const { done, streak } = dailyStatus();
    const record = loadRecord();
    const cleared = clearedCount(record);
    if (done) setText(`오늘의 스도쿠 ⏱ ${formatClock(done.ms)}${streak > 1 ? ` · ${streak}일 연속` : ""}`);
    else if (cleared) setText(`${cleared}단계까지 깼어요 · ★ ${starTotal(record)}/10`);
    else setText("4×4 연습부터 · 오늘의 스도쿠도 있어요");
  }, []);
  return <p className={className}>{text || "\u00a0"}</p>;
}
