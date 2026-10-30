// 궁합 개편(2026-10) 문장 검사: 칸 수, 일지 조합 키, 천간합 표기, 금지어, 맞춤 풀이의 명령형, 점수 구성 합.
// 실행: node scripts/fortune/check-gunghap-v2.mjs
import fs from "node:fs";
import { branchRelation, gunghapScore, gunghapScoreParts } from "../../lib/fortune/saju.js";

const G = JSON.parse(fs.readFileSync(new URL("../../lib/fortune/gunghapTexts.json", import.meta.url), "utf8"));
let fail = 0;
const assert = (cond, label) => {
  if (!cond) {
    fail++;
    console.log(`✗ ${label}`);
  }
};

// 1) 칸 수
assert(G.categories.length === 5, "categories 5개");
assert(G.pairs.length === 10 && G.pairs.every((r) => r.length === 10), "pairs 10×10");
G.pairs.forEach((r, a) => r.forEach((p, b) => assert(p.name && p.text, `pairs[${a}][${b}] 비어 있음`)));
for (const k of ["love", "friend", "family", "work"]) assert(G.areas[k]?.length === 10 && G.areas[k].every(Boolean), `areas.${k} 10개`);
assert(G.points.length === 10, "points 10개");
G.points.forEach((p, i) => ["good", "care", "together"].forEach((k) => assert(p[k]?.length === 3, `points[${i}].${k} 3개`)));

// 2) 일지 조합: 같은 글자·육합·반합·충이면 풀이가 있고, 무난이면 없어야 함
for (let a = 0; a < 12; a++) {
  for (let b = a; b < 12; b++) {
    const has = Boolean(G.dayPairs[`${a}-${b}`]);
    assert(has === (branchRelation(a, b) !== "none"), `dayPairs ${a}-${b} (${branchRelation(a, b)})`);
  }
}
assert(Object.keys(G.dayPairs).length === 36 && G.dayNone, "dayPairs 36개 + dayNone");

// 3) 천간합 짝(갑기·을경·병신·정임·무계)에만 '합'을 말하고, 이름은 "(병화·신금 합)" 꼴
const HAP = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]];
G.pairs.forEach((r, a) =>
  r.forEach((p, b) => {
    const isHap = HAP.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    assert(isHap === /[가-힣]+·[가-힣]+ 합\)/.test(p.text), `pairs[${a}][${b}] 합 표기`);
  })
);

// 4) 금지어·겁주는 말·성별 전제
const all = JSON.stringify(G);
const BANNED = ["병신", "이별", "파산", "사고", "남편", "아내", "여자친구", "남자친구", "결혼", "반드시", "불행", "흉", "살(殺)", "투자", "복권"];
for (const w of BANNED) {
  // 낱말 앞이 한글이면 다른 낱말의 일부예요("깎아내리는"의 아내). "병신"은 "(병화·신금 합)"처럼 떨어져 있으면 괜찮아요.
  assert(!new RegExp(`(^|[^가-힣])${w.replace(/[()]/g, "\\$&")}`).test(all), `금지어 "${w}"`);
}

// 5) 맞춤 풀이는 장면 + 뜻으로 끝내고 조언(명령형)은 넣지 않아요
G.pairs.forEach((r, a) =>
  r.forEach((p, b) => {
    const last = p.text.trim();
    assert(!/(보세요|주세요|마세요|두세요|말아요)\.$/.test(last), `pairs[${a}][${b}] 명령형으로 끝남`);
    assert(p.text.length >= 80 && p.text.length <= 190, `pairs[${a}][${b}] 길이 ${p.text.length}`);
  })
);

// 6) 점수 구성의 합이 점수와 같고(100 상한), 범위는 0~100
for (let cat = 0; cat < 5; cat++)
  for (const dr of ["same", "six", "three", "clash", "none"])
    for (const sp of [true, false])
      for (const fa of [null, 1])
        for (const fb of [null, 2]) {
          const r = { category: cat, dayRelation: dr, samePolarity: sp, fillA: fa, fillB: fb };
          const p = gunghapScoreParts(r);
          assert(p.sum === p.base + p.element + p.polarity + p.day + p.fill, "점수 구성 합");
          assert(p.score === Math.min(100, Math.max(0, p.sum)) && p.score === gunghapScore(r), "점수 = 구성 합(0~100)");
        }

if (fail) {
  console.log(`\n${fail}건 실패`);
  process.exit(1);
}
console.log("모두 통과");
