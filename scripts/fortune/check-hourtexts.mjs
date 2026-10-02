// 시간대 문구(hourNote 10개 + hourFrames)가 같은 화면의 다른 문장과 겹치지 않는지 검사합니다.
// /fortune 한 화면에는 (1) 그날 십신의 결과 카드 문장(texts.json tenGods·relations),
// (2) 추천 카드 두 장(hourNote + hourFrames)이 함께 떠서, 같은 표현이 겹치면 반복으로 읽혀요.
// 다섯 글자 이상 같은 토막이 있으면 알려 줍니다. 실행: node scripts/fortune/check-hourtexts.mjs
import { readFileSync } from "node:fs";

const TEXTS = JSON.parse(readFileSync("lib/fortune/texts.json", "utf8"));
const PERIOD = JSON.parse(readFileSync("lib/fortune/periodTexts.json", "utf8"));

// 끝맺음·조사처럼 한국어 문장이면 으레 겹치는 토막은 넘어갑니다. 여기서 잡고 싶은 건
// "어깨에 긴장이 실리는"처럼 통째로 비슷한 표현이에요.
const ALLOWED = ["시간이에요", "하는 시간", "지는 시간", "이 시간", "는 시간", "보세요", "싶어지는"];

const MIN = 5;

// 조사·어미를 떼고 낱말의 어간만 남깁니다. 두 문장이 같은 어간을 여러 개 쓰면 사실상 같은
// 표현이라고 보고 알려 줘요.
const GRAMMAR = ["시간", "이 시간", "한결", "조금", "다시", "보세요", "수도", "때는"];
const ENDINGS = /(이에요|예요|에요|으로|에서|이나|까지|보고|두면|하고|이고|에게|처럼|보다|라도|면서|이라|지만)$/;
function stems(text) {
  return [
    ...new Set(
      text
        .replace(/[.,·()"'0-9:~]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2)
        .map((w) => w.replace(ENDINGS, ""))
        .filter((w) => w.length >= 2 && !GRAMMAR.includes(w))
        .map((w) => w.slice(0, 2))
    ),
  ];
}

/** 두 문장이 함께 쓰는 낱말 어간 */
function sharedStems(a, b, onlyRare = null) {
  const bs = new Set(stems(b));
  return stems(a).filter((w) => bs.has(w) && (!onlyRare || onlyRare.has(w)));
}

/**
 * "마음·사람·일에"처럼 어디에나 나오는 낱말은 겹쳐도 중복으로 느껴지지 않아요. 결과 카드
 * 문장 전체에서 몇 번 나오는지 세어, 드물게 쓰는 낱말만 중복 판정에 씁니다.
 */
function rareStems(texts, maxCount) {
  const count = new Map();
  for (const t of texts) for (const w of stems(t)) count.set(w, (count.get(w) || 0) + 1);
  return new Set([...count].filter(([, n]) => n <= maxCount).map(([w]) => w));
}

function overlaps(a, b) {
  const found = new Set();
  for (let i = 0; i < a.length; i++) {
    for (let len = MIN; i + len <= a.length; len++) {
      const piece = a.slice(i, i + len);
      if (/[\s.,·()]/.test(piece)) continue;
      if (!b.includes(piece)) break;
      found.add(piece);
    }
  }
  // 더 긴 토막에 포함되는 짧은 토막은 버리고, 허용 목록은 걸러요.
  return [...found]
    .filter((p) => ![...found].some((q) => q !== p && q.includes(p)))
    .filter((p) => !ALLOWED.some((w) => w.includes(p) || p.includes(w)));
}

const hourNotes = PERIOD.periodGods.map((g) => ({ god: g.god, text: g.hourNote }));
const frames = PERIOD.hourFrames.map((f) => ({ god: `프레임:${f.label}`, text: `${f.label} ${f.text}` }));

// 결과 카드에 뜨는 문장들 (십신별로 묶어서, 어느 십신 문장과 겹치는지 알 수 있게)
const cardTexts = [];
TEXTS.tenGods.forEach((g) => {
  ["meaning", "title", "overall", "love", "work", "money", "health"].forEach((k) =>
    cardTexts.push({ where: `${g.god}.${k}`, text: g[k] })
  );
  g.advice.forEach((a, i) => cardTexts.push({ where: `${g.god}.advice${i}`, text: a }));
});
TEXTS.relations.forEach((r) => cardTexts.push({ where: `relations.${r.key}`, text: `${r.title} ${r.text}` }));

let problems = 0;

// 결과 카드 문장 110여 개 중 다섯 번 이하로만 나오는 낱말을 "드문 낱말"로 봅니다.
const RARE = rareStems(
  cardTexts.map((c) => c.text),
  5
);

console.log("1) 시간대 문구 ↔ 결과 카드 문장");
for (const note of [...hourNotes, ...frames]) {
  for (const card of cardTexts) {
    // 낱말 두 개 이상이 겹치거나, 다섯 글자 이상 통째로 같으면 같은 표현으로 봅니다.
    const words = sharedStems(note.text, card.text, RARE);
    const chunk = overlaps(note.text, card.text);
    if (words.length >= 2 || chunk.length) {
      problems++;
      console.log(`  ✗ ${note.god} ↔ ${card.where}: ${[...words, ...chunk].join(", ")}`);
    }
  }
}

console.log("2) 시간대 문구끼리 (추천 카드 두 장이 동시에 보임)");
const all = [...hourNotes, ...frames];
for (let i = 0; i < all.length; i++) {
  for (let j = i + 1; j < all.length; j++) {
    const common = overlaps(all[i].text, all[j].text);
    if (common.length) {
      problems++;
      console.log(`  ✗ ${all[i].god} ↔ ${all[j].god}: ${common.join(", ")}`);
    }
  }
}

console.log("3) hourNote ↔ 바로 뒤에 붙는 프레임 문장의 낱말 반복");
// 추천 카드에서는 "<hourNote> <프레임 문장>"이 한 문단으로 이어 붙어요. 두 문장이 같은 낱말을
// 쓰면 바로 눈에 띄니, 조사·어미를 떼고 두 글자 이상 겹치는 낱말을 찾습니다.
for (const note of hourNotes) {
  for (const frame of PERIOD.hourFrames) {
    const shared = sharedStems(note.text, frame.text);
    if (shared.length) {
      problems++;
      console.log(`  ✗ ${note.god} + ${frame.label}: ${shared.join(", ")}`);
    }
  }
}

console.log("4) 평가형 표현(추천·비추천 양쪽에 붙어도 어색하지 않아야 함)");
const JUDGING = ["좋은 시간", "좋아요", "기 좋", "최고", "피하", "나쁜"];
for (const note of hourNotes) {
  const hit = JUDGING.filter((w) => note.text.includes(w));
  if (hit.length) {
    problems++;
    console.log(`  ✗ ${note.god}: ${hit.join(", ")}`);
  }
}

if (problems) {
  console.log(`\n${problems}건 확인 필요`);
  process.exit(1);
}
console.log("\n모두 통과");
