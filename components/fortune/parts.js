// 운세 코너 화면들이 함께 쓰는 작은 조각들
import styles from "./fortune.module.css";
import t from "./today.module.css";
import { ELEMENTS, ELEMENTS_HANJA, STEMS, STEMS_HANJA, STEM_ELEMENT, TEN_GODS } from "@/lib/fortune/saju";
import { hasBatchim } from "@/lib/korean";

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

// 십신 다섯 묶음(비겁·식상·재성·관성·인성)을 처음 보는 사람도 알 수 있게 부르는 말
export const GOD_PLAIN = ["나와 같은 기운", "내가 낳는 기운", "내가 다스리는 기운", "나를 다스리는 기운", "나를 낳는 기운"];

// 천간을 "정화(丁火)"처럼 읽기 쉽게
export const stemLabel = (s) => `${STEMS[s]}${ELEMENTS[STEM_ELEMENT[s]]}(${STEMS_HANJA[s]}${ELEMENTS_HANJA[STEM_ELEMENT[s]]})`;

/**
 * 결과 판 맨 위의 "나 + 오늘 = 관계" 한 줄. 점수와 풀이가 무엇을 견줘서 나오는지 먼저 보여 줘요.
 * when: "오늘"·"2027년"처럼 견주는 때, unit: "날"·"해"
 */
export function Matchup({ dayMaster, otherStem, when, unit, god }) {
  return (
    <div className={t.match}>
      <div className={t.matchRow}>
        <span className={t.matchChip}>
          <small>태어난 날의 나</small>
          {stemLabel(dayMaster)}
        </span>
        <span className={t.matchOp} aria-hidden="true">
          +
        </span>
        <span className={t.matchChip}>
          <small>{when}의 기운</small>
          {stemLabel(otherStem)}
        </span>
      </div>
      <p className={t.matchResult}>
        {when}의 기운은 <b>{GOD_PLAIN[Math.floor(god / 2)]}</b>이라서 <b>{TEN_GODS[god]}</b>의 {unit}
        {hasBatchim(unit) ? "이에요" : "예요"}. 점수와
        풀이는 이 관계로 정해져요.
      </p>
    </div>
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
