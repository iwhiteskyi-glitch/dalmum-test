"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./games.module.css";
import { PUZZLE_GAMES, PUZZLE_ORDER, LEVELS, todayKey, levelOf, dateLabel, loadSolved } from "@/lib/games/daily";

/**
 * 오늘의 문제 바로가기. 날짜·난이도·푼 여부는 방문자 기기에서 계산해요(한국 시간 기준).
 * only: 한 게임만 보여 줄 때(게임 페이지 아래 안내 카드)
 */
export default function TodayPuzzles({ only = null }) {
  const [today, setToday] = useState(null);
  const [solved, setSolved] = useState({});
  useEffect(() => {
    const t = todayKey();
    setToday(t);
    setSolved(Object.fromEntries(PUZZLE_ORDER.map((k) => [k, Boolean(loadSolved(k)[t])])));
  }, []);
  const level = today ? LEVELS[levelOf(today)] : null;
  const keys = only ? [only] : PUZZLE_ORDER;

  return (
    <ul className={styles.gameList}>
      {keys.map((k) => {
        const g = PUZZLE_GAMES[k];
        return (
          <li key={k}>
            <Link href={g.path} className={`${styles.gameItem} ${styles.pzCard}`}>
              <span className={styles.pzCardIcon} aria-hidden="true">
                {solved[k] ? "✓" : "?"}
              </span>
              <div>
                <h2>오늘의 {g.name} 문제</h2>
                <p>
                  {today ? dateLabel(today) : " "}
                  {level && <span className={`${styles.lv} ${styles[`lv_${level.tone}`]}`}>{level.label}</span>}
                </p>
                <p className={styles.gameProg}>{solved[k] ? "오늘 문제를 풀었어요!" : k === "omok" ? "4를 연달아 만들어 이기기" : k === "janggi" ? "장군을 불러 외통 만들기" : "몇 수 안에 체크메이트"}</p>
              </div>
              <span className={styles.gameGo} aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
