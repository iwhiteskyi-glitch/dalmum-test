"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./games.module.css";
import { needleAngle, nudgeOf, SPIN_HOLD_MS, SPIN_TURN_MS, SPIN_WAIT_MS } from "@/lib/games/opening";

// 첫 판 선공 룰렛(비행기오락실 앱과 같아요): 사람 수만큼 나눈 원판 위에서 침이 돌다가 먼저 할 사람 칸에 멈춰요.
// 칸은 자리 순서로 고정이고 침은 맨 위에서 출발해요. 도는 동안은 화면을 덮어서 판을 누를 수 없어요.
// 시간과 각도는 lib/games/opening.js — 규칙 쪽도 이 시간만큼 컴퓨터의 첫 수를 미뤄요.

export const PLAYER_COLORS = ["#3d8b37", "#e0803a", "#4a7fd0", "#b357b8"];
const SIZE = 260;
const C = SIZE / 2;
const R = C - 8;

const pointAt = (deg, radius) => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + radius * Math.sin(rad), y: C - radius * Math.cos(rad) };
};
const slicePath = (i, count) => {
  if (count === 1) return `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z`;
  const size = 360 / count;
  const a = pointAt(i * size, R);
  const b = pointAt((i + 1) * size, R);
  return `M ${C} ${C} L ${a.x} ${a.y} A ${R} ${R} 0 ${size > 180 ? 1 : 0} 1 ${b.x} ${b.y} Z`;
};

/** 룰렛을 돌릴 때인지. wanted는 "아직 아무도 안 움직인 첫 판"이면 true, 첫 수가 나오면 false */
export function useFirstSpin(wanted) {
  const [done, setDone] = useState(false);
  if (done && !wanted) setDone(false);
  return { spinning: wanted && !done, finishSpin: () => setDone(true) };
}

/** people: [{ id, name }] 자리 순서 · first: 먼저 할 사람 id · seed: 침이 칸 안 어디에 멈출지 정하는 글자 */
export default function FirstPicker({ people, first, seed, onDone }) {
  const count = people.length;
  const target = Math.max(0, people.findIndex((p) => p.id === first));
  const [angle] = useState(() => needleAngle(count, target, nudgeOf(String(seed))));
  const [turned, setTurned] = useState(false);
  const [stopped, setStopped] = useState(false);
  const finish = useRef(onDone);
  finish.current = onDone;

  useEffect(() => {
    const go = setTimeout(() => setTurned(true), SPIN_WAIT_MS);
    const stop = setTimeout(() => setStopped(true), SPIN_WAIT_MS + SPIN_TURN_MS);
    const done = setTimeout(() => finish.current(), SPIN_WAIT_MS + SPIN_TURN_MS + SPIN_HOLD_MS);
    return () => {
      clearTimeout(go);
      clearTimeout(stop);
      clearTimeout(done);
    };
  }, []);

  return (
    <div className={styles.fpCover} role="dialog" aria-modal="true" aria-label="먼저 할 사람 뽑기">
      <p className={styles.fpTitle} role="status">
        {stopped ? `${people[target].name} 먼저!` : "누가 먼저 할까요?"}
      </p>
      <div className={styles.fpWheel}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle cx={C} cy={C} r={R + 7} fill="#2c3e2a" />
          {people.map((p, i) => (
            <path key={p.id} d={slicePath(i, count)} fill={PLAYER_COLORS[i % PLAYER_COLORS.length]} stroke="#fff" strokeWidth="3" opacity={stopped && i !== target ? 0.25 : 1} />
          ))}
          {Array.from({ length: 20 }, (_, i) => {
            const b = pointAt(i * 18, R + 1);
            return <circle key={i} cx={b.x} cy={b.y} r="3.2" fill={i % 2 ? "#fff3c4" : "#ffd54f"} />;
          })}
          {people.map((p, i) => {
            const spot = pointAt(((i + 0.5) * 360) / count, R * 0.6);
            return (
              <text key={p.id} x={spot.x} y={spot.y + 6} textAnchor="middle" fontSize="17" fontWeight="900" fill="#fff" opacity={stopped && i !== target ? 0.5 : 1}>
                {p.name}
              </text>
            );
          })}
        </svg>
        <svg
          className={styles.fpNeedle}
          style={{ transform: `rotate(${turned ? angle : 0}deg)`, transitionDuration: `${SPIN_TURN_MS}ms` }}
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden="true"
        >
          <polygon points={`${C},${C - R + 18} ${C - 11},${C} ${C + 11},${C}`} fill="#fffdf7" stroke="#2c3e2a" strokeWidth="3" />
          <circle cx={C} cy={C} r="18" fill="#ffd54f" stroke="#2c3e2a" strokeWidth="3" />
        </svg>
      </div>
    </div>
  );
}
