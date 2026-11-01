"use client";

// 오늘의 문제 — 게임별로 다른 부분(처음 판, 정답 확인, 막는 쪽의 응수, 힌트, 판 그리기)을 모아 둔 곳.
// 공통 화면은 DailyPuzzle.js 에 있어요.
//
// 각 게임:
//  start(p)                    → { state, side } — side: 0 먼저 두는 쪽(흑·초·백) / 1 나중에 두는 쪽
//  sideName(side)              → "흑" 등
//  judge(p, state, move, left) → { kind: "illegal", notice } | { kind: "wrong", after } | { kind: "solved", after }
//                                 | { kind: "ok", after, reply: () => { state, notice } }
//  hint(p, state, left)        → 힌트로 보여 줄 칸(체스·장기는 움직일 말, 오목은 답 근처 3×3 칸들)
//  Board                       → 판 ({ state, side, active, onMove, onNotice, hint, startLength })

import { useEffect, useState } from "react";
import OmokBoard from "./OmokBoard";
import { chessRules } from "./chess";
import { janggiRules } from "./janggi";
import { SIZE, CELL_COUNT, CENTER, BLACK, rowOf, colOf, gridOf, colorOfTurn, moveProblem, play as omokPlay, lastWinningLine, other } from "@/lib/games/omok/rules";
import { winningFirstMoves, fiveCells } from "@/lib/games/omok/puzzle";
import { play as janggiPlay } from "@/lib/games/janggi/rules";
import { matingFirstMoves, bestDefense } from "@/lib/games/janggi/puzzle";
import { play as chessPlay, turnOf as chessTurn } from "@/lib/games/chess/rules";

/* ───────────── 오목 ───────────── */

/** 저장된 돌 배치(b 흑 칸들, w 백 칸들)를 번갈아 둔 수 목록으로 — 판 그림과 규칙 계산이 수 목록을 쓰기 때문이에요 */
function omokMoves(p) {
  const moves = [];
  for (let i = 0; i < Math.max(p.b.length, p.w.length); i++) {
    if (i < p.b.length) moves.push(p.b[i]);
    if (i < p.w.length) moves.push(p.w[i]);
  }
  return moves;
}

function OmokPuzzleBoard({ state, active, onMove, onNotice, hint, startLength }) {
  const [ghost, setGhost] = useState(null);
  const [blocked, setBlocked] = useState(null);
  useEffect(() => {
    setGhost(null);
    setBlocked(null);
  }, [state.moves.length, state]);
  const color = colorOfTurn(state.moves.length);
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
    if (moveProblem(grid, color, cell) === "doubleThree") {
      setGhost(null);
      setBlocked(cell);
      onNotice("쌍삼(열린 3이 두 개 동시에 생기는 수)은 둘 수 없어요.");
      return;
    }
    onMove(cell);
  }
  const extra = state.moves.length > startLength;
  return (
    <OmokBoard
      moves={state.moves}
      ghost={ghost}
      ghostColor={color}
      lastCell={extra ? state.moves[state.moves.length - 1] : null}
      winLine={extra ? lastWinningLine(state.moves) : null}
      blocked={blocked}
      disabled={!active}
      onTap={tap}
      area={hint}
    />
  );
}

const omok = {
  start(p) {
    const moves = omokMoves(p);
    return { state: { moves }, side: colorOfTurn(moves.length) === BLACK ? 0 : 1 };
  },
  sideName: (side) => (side === 0 ? "흑" : "백"),
  dot: (side) => (side === 0 ? "black" : "white"),
  judge(p, state, cell, left) {
    const grid = gridOf(state.moves);
    const color = colorOfTurn(state.moves.length);
    if (grid[cell] || moveProblem(grid, color, cell)) return { kind: "illegal" };
    const r = omokPlay(state.moves, cell);
    const after = { moves: r.moves };
    if (r.outcome === "win") return { kind: "solved", after };
    const wins = winningFirstMoves(grid, color, left) || [];
    if (!wins.includes(cell)) return { kind: "wrong", after };
    return {
      kind: "ok",
      after,
      reply() {
        // 막는 쪽: 내가 5목을 만들 자리 중 막을 수 있는 곳을 막아요(쌍삼이라 못 막으면 다른 곳에 둬요)
        const g = gridOf(after.moves);
        const opp = other(color);
        const threats = fiveCells(g, color);
        let block = threats.find((c) => !moveProblem(g, opp, c));
        let notice = "";
        if (block === undefined) {
          notice = "막아야 할 자리가 쌍삼 금지라서 상대가 막지 못했어요!";
          block = nearestFree(g, opp, threats[0] ?? CENTER, threats);
        } else if (threats.length >= 2) notice = "두 군데를 동시에 노렸어요. 상대는 한 곳만 막을 수 있어요!";
        const next = omokPlay(after.moves, block);
        return { state: { moves: next ? next.moves : after.moves }, notice };
      },
    };
  },
  hint(p, state, left) {
    const grid = gridOf(state.moves);
    const wins = winningFirstMoves(grid, colorOfTurn(state.moves.length), left) || [];
    if (!wins.length) return null;
    // 답 칸이 늘 가운데에 오지 않게, 문제마다 3×3 칸의 위치를 조금씩 옮겨요
    const a = wins[0];
    const seed = state.moves.length + p.b.length * 7;
    const r0 = Math.min(SIZE - 3, Math.max(0, rowOf(a) - (seed % 3)));
    const c0 = Math.min(SIZE - 3, Math.max(0, colOf(a) - ((seed >> 1) % 3)));
    const cells = [];
    for (let r = r0; r < r0 + 3; r++) for (let c = c0; c < c0 + 3; c++) cells.push(r * SIZE + c);
    return cells;
  },
  Board: OmokPuzzleBoard,
};

