// 읽을거리용 데이터 뽑기(사이트 실제 계산 코드로). 실행: node scripts/reads-data.mjs
import { calcSaju, gunghapReading, gunghapScore, dayReading, addDays, TEN_GODS, branchRelation } from "../lib/fortune/saju.js";
import { readFileSync } from "node:fs";
const TEXTS = JSON.parse(readFileSync(new URL("../lib/fortune/texts.json", import.meta.url)));
let seed = 20261015;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const person = (withTime = true) => {
  const y = ri(1950, 2005), m = ri(1, 12), d = ri(1, 28);
  return { calendar: "solar", year: y, month: m, day: d, ...(withTime ? { hour: ri(0, 23), minute: ri(0, 59) } : {}) };
};
const pct = (n, t) => ((100 * n) / t).toFixed(1) + "%";

// A) 궁합 점수 분포 (무작위 1만 쌍, 시간 포함)
const N = 10000, hist = {}, scores = [];
const relCount = {}, catCount = [0, 0, 0, 0, 0];
for (let i = 0; i < N; i++) {
  const a = calcSaju(person()), b = calcSaju(person());
  const r = gunghapReading(a, b), s = gunghapScore(r);
  scores.push(s); const bin = Math.floor(s / 10) * 10; hist[bin] = (hist[bin] || 0) + 1;
  relCount[r.dayRelation] = (relCount[r.dayRelation] || 0) + 1; catCount[r.category]++;
}
scores.sort((x, y) => x - y);
const avg = scores.reduce((p, c) => p + c, 0) / N;
console.log("## A. 궁합 점수 분포 (무작위 1만 쌍, 1950~2005년생, 태어난 시간 포함)");
console.log(`평균 ${avg.toFixed(1)}점, 중앙값 ${scores[N / 2]}점, 최저 ${scores[0]}점, 최고 ${scores[N - 1]}점`);
Object.keys(hist).sort((a, b) => a - b).forEach((k) => console.log(`- ${k}점대: ${pct(hist[k], N)}`));
console.log(`- 100점: ${pct(scores.filter((s) => s === 100).length, N)}`);
console.log("일지 관계 비율:", Object.entries(relCount).map(([k, v]) => `${k} ${pct(v, N)}`).join(", "));
console.log("오행 관계(내가 보는 상대) 비율:", ["비겁", "식상", "재성", "관성", "인성"].map((c, i) => `${c} ${pct(catCount[i], N)}`).join(", "));
console.log("이론상 범위: 기본 53 + 오행(7~22) + 음양(4~10) + 일지(-12~15) + 보완(0~6) → 52~100(100에서 자름)");

