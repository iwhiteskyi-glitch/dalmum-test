"use client";

import { useEffect, useState } from "react";
import styles from "./games.module.css";
import {
  COLS,
  ROWS,
  SETUPS,
  SETUP_NAMES,
  MOVE_LIMIT,
  newState,
  play,
  legalTargets,
  sideOfPiece,
  checked,
  canPass,
  turnOf,
} from "@/lib/games/janggi/rules";

const STEP = 52;
const MARGIN = 34;
const W = MARGIN * 2 + STEP * (COLS - 1);
const H = MARGIN * 2 + STEP * (ROWS - 1);
// 말 글자와 크기(궁이 가장 크고, 사·졸이 가장 작아요)
const LABEL = { K: ["楚", "漢"], A: ["士", "士"], E: ["象", "象"], H: ["馬", "馬"], R: ["車", "車"], C: ["包", "包"], P: ["卒", "兵"] };
const SIZE = { K: 0.5, R: 0.43, C: 0.43, H: 0.43, E: 0.43, A: 0.36, P: 0.36 };
const COLOR = ["#0f6b57", "#b3261e"]; // 초 초록, 한 빨강

function octagon(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** 장기판: 내 말을 누르면 갈 수 있는 곳이 보이고, 그곳을 누르면 움직여요. 한으로 둘 때는 판을 뒤집어 내 쪽이 아래예요. */
function JanggiBoard({ state, mySide, active, onMove }) {
  const [sel, setSel] = useState(null);
  useEffect(() => setSel(null), [state]);
  const flip = mySide === 1;
  const view = (p) => (flip ? ROWS * COLS - 1 - p : p);
  const pos = (p) => {
    const v = view(p);
    return [MARGIN + (v % COLS) * STEP, MARGIN + Math.floor(v / COLS) * STEP];
  };
  const targets = sel !== null ? legalTargets(state, sel) : [];

  function handle(e) {
    if (!active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const col = Math.round((x - MARGIN) / STEP);
    const row = Math.round((y - MARGIN) / STEP);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    const p = view(row * COLS + col);
    if (sel !== null && targets.includes(p)) {
      onMove({ from: sel, to: p });
      return;
    }
    setSel(sideOfPiece(state.squares[p]) === mySide && legalTargets(state, p).length ? p : null);
  }

  const line = (r1, c1, r2, c2, key) => {
    const [x1, y1] = [MARGIN + c1 * STEP, MARGIN + r1 * STEP];
    const [x2, y2] = [MARGIN + c2 * STEP, MARGIN + r2 * STEP];
    return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} />;
  };

  return (
    <div className={`${styles.boardWrap} ${styles.janggiWrap}`}>
      <svg className={`${styles.board} ${active ? "" : styles.boardWait}`} viewBox={`0 0 ${W} ${H}`} onClick={handle} role="img" aria-label="장기판">
        <rect x="0" y="0" width={W} height={H} rx="16" fill="#e4bf7d" />
        <g stroke="#6b4a1f" strokeWidth="1.4">
          {Array.from({ length: ROWS }, (_, r) => line(r, 0, r, COLS - 1, `r${r}`))}
          {Array.from({ length: COLS }, (_, c) => line(0, c, ROWS - 1, c, `c${c}`))}
          {/* 궁성 대각선 */}
          {line(0, 3, 2, 5, "p1")}
          {line(0, 5, 2, 3, "p2")}
          {line(7, 3, 9, 5, "p3")}
          {line(7, 5, 9, 3, "p4")}
        </g>
        {state.lastMove &&
          [state.lastMove.from, state.lastMove.to].map((p, i) => {
            const [x, y] = pos(p);
            return <circle key={`lm${i}`} cx={x} cy={y} r={STEP * 0.5} fill="rgba(206,40,87,0.18)" />;
          })}
        {state.squares.split("").map((ch, p) => {
          if (ch === ".") return null;
          const side = sideOfPiece(ch);
          const t = ch.toUpperCase();
          const [x, y] = pos(p);
          const r = STEP * SIZE[t];
          const isSel = p === sel;
          return (
            <g key={p}>
              <polygon points={octagon(x + 1.5, y + 2.5, r)} fill="rgba(60,35,10,0.35)" />
              <polygon points={octagon(x, y, r)} fill={isSel ? "#fff6d6" : "#fbf4e6"} stroke={isSel ? "#2f7a2a" : COLOR[side]} strokeWidth={isSel ? 3.5 : 2.2} />
              <text
                x={x}
                y={y + r * 0.36}
                textAnchor="middle"
                fontSize={r * 1.05}
                fontWeight="700"
                fill={COLOR[side]}
                fontFamily='"Noto Serif KR", "Batang", "AppleMyungjo", serif'
              >
                {LABEL[t][side]}
              </text>
            </g>
          );
        })}
        {targets.map((p) => {
          const [x, y] = pos(p);
          return state.squares[p] !== "." ? (
            <circle key={`t${p}`} cx={x} cy={y} r={STEP * 0.47} fill="none" stroke="rgba(47,122,42,0.8)" strokeWidth="4" />
          ) : (
            <circle key={`t${p}`} cx={x} cy={y} r={STEP * 0.14} fill="rgba(47,122,42,0.7)" />
          );
        })}
      </svg>
    </div>
  );
}

/** 대국 전에 고르는 내 상차림(마·상 배치) */
function SetupPicker({ value, onChange }) {
  return (
    <div className={styles.setup}>
      <p className={styles.setupTitle}>내 상차림 고르기</p>
      <div className={styles.setupRow} role="radiogroup" aria-label="상차림">
        {SETUPS.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={value === s} className={`${styles.setupBtn} ${value === s ? styles.setupOn : ""}`} onClick={() => onChange(s)}>
            {SETUP_NAMES[s]}
          </button>
        ))}
      </div>
      <p className={styles.setupNote}>내 쪽에서 봤을 때 왼쪽부터 마·상 순서예요. 컴퓨터는 상차림을 무작위로 골라요.</p>
    </div>
  );
}

