// 신년운세 개편 검사: 맞춤 한 해 풀이 100칸·영역·할 일/피할 일·달 풀이 형식과 100점 점수 범위.
// 실행: node scripts/fortune/check-saeun-v2.mjs
import { readFileSync } from "node:fs";
import { calcSaju, saeunReading } from "../../lib/fortune/saju.js";

const load = (p) => JSON.parse(readFileSync(new URL(`../../lib/fortune/${p}`, import.meta.url), "utf8"));
const TEXTS = load("texts.json");
const SAEUN = load("saeunTexts.json");
const DAILY = load("personalTexts.json");
const errors = [];
const fail = (m) => errors.push(m);

// 1. 맞춤 한 해 풀이 100칸
if (SAEUN.personal.length !== 10) fail(`일간 줄이 ${SAEUN.personal.length}개`);
SAEUN.personal.forEach((row, d) => {
  if (row.length !== 10) fail(`${d}번 일간 칸이 ${row.length}개`);
  row.forEach((s, g) => {
    const where = `${TEXTS.ilgan[d].stem}-${TEXTS.tenGods[g].god}`;
    if (typeof s !== "string" || s.length < 120 || s.length > 230) fail(`${where} 길이 ${s?.length}`);
    if (!/요\.$/.test(s)) fail(`${where} 끝맺음: ${s.slice(-6)}`);
    // 특정 연도 말이 섞이면 올해·내년·내후년 중 어디선가 틀려요.
    if (/올해|내년|작년|오늘|내일/.test(s)) fail(`${where}: 특정 시점 말이 들어 있음`);
  });
});
// 그해 찾아온 글자를 "(정화)"처럼 밝혔는지 — 십신 번호로 그해 천간을 거꾸로 구함(check-today.mjs와 같은 식)
const STEM_NAMES = ["갑목", "을목", "병화", "정화", "무토", "기토", "경금", "신금", "임수", "계수"];
SAEUN.personal.forEach((row, d) =>
  row.forEach((s, g) => {
    const element = ((d >> 1) + (g >> 1)) % 5;
    const stem = element * 2 + (g % 2 === 0 ? d % 2 : 1 - (d % 2));
    if (!s.includes(`(${STEM_NAMES[stem]})`)) fail(`${TEXTS.ilgan[d].stem}-${TEXTS.tenGods[g].god}: "(${STEM_NAMES[stem]})" 없음`);
    // 합 짝 칸(정재·정관 중 천간합)은 "(갑목·기토 합)" 꼴로 밝히고, 붙여 쓴 합 이름("병신합" 등)은 쓰지 않아요.
    if (/[갑을병정무기경신임계]{2}합/.test(s)) fail(`${TEXTS.ilgan[d].stem}-${TEXTS.tenGods[g].god}: 붙여 쓴 합 이름`);
  })
);
const all = SAEUN.personal.flat();
if (new Set(all).size !== all.length) fail("맞춤 풀이에 똑같은 문장이 있음");
// 오늘의 운세 맞춤 풀이와 같은 칸에서 비유를 푸는 구절이 그대로 겹치지 않는지(15글자 이상).
// 첫 문장의 "촛불(정화)이 들풀인 나를"이나 합 이름 문장은 같은 장면을 가리키니 비교하지 않아요.
SAEUN.personal.forEach((row, d) =>
  row.forEach((text, g) => {
    const daily = DAILY.texts[d][g];
    const s = text
      .split(/(?<=요\.) /)
      .slice(1)
      .filter((x) => !x.includes(" 합)"))
      .join(" ");
    for (let i = 0; i + 15 <= s.length; i++) {
      const piece = s.slice(i, i + 15);
      if (daily.includes(piece)) {
        fail(`${TEXTS.ilgan[d].stem}-${TEXTS.tenGods[g].god}: 오늘의 운세와 겹침 "${piece}"`);
        break;
      }
    }
  })
);

