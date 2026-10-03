// 꿈해몽 데이터(symbols.json)와 엔진(select.js)이 어긋나지 않는지 검사합니다.
// 실행: node scripts/dream/check-symbols.mjs
import { readFileSync } from "node:fs";
import { SYMBOL_IDS, synthesisBucket } from "../../lib/dream/select.js";

const DATA = JSON.parse(readFileSync("lib/dream/symbols.json", "utf8"));

let fail = 0;
function check(name, cond) {
  if (!cond) {
    fail++;
    console.log(`FAIL: ${name}`);
  }
}

// 1) select.js의 SYMBOL_IDS와 symbols.json의 id 목록이 정확히 같아야 함(순서는 무관, 집합만 동일)
const dataIds = DATA.symbols.map((s) => s.id);
check("symbols.json에 중복 id 없음", new Set(dataIds).size === dataIds.length);
check("select.js SYMBOL_IDS 개수 == symbols.json 개수", SYMBOL_IDS.length === dataIds.length);
check(
  "select.js SYMBOL_IDS == symbols.json id 집합",
  SYMBOL_IDS.every((id) => dataIds.includes(id)) && dataIds.every((id) => SYMBOL_IDS.includes(id))
);
check("상징 36개", dataIds.length === 36);

// 2) 카테고리 6개 × 6개씩
const catIds = DATA.categories.map((c) => c.id);
check("카테고리 6개", catIds.length === 6);
for (const cat of catIds) {
  const n = DATA.symbols.filter((s) => s.category === cat).length;
  check(`카테고리 "${cat}" 상징 6개 (실제 ${n}개)`, n === 6);
}
check(
  "모든 상징의 category가 실제 카테고리를 가리킴",
  DATA.symbols.every((s) => catIds.includes(s.category))
);

// 3) 필드 유효성
for (const s of DATA.symbols) {
  check(`${s.id}: label 비어있지 않음`, typeof s.label === "string" && s.label.length > 0);
  check(`${s.id}: keyword 비어있지 않음`, typeof s.keyword === "string" && s.keyword.length > 0);
  check(`${s.id}: text 비어있지 않음`, typeof s.text === "string" && s.text.length > 10);
  check(`${s.id}: luck이 0/1/2 중 하나`, [0, 1, 2].includes(s.luck));
}

// 4) 전통 민담의 불길한 통설(가족 사고/죽음/질병) 관련 단어가 전혀 없어야 함 — 콘텐츠 안전 규칙
const BANNED = ["죽음", "죽는다", "사망", "사고사", "불행한 일", "가족을 잃", "질병에 걸", "병에 걸"];
const allText = DATA.symbols.map((s) => s.text).join("\n") + Object.values(DATA.synthesis).map((s) => s.text).join("\n");
for (const word of BANNED) {
  check(`금지어 "${word}" 없음`, !allText.includes(word));
}

// 5) 종합 버킷 로직 — 대표 사례
check("good(0만)", synthesisBucket([0, 0, 1]) === "good");
check("caution(2만)", synthesisBucket([2, 1, 2]) === "caution");
check("mixed(0과 2 모두)", synthesisBucket([0, 2]) === "mixed");
check("neutral(1만)", synthesisBucket([1, 1]) === "neutral");
check("neutral(1개, 1)", synthesisBucket([1]) === "neutral");
check("good(1개, 0)", synthesisBucket([0]) === "good");
check("caution(1개, 2)", synthesisBucket([2]) === "caution");
for (const key of ["good", "caution", "mixed", "neutral"]) {
  check(`synthesis.${key} 존재`, DATA.synthesis[key] && DATA.synthesis[key].title && DATA.synthesis[key].text);
}

console.log(fail === 0 ? `전부 통과 (상징 ${dataIds.length}개)` : `${fail}건 실패`);
process.exit(fail === 0 ? 0 : 1);
