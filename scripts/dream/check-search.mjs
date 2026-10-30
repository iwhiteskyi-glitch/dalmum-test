// 꿈해몽 문장 검색(lib/dream/search.js)이 대표 문장에서 맞는 상징·장면을 찾는지 검사합니다.
// 실행: node scripts/dream/check-search.mjs            → 전체 검사
//       node scripts/dream/check-search.mjs "문장"     → 그 문장의 낱말 분석·결과를 보여 줌(사전 다듬을 때)
import { readFileSync } from "node:fs";
import { createDreamSearch } from "../../lib/dream/search.js";

const DATA = JSON.parse(readFileSync("lib/dream/symbols.json", "utf8"));
const ALIASES = JSON.parse(readFileSync("lib/dream/aliases.json", "utf8"));
const PAGES = JSON.parse(readFileSync("lib/dream/pages.json", "utf8"));
const titles = Object.fromEntries(
  Object.entries(PAGES).map(([id, p]) => [id, { searchName: p.searchName, situations: p.situations.map((s) => s.title), faq: (p.faq || []).map((f) => f.q) }])
);
const engine = createDreamSearch({ symbols: DATA.symbols, aliases: ALIASES, titles });

let fail = 0;
function check(name, cond) {
  if (!cond) {
    fail++;
    console.log(`FAIL: ${name}`);
  }
}

// 1) 사전 자체가 멀쩡한지
const ids = new Set(DATA.symbols.map((s) => s.id));
for (const id of Object.keys(ALIASES.symbols)) check(`aliases.symbols "${id}"는 실제 상징`, ids.has(id));
for (const id of ids) check(`상징 "${id}"에 비슷한 말이 있음`, (ALIASES.symbols[id] || []).length > 0);
const owner = new Map();
for (const [id, list] of Object.entries(ALIASES.symbols)) {
  for (const raw of list) {
    const t = (typeof raw === "string" ? raw : raw.t).replace(/ /g, "");
    check(`"${t}"가 ${owner.get(t)}·${id} 두 상징에 겹치지 않음`, !owner.has(t) || owner.get(t) === id);
    owner.set(t, id);
  }
}
for (const [id, g] of Object.entries(ALIASES.concepts)) {
  check(`concepts.${id}.kind가 verb/mod/noun`, ["verb", "mod", "noun"].includes(g.kind));
  check(`concepts.${id}.words 비어있지 않음`, Array.isArray(g.words) && g.words.length > 0);
}

