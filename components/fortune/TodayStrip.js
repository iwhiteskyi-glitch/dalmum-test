"use client";

import { useEffect, useState } from "react";
import styles from "./fortune.module.css";
import { koreaToday, dayPillar } from "@/lib/fortune/saju";

// 페이지는 미리 만들어 두는 정적 페이지라서, "오늘"의 일진은 방문한 순간 브라우저에서 계산합니다.
export default function TodayStrip() {
  const [label, setLabel] = useState(null);
  useEffect(() => {
    const t = koreaToday();
    const p = dayPillar(t.year, t.month, t.day);
    setLabel(`${t.month}월 ${t.day}일 오늘의 일진 · ${p.ko}(${p.hanja})일`);
  }, []);
  return <p className={styles.todayStrip}>{label || "오늘의 일진을 계산하고 있어요"}</p>;
}
