"use client";

import { useEffect, useState } from "react";
import { loadRecord } from "@/lib/games/bingo/record";

/** 게임 목록에 빙고 기록을 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function BingoProgress({ className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const r = loadRecord();
    if (r.rounds) setText(`${r.rounds}판 중 ${r.roundWins}판 이김${r.champions ? ` · 우승 ${r.champions}번` : ""}`);
    else setText("컴퓨터 1~3명과 · 직접 채우기 · 블랙빙고");
  }, []);
  return <p className={className}>{text || " "}</p>;
}