// 2) 대표 문장 — first: 1등이어야 하는 상징, top: 결과 안에 있어야 하는 상징, none: 결과에 없어야 하는 상징,
//    scene: first 상징의 가장 비슷한 장면 제목에 들어 있어야 하는 말
const CASES = [
  { q: "큰 뱀이 집에 들어와서 나를 물었어", first: "snake", top: ["house"], scene: "물리" },
  { q: "구렁이가 안방에 있었어요", first: "snake", scene: "구렁이" },
  { q: "뱀한테물렸어요", first: "snake", scene: "물리" },
  { q: "흰 뱀이 나왔어", first: "snake", scene: "흰 뱀" },
  { q: "뱀이 여러 마리 나왔어", first: "snake" },
  { q: "이가 우수수 빠지는 꿈", first: "teeth", scene: "한꺼번에" },
  { q: "앞니가 빠졌어", first: "teeth", scene: "앞니" },
  { q: "치아가 흔들리기만 했어", first: "teeth", scene: "흔들리기만" },
  { q: "돌아가신 할머니가 웃으면서 나왔어", first: "ancestor", scene: "웃으며" },
  { q: "할머니가 돌아가셨어", first: "death", scene: "가족" },
  { q: "내가 죽는 꿈을 꿨어요", first: "death", scene: "내가 죽는" },
  { q: "호랑이한테 쫓겨서 도망쳤어", first: "tiger", top: ["chased"], scene: "쫓기" },
  { q: "용이 하늘로 올라갔어", first: "dragon", scene: "승천" },
  { q: "물고기를 엄청 많이 잡았어", first: "fish", scene: "많이 잡" },
  { q: "돼지가 품에 안겼어요", first: "pig", scene: "품 안" },
  { q: "거미줄에 걸렸어", first: "spider", scene: "거미줄에 걸리" },
  { q: "맑은 물에 들어가서 몸을 담갔어", first: "water" },
  { q: "집에 불이 났어요", first: "fire", top: ["house"], scene: "집이나 건물" },
  { q: "우산 쓰고 비 맞으면서 걸었어", first: "rain", scene: "우산" },
  { q: "함박눈이 소복하게 쌓였어", first: "snow", scene: "쌓이" },
  { q: "쌍무지개를 봤어요", first: "rainbow", scene: "쌍무지개" },
  { q: "번개를 맞았어", first: "lightning", scene: "번개를 맞" },
  { q: "아기를 안고 있었어요", first: "baby", scene: "안는" },
  { q: "내가 결혼식을 올렸어", first: "wedding", scene: "내가 결혼식" },
  { q: "모르는 사람이 계속 쳐다봤어", first: "stranger", scene: "쳐다보" },
  { q: "전남친한테 연락이 왔어", first: "ex", scene: "연락" },
  { q: "사람들이 엄청 많은 곳에서 길을 잃었어", first: "crowd", top: ["lost"], scene: "길을 잃" },
  { q: "검은 고양이가 나타났어", first: "cat", scene: "검은" },
  { q: "강아지가 졸졸 따라왔어", first: "dog", scene: "따라오" },
  { q: "흰 쥐가 나왔어요", first: "rat", scene: "흰 쥐" },
  { q: "소가 집 안으로 들어왔어", first: "cow", scene: "집 안" },
  { q: "백마를 타고 달렸어", first: "horse" },
  { q: "새가 집 안으로 날아들어왔어", first: "bird", scene: "집 안으로" },
  { q: "바퀴벌레가 잔뜩 나왔어", first: "bug", scene: "바퀴벌레" },
  { q: "상어한테 물렸어", first: "shark", scene: "물리" },
  { q: "거친 파도가 몰아쳤어", first: "sea", scene: "거친 파도" },
  { q: "산 정상까지 올라갔어", first: "mountain", scene: "정상" },
  { q: "보름달이 엄청 밝았어", first: "star", scene: "보름달" },
  { q: "꽃다발을 선물로 받았어", first: "flower", scene: "선물" },
  { q: "잘 익은 사과를 땄어", first: "fruit", scene: "따는" },
  { q: "나무가 쓰러졌어", first: "tree", scene: "쓰러지" },
  { q: "홍수가 나서 집이 물에 잠겼어", first: "flood", scene: "잠기" },
  { q: "땅이 갈라졌어", first: "earthquake", scene: "갈라지" },
  { q: "임신한 걸 알게 됐어", first: "pregnant", scene: "알게" },
  { q: "귀신한테 쫓겼어", first: "ghost", scene: "쫓기" },
  { q: "아이돌이랑 사진 찍었어", first: "celebrity", scene: "사진" },
  { q: "반지를 잃어버렸어", first: "ring", scene: "잃어버리" },
  { q: "길에서 지갑을 주웠어", first: "wallet", scene: "줍" },
  { q: "핸드폰이 고장났어", first: "phone", scene: "고장" },
  { q: "열쇠로 문을 열었어", first: "key", scene: "문을 여는" },
  { q: "새 옷을 입었어요", first: "clothes", none: ["bird"], scene: "새 옷" },
  { q: "시체를 봤어요", first: "corpse" },
  { q: "장례식장에 갔는데 사람이 많았어", first: "funeral", top: ["crowd"], scene: "많은 사람" },
  { q: "학교에 지각했어", first: "school", top: ["late"], scene: "지각" },
  { q: "화장실을 못 찾아서 헤맸어", first: "toilet", scene: "찾지 못해" },
  { q: "엘리베이터가 추락했어", first: "elevator", scene: "추락" },
  { q: "계단에서 굴렀어", first: "stairs", scene: "구르" },
  { q: "로또 1등에 당첨됐어", first: "lottery", scene: "당첨" },
  { q: "거울이 깨졌어", first: "mirror", scene: "깨지" },
  { q: "시험 보러 가는데 늦었어", top: ["exam", "late"] },
  { q: "운전하다가 사고 났어", first: "accident" },
  { q: "비행기가 심하게 흔들렸어", first: "plane", scene: "흔들리" },
  { q: "물에 빠져서 가라앉았어", first: "drown", scene: "가라앉" },
  { q: "감옥에서 탈출했어", first: "prison", scene: "탈출" },
  { q: "도둑이 집에 들어왔어", first: "thief", top: ["house"], scene: "집에 도둑" },
  { q: "전쟁이 나서 피난 갔어", first: "war", scene: "피난" },
  { q: "시험에서 떨어졌어", first: "failexam", none: ["falling"] },
  { q: "가위에 눌려서 소리를 못 질렀어", first: "paralysis", scene: "소리를 지르" },
  { q: "군대에 다시 입대하는 꿈", first: "army", scene: "입대" },
  { q: "흔들리는 다리를 건넜어", first: "bridge", scene: "흔들리" },
  { q: "하늘을 훨훨 날았어", first: "flying" },
  { q: "높은 곳에서 떨어졌어", first: "falling" },
  { q: "똥을 밟았어", first: "poop" },
  { q: "돈다발을 주웠어", first: "money" },
  { q: "황금을 받았어", first: "gold" },
  { q: "이사 가는 꿈", first: "moving" },
  { q: "친구랑 크게 싸웠어", first: "fight" },
  { q: "뷔페에서 맛있게 먹었어", first: "eating" },
  { q: "엉엉 울다가 깼어", first: "crying", scene: "엉엉" },
  { q: "크게 웃는 꿈", first: "laughing", scene: "크게 웃" },
  { q: "머리카락이 뭉텅 빠졌어", first: "hair" },
  { q: "알몸으로 길거리에 있었어", first: "naked" },
  { q: "코피가 났어", first: "blood" },
  { q: "여드름을 짰어", first: "acne", scene: "짜내" },
  { q: "손톱을 깎다가 다쳤어", first: "nails", scene: "다치" },
  { q: "남편이 바람피우는 꿈", first: "affair", none: ["horse", "storm"] },
  { q: "청혼을 받았어요", first: "proposal" },
  { q: "이혼하자고 했어", first: "divorce" },
  { q: "짝사랑하는 사람이랑 눈이 마주쳤어", first: "romance", none: ["snow"], scene: "눈이 마주" },
  { q: "쌍둥이를 낳았어", first: "birth", scene: "쌍둥이" },
  { q: "거북이가 알을 낳았어", first: "turtle", scene: "알을" },
  { q: "나비를 손으로 잡았어", first: "butterfly", scene: "손으로 잡" },
  { q: "곰한테 쫓기는 꿈", first: "bear" },
  { q: "토끼가 새끼를 많이 낳았어", first: "rabbit", scene: "새끼" },
  { q: "원숭이가 물건을 뺏어갔어", first: "monkey", scene: "빼앗" },
  { q: "태풍이 지나가고 날이 맑아졌어", first: "storm", scene: "맑아지" },
  { q: "안개 속에서 길을 잃었어", first: "fog", scene: "길을 잃" },
  { q: "먹구름이 몰려왔어", first: "cloud", none: ["eating"], scene: "먹구름" },
  { q: "차가운 물을 마셨어", first: "water", none: ["car"] },
  { q: "정말 무서운 꿈이었어", none: ["horse"] },
  { q: "말을 타고 달리는 꿈", first: "horse" },
  { q: "친구가 나한테 말을 걸었어", none: ["horse"] },
  { q: "별로 안 무서웠는데 뱀이 나왔어", first: "snake", none: ["star"] },
  { q: "비행기를 놓쳤어", top: ["late", "plane"], none: ["rain"] },
  { q: "눈물이 멈추지 않았어", first: "crying", none: ["snow"] },
  { q: "새 신발을 샀어", first: "shoes", none: ["bird"] },
  { q: "눈을 치우는 꿈", first: "snow" },
  { q: "큰 잉어가 품으로 들어왔어 태몽인가요", top: ["pregnant", "fish"] },
  { q: "용꿈 꾸면 복권 사야 하나요", first: "dragon", top: ["lottery"] },
  { q: "강에 빠졌어", first: "drown" },
  { q: "소나기가 쏟아졌어", first: "rain", none: ["cow"] },
  { q: "개나리가 피었어", first: "flower", none: ["dog"] },
  { q: "지진이 나서 건물이 무너졌어", first: "earthquake", scene: "무너지" },
  { q: "소식이 왔어", none: ["cow"] },
  { q: "불안했어", none: ["fire"] },
  { q: "청소를 했어", none: ["cow"] },
  { q: "힘들어 죽겠어", none: ["death"] },
  { q: "용기를 냈어", none: ["dragon"] },
  { q: "지금 금방 갈게", none: ["gold"] },
  { q: "개미가 줄지어 갔어", first: "bug", none: ["dog"] },
  { q: "바람이 세게 불었어", first: "storm", none: ["affair"] },
];

