"use client";

import styles from "./games.module.css";
import { SIZE, newState, legalMoves, play, count } from "@/lib/games/othello/rules";

const VIEW = 400;
const PAD = 14;
const STEP = (VIEW - PAD * 2) / SIZE;

/** 오델로 판: 둘 수 있는 칸에 작은 점을 보여 주고, 한 번 누르면 바로 둬요(칸이 커서 잘못 누를 일이 적어요). */
function OthelloBoard({ state, mySide, active, onMove }) {
  const hints = active ? legalMoves(state.cells, mySide) : [];
  const flipped = new Set(state.flipped || []);
  function handle(e) {
    if (!active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VIEW - PAD;
    const y = ((e.clientY - rect.top) / rect.height) * VIEW - PAD;
    const col = Math.floor(x / STEP);
    const row = Math.floor(y / STEP);
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;
    const idx = row * SIZE + col;
    if (hints.includes(idx)) onMove(idx);
  }
  const center = (i) => [PAD + (i % SIZE) * STEP + STEP / 2, PAD + Math.floor(i / SIZE) * STEP + STEP / 2];
  return (
    <div className={styles.boardWrap}>
      <svg
        className={`${styles.board} ${styles.boardOthello} ${active ? "" : styles.boardWait}`}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        onClick={handle}
        role="img"
        aria-label="오델로 판"
      >
        <defs>
          <radialGradient id="oth-black" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#555" />
            <stop offset="1" stopColor="#111" />
          </radialGradient>
          <radialGradient id="oth-white" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#dcd9d2" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={VIEW} height={VIEW} rx="16" fill="#1f6b3f" />
        <rect x={PAD} y={PAD} width={VIEW - PAD * 2} height={VIEW - PAD * 2} fill="#2f8a52" />
        {Array.from({ length: SIZE + 1 }, (_, i) => (
          <g key={i} stroke="#1b5a35" strokeWidth="1.6">
            <line x1={PAD} y1={PAD + i * STEP} x2={VIEW - PAD} y2={PAD + i * STEP} />
            <line x1={PAD + i * STEP} y1={PAD} x2={PAD + i * STEP} y2={VIEW - PAD} />
          </g>
        ))}
        {[
          [2, 2],
          [2, 6],
          [6, 2],
          [6, 6],
        ].map(([r, c]) => (
          <circle key={`${r}${c}`} cx={PAD + c * STEP} cy={PAD + r * STEP} r="3.5" fill="#1b5a35" />
        ))}
        {state.cells.map((v, i) => {
          if (!v) return null;
          const [cx, cy] = center(i);
          return (
            <g key={i} className={flipped.has(i) || i === state.last ? styles.flip : undefined}>
              <circle cx={cx + 1} cy={cy + 2} r={STEP * 0.4} fill="rgba(0,0,0,0.3)" />
              <circle cx={cx} cy={cy} r={STEP * 0.4} fill={v === 1 ? "url(#oth-black)" : "url(#oth-white)"} />
              {i === state.last && <circle cx={cx} cy={cy} r={STEP * 0.09} fill="#ce2857" />}
            </g>
          );
        })}
        {hints.map((i) => {
          const [cx, cy] = center(i);
          return <circle key={`h${i}`} cx={cx} cy={cy} r={STEP * 0.13} fill={mySide === 0 ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.6)"} />;
        })}
      </svg>
    </div>
  );
}

export const othelloRules = {
  init: () => newState(),
  turn: (state) => state.turn,
  apply(state, idx) {
    const r = play(state, idx);
    if (!r) return null;
    if (!r.end) return { state: r.state, end: null };
    const { black, white } = r.end;
    return { state: r.state, end: { winner: r.end.winner, reason: `흑 ${black} : 백 ${white}` } };
  },
  info(state, end, mySide) {
    const { black, white } = count(state.cells);
    const score = `흑 ${black} : 백 ${white}`;
    if (end) return score;
    if (state.passed !== null && state.passed !== undefined) {
      const who = state.passed === mySide ? "내가" : "컴퓨터가";
      return `${who} 둘 곳이 없어 한 번 쉬었어요 · ${score}`;
    }
    return `${score} · 점이 찍힌 칸에 둘 수 있어요`;
  },
  Board: OthelloBoard,
  createWorker: () => new Worker(new URL("../../lib/games/othello/worker.js", import.meta.url)),
  loadAi: () => import("@/lib/games/othello/ai"),
  rule: "상대 돌을 내 돌 사이에 끼우면 뒤집혀요 · 둘 곳이 없으면 한 번 쉬고, 판이 끝나면 돌이 많은 쪽이 이겨요",
};
