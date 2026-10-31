// 관상 풀이 문장 검사 — 빠진 칸, 금지어, 한 화면에 함께 뜨는 문장끼리 겹치는 구절.
// node scripts/gwansang/check-texts.mjs
import TEXTS from "../../lib/gwansang/texts.json" with { type: "json" };
import { PARTS, DIM_COUNT } from "../../lib/gwansang/classify.js";

let fail = 0;
let count = 0;
const bad = (msg) => {
  fail++;
  console.log(`[FAIL] ${msg}`);
};

// 1) 칸이 빠짐없이 있고 비어 있지 않은지
const all = []; // { where, text, part, combo }
for (const part of PARTS) {
  const def = TEXTS.parts[part];
  if (!def) {
    bad(`${part} 없음`);
    continue;
  }
  const [a, b] = DIM_COUNT[part];
  count++;
  if (def.dims?.[0]?.steps?.length !== a || def.dims?.[1]?.steps?.length !== b) bad(`${part} dims 칸 수가 DIM_COUNT와 다름`);
  if (!def.about || !def.label) bad(`${part} label/about 비어 있음`);
  const keys = Object.keys(def.combos);
  count++;
  if (keys.length !== a * b) bad(`${part} 조합 수 ${keys.length} (≠ ${a * b})`);
  for (let i = 0; i < a; i++)
    for (let j = 0; j < b; j++) {
      const c = def.combos[`${i}-${j}`];
      count++;
      if (!c?.name || !c?.text) {
        bad(`${part} ${i}-${j} 비어 있음`);
        continue;
      }
      all.push({ where: `${part} ${i}-${j}`, text: c.text, part, combo: [i, j] });
      all.push({ where: `${part} ${i}-${j} 이름`, text: c.name, part, combo: [i, j] });
    }
  // 같은 부위 안에서 이름이 겹치지 않는지
  const names = Object.values(def.combos).map((c) => c.name);
  count++;
  if (new Set(names).size !== names.length) bad(`${part} 이름 중복`);
}
const synKeys = Object.keys(TEXTS.synthesis);
count++;
if (synKeys.length !== 18) bad(`종합 ${synKeys.length}가지 (≠ 18)`);
for (let s = 0; s < 3; s++)
  for (let t = 0; t < 2; t++)
    for (let e = 0; e < 3; e++) {
      const k = `${s}-${t}-${e}`;
      const c = TEXTS.synthesis[k];
      count++;
      if (!c || !["title", "text", "first", "work", "people"].every((f) => c[f])) {
        bad(`종합 ${k} 비어 있음`);
        continue;
      }
      for (const f of ["title", "text", "first", "work", "people"]) all.push({ where: `종합 ${k} ${f}`, text: c[f], syn: [s, t, e] });
    }
const titles = Object.values(TEXTS.synthesis).map((c) => c.title);
count++;
if (new Set(titles).size !== titles.length) bad("종합 제목 중복");

// 2) 금지어 — 외모 평가, 재물·수명·결혼·건강 예언, 성별 전제, '미간'(두 눈썹 사이를 뜻해 실제로 재는 곳과 다름)
const BANNED = [
  "매력", "예쁘", "예쁜", "잘생", "미인", "미남", "못생", "귀여", "앳된", "동안",
  "부자", "재물", "재산", "돈복", "재복", "부귀", "수명", "장수", "단명", "오래 살", "건강",
  "결혼", "배우자", "남편", "남자", "여자", "남성", "여성", /(^|\s)아들/, /(^|\s)아내/, /(^|\s)딸/,
  "운명", "성공할", "실패할", "망하", "불운", /흉(?!내)/, "길하", "미간", "리더", "카리스마", "듬직", "든든",
  // 검토(docs/gwansang/v2)에서 성별 연상·외모 평가·재지 않은 부위로 걸린 말
  "포근", "단아", "믿음직", "다부", "화통", "똑 부러", "묵직", "심지", "추진력", "기념일", "콧대", "수수", "무난", "오밀조밀", "가운데로 모인",
].map((w) => (typeof w === "string" ? new RegExp(w) : w));
for (const x of all) for (const w of BANNED) {
  count++;
  if (w.test(x.text)) bad(`금지어 ${w} — ${x.where}: ${x.text}`);
}
for (const w of BANNED) for (const f of ["intro", "resultLead", "disclaimer", "synthesisLead"]) {
  // 소개는 '운명 판단이 아니라'처럼 부정하는 말로 쓸 수 있어 운명만 예외
  if (String(w) === "/운명/") continue;
  count++;
  if (w.test(TEXTS[f])) bad(`금지어 ${w} — ${f}`);
}

