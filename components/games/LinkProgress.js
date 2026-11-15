"use client";

import { useEffect, useState } from "react";
import { clearedCount, dailyStatus, formatClock, loadRecord, STAGE_COUNT, starTotal } from "@/lib/games/link/record";

/** 게임 목록에 짝꿍 잇기 진행을 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function LinkProgress({ className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const { done, streak } = dailyStatus();
    const record = loadRecord();
    const cleared = clearedCount(record);
    if (done) setText(`오늘의 짝꿍 잇기 ⏱ ${formatClock(done.ms)}${streak > 1 ? ` · ${streak}일 연속` : ""}`);
    else if (cleared) setText(`${cleared}단계까지 깼어요 · ★ ${starTotal(record)}/${STAGE_COUNT * 3}`);
    else setText("6×6 작은 판부터 · 오늘의 짝꿍 잇기도 있어요");
  }, []);
  return <p className={className}>{text || "\u00a0"}</p>;
}
