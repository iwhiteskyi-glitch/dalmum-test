"use client";

import { useEffect, useState } from "react";
import styles from "./games.module.css";
import { newState, play, legalMovesFrom, colorOf, inCheck, isPromotionMove, turnOf } from "@/lib/games/chess/rules";

const VIEW = 480;
const STEP = VIEW / 8;
const FILES = "abcdefgh";
const PIECE_SRC = (p) => `/games/chess/${p === p.toUpperCase() ? "w" : "b"}${p.toUpperCase()}.svg`;
const PROMO = [
  ["Q", "퀸"],
  ["R", "룩"],
  ["B", "비숍"],
  ["N", "나이트"],
];

/**
 * 체스판: 내 말을 누르면 갈 수 있는 칸이 표시되고, 그 칸을 누르면 움직여요. 흑일 때는 판을 뒤집어 보여 줘요.
 * hint: 힌트로 테두리를 그려 줄 칸(오늘의 문제에서 "이 말을 움직여 보세요")
 */
function ChessBoard({ state, mySide, active, end, onMove, hint = null }) {
  const [sel, setSel] = useState(null);
  const [promo, setPromo] = useState(null); // 프로모션 고르는 중인 수 { from, to }
  useEffect(() => {
    setSel(null);
    setPromo(null);
  }, [state]);

  const myColor = mySide === 0 ? "w" : "b";
  const flip = mySide === 1;
  const view = (sq) => (flip ? 63 - sq : sq); // 화면 위치
  const targets = sel !== null ? legalMovesFrom(state, sel).map((m) => m.to) : [];
  const checkedKing = !end || end.winner !== null ? (inCheck(state, state.turn) ? state.squares.indexOf(state.turn === "w" ? "K" : "k") : -1) : -1;

  function handle(e) {
    if (!active || promo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
    if (row < 0 || row > 7 || col < 0 || col > 7) return;
    const sq = view(row * 8 + col);
    if (sel !== null && targets.includes(sq)) {
      const m = { from: sel, to: sq };
      if (isPromotionMove(state, m)) {
        setPromo(m);
        return;
      }
      onMove(m);
      return;
    }
    setSel(colorOf(state.squares[sq]) === myColor && legalMovesFrom(state, sq).length ? sq : null);
  }

  const xy = (sq) => {
    const v = view(sq);
    return [(v % 8) * STEP, Math.floor(v / 8) * STEP];
  };

  return (
    <div className={`${styles.boardWrap} ${styles.chessWrap}`}>
      <svg className={`${styles.board} ${active ? "" : styles.boardWait}`} viewBox={`0 0 ${VIEW} ${VIEW}`} onClick={handle} role="img" aria-label="체스판">
        {Array.from({ length: 64 }, (_, v) => {
          const r = Math.floor(v / 8);
          const c = v % 8;
          const sq = view(v);
          const last = state.lastMove && (state.lastMove.from === sq || state.lastMove.to === sq);
          return (
            <rect
              key={v}
              x={c * STEP}
              y={r * STEP}
              width={STEP}
              height={STEP}
              fill={sq === sel ? "#f6d46b" : last ? ((r + c) % 2 ? "#c9b25a" : "#e8dc8a") : (r + c) % 2 ? "#b58863" : "#f0d9b5"}
            />
          );
        })}
        {/* 칸 이름(a~h, 1~8) */}
        {Array.from({ length: 8 }, (_, i) => (
          <g key={`l${i}`} fontSize="11" fontWeight="700" fill="rgba(60,40,20,0.65)">
            <text x={i * STEP + STEP - 9} y={VIEW - 4}>
              {FILES[flip ? 7 - i : i]}
            </text>
            <text x="3" y={i * STEP + 12}>
              {flip ? i + 1 : 8 - i}
            </text>
          </g>
        ))}
        {hint !== null && (
          <rect x={xy(hint)[0] + 3} y={xy(hint)[1] + 3} width={STEP - 6} height={STEP - 6} rx="6" fill="rgba(47,122,42,0.18)" stroke="#2f7a2a" strokeWidth="4" strokeDasharray="8 5" />
        )}
        {checkedKing >= 0 && (
          <circle cx={xy(checkedKing)[0] + STEP / 2} cy={xy(checkedKing)[1] + STEP / 2} r={STEP * 0.47} fill="rgba(206,40,87,0.45)" />
        )}
        {state.squares.split("").map((p, sq) => {
          if (p === ".") return null;
          const [x, y] = xy(sq);
          return <image key={sq} href={PIECE_SRC(p)} x={x + STEP * 0.04} y={y + STEP * 0.04} width={STEP * 0.92} height={STEP * 0.92} />;
        })}
        {targets.map((sq) => {
          const [x, y] = xy(sq);
          const capture = state.squares[sq] !== "." || (state.enPassant === sq && state.squares[sel].toUpperCase() === "P");
          return capture ? (
            <circle key={`t${sq}`} cx={x + STEP / 2} cy={y + STEP / 2} r={STEP * 0.44} fill="none" stroke="rgba(47,122,42,0.75)" strokeWidth="5" />
          ) : (
            <circle key={`t${sq}`} cx={x + STEP / 2} cy={y + STEP / 2} r={STEP * 0.15} fill="rgba(47,122,42,0.6)" />
          );
        })}
      </svg>
      {promo && (
        <div className={styles.promo} role="dialog" aria-label="프로모션 고르기">
          <p>폰이 끝 줄에 닿았어요. 무엇으로 바꿀까요?</p>
          <div>
            {PROMO.map(([k, label]) => (
              <button key={k} type="button" onClick={() => onMove({ ...promo, promotion: k })}>
                <img src={PIECE_SRC(myColor === "w" ? k : k.toLowerCase())} alt="" width="44" height="44" />
                {label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.promoCancel} onClick={() => setPromo(null)}>
            취소
          </button>
        </div>
      )}
    </div>
  );
}

export const chessRules = {
  init: () => newState(),
  turn: (state) => turnOf(state),
  apply: (state, m) => play(state, m),
  info(state, end, mySide) {
    if (end) return null;
    const meToMove = turnOf(state) === mySide;
    if (inCheck(state, state.turn)) return meToMove ? "체크! 킹을 지켜야 해요" : "체크를 걸었어요!";
    return "내 말을 누르면 갈 수 있는 칸이 표시돼요";
  },
  Board: ChessBoard,
  createWorker: () => new Worker(new URL("../../lib/games/chess/worker.js", import.meta.url)),
  loadAi: () => import("@/lib/games/chess/ai"),
  rule: "킹을 잡을 수 없게 몰아넣으면(체크메이트) 이겨요 · 캐슬링·앙파상·프로모션 가능 · 무승부 규칙 적용",
};