// B) 태어난 시간만 바꾸면 (300쌍 x 내 시간 24가지 중 무작위 다른 시간)
let changedScore = 0, changedFill = 0, T = 300, diffs = [], dayChanged = 0, maxSameDay = 0, bigDiff = 0, bigDiffDayChanged = 0;
for (let i = 0; i < T; i++) {
  const pa = person(), pb = person();
  const a1 = calcSaju(pa), b = calcSaju(pb);
  let h2 = ri(0, 23); while (Math.floor(((h2 + 1) % 24) / 2) === Math.floor(((pa.hour + 1) % 24) / 2)) h2 = ri(0, 23);
  const a2 = calcSaju({ ...pa, hour: h2 });
  const r1 = gunghapReading(a1, b), r2 = gunghapReading(a2, b);
  const s1 = gunghapScore(r1), s2 = gunghapScore(r2);
  if (s1 !== s2) changedScore++;
  if (r1.fillA !== r2.fillA || r1.fillB !== r2.fillB) changedFill++;
  diffs.push(Math.abs(s1 - s2));
  const dc = a1.pillars.day.index !== a2.pillars.day.index;
  if (dc) dayChanged++; else maxSameDay = Math.max(maxSameDay, Math.abs(s1 - s2));
  if (Math.abs(s1 - s2) > 6) { bigDiff++; if (dc) bigDiffDayChanged++; }
}
console.log("\n## B. 내 태어난 시간만 다른 시진으로 바꾸면 (무작위 300쌍)");
console.log(`시간을 바꾼 결과 태어난 날(일주)까지 바뀐 쌍 ${dayChanged}쌍(보정 시간 밤 11시 = 시계 밤 11시 30분 경계를 넘은 경우), 일주가 그대로인 쌍의 최대 점수 변화 ${maxSameDay}점, 6점 넘게 바뀐 ${bigDiff}쌍 중 일주가 바뀐 쌍 ${bigDiffDayChanged}쌍`);
console.log(`점수가 바뀐 쌍 ${pct(changedScore, T)}, 오행 보완 결과가 바뀐 쌍 ${pct(changedFill, T)}, 바뀐 폭 최대 ${Math.max(...diffs)}점, 평균 ${(diffs.reduce((p, c) => p + c, 0) / T).toFixed(1)}점`);
// 시간 모름 vs 시간 앎
let unk = 0;
for (let i = 0; i < T; i++) {
  const pa = person(), pb = person();
  const s1 = gunghapScore(gunghapReading(calcSaju(pa), calcSaju(pb)));
  const { hour, minute, ...noTime } = pa;
  const s2 = gunghapScore(gunghapReading(calcSaju(noTime), calcSaju(pb)));
  if (s1 !== s2) unk++;
}
console.log(`내 시간을 '모름'으로 바꾸면 점수가 바뀐 쌍 ${pct(unk, T)}`);
// 일간/일지는 시간에 따라 바뀌나? (자시 23시대만 날이 바뀜)
console.log("참고: 일간·일지(오행 관계·음양·일지 합충)는 보정 시간 밤 11시 전후로 날이 바뀌는 경우 말고는 시간과 무관");

// C) 오늘의 운세 1년(2025년) 통계 — 무작위 1천 명 × 365일
const P = 1000; const starHist = {}, godHist = new Array(10).fill(0), relHist = {};
const REL = Object.fromEntries(TEXTS.relations.map((r) => [r.key, r.adjust]));
let five = 0, one = 0, days = 0;
const people = Array.from({ length: P }, () => calcSaju(person(false)));
let d = { year: 2025, month: 1, day: 1 };
for (let k = 0; k < 365; k++) {
  for (const s of people) {
    const r = dayReading(s, d);
    const st = Math.min(5, Math.max(1, TEXTS.tenGods[r.tenGod].stars.overall + REL[r.relation]));
    starHist[st] = (starHist[st] || 0) + 1; godHist[r.tenGod]++; relHist[r.relation] = (relHist[r.relation] || 0) + 1; days++;
  }
  d = addDays(d, 1);
}
console.log("\n## C. 오늘의 운세 1년 치 (2025년 365일 × 무작위 1천 명 = 36만 5천 번)");
console.log("총운 별점:", Object.keys(starHist).sort().map((k) => `${k}개 ${pct(starHist[k], days)}`).join(", "));
console.log("십신:", TEN_GODS.map((g, i) => `${g} ${pct(godHist[i], days)}`).join(", "));
console.log("일지 관계:", Object.entries(relHist).map(([k, v]) => `${k} ${pct(v, days)}`).join(", "));
console.log("십신별 기본 총운 별점:", TEXTS.tenGods.map((g) => `${g.god} ${g.stars.overall}`).join(", "));
console.log("관계 보정:", TEXTS.relations.map((r) => `${r.key} ${r.adjust}`).join(", "));
// 한 사람 기준: 같은 십신이 돌아오는 주기
const one1 = calcSaju({ calendar: "solar", year: 1990, month: 5, day: 15 });
let seq = []; d = { year: 2025, month: 1, day: 1 };
for (let k = 0; k < 30; k++) { seq.push(TEN_GODS[dayReading(one1, d).tenGod]); d = addDays(d, 1); }
console.log("1990-05-15생의 2025년 1월 1~30일 십신 순서:", seq.join(" "));
