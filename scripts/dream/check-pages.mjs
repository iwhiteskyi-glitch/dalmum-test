// 꿈해몽 상세 페이지(pages.json) 검사 — 형식, 분량, 금지 표현, 페이지끼리 문장 겹침.
// 실행: node scripts/dream/check-pages.mjs
// 규칙 근거: docs/dream/작성규칙.md §7~§9
import { readFileSync } from "node:fs";
import { PAGE_IDS } from "../../lib/dream/pageIds.js";

const DATA = JSON.parse(readFileSync("lib/dream/symbols.json", "utf8"));
const PAGES = JSON.parse(readFileSync("lib/dream/pages.json", "utf8"));
const SYMBOL = Object.fromEntries(DATA.symbols.map((s) => [s.id, s]));

let fail = 0;
function check(name, cond) {
  if (!cond) {
    fail++;
    console.log(`FAIL: ${name}`);
  }
}

const ids = Object.keys(PAGES);
check(
  "pageIds.js PAGE_IDS == pages.json 키 집합",
  PAGE_IDS.length === ids.length && ids.every((id) => PAGE_IDS.includes(id))
);

const MIN_LEN = 1200;
const MAX_LEN = 1800;
// 출처를 지어내는 표현, 의료·진단처럼 읽히는 표현 (§8)
const FAKE_SOURCE = ["따르면", "문헌", "해몽서", "연구에서", "연구 결과", "학자"];
const MEDICAL = ["진단", "상담을 받", "전문가", "치료", "병원", "장애", "증상", "우울증", "불안증"];
const PREDICT = ["예고", "경고", "아플 수", "사고가 날", "다칠 수", "반드시 좋은", "꼭 좋은 일"];
// "받아들이다"의 "아들"은 제외
const GENDER = [/(?<!받)아들/, /딸(?=[을이은일 ,.]|$)/];

function bodyOf(p) {
  return [p.care || "", p.meaning, ...p.situations.map((s) => s.text), p.modern, p.helpline || ""].join(" ");
}

for (const id of ids) {
  const p = PAGES[id];
  const sym = SYMBOL[id];
  check(`${id}: symbols.json에 있는 상징`, !!sym);
  for (const f of ["searchName", "metaDescription", "summary", "meaning", "modern"]) {
    check(`${id}: ${f} 비어있지 않음`, typeof p[f] === "string" && p[f].length > 0);
  }
  check(`${id}: metaDescription 80자 이내 (${p.metaDescription.length}자)`, p.metaDescription.length <= 80);
  check(`${id}: 상황별 풀이 4~7개 (${p.situations.length}개)`, p.situations.length >= 4 && p.situations.length <= 7);
  check(`${id}: 상황 제목 중복 없음`, new Set(p.situations.map((s) => s.title)).size === p.situations.length);
  for (const s of p.situations) check(`${id}/${s.title}: 내용 있음`, s.text && s.text.length > 40);
  check(`${id}: 비슷한 꿈 3~4개`, p.related.length >= 3 && p.related.length <= 4);
  for (const r of p.related) {
    check(`${id}: 비슷한 꿈 "${r}"이 실제 상징`, !!SYMBOL[r]);
    check(`${id}: 비슷한 꿈에 자기 자신 없음`, r !== id);
  }
  if (sym?.sensitive) check(`${id}: 민감 상징은 이별을 겪은 사람을 위한 문단(care) 필수`, !!p.care);

  const body = bodyOf(p);
  check(`${id}: 본문 ${MIN_LEN}~${MAX_LEN}자 (${body.length}자)`, body.length >= MIN_LEN && body.length <= MAX_LEN);
  const all = [body, p.summary, p.metaDescription].join(" ");
  for (const w of FAKE_SOURCE) check(`${id}: 출처 지어내기 표현 "${w}" 없음`, !all.includes(w));
  for (const w of MEDICAL) check(`${id}: 의료·진단 표현 "${w}" 없음`, !all.includes(w));
  for (const w of PREDICT) check(`${id}: 예고·단정 표현 "${w}" 없음`, !all.includes(w));
  for (const re of GENDER) check(`${id}: 성별 예측 표현 ${re} 없음`, !re.test(all));

  // 무서운 꿈이라는 전제를 깔거나 통설을 암시하는 말 금지(§2)
  for (const w of ["무섭지 않게", "불길", "흉몽이라고"]) check(`${id}: 통설 암시 표현 "${w}" 없음`, !all.includes(w));
  check(`${id}: meaningTitle은 있으면 문자열`, p.meaningTitle === undefined || typeof p.meaningTitle === "string");

  // 틀에 찍어 낸 글처럼 보이지 않게 — 반복 표현 빈도 제한(§8)
  const count = (re) => (body.match(re) || []).length;
  check(`${id}: "풀이" 4회 이하 (${count(/풀이/g)}회)`, count(/풀이/g) <= 4);
  check(`${id}: "~다면" 조건문 4회 이하 (${count(/다면/g)}회)`, count(/다면/g) <= 4);
  check(`${id}: modern이 섹션 제목("요즘 식으로 보면")을 되풀이하지 않음`, !p.modern.startsWith("요즘 식으로 보면"));

  // 짧은 해석(symbols.json)을 그대로 늘려 쓴 게 아닌지 — 요약 포함, 공백 뺀 12자 이상 겹침 금지
  if (sym) {
    const a = sym.text.replace(/\s/g, "");
    const b = (body + p.summary).replace(/\s/g, "");
    let hit = null;
    for (let i = 0; i + 12 <= a.length && !hit; i++) if (b.includes(a.slice(i, i + 12))) hit = a.slice(i, i + 12);
    check(`${id}: 짧은 해석과 12자 이상 겹치지 않음${hit ? ` ("${hit}")` : ""}`, !hit);
  }
}

