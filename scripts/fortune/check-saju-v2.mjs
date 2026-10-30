// 내 사주 개편 검사: 일주 60·계절 40·십신 묶음·영역·오행 채우기 문장 형식과 sajuProfile() 계산.
// 실행: node scripts/fortune/check-saju-v2.mjs
import { readFileSync } from "node:fs";
import { calcSaju, sajuProfile, pillar, tenGod, BRANCH_MAIN_STEM, STEM_ELEMENT } from "../../lib/fortune/saju.js";

const load = (p) => JSON.parse(readFileSync(new URL(`../../lib/fortune/${p}`, import.meta.url), "utf8"));
const TEXTS = load("texts.json");
const SAJU = load("sajuTexts.json");
const errors = [];
const fail = (m) => errors.push(m);
const STEM_NAMES = ["갑목", "을목", "병화", "정화", "무토", "기토", "경금", "신금", "임수", "계수"];
const BRANCH_NAMES = ["자수", "축토", "인목", "묘목", "진토", "사화", "오화", "미토", "신금", "유금", "술토", "해수"];

// 1. 일주 60
if (SAJU.ilju.length !== 60) fail(`일주가 ${SAJU.ilju.length}개`);
SAJU.ilju.forEach((x, i) => {
  const p = pillar(i);
  const where = `${p.ko}일주`;
  if (x.name !== p.ko || x.hanja !== p.hanja) fail(`${i}번 이름이 ${x.name}(${x.hanja}) — ${p.ko}(${p.hanja})여야 함`);
  if (x.title.length < 7 || x.title.length > 18) fail(`${where} 제목 길이 ${x.title.length}`);
  if (x.text.length < 140 || x.text.length > 220) fail(`${where} 길이 ${x.text.length}`);
  if (x.text.split(/(?<=요\.) /).length !== 3) fail(`${where}: 세 문장이 아님`);
  // 첫 문장에 내 일간과 일지 글자를 "(갑목)"·"(자수)"처럼 밝혀요.
  if (!x.text.includes(`(${STEM_NAMES[p.stem]})인 내가`)) fail(`${where}: "(${STEM_NAMES[p.stem]})인 내가" 없음`);
  if (!x.text.includes(`(${BRANCH_NAMES[p.branch]})`)) fail(`${where}: "(${BRANCH_NAMES[p.branch]})" 없음`);
  if (/오늘|내일|올해|내년/.test(x.text)) fail(`${where}: 특정 시점 말`);
});
// 첫 문장 끝맺음이 한쪽으로 몰리지 않게(작성 규칙: 같은 구조 반복 금지)
const firstEnds = {};
for (const x of SAJU.ilju) {
  const end = x.text.split(/(?<=요\.) /)[0].match(/(\S+ \S+)$/)[1];
  firstEnds[end] = (firstEnds[end] || 0) + 1;
}
for (const [end, n] of Object.entries(firstEnds)) if (n > 20) fail(`일주 첫 문장 끝 "${end}" ${n}번`);
const titles = SAJU.ilju.map((x) => x.title);
if (new Set(titles).size !== 60) fail("일주 제목이 겹침");

// 2. 계절 40, 십신 묶음 5, 영역 40, 채우기 5
if (SAJU.season.length !== 10 || SAJU.season.some((r) => r.length !== 4)) fail("season이 10×4가 아님");
SAJU.season.forEach((row, d) =>
  row.forEach((s, k) => {
    if (s.length < 70 || s.length > 130) fail(`${TEXTS.ilgan[d].stem}-${["봄", "여름", "가을", "겨울"][k]} 길이 ${s.length}`);
    if (!s.includes(["봄", "여름", "가을", "겨울"][k])) fail(`${TEXTS.ilgan[d].stem}-${k}: 계절 이름 없음`);
  })
);
if (SAJU.godGroups.length !== 5) fail("godGroups가 5개가 아님");
SAJU.godGroups.forEach((g, i) => {
  for (const k of ["name", "hanja", "plain", "sub", "desc", "many", "none"]) if (!g[k]) fail(`godGroups ${i} ${k} 없음`);
  if (!g.many.startsWith(g.name) || !g.none.startsWith(g.name)) fail(`godGroups ${i}: many·none이 이름으로 시작하지 않음`);
});
const AREA_KEYS = ["love", "work", "money", "rhythm"];
if (SAJU.areas.length !== 10) fail("areas가 10개가 아님");
SAJU.areas.forEach((a, i) =>
  AREA_KEYS.forEach((k) => {
    if (typeof a[k] !== "string" || a[k].length < 55 || a[k].length > 120) fail(`areas ${i} ${k} 길이 ${a[k]?.length}`);
  })
);
if (SAJU.fill.length !== 5) fail("fill이 5개가 아님");
SAJU.fill.forEach((s, i) => !s.includes(`${TEXTS.elements[i].element}이`) && !s.includes(`${TEXTS.elements[i].element}가`) && fail(`fill ${i}: 오행 이름 없음`));

