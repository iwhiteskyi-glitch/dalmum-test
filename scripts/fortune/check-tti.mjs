// 띠별 운세 계산 검증 (외부 대조 + 내부 불변식)
// 실행: node scripts/fortune/check-tti.mjs
import { calcSaju, STEMS, BRANCHES, STEM_ELEMENT, BRANCH_ELEMENT, TEN_GODS, addDays } from "../../lib/fortune/saju.js";
import { sajuYearOf, BONGI_STEM, ttiReading, ttiYears, yearPillar, ttiMatches, ttiYearRows, TTI_SLUGS, ttiBySlug } from "../../lib/fortune/tti.js";

let fail = 0;
const assert = (c, l) => {
  if (!c) {
    fail++;
    console.log(`✗ ${l}`);
  }
};

// 1) 본기 천간의 오행은 지지 오행과 같아야 함
for (let b = 0; b < 12; b++) assert(STEM_ELEMENT[BONGI_STEM[b]] === BRANCH_ELEMENT[b], `본기 오행 ${BRANCHES[b]}`);

// 2) 해 간지: 이미 검증된 사주 엔진의 연주(입춘 뒤 날짜)와 1901~2050 전부 대조, 띠 연도 목록도 함께
for (let y = 1901; y <= 2050; y++) {
  const s = calcSaju({ calendar: "solar", year: y, month: 6, day: 1 });
  const yp = yearPillar(y);
  assert(s.pillars.year.stem === yp.stem && s.pillars.year.branch === yp.branch, `해 간지 ${y}`);
  assert(ttiYears(yp.branch, 2050, 200).includes(y), `띠 연도 목록 ${y}`);
}
assert(yearPillar(1984).stem === 0 && yearPillar(1984).branch === 0, "1984 갑자");
assert(yearPillar(2026).stem === 2 && yearPillar(2026).branch === 6, "2026 병오");

// 3) 궁합 띠: 육합·삼합·충은 서로 대칭
for (let b = 0; b < 12; b++) {
  const m = ttiMatches(b);
  assert(ttiMatches(m.six).six === b, `육합 대칭 ${b}`);
  assert(ttiMatches(m.clash).clash === b, `충 대칭 ${b}`);
  for (const t of m.three) assert(ttiMatches(t).three.includes(b), `삼합 대칭 ${b}`);
  assert(ttiBySlug(TTI_SLUGS[b]).branch === b, `slug ${b}`);
}

// 4) 하루 동안 12띠의 십신: 축·미, 진·술만 늘 같고 나머지는 서로 다름 / 관계 개수(같음1·육합1·삼합2·충1)
let d = { year: 2026, month: 1, day: 1 };
const godCount = new Array(10).fill(0);
for (let i = 0; i < 730; i++) {
  const rs = BRANCHES.map((_, b) => ttiReading(b, d));
  const gods = rs.map((r) => r.tenGod);
  assert(gods[1] === gods[7] && gods[4] === gods[10], `축미·진술 같은 십신 ${d.month}/${d.day}`);
  assert(new Set(gods).size === 10, `하루 십신 10종 ${d.year}-${d.month}-${d.day}`);
  const rel = (k) => rs.filter((r) => r.relation === k).length;
  assert(rel("same") === 1 && rel("six") === 1 && rel("three") === 2 && rel("clash") === 1, `관계 개수 ${d.month}/${d.day}`);
  gods.forEach((g) => godCount[g]++);
  // 년생별: 해 천간 × 오늘 천간 십신이 다시 계산해도 같음
  const rows = ttiYearRows(0, d);
  assert(rows.every((r) => r.pillar.branch === 0), "년생 행은 모두 같은 띠");
  d = addDays(d, 1);
}
// 5) 입춘 전에는 아직 새해 띠가 아님: 2027-01-10은 2026년(병오), 2027-02-10은 2027년(정미)
assert(sajuYearOf({ year: 2027, month: 1, day: 10 }) === 2026, "입춘 전 해");
assert(sajuYearOf({ year: 2027, month: 2, day: 10 }) === 2027, "입춘 뒤 해");
assert(!ttiYearRows(7, { year: 2027, month: 1, day: 10 }).some((r) => r.year === 2027), "입춘 전 양띠 목록에 2027 없음");
console.log("2년 동안 십신 분포:", TEN_GODS.map((g, i) => `${g} ${godCount[i]}`).join(" · "));
console.log(fail ? `실패 ${fail}건` : "모두 통과");
process.exit(fail ? 1 : 0);
