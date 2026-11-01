"use client";

import { useEffect, useState } from "react";
import OmokBoard from "./OmokBoard";
import { gridOf, moveProblem, play, lastWinningLine, colorOfTurn, BLACK, WHITE } from "@/lib/games/omok/rules";

/** 오목 판: 한 번 누르면 미리보기, 같은 자리를 한 번 더 누르면 둬요(손가락이 빗나가 엉뚱한 곳에 두지 않게). */
function OmokPlay({ state, mySide, active, end, onMove, onNotice }) {
  const [ghost, setGhost] = useState(null);
  const [blocked, setBlocked] = useState(null);
  useEffect(() => {
    setGhost(null);
    setBlocked(null);
  }, [state.moves.length]);

  const myColor = mySide === 0 ? BLACK : WHITE;
  function tap(cell) {
    if (!active) return;
    setBlocked(null);
    const grid = gridOf(state.moves);
    if (grid[cell]) return;
    if (ghost !== cell) {
      setGhost(cell);
      onNotice("같은 자리를 한 번 더 누르면 돌을 놓아요.");
      return;
    }
    if (moveProblem(grid, myColor, cell) === "doubleThree") {
      setGhost(null);
      setBlocked(cell);
      onNotice("쌍삼(열린 3이 두 개 동시에 생기는 수)은 둘 수 없어요. 다른 곳에 둬 보세요.");
      return;
    }
    onMove(cell);
  }

  return (
    <OmokBoard
      moves={state.moves}
      ghost={ghost}
      ghostColor={myColor}
      lastCell={state.moves[state.moves.length - 1]}
      winLine={end && end.winner !== null ? lastWinningLine(state.moves) : null}
      blocked={blocked}
      disabled={!active}
      onTap={tap}
    />
  );
}

export const omokRules = {
  init: () => ({ moves: [] }),
  turn: (state) => (colorOfTurn(state.moves.length) === BLACK ? 0 : 1),
  apply(state, cell) {
    const r = play(state.moves, cell);
    if (!r) return null;
    const next = { moves: r.moves };
    if (r.outcome === "win") return { state: next, end: { winner: (r.moves.length - 1) % 2, reason: "다섯 개를 먼저 이었어요" } };
    if (r.outcome === "draw") return { state: next, end: { winner: null, reason: "판이 가득 찼어요" } };
    return { state: next, end: null };
  },
  info: (state, end) => (end ? null : "놓고 싶은 자리를 누르세요. 한 번 더 누르면 놓여요."),
  Board: OmokPlay,
  createWorker: () => new Worker(new URL("../../lib/games/omok/worker.js", import.meta.url)),
  loadAi: () => import("@/lib/games/omok/ai"),
  rule: "쌍삼 금지 · 가로·세로·대각선으로 5개를 먼저 이으면 이겨요(6개 이상도 승리)",
};