// 3. 같은 화면에 나오는 기존 문장(일간 풀이·오행 한 줄·시주 풀이)과 15글자 이상 겹치지 않게
const ilganLines = (d) => {
  const g = TEXTS.ilgan[d];
  return [g.summary, ...g.strengths, ...g.cautions, g.tip].join(" ");
};
const shared = [...TEXTS.elements.flatMap((e) => [e.intro, e.many, e.few]), ...TEXTS.hour.gods.map((h) => h.text)].join(" ");
function overlap(text, other) {
  for (let i = 0; i + 15 <= text.length; i++) {
    const piece = text.slice(i, i + 15);
    if (other.includes(piece)) return piece;
  }
  return null;
}
SAJU.ilju.forEach((x, i) => {
  const d = i % 10;
  const others = [ilganLines(d), shared, SAJU.season[d].join(" "), Object.values(SAJU.areas[d]).join(" ")].join(" ");
  const hit = overlap(x.text, others);
  if (hit) fail(`${x.name}일주: 같은 화면 문장과 겹침 "${hit}"`);
});
SAJU.season.forEach((row, d) =>
  row.forEach((s, k) => {
    const hit = overlap(s, [ilganLines(d), shared, Object.values(SAJU.areas[d]).join(" ")].join(" "));
    if (hit) fail(`${TEXTS.ilgan[d].stem}-${k} 계절: 겹침 "${hit}"`);
  })
);
SAJU.areas.forEach((a, d) =>
  AREA_KEYS.forEach((k) => {
    const hit = overlap(a[k], [ilganLines(d), shared].join(" "));
    if (hit) fail(`areas ${d} ${k}: 겹침 "${hit}"`);
  })
);

// 4. 금지어(작성 규칙: 의료·투자·겁주기·성별 전제·살 이야기)
const BANNED = ["반드시", "절대", "파산", "이별", "사고", "질병", "병원", "투자", "주식", "코인", "복권", "남편", "아내", "여자친구", "남자친구", "퇴사", "이직", "백호", "괴강", "도화", "역마", "양인"];
const everything = [
  ...SAJU.ilju.flatMap((x) => [x.title, x.text]),
  ...SAJU.season.flat(),
  ...SAJU.godGroups.flatMap((g) => [g.desc, g.many, g.none]),
  ...SAJU.areas.flatMap((a) => AREA_KEYS.map((k) => a[k])),
  ...SAJU.fill,
];
for (const s of everything) {
  for (const w of BANNED) if (new RegExp(`(^|[\\s(])${w}`).test(s)) fail(`금지어 "${w}": ${s}`);
  if (/[갑을병정무기경신임계]{2}합/.test(s)) fail(`붙여 쓴 합 이름: ${s}`);
}
if (new Set(everything).size !== everything.length) fail("똑같은 문장이 있음");

// 5. sajuProfile() — 손으로 센 값과 대조
{
  // 1990-05-15 14:30 → 경오년 신사월 경진일 계미시 (만세력 기준)
  const s = calcSaju({ calendar: "solar", year: 1990, month: 5, day: 15, hour: 14, minute: 30 });
  const p = sajuProfile(s);
  const got = [s.pillars.year.ko, s.pillars.month.ko, s.pillars.day.ko, s.pillars.hour.ko].join(" ");
  if (got !== "경오 신사 경진 계미") fail(`대조 팔자 ${got}`);
  // 일간 경금: 연간 경 비견, 연지 오(정) 정관, 월간 신 겁재, 월지 사(병) 편관, 일지 진(무) 편인, 시간 계 상관, 시지 미(기) 정인
  if (p.chars.map((c) => c.god).join(",") !== "0,7,1,6,8,3,9") fail(`대조 십신 ${p.chars.map((c) => c.god)}`);
  if (p.groups.join(",") !== "2,1,0,2,2") fail(`대조 묶음 ${p.groups}`);
  if (p.season !== 1) fail(`대조 계절 ${p.season}`);
  if (p.iljuIndex !== 16) fail(`대조 일주 ${p.iljuIndex}`);
}
let samples = 0;
const seasonSeen = new Set();
for (let y = 1930; y <= 2020; y += 7)
  for (let m = 1; m <= 12; m++)
    for (const dd of [3, 11, 19, 27])
      for (const h of [null, 1, 9, 17, 23]) {
        const s = calcSaju({ calendar: "solar", year: y, month: m, day: dd, hour: h, minute: h == null ? null : 10 });
        const p = sajuProfile(s);
        samples++;
        const n = h == null ? 5 : 7;
        if (p.chars.length !== n) fail(`${y}-${m}-${dd} ${h}: 글자 ${p.chars.length}개`);
        if (p.groups.reduce((a, b) => a + b, 0) !== n) fail(`${y}-${m}-${dd}: 묶음 합`);
        if (s.elements[p.fillElement] !== Math.min(...s.elements)) fail(`${y}-${m}-${dd}: 채울 오행이 가장 적은 오행이 아님`);
        if (p.dayBranchGod !== tenGod(s.dayMaster, BRANCH_MAIN_STEM[s.pillars.day.branch])) fail("일지 십신");
        // 비겁 묶음은 일간과 같은 오행인 글자 수와 같아요(일간 자신은 빼고).
        const sameEl = s.elements[STEM_ELEMENT[s.dayMaster]] - 1;
        if (p.groups[0] !== sameEl) fail(`${y}-${m}-${dd} ${h}: 비겁 ${p.groups[0]} ≠ 같은 오행 ${sameEl}`);
        seasonSeen.add(`${m}:${p.season}`);
      }
// 3월 중순은 봄, 7월 중순은 여름, 10월 중순은 가을, 1월 중순은 겨울
for (const [m, k] of [[3, 0], [7, 1], [10, 2], [1, 3]]) if (!seasonSeen.has(`${m}:${k}`)) fail(`${m}월이 ${k}번 계절로 안 나옴`);
console.log(`sajuProfile 표본 ${samples}개 확인`);

if (errors.length) {
  console.error(`문제 ${errors.length}건:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("내 사주 개편 검사 통과");