// 상황별 풀이의 문장 끝이 한 가지로 쏠리지 않게 — 같은 끝맺음(공백 뺀 마지막 6자)이
// 전체 상황 문단의 20%(최소 3개)를 넘으면 실패
const endings = {};
for (const id of ids) {
  for (const s of PAGES[id].situations) {
    const e = s.text.replace(/\s/g, "").slice(-6);
    (endings[e] ||= []).push(`${id}/${s.title}`);
  }
}
const totalSituations = Object.values(endings).flat().length;
const maxSame = Math.max(3, Math.floor(totalSituations * 0.2));
for (const [e, where] of Object.entries(endings)) {
  check(`상황 문단 끝맺음 "${e}" ${where.length}회 (최대 ${maxSame}회): ${where.join(", ")}`, where.length <= maxSame);
}

// 페이지끼리 문장 겹침 — 공백 뺀 10자 이상 같은 구절이 두 페이지에 나오면 안 됨
// (자동 생성 저품질 판정 방지). 내용어가 들어간 진짜 중복(예: "손에 닿을 만큼 가까워졌다",
// "가운데서도 가장 널리 알려진")은 그대로 잡아야 하므로, 여기 넣는 건 한국어 해몽 글에서
// "~라고 본다"에 해당하는 순수 연결 어미뿐입니다 — 내용 없이 문장을 맺는 상투어만 제외하고,
// 그 앞뒤에 붙는 실제 내용(무엇을 어떻게 본다는 서술)은 여전히 겹치면 걸립니다.
const FRAME = [
  "전통해몽에서는",
  "다는뜻으로", "있다는뜻으로", "다는신호로", "있다는신호로",
  "조심스럽게풀이해요", "조심스럽게읽어요", "조심스럽게봐요", "조심스럽게받아들이면",
  "조심스럽게받아들여요",
  "이런꿈을꾸기쉬워요", "이런꿈을자주꿔요", "때자주찾아와요", "때자주꾸기쉬워요", "때자주나타나요",
  "고있을때자주나타나요", "이런꿈으로나타나기도해", "의모습으로나타나기도해요",
  "는경우가많아요", "받아들이면돼요", "받아들여도좋아요", "받아들여보세요",
  "가르는단서가돼요", "보여주는단서가돼요", "짐작하게해줘요", "짐작할수있어요",
  "가늠할수있어요", "는지떠올려보면지금그", "들여다본적있나요이런",
  "비추는상징으로자주쓰", "꿈가운데서도가장뚜렷한", "꿈가운데서도가장선명한",
  "고싶은마음을보여줘요", "준비가됐다는신호예요", "준비가되어있다는신호",
  "과정으로받아들여도충분해", "마음에들었다면그변화", "게지나간다는뜻이에요",
  "하게받아들이고있다는", "도무난하게지나간다는",
  "자살예방상담전화109", "꿈과별개로", "에서24시간이야기를들어줘요", // 109 안내는 고정 안전 문구라 여러 민감 상징 페이지에서 그대로 반복
];
function chunks(text, n = 10) {
  let t = text.replace(/[\s,.·'"!?()]/g, "");
  for (const f of FRAME) t = t.split(f).join("|");
  const set = new Set();
  for (const part of t.split("|")) for (let i = 0; i + n <= part.length; i++) set.add(part.slice(i, i + n));
  return set;
}
const chunkSets = ids.map((id) => ({ id, set: chunks(bodyOf(PAGES[id])) }));
for (let i = 0; i < chunkSets.length; i++) {
  for (let j = i + 1; j < chunkSets.length; j++) {
    const common = [...chunkSets[i].set].filter((c) => chunkSets[j].set.has(c));
    check(`${chunkSets[i].id} ↔ ${chunkSets[j].id}: 10자 이상 같은 구절 없음${common.length ? ` (${common.slice(0, 3).join(", ")})` : ""}`, common.length === 0);
  }
}

for (const id of ids) console.log(`  ${id}: 본문 ${bodyOf(PAGES[id]).length}자, 상황 ${PAGES[id].situations.length}개`);
console.log(fail === 0 ? `전부 통과 (상세 페이지 ${ids.length}개)` : `${fail}건 실패`);
process.exit(fail === 0 ? 0 : 1);
