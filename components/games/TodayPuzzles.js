"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./games.module.css";
import { OmokIcon, JanggiIcon, ChessIcon } from "./GameIcons";
import { PUZZLE_GAMES, PUZZLE_ORDER, LEVELS, todayKey, levelOf, dateLabel, loadSolved } from "@/lib/games/daily";

const ICON = { omok: OmokIcon, janggi: JanggiIcon, chess: ChessIcon };
const TINT = { omok: "#f6ead3", janggi: "#fbf1e3", chess: "#f2e6d4" };
const SHORT = { omok: "4로 몰아 5목", janggi: "장군으로 외통", chess: "체크메이트" };

/**
 * 오늘의 문제 바로가기. 날짜·난이도·푼 여부는 방문자 기기에서 계산해요(한국 시간 기준).
 *  - 기본: 날짜·난이도·푼 개수를 위에 한 번 보여 주고, 세 게임을 타일로 나란히
 *  - only: 한 게임만 가로 띠로(게임 페이지 아래 안내)
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
  const chip = level && <span className={`${styles.lv} ${styles[`lv_${level.tone}`]}`}>{level.label}</span>;

  if (only) {
    const g = PUZZLE_GAMES[only];
    const done = solved[only];
    return (
      <Link href={g.path} className={`${styles.pzBanner} ${done ? styles.pzBannerDone : ""}`}>
        <span className={styles.pzTileIcon} style={{ background: TINT[only] }}>
          {ICON[only]}
          {done && <i className={styles.pzCheck}>✓</i>}
        </span>
        <span className={styles.pzBannerText}>
          <small>매일 바뀌는 묘수풀이</small>
          <b>오늘의 {g.name} 문제</b>
          <span>
            {today ? dateLabel(today) : " "}
            {chip}
          </span>
        </span>
        <span className={styles.pzGo}>{done ? "✓ 풀었어요" : "풀러 가기"}</span>
      </Link>
    );
  }

  const count = PUZZLE_ORDER.filter((k) => solved[k]).length;
  return (
    <section className={styles.pzPanel} aria-label="오늘의 문제">
      <div className={styles.pzPanelHead}>
        <div>
          <p className={styles.pzPanelDate}>
            {today ? dateLabel(today) : " "}
            {chip}
          </p>
          <p className={styles.pzPanelSub}>{count === 3 ? "오늘 문제를 모두 풀었어요! 🎉" : `3문제 중 ${count}개 풀었어요`}</p>
        </div>
        <span className={styles.pzDots} aria-hidden="true">
          {PUZZLE_ORDER.map((k) => (
            <i key={k} className={solved[k] ? styles.pzDotOn : ""} />
          ))}
        </span>
      </div>
      <ul className={styles.pzTiles}>
        {PUZZLE_ORDER.map((k) => {
          const g = PUZZLE_GAMES[k];
          const done = solved[k];
          return (
            <li key={k}>
              <Link href={g.path} className={`${styles.pzTile} ${done ? styles.pzTileDone : ""}`}>
                <span className={styles.pzTileIcon} style={{ background: TINT[k] }}>
                  {ICON[k]}
                  {done && <i className={styles.pzCheck}>✓</i>}
                </span>
                <b>{g.name}</b>
                <small>{SHORT[k]}</small>
                <span className={styles.pzGo}>{done ? "✓ 풀었어요" : "풀러 가기"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
