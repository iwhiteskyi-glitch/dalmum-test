"use client";

import { useEffect, useState } from "react";
import { dailyStatus, loadBest } from "@/lib/games/spot/record";
import { formatClock } from "@/lib/games/sudoku/record";

/** 게임 목록에 틀린 그림 찾기 기록을 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function SpotProgress({ className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const { done, streak } = dailyStatus();
    const best = loadBest();
    if (done) setText(`오늘의 그림 ⏱ ${formatClock(done.ms)}${streak > 1 ? ` · ${streak}일 연속` : ""}`);
    else if (best) setText(`🔥 최고 ${best}연승 · 오늘의 그림도 있어요`);
    else setText("연승 도전 · 오늘의 그림도 있어요");
  }, []);
  return <p className={className}>{text || "\u00a0"}</p>;
}
