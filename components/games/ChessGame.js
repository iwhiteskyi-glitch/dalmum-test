"use client";

import GameShell from "./GameShell";
import { GAMES } from "@/lib/games/meta";
import { chessRules } from "./chess";

/** 체스 페이지의 게임 화면(게임별로 따로 둬서 페이지마다 그 게임 코드만 내려받아요) */
export default function ChessGame() {
  return <GameShell meta={GAMES.chess} rules={chessRules} />;
}