/** 한수쉼 버튼(장군 중에는 못 해요) */
function PassButton({ state, active, onMove }) {
  return (
    <button type="button" className={styles.btn} disabled={!active || !canPass(state)} onClick={() => onMove({ pass: true })}>
      한수쉼
    </button>
  );
}

export const janggiRules = {
  defaultChoice: "HEEH",
  init(mySide, choice) {
    const mine = SETUPS.includes(choice) ? choice : "HEEH";
    const cpu = SETUPS[Math.floor(Math.random() * SETUPS.length)];
    return mySide === 0 ? newState(mine, cpu) : newState(cpu, mine);
  },
  turn: (state) => turnOf(state),
  apply: (state, m) => play(state, m),
  info(state, end, mySide) {
    if (end) return null;
    const meToMove = turnOf(state) === mySide;
    if (checked(state)) return meToMove ? "장군! 궁을 지켜야 해요" : "장군을 불렀어요!";
    if (state.lastPassed) return `${meToMove ? "컴퓨터가" : "내가"} 한수쉼을 했어요 · ${state.ply} / ${MOVE_LIMIT}수`;
    return `내 말을 누르면 갈 수 있는 곳이 보여요 · ${state.ply} / ${MOVE_LIMIT}수`;
  },
  Board: JanggiBoard,
  Setup: SetupPicker,
  Extra: PassButton,
  createWorker: () => new Worker(new URL("../../lib/games/janggi/worker.js", import.meta.url)),
  loadAi: () => import("@/lib/games/janggi/ai"),
  rule: `외통으로 이기고, 빅장·연속 한수쉼은 무승부 · ${MOVE_LIMIT}수가 지나면 점수(차13·포7·마5·상3·사3·졸2, 한 덤 1.5)로 판정`,
};
