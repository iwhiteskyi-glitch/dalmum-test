/**
 * 사주 팔자 계산 — 모두 브라우저 안에서 계산하고 어디에도 저장하지 않습니다.
 *
 * 계산 기준 (읽을거리·FAQ 설명과 맞춰 두었어요. 바꾸면 그쪽 글도 함께 고칠 것)
 *  - 해(연주)는 입춘, 달(월주)은 12절(소한·입춘·경칩 …)이 시작되는 "정확한 시각"에 바뀝니다.
 *  - 음력 생일은 한국천문연구원 기준 음력(korean-lunar-calendar)으로 양력으로 바꿔 계산합니다.
 *  - 태어난 시간은 그 시절 한국의 표준시·서머타임을 반영해 실제 시각으로 바꾼 뒤,
 *    동경 127.5도 기준 "지역 시간"으로 보정합니다(지금의 한국 표준시라면 30분 늦춤).
 *  - 자시(보정 시간 23:00~00:59)가 시작되면 날(일주)도 다음 날로 넘어갑니다.
 *  - 시간을 모르면 시주 없이 6글자만 계산하고, 절기가 바뀌는 날이면 그 사실을 알려 줍니다.
 */
import KoreanLunarCalendar from "korean-lunar-calendar";
import { JEOLGI, JEOLGI_EPOCH_MS, JEOLGI_START_YEAR, JEOLGI_END_YEAR } from "./data/jeolgi.js";

export const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
export const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
export const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

// 오행: 0 목(나무) · 1 화(불) · 2 토(흙) · 3 금(쇠) · 4 수(물)
export const ELEMENTS = ["목", "화", "토", "금", "수"];
export const ELEMENTS_HANJA = ["木", "火", "土", "金", "水"];
export const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
export const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];

// 계산할 수 있는 생년 범위 (음력 변환표가 2050년까지라 여기에 맞춤)
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2050;

const MINUTE = 60000;
const DAY = 86400000;
// 동경 127.5도의 지역 시간 = UTC + 8시간 30분
const LOCAL_SOLAR_OFFSET_MIN = 510;

/**
 * 한국의 과거 표준시·서머타임(IANA 시간대 데이터베이스 Asia/Seoul 기준).
 * [이 시각(UTC)부터, UTC와의 차이(분)]
 */
const KOREA_OFFSETS = [
  ["1900-01-01T00:00Z", 508], // 서울 지역 평균시 (+8:27:52, 분 단위로 반올림)
  ["1908-03-31T15:32Z", 510], // 지역 평균시 1908-04-01 00:00 = 15:32:08 UTC
  ["1911-12-31T15:30Z", 540],
  ["1948-05-31T15:00Z", 600], // 서머타임
  ["1948-09-12T14:00Z", 540],
  ["1949-04-02T15:00Z", 600],
  ["1949-09-10T14:00Z", 540],
  ["1950-03-31T15:00Z", 600],
  ["1950-09-09T14:00Z", 540],
  ["1951-05-05T15:00Z", 600],
  ["1951-09-08T14:00Z", 540],
  ["1954-03-20T15:00Z", 510], // 표준시 +8:30
  ["1955-05-04T15:30Z", 570],
  ["1955-09-08T14:30Z", 510],
  ["1956-05-19T15:30Z", 570],
  ["1956-09-29T14:30Z", 510],
  ["1957-05-04T15:30Z", 570],
  ["1957-09-21T14:30Z", 510],
  ["1958-05-03T15:30Z", 570],
  ["1958-09-20T14:30Z", 510],
  ["1959-05-02T15:30Z", 570],
  ["1959-09-19T14:30Z", 510],
  ["1960-04-30T15:30Z", 570],
  ["1960-09-17T14:30Z", 510],
  ["1961-08-09T15:30Z", 540], // 지금의 표준시 +9:00
  ["1987-05-09T17:00Z", 600],
  ["1987-10-10T17:00Z", 540],
  ["1988-05-07T17:00Z", 600],
  ["1988-10-08T17:00Z", 540],
].map(([iso, off]) => [Date.parse(iso), off]);

