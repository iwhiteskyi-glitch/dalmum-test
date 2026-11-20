"use client";

import { useEffect, useState } from "react";
import { clearedCount, dailyStatus, loadRecord, STAGE_COUNT, starTotal } from "@/lib/games/baseball/record";

/** 게임 목록에 숫자 야구 진행을 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function BaseballProgress({ className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const { state, streak } = dailyStatus();
    const record = loadRecord();
    const cleared = clearedCount(record);
    if (state.kind === "solved") setText(`오늘의 숫자 ⚾ ${state.used}번 만에${streak > 1 ? ` · ${streak}일 연속` : ""}`);
    else if (cleared || record.vsCleared)
      setText([cleared ? `맞히기 ${cleared}단계 · ★ ${starTotal(record)}/${STAGE_COUNT * 3}` : "", record.vsCleared ? `대결 ${record.vsCleared}단계` : ""].filter(Boolean).join(" · "));
    else setText("숫자 맞히기 · 컴퓨터와 대결 · 오늘의 숫자");
  }, []);
  return <p className={className}>{text || "\u00a0"}</p>;
}
