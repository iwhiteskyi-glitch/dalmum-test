"use client";

import { useEffect, useState } from "react";
import { loadRecord } from "@/lib/games/thief/record";

/** 게임 목록에 도둑잡기 기록을 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function ThiefProgress({ className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const r = loadRecord();
    if (r.rounds) setText(`${r.rounds}판 중 도둑 ${r.rounds - r.roundWins}번${r.matches ? ` · 꼴찌 피한 경기 ${r.champions}/${r.matches}` : ""}`);
    else setText("컴퓨터 1~3명과 · 짝 맞추기 · 조커 넘기기");
  }, []);
  return <p className={className}>{text || " "}</p>;
}