/** 그 순간(UTC 밀리초) 한국 시계가 UTC보다 몇 분 빨랐는지 */
export function koreaOffsetMinutes(utcMs) {
  let off = KOREA_OFFSETS[0][1];
  for (const [from, o] of KOREA_OFFSETS) {
    if (utcMs >= from) off = o;
    else break;
  }
  return off;
}

const ALL_OFFSETS = [...new Set(KOREA_OFFSETS.map(([, o]) => o))].sort((a, b) => b - a);

/**
 * 한국 시계로 본 날짜·시각 → { utc: UTC 밀리초, kind }.
 *  kind "normal"    : 보통
 *  kind "repeated"  : 서머타임이 끝나는 등 시계를 뒤로 돌려 같은 시각이 두 번 있었던 1시간 → 앞쪽(서머타임) 시각으로 봄
 *  kind "skipped"   : 서머타임 시작 등으로 시계가 건너뛰어 없던 시각 → 바뀌기 전 시간으로 봄
 */
export function resolveKoreaLocal(y, m, d, h, mi) {
  const asUtc = Date.UTC(y, m - 1, d, h, mi);
  // 시계 차이가 큰(이른) 쪽부터 확인하므로, 두 번 있었던 시각이면 앞쪽이 먼저 맞습니다.
  const fits = ALL_OFFSETS.filter((o) => koreaOffsetMinutes(asUtc - o * MINUTE) === o);
  if (fits.length) return { utc: asUtc - fits[0] * MINUTE, kind: fits.length > 1 ? "repeated" : "normal" };
  // 없던 시각: 시계를 바꾸기 직전 기준(한 시간 전 시점의 시계 차이)으로 계산
  const before = koreaOffsetMinutes(asUtc - Math.max(...ALL_OFFSETS) * MINUTE - 60 * MINUTE);
  return { utc: asUtc - before * MINUTE, kind: "skipped" };
}

/** 한국 시계로 본 날짜·시각 → UTC 밀리초 */
export function koreaLocalToUtc(y, m, d, h, mi) {
  return resolveKoreaLocal(y, m, d, h, mi).utc;
}

let jeolgiCache = null;
/** 절기 시각(UTC 밀리초) 배열. 해마다 12개, 소한부터. */
function jeolgiTimes() {
  if (!jeolgiCache) {
    jeolgiCache = JEOLGI.split(",").map((s) => JEOLGI_EPOCH_MS + parseInt(s, 36) * MINUTE);
  }
  return jeolgiCache;
}

/** 이 순간 직전에 시작된 절기: { year(그 절기가 속한 양력 해), index(0 소한 … 11 대설), at } */
function jeolgiBefore(utcMs) {
  const t = jeolgiTimes();
  let lo = 0;
  let hi = t.length - 1;
  if (utcMs < t[0] || utcMs >= t[hi]) throw new Error("절기 표 범위를 벗어났어요");
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (t[mid] <= utcMs) lo = mid;
    else hi = mid - 1;
  }
  return { year: JEOLGI_START_YEAR + Math.floor(lo / 12), index: lo % 12, at: t[lo] };
}

