"use client";

import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/games/progress";
import { STAGE_COUNT } from "@/lib/games/omok/stages";

/** 게임 목록에 "N / 10단계 깼어요"를 보여 줘요(기록은 이 브라우저에만 있어서 화면에서 읽어요). */
export default function GameProgress({ game, className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const p = loadProgress(game);
    if (p.white) setText(`흑돌 완주 · 백돌 ${p.white} / ${STAGE_COUNT}단계`);
    else if (p.black) setText(p.black >= STAGE_COUNT ? "흑돌 완주! 백돌 도전이 열렸어요" : `${p.black} / ${STAGE_COUNT}단계 깼어요`);
    else setText(`1단계부터 · 모두 ${STAGE_COUNT}단계`);
  }, [game]);
  return <p className={className}>{text || "\u00a0"}</p>;
}
