"use client";

import { useEffect, useState } from "react";
import { loadBestReact, loadRecord } from "@/lib/games/dingdong/record";

/** 게임 목록에 띵동 다섯 기록을 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function DingDongProgress({ className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const r = loadRecord();
    const best = loadBestReact();
    if (r.rounds) setText(`${r.rounds}판 중 ${r.roundWins}판 이김${best ? ` · 가장 빠른 띵동 ${(best / 1000).toFixed(2)}초` : ""}`);
    else setText("컴퓨터 1~3명과 · 빠르기 3단계 · 반응 속도 대결");
  }, []);
  return <p className={className}>{text || " "}</p>;
}
