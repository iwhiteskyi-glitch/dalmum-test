"use client";

import styles from "./games.module.css";
import { SIZE, rowOf, colOf } from "@/lib/games/omok/rules";

const VIEW = 600;
const MARGIN = 26;
const STEP = (VIEW - MARGIN * 2) / (SIZE - 1);
const STARS = [
  [3, 3],
  [3, 11],
  [7, 7],
  [11, 3],
  [11, 11],
];
const pos = (i) => MARGIN + i * STEP;

/**
 * 나무 바둑판(15×15). 누르면 가장 가까운 교차점의 칸 번호로 onTap을 불러요.
 *  ghost: 놓을 자리 미리보기(한 번 누르면 표시, 같은 자리를 한 번 더 누르면 둠)
 *  ghostColor: 1 흑 / 2 백 · lastCell: 마지막 수 표시 · winLine: 이긴 줄 강조
 *  blocked: 방금 둘 수 없다고 알려 준 자리(쌍삼)
 *  area: 힌트로 살짝 칠해 줄 칸들(오늘의 문제에서 "이 근처에 답이 있어요")
 */
export default function OmokBoard({ moves, ghost, ghostColor, lastCell, winLine, blocked, disabled, onTap, area = null }) {
  function handle(e) {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VIEW;
    const y = ((e.clientY - rect.top) / rect.height) * VIEW;
    const col = Math.round((x - MARGIN) / STEP);
    const row = Math.round((y - MARGIN) / STEP);
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;
    onTap(row * SIZE + col);
  }

  const win = new Set(winLine || []);
  const r = STEP * 0.45;

  return (
    <div className={styles.boardWrap}>
      <svg
        className={`${styles.board} ${disabled ? styles.boardWait : ""}`}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        onClick={handle}
        role="img"
        aria-label={`오목판, 지금까지 ${moves.length}수`}
      >
        <defs>
          <linearGradient id="omok-wood" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ebc988" />
            <stop offset="1" stopColor="#d2a259" />
          </linearGradient>
          <radialGradient id="omok-black" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#5a5a5a" />
            <stop offset="1" stopColor="#0f0f0f" />
          </radialGradient>
          <radialGradient id="omok-white" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#d9d6d0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={VIEW} height={VIEW} rx="18" fill="url(#omok-wood)" />
        {Array.from({ length: SIZE }, (_, i) => (
          <g key={i} stroke="#6b4a1f" strokeWidth={i === 0 || i === SIZE - 1 ? 2 : 1.1}>
            <line x1={MARGIN} y1={pos(i)} x2={VIEW - MARGIN} y2={pos(i)} />
            <line x1={pos(i)} y1={MARGIN} x2={pos(i)} y2={VIEW - MARGIN} />
          </g>
        ))}
        {STARS.map(([row, col]) => (
          <circle key={`${row}-${col}`} cx={pos(col)} cy={pos(row)} r="4.5" fill="#6b4a1f" />
        ))}

        {area &&
          area.map((cell) => (
            <rect key={`a${cell}`} x={pos(colOf(cell)) - STEP / 2} y={pos(rowOf(cell)) - STEP / 2} width={STEP} height={STEP} fill="rgba(47,122,42,0.22)" />
          ))}
        {moves.map((cell, i) => {
          const black = i % 2 === 0;
          const cx = pos(colOf(cell));
          const cy = pos(rowOf(cell));
          return (
            <g key={cell}>
              <circle cx={cx + 1.2} cy={cy + 2} r={r} fill="rgba(60,35,10,0.35)" />
              <circle cx={cx} cy={cy} r={r} fill={black ? "url(#omok-black)" : "url(#omok-white)"} />
              {win.has(cell) && <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#ce2857" strokeWidth="3.5" />}
              {cell === lastCell && !win.size && <circle cx={cx} cy={cy} r={STEP * 0.12} fill="#ce2857" />}
            </g>
          );
        })}

        {ghost != null && (
          <g className={styles.ghost}>
            <circle
              cx={pos(colOf(ghost))}
              cy={pos(rowOf(ghost))}
              r={r}
              fill={ghostColor === 1 ? "rgba(20,20,20,0.45)" : "rgba(255,255,255,0.75)"}
              stroke="#2f7a2a"
              strokeWidth="2.5"
              strokeDasharray="5 4"
            />
          </g>
        )}
        {blocked != null && (
          <g stroke="#c0392b" strokeWidth="4" strokeLinecap="round">
            <line x1={pos(colOf(blocked)) - 9} y1={pos(rowOf(blocked)) - 9} x2={pos(colOf(blocked)) + 9} y2={pos(rowOf(blocked)) + 9} />
            <line x1={pos(colOf(blocked)) + 9} y1={pos(rowOf(blocked)) - 9} x2={pos(colOf(blocked)) - 9} y2={pos(rowOf(blocked)) + 9} />
          </g>
        )}
      </svg>
    </div>
  );
}
