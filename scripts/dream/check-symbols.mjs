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

// 1) select.js의 SYMBOL_IDS와 symbols.json의 id 집합이 같아야 함
const dataIds = DATA.symbols.map((s) => s.id);
check("symbols.json에 중복 id 없음", new Set(dataIds).size === dataIds.length);
check("select.js SYMBOL_IDS에 중복 없음", new Set(SYMBOL_IDS).size === SYMBOL_IDS.length);
check(
  "select.js SYMBOL_IDS == symbols.json id 집합",
  SYMBOL_IDS.length === dataIds.length && dataIds.every((id) => SYMBOL_IDS.includes(id))
);
for (const id of dataIds) {
  check(`id "${id}"는 영어 소문자만(주소·공유 링크에 쓰임)`, /^[a-z]+$/.test(id));
}

// 2) 카테고리마다 상징이 하나 이상(상징은 계속 늘어나므로 개수는 고정하지 않음)
const catIds = DATA.categories.map((c) => c.id);
for (const cat of catIds) {
  check(`카테고리 "${cat}"에 상징 있음`, DATA.symbols.some((s) => s.category === cat));
}
check("모든 상징의 category가 실제 카테고리를 가리킴", DATA.symbols.every((s) => catIds.includes(s.category)));

// 3) 필드 유효성
for (const s of DATA.symbols) {
  check(`${s.id}: label 비어있지 않음`, typeof s.label === "string" && s.label.length > 0);
  check(`${s.id}: keyword 비어있지 않음`, typeof s.keyword === "string" && s.keyword.length > 0);
  check(`${s.id}: text 비어있지 않음`, typeof s.text === "string" && s.text.length > 10);
  check(`${s.id}: luck이 0/1/2 중 하나`, [0, 1, 2].includes(s.luck));
}

// 4) 콘텐츠 안전 — 죽음·질병 관련 단어는 민감 상징(sensitive: true, 예: 죽는 꿈)의 자기 문장
//    말고는 어디에도 나오면 안 됨. 예고·경고처럼 "실제 일이 생긴다"로 읽히는 말은 전부 금지.
const DEATH_WORDS = ["죽음", "죽는다", "사망", "사고사", "불행한 일", "가족을 잃", "질병에 걸", "병에 걸"];
const PREDICT_WORDS = ["예고", "경고", "아플 수", "사고가 날", "다칠 수"];
for (const s of DATA.symbols) {
  if (!s.sensitive) for (const w of DEATH_WORDS) check(`${s.id}: 금지어 "${w}" 없음`, !s.text.includes(w));
  for (const w of PREDICT_WORDS) check(`${s.id}: 예고형 표현 "${w}" 없음`, !s.text.includes(w));
}
for (const [k, v] of Object.entries(DATA.synthesis)) {
  for (const w of [...DEATH_WORDS, ...PREDICT_WORDS]) check(`synthesis.${k}: "${w}" 없음`, !v.text.includes(w));
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
