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

/** 월운 목록처럼 요일 없이 짧게 (예: 2월 4일) */
export function shortDateLabel(d) {
  return `${d.month}월 ${d.day}일`;
}

// 시각을 부르는 말 (새벽·아침·오전·오후·저녁·밤)
function timeWord(hour) {
  if (hour < 5) return "새벽";
  if (hour < 9) return "아침";
  if (hour < 12) return "오전";
  if (hour < 18) return "오후";
  if (hour < 21) return "저녁";
  return "밤";
}

const clock = (min) => `${Math.floor(min / 60) % 12 || 12}:${String(min % 60).padStart(2, "0")}`;

/** 시진의 시각 범위를 읽기 쉽게 (예: 오전 9:30~11:30, 밤 11:30~새벽 1:30) */
export function hourRangeLabel(startMin, endMin) {
  const from = timeWord(Math.floor(startMin / 60));
  const to = timeWord(Math.floor(endMin / 60));
  return `${from} ${clock(startMin)}~${from === to ? "" : `${to} `}${clock(endMin)}`;
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
