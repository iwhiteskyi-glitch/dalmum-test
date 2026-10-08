"use client";

import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/games/progress";
import { GAMES, STAGE_COUNT } from "@/lib/games/meta";

/** 게임 목록에 "N / 10단계 깼어요"를 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function GameProgress({ game, className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const meta = GAMES[game];
    const p = loadProgress(game);
    if (p.second) setText(`${meta.tracks.first.short} 완주 · ${meta.tracks.second.short} ${p.second} / ${STAGE_COUNT}단계`);
    else if (p.first)
      setText(p.first >= STAGE_COUNT ? `${meta.tracks.first.short} 완주! ${meta.tracks.second.label}이 열렸어요` : `${p.first} / ${STAGE_COUNT}단계 깼어요`);
    else setText(`1단계부터 · 모두 ${STAGE_COUNT}단계`);
  }, [game]);
  return <p className={className}>{text || "\u00a0"}</p>;
}