/** 양력 날짜의 율리우스 적일(정오 기준 정수) */
function julianDay(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** 60갑자 번호(0 갑자 … 59 계해) → 기둥 객체 */
export function pillar(n) {
  const i = ((n % 60) + 60) % 60;
  const stem = i % 10;
  const branch = i % 12;
  return {
    index: i,
    stem,
    branch,
    ko: STEMS[stem] + BRANCHES[branch],
    hanja: STEMS_HANJA[stem] + BRANCHES_HANJA[branch],
  };
}

/** 천간·지지 번호로 60갑자 번호 찾기 (음양이 맞지 않으면 null) */
function ganjiIndex(stem, branch) {
  for (let i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return i;
  return null;
}

/** 양력 날짜의 일진(일주). 2000-01-01이 무오일. */
export function dayPillar(y, m, d) {
  return pillar(julianDay(y, m, d) + 49);
}

/** 오늘(한국 날짜) 정보 */
export function koreaToday(now = Date.now()) {
  const t = new Date(now + 540 * MINUTE);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

/** 날짜에 n일 더하기 */
export function addDays({ year, month, day }, n) {
  const t = new Date(Date.UTC(year, month - 1, day) + n * DAY);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

/** 음력 → 양력. 없는 날짜(예: 윤달이 없는 해의 윤달)면 null */
export function lunarToSolar(year, month, day, leap = false) {
  const cal = new KoreanLunarCalendar();
  if (!cal.setLunarDate(year, month, day, Boolean(leap))) return null;
  const s = cal.getSolarCalendar();
  return { year: s.year, month: s.month, day: s.day };
}

/** 양력 → 음력 (표시용) */
export function solarToLunar(year, month, day) {
  const cal = new KoreanLunarCalendar();
  if (!cal.setSolarDate(year, month, day)) return null;
  const l = cal.getLunarCalendar();
  return { year: l.year, month: l.month, day: l.day, leap: Boolean(l.intercalation) };
}

function isValidSolar(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** 그해 연간(年干)과 절기 index(0 소한 … 11 대설)로 그 달의 월주를 구합니다. */
function monthPillarAt(yearStem, jeolgiIndex) {
  // 절기 index → 달의 지지: 소한 축(1), 입춘 인(2) … 대설 자(0)
  const monthBranch = (jeolgiIndex + 1) % 12;
  // 인월(寅月)부터 센 몇 번째 달인지 (0 인월 … 11 축월)
  const fromIn = (monthBranch - 2 + 12) % 12;
  // 달의 천간: 연간 갑·기 → 병인월부터 (오호둔)
  const monthStem = (yearStem * 2 + 2 + fromIn) % 10;
  return pillar(ganjiIndex(monthStem, monthBranch));
}

/** 사주해(입춘 기준 연도) → 서기 4년이 갑자년인 연주 */
function sajuYearPillar(sajuYear) {
  return pillar(sajuYear - 4);
}

/** 연주·월주: 이 순간(UTC) 기준 */
function yearMonthPillars(utcMs) {
  const j = jeolgiBefore(utcMs);
  // 소한(index 0) 다음 입춘 전까지는 아직 지난해. 대설(11)은 그해 안이에요.
  const sajuYear = j.index === 0 ? j.year - 1 : j.year;
  const year = sajuYearPillar(sajuYear);
  const month = monthPillarAt(year.stem, j.index);
  return { year, month, sajuYear, jeolgi: j };
}

/**
 * 사주 계산.
 * @param {object} input
 *   calendar: "solar" | "lunar", year, month, day, leap(음력 윤달 여부),
 *   hour, minute: 태어난 시각(한국 시계 기준, 0~23 / 0~59). 모르면 null.
 * @returns {{ ok: true, ... } | { ok: false, error: string }}
 */
export function calcSaju(input) {
  const { calendar = "solar", leap = false } = input;
  const y = Number(input.year);
  const m = Number(input.month);
  const d = Number(input.day);
  const hasTime = input.hour != null && input.hour !== "";
  const hh = hasTime ? Number(input.hour) : null;
  const mi = hasTime ? Number(input.minute || 0) : null;

  if (!Number.isInteger(y) || y < MIN_YEAR || y > MAX_YEAR) {
    return { ok: false, error: `${MIN_YEAR}년부터 ${MAX_YEAR}년 사이로 입력해 주세요.` };
  }
  if (hasTime && !(Number.isInteger(hh) && Number.isInteger(mi) && hh >= 0 && hh <= 23 && mi >= 0 && mi <= 59)) {
    return { ok: false, error: "태어난 시간을 다시 확인해 주세요." };
  }

  let solar;
  if (calendar === "lunar") {
    solar = lunarToSolar(y, m, d, leap);
    if (!solar && y === MAX_YEAR && m >= 11) {
      return { ok: false, error: `음력은 ${MAX_YEAR}년 11월 중순까지 계산할 수 있어요.` };
    }
    if (!solar) {
      return {
        ok: false,
        error: leap ? "그해에는 그 달의 윤달이 없어요. 날짜를 다시 확인해 주세요." : "음력에 없는 날짜예요. 날짜를 다시 확인해 주세요.",
      };
    }
  } else {
    if (!isValidSolar(y, m, d)) return { ok: false, error: "없는 날짜예요. 날짜를 다시 확인해 주세요." };
    solar = { year: y, month: m, day: d };
  }
  if (solar.year > MAX_YEAR) return { ok: false, error: `${MAX_YEAR}년까지 계산할 수 있어요.` };

  const notes = [];
  let ym;
  let day;
  let hour = null;
  let local = null;

  if (hasTime) {
    const { utc, kind } = resolveKoreaLocal(solar.year, solar.month, solar.day, hh, mi);
    ym = yearMonthPillars(utc);
    if (kind === "repeated") {
      notes.push("이날은 시계를 뒤로 돌려(서머타임 해제 등) 이 시각이 두 번 있었어요. 앞쪽 시각으로 계산했어요.");
    } else if (kind === "skipped") {
      notes.push("이날은 시계를 앞당겨(서머타임 시작 등) 실제로는 없던 시각이에요. 바뀌기 전 시간으로 계산했어요.");
    }
    // 지역 시간(동경 127.5도)으로 보정한 시각
    const lt = new Date(utc + LOCAL_SOLAR_OFFSET_MIN * MINUTE);
    local = {
      year: lt.getUTCFullYear(),
      month: lt.getUTCMonth() + 1,
      day: lt.getUTCDate(),
      hour: lt.getUTCHours(),
      minute: lt.getUTCMinutes(),
      correction: LOCAL_SOLAR_OFFSET_MIN - koreaOffsetMinutes(utc),
    };
    // 자시(23시)부터는 다음 날로
    const dayBase = local.hour >= 23 ? addDays(local, 1) : local;
    day = dayPillar(dayBase.year, dayBase.month, dayBase.day);
    const hourBranch = Math.floor((local.hour + 1) / 2) % 12;
    const hourStem = (day.stem * 2 + hourBranch) % 10; // 오서둔: 일간 갑·기 → 갑자시
    hour = pillar(ganjiIndex(hourStem, hourBranch));
    if (koreaOffsetMinutes(utc) !== 540) {
      notes.push("태어난 해에 한국은 지금과 다른 표준시나 서머타임을 써서, 그 차이를 반영해 계산했어요.");
    }
  } else {
    day = dayPillar(solar.year, solar.month, solar.day);
    // 시간을 모르면 정오 기준으로 계산하고, 그날 절기가 바뀌었는지 확인
    const start = koreaLocalToUtc(solar.year, solar.month, solar.day, 0, 0);
    const end = start + DAY - MINUTE;
    ym = yearMonthPillars(start + DAY / 2);
    const a = yearMonthPillars(start);
    const b = yearMonthPillars(end);
    if (a.month.index !== b.month.index) {
      notes.push(
        a.year.index !== b.year.index
          ? "태어난 날 입춘이 시작돼서, 태어난 시간에 따라 띠와 연주·월주가 달라질 수 있어요. 시간을 알면 넣어 주세요."
          : "태어난 날 절기가 바뀌어서, 태어난 시간에 따라 월주가 달라질 수 있어요. 시간을 알면 넣어 주세요."
      );
    }
  }

  const pillars = { year: ym.year, month: ym.month, day, hour };
  const elements = [0, 0, 0, 0, 0];
  for (const p of Object.values(pillars)) {
    if (!p) continue;
    elements[STEM_ELEMENT[p.stem]]++;
    elements[BRANCH_ELEMENT[p.branch]]++;
  }

  return {
    ok: true,
    input: { calendar, year: y, month: m, day: d, leap: Boolean(leap), hour: hh, minute: mi },
    solar,
    lunar: solarToLunar(solar.year, solar.month, solar.day),
    local,
    pillars,
    dayMaster: day.stem,
    animal: ANIMALS[ym.year.branch],
    sajuYear: ym.sajuYear,
    elements,
    notes,
  };
}

/* ───────────── 관계 풀이 ───────────── */

export const TEN_GODS = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];

/**
 * 일간(나)과 다른 천간의 관계(십신). 0 비견 … 9 정인
 * 같은 오행: 비견·겁재 / 내가 낳는 오행: 식신·상관 / 내가 이기는 오행: 편재·정재
 * 나를 이기는 오행: 편관·정관 / 나를 낳는 오행: 편인·정인 (음양이 같으면 앞쪽, 다르면 뒤쪽)
 */
export function tenGod(dayStem, otherStem) {
  const me = STEM_ELEMENT[dayStem];
  const other = STEM_ELEMENT[otherStem];
  const rel = (other - me + 5) % 5; // 0 같음, 1 내가 낳음, 2 내가 이김, 3 나를 이김, 4 나를 낳음
  const samePolarity = dayStem % 2 === otherStem % 2;
  return rel * 2 + (samePolarity ? 0 : 1);
}

const SIX_HARMONY = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const THREE_HARMONY = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];

/**
 * 두 지지의 관계 (오늘의 운세 보조 풀이용으로 단순화)
 * "same" 같은 글자 · "six" 육합 · "three" 삼합(반합) · "clash" 충 · "none" 그 밖
 */
export function branchRelation(a, b) {
  if (a === b) return "same";
  if (SIX_HARMONY.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return "six";
  if (THREE_HARMONY.some((g) => g.includes(a) && g.includes(b))) return "three";
  if ((a - b + 12) % 12 === 6) return "clash";
  return "none";
}

// 십신 계열(비겁·식상·재성·관성·인성)마다 기운을 부드럽게 이어 주는 오행(통관)
// 비겁 날 → 식상, 식상 날 → 재성, 재성 날 → 비겁, 관성 날 → 인성, 인성 날 → 비겁
const BALANCE_REL = [1, 2, 0, 4, 0];
export const ELEMENT_COLORS = ["초록", "빨강", "노랑", "흰색", "검정·남색"];
export const ELEMENT_NUMBERS = [[3, 8], [2, 7], [5, 10], [4, 9], [1, 6]];
// 오행마다 정해진 전통 방위 (목 동 · 화 남 · 토 중앙 · 금 서 · 수 북)
export const ELEMENT_DIRECTIONS = ["동쪽", "남쪽", "중앙", "서쪽", "북쪽"];

/**
 * 어느 날의 운세 재료. 문장은 lib/fortune/texts.js 에서 고릅니다.
 * @param saju calcSaju 결과
 * @param date {year, month, day} 한국 날짜
 */
export function dayReading(saju, date) {
  const today = dayPillar(date.year, date.month, date.day);
  const god = tenGod(saju.dayMaster, today.stem);
  const relation = branchRelation(saju.pillars.day.branch, today.branch);
  const balanceElement = (STEM_ELEMENT[saju.dayMaster] + BALANCE_REL[Math.floor(god / 2)]) % 5;
  return {
    date,
    pillar: today,
    tenGod: god,
    relation,
    luckyElement: balanceElement,
    luckyColor: ELEMENT_COLORS[balanceElement],
    luckyNumbers: ELEMENT_NUMBERS[balanceElement],
    luckyDirection: ELEMENT_DIRECTIONS[balanceElement],
  };
}

/* ───────────── 신년운세(세운·월운) ───────────── */

/** 오늘(한국 날짜) 기준 지금 사주해(입춘 기준 연도) */
export function currentSajuYear(now = Date.now()) {
  const j = jeolgiBefore(now);
  return j.index === 0 ? j.year - 1 : j.year;
}

/** 그 사주해의 세운(그해 전체) 간지 */
export function saeunYear(sajuYear) {
  return sajuYearPillar(sajuYear);
}

/**
 * 그 사주해(sajuYear) 안의 열두 달 월운. 그해 입춘부터 다음 해 소한까지,
 * 절기가 정확히 바뀌는 시각 그대로 시간순 12개를 돌려줍니다.
 * 반환: [{ pillar, start:{year,month,day} }, …] 12개
 */
export function saeunMonths(sajuYear) {
  if (sajuYear < JEOLGI_START_YEAR || sajuYear + 1 > JEOLGI_END_YEAR) {
    throw new Error("이 연도의 월운은 계산할 수 없어요.");
  }
  const t = jeolgiTimes();
  const year = sajuYearPillar(sajuYear);
  const base = (sajuYear - JEOLGI_START_YEAR) * 12;
  // 그해 입춘(index1)부터 대설(index11)까지 11개, 그다음 다음 해 소한(index0) 1개 — 시간순 12개
  const offsets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return offsets.map((off) => {
    const jeolgiIndex = off % 12; // 1..11, 그다음 0(다음 해 소한)
    const p = monthPillarAt(year.stem, jeolgiIndex);
    const d = new Date(t[base + off] + 540 * MINUTE); // 지금 표준시(+9) 기준 날짜 표시
    return { pillar: p, start: { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() } };
  });
}

/**
 * 신년운세 재료. dayReading과 같은 방식으로 내 일간과 세운·월운 간지의 관계(십신)를 찾고,
 * 풀이 문장은 lib/fortune/texts.json의 periodGods·periodRelations에서 고릅니다.
 * @param saju calcSaju 결과
 * @param sajuYear 보고 싶은 사주해(입춘 기준 연도)
 */
export function saeunReading(saju, sajuYear) {
  const build = (p) => ({
    pillar: p,
    tenGod: tenGod(saju.dayMaster, p.stem),
    relation: branchRelation(saju.pillars.day.branch, p.branch),
  });
  const months = saeunMonths(sajuYear);
  const year = build(saeunYear(sajuYear));
  const balanceElement = (STEM_ELEMENT[saju.dayMaster] + BALANCE_REL[Math.floor(year.tenGod / 2)]) % 5;
  return {
    sajuYear,
    year: {
      ...year,
      luckyElement: balanceElement,
      luckyColor: ELEMENT_COLORS[balanceElement],
      luckyNumbers: ELEMENT_NUMBERS[balanceElement],
      luckyDirection: ELEMENT_DIRECTIONS[balanceElement],
    },
    months: months.map((m) => ({ ...build(m.pillar), start: m.start })),
  };
}

/* ───────────── 궁합 ───────────── */

// 십신 10가지가 묶이는 다섯 범주. tenGod()이 돌려주는 0~9 값을 2로 나눈 몫과 같은 순서예요.
export const GOD_CATEGORIES = ["비겁", "식상", "재성", "관성", "인성"];

/**
 * 두 사람의 궁합 재료.
 * @param a 나의 calcSaju() 결과, b 상대의 calcSaju() 결과
 */
export function gunghapReading(a, b) {
  const godAtoB = tenGod(a.dayMaster, b.dayMaster); // 내가 보는 상대: 상대의 일간이 나에게 어떤 관계인지
  const godBtoA = tenGod(b.dayMaster, a.dayMaster); // 상대가 보는 나
  const dayRelation = branchRelation(a.pillars.day.branch, b.pillars.day.branch);
  const samePolarity = a.dayMaster % 2 === b.dayMaster % 2;

  const topElement = (elements) => elements.reduce((best, v, i) => (v > elements[best] ? i : best), 0);
  const topA = topElement(a.elements);
  const topB = topElement(b.elements);

  return {
    godAtoB,
    godBtoA,
    category: Math.floor(godAtoB / 2), // 0 비겁 1 식상 2 재성 3 관성 4 인성 (내가 보는 상대 기준)
    dayRelation,
    samePolarity,
    elementsA: a.elements,
    elementsB: b.elements,
    topElementA: topA,
    topElementB: topB,
    topElementSame: topA === topB,
  };
}

const GUNGHAP_BASE = 55;
const GUNGHAP_DAY_BONUS = { same: 4, six: 15, three: 15, clash: -12, none: 2 };

/**
 * 궁합 점수(0~100). 전통 사주의 오행 상생상극·음양·일지 합충 개념을 바탕으로 이 사이트가 정한
 * 계산식이에요. "맞다/틀리다"가 있는 공식이 아니라, 재미로 보는 참고 점수라는 점을 UI에서도
 * 함께 알려 주세요.
 *  - 오행 관계: 같음 +8, 상생(내가 낳거나 나를 낳음) +22, 상극(내가 이기거나 나를 이김) +7
 *  - 음양: 다르면 +10, 같으면 +4
 *  - 일지 관계: 같음 +4, 합(육합·삼합) +15, 충 -12, 그 밖 +2
 */
export function gunghapScore(reading) {
  const rel = reading.category;
  const relBonus = rel === 0 ? 8 : rel === 1 || rel === 4 ? 22 : 7;
  const polarityBonus = reading.samePolarity ? 4 : 10;
  const dayBonus = GUNGHAP_DAY_BONUS[reading.dayRelation];
  return Math.max(0, Math.min(100, GUNGHAP_BASE + relBonus + polarityBonus + dayBonus));
}

export const SUPPORTED_RANGE = { from: JEOLGI_START_YEAR, to: JEOLGI_END_YEAR };
