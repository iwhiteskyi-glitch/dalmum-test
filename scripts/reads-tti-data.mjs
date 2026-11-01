// 읽을거리 '같은 띠인데 왜 년생마다 다를까'에 쓸 숫자: 띠별 운세를 한 해 치 계산해서 세어 봐요.
// 실행: node scripts/reads-tti-data.mjs [연도=2026]
import { createRequire } from "node:module";
import { ANIMALS, STEMS, TEN_GODS } from "../lib/fortune/saju.js";
import { BONGI_STEM, ttiReading, ttiYearRows, ttiYears, yearPillar } from "../lib/fortune/tti.js";

// lib/fortune/ttiView.js와 같은 계산(그 파일은 JSON을 import해서 plain node로 바로 못 불러와요)
const require = createRequire(import.meta.url);
const TEXTS = require("../lib/fortune/texts.json");
const TTI_TEXTS = require("../lib/fortune/ttiTexts.json");
const RELATIONS = Object.fromEntries(TTI_TEXTS.relations.map((r) => [r.key, r]));
function buildTti(branch, date) {
  const r = ttiReading(branch, date);
  const god = TTI_TEXTS.gods[r.tenGod];
  const rel = RELATIONS[r.relation];
  return { ...r, god, godName: TEN_GODS[r.tenGod], rel, overall: Math.min(5, Math.max(1, god.stars.overall + rel.adjust)) };
}
function buildYearRows(branch, date) {
  return ttiYearRows(branch, date).map((row) => ({ ...row, keyword: TEXTS.tenGods[row.tenGod].keyword }));
}

const YEAR = Number(process.argv[2] || 2026);
const days = [];
for (let t = Date.UTC(YEAR, 0, 1); t < Date.UTC(YEAR + 1, 0, 1); t += 864e5) {
  const d = new Date(t);
  days.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
}
const pct = (n, all) => `${((n / all) * 100).toFixed(1)}%`;

console.log(`## ${YEAR}년 ${days.length}일 × 12띠 = ${days.length * 12}번`);

// 1) 띠마다 별점 분포
const all = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
for (let b = 0; b < 12; b++) {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of days) c[buildTti(b, d).overall]++;
  for (const k in c) all[k] += c[k];
  console.log(`${ANIMALS[b]}띠(본기 ${STEMS[BONGI_STEM[b]]}): ` + [2, 3, 4, 5].map((s) => `★${s} ${c[s]}일`).join(" · "));
}
const total = days.length * 12;
console.log("전체: " + [1, 2, 3, 4, 5].map((s) => `★${s} ${all[s]}(${pct(all[s], total)})`).join(" · "));

// 2) 같은 날 열두 띠의 십신·별점이 몇 갈래로 나뉘나
let sameGodPairs = new Map();
let distinctGods = [];
let distinctFull = [];
for (const d of days) {
  const r = Array.from({ length: 12 }, (_, b) => buildTti(b, d));
  distinctGods.push(new Set(r.map((x) => x.tenGod)).size);
  distinctFull.push(new Set(r.map((x) => `${x.tenGod}-${x.overall}`)).size);
  for (let a = 0; a < 12; a++)
    for (let b = a + 1; b < 12; b++)
      if (r[a].tenGod === r[b].tenGod) {
        const k = `${ANIMALS[a]}-${ANIMALS[b]}`;
        sameGodPairs.set(k, (sameGodPairs.get(k) || 0) + 1);
      }
}
const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
console.log(`같은 날 열두 띠의 십신 종류: 평균 ${avg(distinctGods)}가지 (최소 ${Math.min(...distinctGods)}, 최대 ${Math.max(...distinctGods)})`);
console.log(`같은 날 열두 띠의 (십신+별점) 종류: 평균 ${avg(distinctFull)}가지`);
console.log("1년 내내 같은 십신인 띠 짝: " + [...sameGodPairs].filter(([, n]) => n === days.length).map(([k]) => k).join(", "));
console.log(
  "그 밖에 같은 십신이 나온 날이 많은 짝(상위 6): " +
    [...sameGodPairs].filter(([, n]) => n < days.length).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} ${n}일`).join(", ")
);

// 3) 같은 띠 안의 년생: 해 천간이 몇 갈래인가 (말띠 예시)
const horse = 6;
const ys = ttiYears(horse, 2026, 96);
console.log("말띠 년생과 해 간지: " + ys.map((y) => `${y} ${yearPillar(y).ko}`).join(", "));
const stems = new Set(ys.map((y) => yearPillar(y).stem));
console.log(`말띠 해 천간 종류: ${stems.size}가지 (${[...stems].map((s) => STEMS[s]).join("·")})`);

// 4) 오늘(예시 날짜) 말띠 년생별 십신
const ex = { year: 2026, month: 11, day: 1 };
console.log(
  `2026-11-01 말띠 년생별: ` +
    buildYearRows(horse, ex)
      .slice(0, 8)
      .map((r) => `${r.year}(${r.pillar.ko}) ${TEN_GODS[r.tenGod]}·${r.keyword}`)
      .join(" / ")
);
console.log(`2026-11-01 말띠 본 풀이: ${(() => { const x = buildTti(horse, ex); return `${x.godName} ${x.god.title} ★${x.overall} (${x.rel.label})`; })()}`);

// 5) 같은 십신을 받는 두 짝(소·양, 용·개)이 별점까지 같은 날
for (const [a, b] of [[1, 7], [4, 10]]) {
  let same = 0;
  const diff = {};
  for (const d of days) {
    const x = buildTti(a, d);
    const y = buildTti(b, d);
    if (x.overall === y.overall) same++;
    else diff[`${x.rel.key}/${y.rel.key}`] = (diff[`${x.rel.key}/${y.rel.key}`] || 0) + 1;
  }
  console.log(`${ANIMALS[a]}띠·${ANIMALS[b]}띠 별점까지 같은 날: ${same}/${days.length}일 · 다른 날의 관계: ${JSON.stringify(diff)}`);
}
const exP = ttiReading(6, ex).pillar;
console.log(`2026-11-01 일진: ${exP.ko}(${exP.hanja})`);
