"use client";

import GameShell from "./GameShell";
import { GAMES } from "@/lib/games/meta";
import { omokRules } from "./omok";

/** 오목 페이지의 게임 화면(게임별로 따로 둬서 페이지마다 그 게임 코드만 내려받아요) */
export default function OmokGame() {
  return <GameShell meta={GAMES.omok} rules={omokRules} />;
}
