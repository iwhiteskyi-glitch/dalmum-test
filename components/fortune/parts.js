// 운세 코너 화면들이 함께 쓰는 작은 조각들
import styles from "./fortune.module.css";
import { ELEMENTS } from "@/lib/fortune/saju";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function range(a, b) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export function dateLabel(d) {
  const w = new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
  return `${d.month}월 ${d.day}일 (${WEEKDAYS[w]})`;
}

/** 입력한 생년월일을 한 줄로 (예: 양력 1990년 5월 15일 14시 30분) */
export function birthLabel(saju) {
  const b = saju.input;
  const s = saju.solar;
  const date =
    b.calendar === "lunar"
      ? `음력 ${b.year}년 ${b.leap ? "윤" : ""}${b.month}월 ${b.day}일(양력 ${s.year}.${s.month}.${s.day})`
      : `양력 ${s.year}년 ${s.month}월 ${s.day}일`;
  return `${date}${b.hour != null ? ` ${b.hour}시 ${b.minute}분` : " · 시간 모름"}`;
}

export function Stars({ n, label }) {
  return (
    <span className={styles.stars} role="img" aria-label={`${label} 별 5개 중 ${n}개`}>
      {"★".repeat(n)}
      <span className={styles.starsOff}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function Char({ hanja, ko, element }) {
  return (
    <span className={`${styles.char} ${styles[`el${element}`]}`}>
      <span className={styles.charHanja}>{hanja}</span>
      <span className={styles.charKo}>
        {ko} · {ELEMENTS[element]}
      </span>
    </span>
  );
}