// 2. 영역·할 일/피할 일·달 풀이
const AREA_KEYS = ["love", "work", "money", "health"];
if (SAEUN.areas.length !== 10) fail("areas가 10개가 아님");
SAEUN.areas.forEach((a, i) =>
  AREA_KEYS.forEach((k) => {
    const s = a[k];
    if (typeof s !== "string" || s.length < 55 || s.length > 120) fail(`areas ${i} ${k} 길이 ${s?.length}`);
    if (s === TEXTS.tenGods[i][k]) fail(`areas ${i} ${k}: 오늘의 운세 문장과 같음`);
  })
);
if (SAEUN.doDont.length !== 10) fail("doDont가 10개가 아님");
SAEUN.doDont.forEach((x, i) => {
  for (const k of ["do", "dont"]) {
    if (x[k].length !== 3) fail(`doDont ${i} ${k} ${x[k].length}개`);
    x[k].forEach((s) => s.length > 22 && fail(`doDont ${i} ${k} 너무 김: ${s}`));
  }
});
if (SAEUN.months.length !== 10) fail("months가 10개가 아님");
SAEUN.months.forEach((m, i) => {
  if (m.text.length < 50 || m.text.length > 110) fail(`months ${i} text 길이 ${m.text.length}`);
  if (m.tip.length < 10 || m.tip.length > 30) fail(`months ${i} tip 길이 ${m.tip.length}`);
});
const allLines = [
  ...SAEUN.areas.flatMap((a) => AREA_KEYS.map((k) => a[k])),
  ...SAEUN.doDont.flatMap((x) => [...x.do, ...x.dont]),
  ...SAEUN.months.flatMap((m) => [m.text, m.tip]),
];
if (new Set(allLines).size !== allLines.length) fail("영역·할 일·달 풀이에 똑같은 문장이 있음");

// 3. 금지어(작성 규칙: 의료·투자·겁주기·성별 전제)
const BANNED = ["반드시", "절대", "파산", "이별", "사고", "질병", "병원", "투자", "주식", "코인", "복권", "남편", "아내", "여자친구", "남자친구", "퇴사", "이직"];
// 낱말 첫머리일 때만 걸러요("찾아내" 속 "아내" 같은 오탐 방지)
for (const s of [...all, ...allLines]) for (const w of BANNED) if (new RegExp(`(^|[\\s(])${w}`).test(s)) fail(`금지어 "${w}": ${s}`);

// 4. 점수 — 화면(SaeunView.js buildYear)과 같은 식
const REL = Object.fromEntries(TEXTS.relations.map((r) => [r.key, r.adjust]));
const clamp = (n) => Math.min(5, Math.max(1, n));
const areaAvg = (god) => AREA_KEYS.reduce((a, k) => a + god.stars[k], 0) / 4;
function scores(saju, year) {
  const r = saeunReading(saju, year);
  const months = r.months.map((m) => {
    const god = TEXTS.tenGods[m.tenGod];
    const stars = clamp(god.stars.overall + REL[m.relation]);
    return { stars, score: Math.round((0.75 * stars + 0.25 * areaAvg(god)) * 20) };
  });
  const god = TEXTS.tenGods[r.year.tenGod];
  const overall = clamp(god.stars.overall + REL[r.year.relation]);
  const monthAvg = months.reduce((a, m) => a + m.stars, 0) / 12;
  return { year: Math.round((0.6 * overall + 0.25 * areaAvg(god) + 0.15 * monthAvg) * 20), months: months.map((m) => m.score) };
}
const yearScores = [];
const monthScores = [];
for (let y = 1940; y <= 2015; y += 3)
  for (let m = 1; m <= 12; m += 2)
    for (let dd = 2; dd <= 28; dd += 5) {
      const saju = calcSaju({ calendar: "solar", year: y, month: m, day: dd, hour: null, minute: null });
      for (const year of [2026, 2027, 2028]) {
        const s = scores(saju, year);
        yearScores.push(s.year);
        monthScores.push(...s.months);
      }
    }
const stat = (xs) => {
  const hist = {};
  for (const s of xs) hist[Math.floor(s / 10) * 10] = (hist[Math.floor(s / 10) * 10] || 0) + 1;
  return `${Math.min(...xs)}~${Math.max(...xs)}, 평균 ${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)} ${JSON.stringify(hist)}`;
};
if (Math.min(...yearScores) < 40 || Math.max(...yearScores) > 100) fail("한 해 점수 범위 벗어남");
if (Math.min(...monthScores) < 40 || Math.max(...monthScores) > 100) fail("달 점수 범위 벗어남");
console.log(`한 해 점수 ${yearScores.length}개: ${stat(yearScores)}`);
console.log(`달 점수 ${monthScores.length}개: ${stat(monthScores)}`);

if (errors.length) {
  console.error(`문제 ${errors.length}건:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("신년운세 개편 검사 통과");
