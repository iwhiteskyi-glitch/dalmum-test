// 오늘의 운세 개편 검사: 맞춤 풀이 100칸·할 일/피할 일·행운 음식·장소 형식과 100점 점수 범위.
// 실행: node scripts/fortune/check-today.mjs
import { readFileSync } from "node:fs";
import { calcSaju, dayReading, hourFlow, addDays } from "../../lib/fortune/saju.js";

const load = (p) => JSON.parse(readFileSync(new URL(`../../lib/fortune/${p}`, import.meta.url), "utf8"));
const TEXTS = load("texts.json");
const PERSONAL = load("personalTexts.json");
const EXTRAS = load("todayExtras.json");
const errors = [];
const fail = (m) => errors.push(m);

// 1. 맞춤 풀이 100칸
if (PERSONAL.texts.length !== 10) fail(`일간 줄이 ${PERSONAL.texts.length}개`);
PERSONAL.texts.forEach((row, d) => {
  if (row.length !== 10) fail(`${d}번 일간 칸이 ${row.length}개`);
  row.forEach((s, g) => {
    const where = `${TEXTS.ilgan[d].stem}-${TEXTS.tenGods[g].god}`;
    if (typeof s !== "string" || s.length < 60 || s.length > 150) fail(`${where} 길이 ${s?.length}`);
    if (!/요\.$/.test(s)) fail(`${where} 끝맺음: ${s.slice(-6)}`);
  });
});
// 오늘 찾아온 글자를 "(정화)"처럼 밝혔는지 — 십신 번호로 오늘 천간을 거꾸로 구함
const STEM_NAMES = ["갑목", "을목", "병화", "정화", "무토", "기토", "경금", "신금", "임수", "계수"];
PERSONAL.texts.forEach((row, d) =>
  row.forEach((s, g) => {
    const element = ((d >> 1) + (g >> 1)) % 5;
    const stem = element * 2 + (g % 2 === 0 ? d % 2 : 1 - (d % 2));
    if (!s.includes(`(${STEM_NAMES[stem]})`)) fail(`${TEXTS.ilgan[d].stem}-${TEXTS.tenGods[g].god}: "(${STEM_NAMES[stem]})" 없음`);
  })
);
const all = PERSONAL.texts.flat();
if (new Set(all).size !== all.length) fail("맞춤 풀이에 똑같은 문장이 있음");

// 2. 할 일/피할 일, 행운
if (EXTRAS.doDont.length !== 10) fail("doDont가 10개가 아님");
EXTRAS.doDont.forEach((x, i) => {
  for (const k of ["do", "dont"]) {
    if (x[k].length !== 3) fail(`doDont ${i} ${k} ${x[k].length}개`);
    x[k].forEach((s) => s.length > 22 && fail(`doDont ${i} ${k} 너무 김: ${s}`));
  }
});
if (EXTRAS.lucky.length !== 5) fail("lucky가 5개가 아님");
EXTRAS.lucky.forEach((x, i) => {
  if (x.foods.length !== 3 || x.places.length !== 3) fail(`lucky ${i} 음식·장소 3개씩 아님`);
});

// 3. 금지어(작성 규칙: 의료·투자·겁주기·성별 전제)
const BANNED = ["반드시", "절대", "파산", "이별", "사고", "질병", "병원", "투자", "주식", "코인", "복권", "남편", "아내", "여자친구", "남자친구"];
const every = [...all, ...EXTRAS.doDont.flatMap((x) => [...x.do, ...x.dont]), ...EXTRAS.lucky.flatMap((x) => [...x.foods, ...x.places])];
// 낱말 첫머리일 때만 걸러요("찾아내" 속 "아내" 같은 오탐 방지)
for (const s of every) for (const w of BANNED) if (new RegExp(`(^|[\\s(])${w}`).test(s)) fail(`금지어 "${w}": ${s}`);

// 4. 점수 — 화면(TodayFortune.js buildDay)과 같은 식
const REL = Object.fromEntries(TEXTS.relations.map((r) => [r.key, r.adjust]));
const clamp = (n) => Math.min(5, Math.max(1, n));
function score(saju, date) {
  const r = dayReading(saju, date);
  const god = TEXTS.tenGods[r.tenGod];
  const overall = clamp(god.stars.overall + REL[r.relation]);
  const awake = hourFlow(saju, date).filter((h) => h.branch >= 3);
  const hourAvg = awake.reduce((a, h) => a + clamp(TEXTS.tenGods[h.tenGod].stars.overall + REL[h.relation]), 0) / awake.length;
  const areaAvg = ["love", "work", "money", "health"].reduce((a, k) => a + god.stars[k], 0) / 4;
  return Math.round((0.6 * overall + 0.25 * areaAvg + 0.15 * hourAvg) * 20);
}
const scores = [];
for (let y = 1950; y <= 2010; y += 7)
  for (let m = 1; m <= 12; m += 5)
    for (let dd = 3; dd <= 28; dd += 6) {
      const saju = calcSaju({ calendar: "solar", year: y, month: m, day: dd, hour: null, minute: null });
      for (let i = 0; i < 60; i++) scores.push(score(saju, addDays({ year: 2026, month: 10, day: 1 }, i)));
    }
const min = Math.min(...scores);
const max = Math.max(...scores);
const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
if (min < 40 || max > 100) fail(`점수 범위 ${min}~${max}`);
const hist = {};
for (const s of scores) hist[Math.floor(s / 10) * 10] = (hist[Math.floor(s / 10) * 10] || 0) + 1;

console.log(`점수 ${scores.length}개: ${min}~${max}, 평균 ${avg.toFixed(1)}`, hist);
if (errors.length) {
  console.error(`문제 ${errors.length}건\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("check-today: 모두 통과");
