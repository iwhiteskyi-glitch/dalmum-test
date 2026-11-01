// 띠별 오늘의 운세 계산. 생년월일 없이 띠(태어난 해의 지지)만으로 보는 간이 풀이예요.
//  - 본 풀이: 띠 글자의 본기(本氣) 천간을 '나'로 보고, 오늘 일진 천간과의 십신(10종)
//  - 보조: 띠 글자와 오늘 일지의 관계(같은 띠의 날·육합·삼합·충·그 밖) → 총운 별점 ±1
//  - 년생별 한마디: 같은 띠라도 태어난 해의 천간이 달라서(84년생 갑자, 96년생 병자 …) 해 천간 × 오늘 천간 십신
// 문장은 lib/fortune/ttiTexts.json(띠 풀이)과 texts.json(년생별 한마디)에서 고릅니다.
import {
  BRANCHES,
  BRANCHES_HANJA,
  ANIMALS,
  BRANCH_ELEMENT,
  STEM_ELEMENT,
  ELEMENT_COLORS,
  ELEMENT_NUMBERS,
  ELEMENT_DIRECTIONS,
  dayPillar,
  pillar,
  tenGod,
  branchRelation,
  currentSajuYear,
} from "./saju.js";

export const TTI_SLUGS = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "pig"];

// 지지마다 품고 있는 대표 천간(본기). 子癸 丑己 寅甲 卯乙 辰戊 巳丙 午丁 未己 申庚 酉辛 戌戊 亥壬
export const BONGI_STEM = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];

// 십신 계열(비겁·식상·재성·관성·인성)마다 기운을 이어 주는 오행 — 오늘의 운세(saju.js dayReading)와 같은 방식
const BALANCE_REL = [1, 2, 0, 4, 0];

const SIX_PARTNER = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const THREE_GROUPS = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];

export function ttiInfo(branch) {
  return {
    branch,
    slug: TTI_SLUGS[branch],
    animal: ANIMALS[branch],
    name: `${ANIMALS[branch]}띠`,
    ko: BRANCHES[branch],
    hanja: BRANCHES_HANJA[branch],
    element: BRANCH_ELEMENT[branch],
    bongiStem: BONGI_STEM[branch],
  };
}

export function ttiBySlug(slug) {
  const i = TTI_SLUGS.indexOf(slug);
  return i < 0 ? null : ttiInfo(i);
}

/** 전통적으로 잘 어울린다고 보는 띠(육합 1 + 삼합 2)와 부딪힌다고 보는 띠(충 1) */
export function ttiMatches(branch) {
  const three = THREE_GROUPS.find((g) => g.includes(branch)).filter((b) => b !== branch);
  return { six: SIX_PARTNER[branch], three, clash: (branch + 6) % 12 };
}

/** 그 날짜가 속한 해(입춘 기준). 2027년 1월 10일 → 2026 (입춘 전이라 아직 병오년) */
export function sajuYearOf(date) {
  return currentSajuYear(Date.UTC(date.year, date.month - 1, date.day, 3)); // 한국 정오
}

/** 이 띠에 해당하는 태어난 해(양력 연도, 입춘 기준) — thisYear는 sajuYearOf로 구한 해, 최근 해가 먼저 */
export function ttiYears(branch, thisYear, span = 96) {
  const years = [];
  for (let y = thisYear; y > thisYear - span; y--) {
    if ((((y - 4) % 12) + 12) % 12 === branch) years.push(y);
  }
  return years;
}

/** 양력 연도의 간지(입춘이 지난 뒤 기준). 1984 → 갑자 */
export function yearPillar(year) {
  return pillar(year - 4);
}

/**
 * 어느 날 한 띠의 운세 재료.
 * @param branch 띠 번호(0 쥐 … 11 돼지)
 * @param date {year, month, day} 한국 날짜
 */
export function ttiReading(branch, date) {
  const today = dayPillar(date.year, date.month, date.day);
  const me = BONGI_STEM[branch];
  const god = tenGod(me, today.stem);
  const relation = branchRelation(branch, today.branch);
  const balanceElement = (STEM_ELEMENT[me] + BALANCE_REL[Math.floor(god / 2)]) % 5;
  return {
    branch,
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

/** 년생별 한마디 재료: 그해 간지와, 해 천간 × 오늘 천간의 십신 */
export function ttiYearRows(branch, date) {
  const today = dayPillar(date.year, date.month, date.day);
  return ttiYears(branch, sajuYearOf(date)).map((year) => {
    const yp = yearPillar(year);
    return { year, pillar: yp, tenGod: tenGod(yp.stem, today.stem) };
  });
}
