"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/games/slide/slide";
import { dailyStatus } from "@/lib/games/slide/record";

/** 게임 목록에 오늘의 판을 풀었는지 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function SlideProgress({ className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const { done, streak } = dailyStatus();
    setText(done ? `오늘의 판 ⏱ ${formatTime(done.ms)}${streak > 1 ? ` · ${streak}일 연속` : ""}` : "4×4부터 · 오늘의 판도 있어요");
  }, []);
  return <p className={className}>{text || "\u00a0"}</p>;
}