// 3) 한 화면에 함께 뜰 수 있는 문장끼리 겹치는 표현 (운세 check-hourtexts.mjs와 같은 방식)
//    ① 띄어쓰기 없이 이어진 5자 이상 같은 조각  ② 전체에서 드물게(3번 이하) 쓰는 낱말이 두 개 이상 같이 나옴
//    부위 이름·생김새를 말하는 낱말(눈꼬리·콧볼·인중 등)은 고정 틀이라 뺍니다.
const FRAME_WORDS = /^(전통|관상에서|관상에서는|풀이해요|풀이되는|사람처럼|비치기|비칠|비쳐요|쉬워요|편이에요|들어요|있어요|인상|인상을|인상으로|인상이에요|이목구비가|이목구비|턱선|턱선이|턱선,|턱선은|얼굴에|얼굴|얼굴로|눈꼬리가|눈꼬리는|눈썹이|콧볼이|콧볼|인중이|인중|입술이|입꼬리가|입꼬리는|사진|속|두|눈|사이|사이가|간격|간격이|간격은|간격과|너비|너비가|너비는|길이|길이는|길이와|코가|코|입매|입매예요|눈매|눈매예요|윤곽|윤곽이에요|배치|배치예요|보통이고|보통이에요|모양|기질로|기질로,|함께|있는|같은|같다는|말을|듣는|듣기)$/;
const STRIP = /(이에요|예요|에요|으로|에서|이나|까지|하고|이고|에게|처럼|보다|라도|면서|이라|지만|해요|돼요|어요|아요|이|가|은|는|을|를|에|의|도|와|과|로)$/;
const words = (t) => t.replace(/[.,·()'"]/g, " ").split(/\s+/).filter(Boolean).filter((w) => !FRAME_WORDS.test(w)).map((w) => w.replace(STRIP, "")).filter((w) => w.length >= 2 && !FRAME_WORDS.test(w));
const freq = new Map();
for (const x of all) for (const w of new Set(words(x.text))) freq.set(w, (freq.get(w) || 0) + 1);
const rare = (w) => freq.get(w) <= 3;
const chunks = (a, b) => {
  const found = new Set();
  for (let i = 0; i < a.length; i++)
    for (let len = 5; i + len <= a.length; len++) {
      const piece = a.slice(i, i + len);
      if (/[\s.,·()]/.test(piece)) break;
      if (!b.includes(piece)) break;
      found.add(piece);
    }
  return [...found].filter((p) => ![...found].some((q) => q !== p && q.includes(p)));
};
const canMeet = (x, y) => {
  if (x.part && y.part) return x.part !== y.part;
  if (x.syn && y.syn) return x.syn.join() === y.syn.join() && x.where !== y.where;
  const p = x.part ? x : y;
  const sy = x.part ? y : x;
  // 턱·배치 부위는 종합 열쇠와 맞는 조합일 때만 함께 떠요
  if (p.part === "jaw") return p.combo[0] === sy.syn[1] && p.combo[1] === sy.syn[0];
  if (p.part === "layout") return p.combo[0] === sy.syn[2];
  return true;
};
for (let i = 0; i < all.length; i++)
  for (let j = i + 1; j < all.length; j++) {
    const x = all[i];
    const y = all[j];
    if (!canMeet(x, y)) continue;
    const wy = new Set(words(y.text));
    const shared = [...new Set(words(x.text))].filter((w) => wy.has(w) && rare(w));
    const ch = chunks(x.text, y.text).filter((c) => !FRAME_WORDS.test(c));
    count++;
    if (shared.length >= 2 || ch.length) bad(`겹침 ${x.where} ↔ ${y.where}: ${[...ch, ...(shared.length >= 2 ? shared : [])].join(", ")}`);
  }

console.log(fail === 0 ? `통과 (${count}건 확인)` : `${fail}건 실패`);
if (fail > 0) process.exit(1);
