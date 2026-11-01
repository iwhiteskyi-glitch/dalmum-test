"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./fortune.module.css";
import { koreaToday, BRANCHES } from "@/lib/fortune/saju";
import { buildTti, sameDate } from "@/lib/fortune/ttiView";
import { Stars, dateLabel } from "./parts";

/** 열두 띠의 오늘 한 줄 요약. 날짜가 바뀌었으면 브라우저에서 다시 계산해요. */
export default function TtiGrid({ initialDate, current }) {
  const [date, setDate] = useState(initialDate);
  useEffect(() => {
    const t = koreaToday();
    if (!sameDate(t, initialDate)) setDate(t);
  }, [initialDate]);

  return (
    <>
      {current == null && (
        <p className={styles.todayStrip}>
          {date.year}년 {dateLabel(date)}의 띠별 운세
        </p>
      )}
      <ul className={styles.ttiGrid}>
        {BRANCHES.map((_, b) => {
          const d = buildTti(b, date);
          return (
            <li key={b}>
              <Link
                href={`/fortune/tti/${d.info.slug}`}
                className={styles.ttiCard}
                aria-current={b === current ? "page" : undefined}
              >
                <span className={`${styles.ttiBadge} ${styles[`el${d.info.element}`]}`} aria-hidden="true">
                  {d.info.hanja}
                </span>
                <span className={styles.ttiCardBody}>
                  <strong>{d.info.name}</strong>
                  <span className={styles.ttiCardTitle}>{d.god.title}</span>
                  <Stars n={d.overall} label={`${d.info.name} 총운`} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