let pass = 0;
for (const c of CASES) {
  const r = engine.search(c.q);
  const ids = r.results.map((x) => x.id);
  const problems = [];
  if (c.first && ids[0] !== c.first) problems.push(`1등이 ${ids[0] ?? "없음"} (기대 ${c.first})`);
  for (const id of c.top || []) if (!ids.includes(id)) problems.push(`${id} 없음`);
  for (const id of c.none || []) if (ids.includes(id)) problems.push(`${id}가 나오면 안 됨`);
  if (c.scene) {
    const hit = r.results.find((x) => x.id === c.first);
    const best = hit?.situations[0]?.title || "";
    if (!best.includes(c.scene)) problems.push(`장면 "${best}" (기대 "${c.scene}" 포함)`);
  }
  if (problems.length === 0) pass++;
  else {
    fail++;
    console.log(`FAIL: "${c.q}" → [${ids.join(", ")}] · ${problems.join(" / ")}`);
  }
}
console.log(`대표 문장 ${pass}/${CASES.length} 통과`);

// 3) 자동 완성
check("자동완성 '배' → 뱀 포함", engine.suggest("배").some((s) => s.id === "snake"));
check("자동완성 'ㅇㅁ' 같은 자모 조각도 오류 없음", Array.isArray(engine.suggest("ㅇ")));
check("빈 검색어는 결과 없음", engine.search("").results.length === 0);

// 문장 하나를 넘기면 분석 결과를 보여 줍니다(사전 다듬을 때 씀)
const arg = process.argv[2];
if (arg) {
  const r = engine.search(arg);
  console.log("\n낱말:", r.tokens.map((t) => `${t.text}(${t.type === "symbol" ? t.id : "c:" + t.id}${t.w !== 1 ? " " + t.w : ""})`).join(" "));
  for (const x of r.results) console.log(`${x.id} ${x.score}${x.via === "situation" ? " (장면으로)" : ""}`, x.situations.map((s) => `${s.title}(${s.score})`).join(" | "));
  if (r.fallback) console.log("추천:", r.suggestions.map((s) => `${s.id}(${s.score})`).join(" "));
} else {
  console.log(fail === 0 ? "전부 통과" : `${fail}건 실패`);
  process.exit(fail === 0 ? 0 : 1);
}