/** 쌍삼이라 막지 못할 때 상대가 대신 둘 곳: 그 자리에서 가까운 빈칸 */
function nearestFree(grid, color, from, avoid) {
  let best = -1;
  let bestD = Infinity;
  for (let c = 0; c < CELL_COUNT; c++) {
    if (grid[c] || avoid.includes(c) || moveProblem(grid, color, c)) continue;
    const d = Math.abs(rowOf(c) - rowOf(from)) + Math.abs(colOf(c) - colOf(from));
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/* ───────────── 장기 ───────────── */

const same = (a, b) => a.from === b.from && a.to === b.to;
const JanggiBoard = janggiRules.Board;

const janggi = {
  start(p) {
    return {
      state: { squares: p.q, turn: p.t, lastMove: null, lastPassed: false, captured: { cho: "", han: "" }, ply: 0 },
      side: p.t,
    };
  },
  sideName: (side) => (side === 0 ? "초" : "한"),
  dot: (side) => (side === 0 ? "cho" : "han"),
  judge(p, state, m, left) {
    const r = janggiPlay(state, m);
    if (!r) return { kind: "illegal" };
    if (r.end && r.end.winner === state.turn) return { kind: "solved", after: r.state };
    const wins = matingFirstMoves(state, left) || [];
    if (!wins.some((w) => same(w, m))) return { kind: "wrong", after: r.state };
    return {
      kind: "ok",
      after: r.state,
      reply() {
        const d = bestDefense(r.state, left - 1);
        const r2 = d && janggiPlay(r.state, d);
        return { state: r2 ? r2.state : r.state, notice: "" };
      },
    };
  },
  hint(p, state, left) {
    const wins = matingFirstMoves(state, left) || [];
    return wins.length ? wins[0].from : null;
  },
  Board: ({ state, side, active, onMove, hint }) => <JanggiBoard state={state} mySide={side} active={active} onMove={onMove} hint={hint} />,
};

/* ───────────── 체스 ───────────── */

const sq = (s) => (8 - Number(s[1])) * 8 + (s.charCodeAt(0) - 97);
const uci = (u) => ({ from: sq(u.slice(0, 2)), to: sq(u.slice(2, 4)), promotion: u[4] ? u[4].toUpperCase() : undefined });

/** 리체스 문제의 FEN을 체스 규칙의 판 상태로 */
function fromFen(fen) {
  const [placement, turn, castling, ep, half] = fen.split(" ");
  return {
    squares: placement.replace(/\d/g, (d) => ".".repeat(Number(d))).replace(/\//g, ""),
    turn,
    castling: castling === "-" ? "" : castling,
    enPassant: ep === "-" ? null : sq(ep),
    halfmove: Number(half) || 0,
    history: [],
    lastMove: null,
    captured: { w: "", b: "" },
  };
}
const ChessBoard = chessRules.Board;
const steps = (p) => p.m.split(" ");

const chess = {
  // 리체스 문제는 "상대가 방금 둔 수"부터 시작해요: 그 수를 둔 판이 문제의 처음 판이에요.
  start(p) {
    const r = chessPlay(fromFen(p.f), uci(steps(p)[0]));
    return { state: r.state, side: chessTurn(r.state) };
  },
  sideName: (side) => (side === 0 ? "백" : "흑"),
  dot: (side) => (side === 0 ? "white" : "black"),
  judge(p, state, m, left) {
    const r = chessPlay(state, m);
    if (!r) return { kind: "illegal" };
    if (r.end && r.end.winner === chessTurn(state)) return { kind: "solved", after: r.state };
    const step = 1 + (p.n - left) * 2;
    const want = uci(steps(p)[step]);
    const promoOk = !want.promotion || want.promotion === (m.promotion || "Q");
    if (!(same(want, m) && promoOk) || left <= 1) return { kind: "wrong", after: r.state };
    return {
      kind: "ok",
      after: r.state,
      reply() {
        const r2 = chessPlay(r.state, uci(steps(p)[step + 1]));
        return { state: r2 ? r2.state : r.state, notice: "" };
      },
    };
  },
  hint(p, state, left) {
    const s = steps(p)[1 + (p.n - left) * 2];
    return s ? uci(s).from : null;
  },
  Board: ({ state, side, active, onMove, hint }) => <ChessBoard state={state} mySide={side} active={active} onMove={onMove} hint={hint} />,
};

export const PUZZLE_RULES = { omok, janggi, chess };
