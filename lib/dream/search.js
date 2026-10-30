/**
 * 꿈해몽 문장 검색 엔진 — 브라우저 안에서만 돌아가는 순수 함수(서버·AI·유료 API 없음).
 *
 * "큰 뱀이 집에 들어와서 나를 물었어" 같은 문장을 받아
 *   1) 비슷한 말 사전(aliases.json)으로 상징(뱀·집)과 동작·수식어(물리다·큰)를 찾고
 *   2) 상세 페이지의 상황별 풀이 제목("뱀에게 물리는 꿈")과 겹치는 정도로 가장 비슷한 장면을 고르고
 *   3) 아무것도 못 찾으면 글자 2개씩 겹침(바이그램)으로 비슷한 꿈을 추천합니다.
 *
 * select.js처럼 JSON을 직접 import하지 않고 createDreamSearch({ symbols, aliases, titles })로
 * 데이터를 받습니다 — 그래야 scripts/dream/check-search.mjs가 Node에서 그대로 돌릴 수 있어요.
 *
 * 한국어 처리 방식(형태소 분석기 없이):
 *  - 글자를 자모(ㅂ+ㅐ+ㅁ)로 풀어서 비교합니다. 그래야 "잡았어"에서 "잡"을, "났어"에서 "나"를 찾을 수 있어요.
 *  - 사전 낱말 뒤에 붙은 조사(이/가/을/를/한테…)와 어미(었어/는데/고…)는 떼어 냅니다.
 *  - 한 글자 낱말(뱀·소·말·눈·비)은 오인식이 많아서 어절 첫머리에 있고 뒤에 조사가 붙거나 띄어쓰기로
 *    끝날 때만 인정합니다("소식"의 소, "비행기"의 비는 안 잡힘). 두 글자 이상은 띄어쓰기 없이도 찾습니다.
 *  - 같은 자리에서 여러 낱말이 맞으면 가장 긴 것을 고릅니다("말을 걸다" > "말", "눈물" > "눈").
 */

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = "\0ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ";

/** 한글 음절을 자모 문자열로 풉니다("뱀" → "ㅂㅐㅁ"). 한글이 아닌 글자는 그대로 둡니다. */
export function toJamo(str) {
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) {
      out += ch;
      continue;
    }
    const cho = Math.floor(code / 588);
    const jung = Math.floor((code % 588) / 28);
    const jong = code % 28;
    out += CHO[cho] + JUNG[jung] + (jong ? JONG[jong] : "");
  }
  return out;
}

/** 소문자·NFC로 맞추고 한글·영문·숫자 말고는 전부 띄어쓰기로 바꿉니다. */
export function normalizeText(text) {
  return String(text ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{Script=Hangul}a-z0-9]+/gu, " ")
    .trim();
}

// 명사 뒤에 붙는 조사·보조사·위치 명사·"꿈". 긴 것부터 떼어 내므로 순서는 상관없습니다.
const NOUN_SUFFIXES = [
  "이", "가", "을", "를", "은", "는", "에", "에서", "에게", "에게서", "한테", "한테서", "께", "께서",
  "으로", "로", "로부터", "와", "과", "랑", "이랑", "하고", "도", "만", "뿐", "의", "까지", "부터",
  "처럼", "같이", "같은", "마다", "조차", "마저", "밖에", "이나", "나", "이든", "든", "이라도", "라도",
  "이란", "란", "이라고", "라고", "이라는", "라는", "이라며", "이었", "였", "이에요", "예요", "이야", "야",
  "이고", "고", "이며", "인데", "인", "이면", "면", "이라", "라", "이지", "지", "입니다", "이었어", "였어",
  "이었어요", "였어요", "이었는데", "였는데", "이었고", "였고", "이었다", "였다", "인가", "일까", "이네", "네",
  "이래", "래", "이라서", "라서", "이니까", "니까", "이어서", "여서", "요", "들", "속", "안", "밖", "위",
  "아래", "밑", "옆", "앞", "뒤", "꿈", "ㄴ데", "ㄴ", "ㄹ", "ㄹ까", "ㄴ가", "ㄴ지", "ㅁ",
];

// 동사·형용사 어간 뒤에 붙는 어미. 받침으로 붙는 것(ㅆ·ㄴ·ㄹ·ㅁ)도 자모 단위라 뗄 수 있습니다.
const VERB_SUFFIXES = [
  "어", "아", "여", "어요", "아요", "여요", "었", "았", "였", "ㅆ", "ㅆ어", "ㅆ어요", "ㅆ는데", "ㅆ고", "ㅆ다",
  "ㅆ지", "ㅆ던", "ㅆ을", "ㅆ는", "ㅆ습니다", "는", "ㄴ", "ㄹ", "ㅁ", "은", "을", "던", "고", "고서", "서",
  "데", "는데", "ㄴ데", "지", "지만", "게", "다", "다가", "다니", "더니", "더라", "더라고", "면", "면서",
  "며", "자", "자마자", "기", "길", "래", "네", "네요", "구나", "군요", "죠", "습니다", "ㅂ니다", "나요",
  "ㄹ까", "ㄹ까요", "ㄹ래", "까", "라", "라고", "라서", "려", "려고", "려다", "려는데", "어서", "아서",
  "여서", "니", "니까", "나", "으", "요", "거든", "거든요", "잖아", "잖아요", "대", "대요", "던데", "던가",
  "ㄴ다", "는다", "ㄴ대", "는대", "ㄹ게", "ㄹ지", "ㄹ수", "수", "수가", "수도", "ㄴ지", "는지", "는걸",
  "ㄴ걸", "ㄹ걸", "ㄹ것", "것", "걸", "중", "어도", "아도", "여도", "어야", "아야", "여야", "어버", "아버",
  "어보", "아보", "여보", "어봤", "아봤", "여봤", "어주", "아주", "어줬", "어진", "어졌", "아진", "아졌",
  "어지", "아지", "어가", "어갔", "아가", "아갔", "어오", "어왔", "아오", "아왔", "어있", "어있었", "아있",
  "았었", "었었", "어했", "아했", "시", "셨", "세요", "셔", "는지", "을지", "을까", "을까봐", "ㄹ까봐",
];

// 수식어("큰", "흰")는 바로 다음 명사에 붙으므로 떼어 낼 꼬리가 없습니다.
const MOD_SUFFIXES = [];

function suffixList(list) {
  return [...new Set(list.map(toJamo))].sort((a, b) => b.length - a.length);
}
const SUFFIXES = {
  noun: suffixList(NOUN_SUFFIXES),
  verb: suffixList(VERB_SUFFIXES),
  mod: suffixList(MOD_SUFFIXES),
  block: suffixList([...NOUN_SUFFIXES, ...VERB_SUFFIXES]),
};

/** 비슷한 말 사전의 항목 하나(문자열 또는 {t, kind, w, keep, start})를 공통 모양으로 폅니다. */
function entryOf(raw, type, id, defaults = {}) {
  const o = typeof raw === "string" ? { t: raw } : raw;
  const text = normalizeText(o.t).replace(/ /g, "");
  const syl = [...text].length;
  const kind = o.kind ?? defaults.kind ?? "noun";
  // 한 글자 명사(소·말·눈)는 다른 말과 헷갈리기 쉬워 기본 점수를 낮춥니다.
  const w = o.w ?? defaults.w ?? (syl === 1 && kind === "noun" ? 0.6 : 1);
  return { text, jamo: toJamo(text), syl, kind, type, id, w, keep: !!o.keep, start: !!o.start, excl: !!(o.excl ?? defaults.excl) };
}

function buildDict(aliases) {
  const entries = [];
  for (const [id, list] of Object.entries(aliases.symbols || {})) {
    for (const raw of list) entries.push(entryOf(raw, "symbol", id));
  }
  for (const [id, group] of Object.entries(aliases.concepts || {})) {
    const defaults = { kind: group.kind, w: group.w, excl: group.excl };
    for (const raw of group.words || []) entries.push(entryOf(raw, "concept", id, defaults));
  }
  for (const raw of aliases.block || []) entries.push(entryOf(raw, "block", null, { kind: "block" }));

  // 첫 자모로 묶어 두고 긴 것부터 보게 정렬(같은 자리에서 가장 긴 낱말이 이기도록)
  const byCho = new Map();
  for (const e of entries) {
    if (!e.jamo) continue;
    const k = e.jamo[0];
    if (!byCho.has(k)) byCho.set(k, []);
    byCho.get(k).push(e);
  }
  for (const list of byCho.values()) list.sort((a, b) => b.jamo.length - a.jamo.length);
  return { entries, byCho };
}

/**
 * 사전 낱말 뒤에 붙은 조사·어미를 욕심껏(가장 긴 것부터) 떼어 냅니다.
 * 끝난 자리가 음절 경계여야 하므로, 마지막으로 음절 경계에 맞았던 자리를 돌려줍니다.
 */
function consumeSuffixes(J, pos, suffixes, sylAt, stopAt) {
  let p = pos;
  let used = 0;
  const good = sylAt.has(p) ? p : -1;
  if (good < 0) return { end: -1, used: 0 };
  for (;;) {
    // 띄어쓰기 뒤나 다른 낱말이 시작되는 자리("학교에 지각"의 "지", "흔들리는 다리"의 "다")는 조사로 삼키지 않습니다
    if (stopAt(sylAt.get(p))) break;
    let hit = null;
    for (const s of suffixes) {
      if (!J.startsWith(s, p)) continue;
      const q = p + s.length;
      // 조사는 음절 경계에서 끝나야 하고("뱀이집"에서 "이지"처럼 다음 글자를 반만 먹으면 안 됨),
      // 그 안에서 다른 낱말이 시작돼도 안 됩니다("핸드폰이 고장"의 "이고")
      if (!sylAt.has(q)) continue;
      let crosses = false;
      for (let r = p + 1; r < q; r++) if (sylAt.has(r) && stopAt(sylAt.get(r))) crosses = true;
      if (crosses) continue;
      hit = s;
      break;
    }
    if (!hit) break;
    p += hit.length;
    used++;
  }
  return { end: p, used };
}

/** 긴 낱말이 짧은 낱말에 조사만 붙은 꼴인지("바람이" ← "바람") */
function isInflection(longJamo, shortJamo) {
  let rest = longJamo.slice(shortJamo.length);
  while (rest) {
    const hit = SUFFIXES.noun.find((s) => rest.startsWith(s));
    if (!hit) return false;
    rest = rest.slice(hit.length);
  }
  return true;
}

/** 문장을 사전 낱말(상징·동작·수식어) 목록으로 바꿉니다. 검색어와 상황 제목 양쪽에 같은 함수를 씁니다. */
function makeParser(dict) {
  return function parse(text) {
    const norm = normalizeText(text);
    if (!norm) return [];
    const syls = [];
    const boundary = []; // 어절(띄어쓰기 단위)의 첫 글자인지
    for (const word of norm.split(" ")) {
      [...word].forEach((c, i) => {
        syls.push(c);
        boundary.push(i === 0);
      });
    }
    const n = syls.length;
    const offsets = new Array(n + 1);
    let J = "";
    for (let i = 0; i < n; i++) {
      offsets[i] = J.length;
      J += toJamo(syls[i]);
    }
    offsets[n] = J.length;
    const sylAt = new Map(offsets.map((o, i) => [o, i]));

    // 음절마다 두 글자 이상의 사전 낱말이 시작되는지 미리 계산(조사 떼기를 멈출 자리)
    const ws = new Array(n + 1).fill(false);
    for (let k = 0; k < n; k++) {
      ws[k] = boundary[k] || (dict.byCho.get(J[offsets[k]]) || []).some((e) => e.syl >= 2 && J.startsWith(e.jamo, offsets[k]));
    }
    const wordStartsAt = (k) => k < n && ws[k];
    const KKUM = toJamo("꿈");

    const tokens = [];
    let i = 0;
    let lastEnd = 0;
    let lastUsed = 0; // 바로 앞 낱말 뒤에서 떼어 낸 조사·어미 개수
    while (i < n) {
      const cands = [];
      const chained = boundary[i] || lastEnd === i; // 어절 첫머리이거나 바로 앞 낱말에 이어지는 자리
      // 두 글자 동사는 어절 첫머리이거나 조사 바로 뒤("뱀한테물렸")일 때만 — "치우는"의 "우는"은 안 됨
      const verbOk = boundary[i] || (lastEnd === i && lastUsed > 0);
      for (const e of dict.byCho.get(J[offsets[i]]) || []) {
        if (!J.startsWith(e.jamo, offsets[i])) continue;
        if (e.syl === 1 && !chained) continue;
        if (e.start && !boundary[i]) continue;
        // 어절 중간에서 시작하는 두 글자 동사("피우는"·"치우는"의 "우는")는 오인이 많아 명사만 허용
        if (e.syl === 2 && !verbOk && e.kind !== "noun") continue;
        const after = offsets[i] + e.jamo.length;
        const { end, used } = consumeSuffixes(J, after, SUFFIXES[e.kind], sylAt, wordStartsAt);
        if (end < 0) continue;
        const endSyl = sylAt.get(end);
        let w = e.w;
        if (e.syl === 1 && e.kind !== "mod") {
          // 한 글자 낱말은 뒤에 조사가 붙거나 어절이 끝나야 인정("소식"의 소는 안 됨)
          const bounded = used > 0 || endSyl === n || boundary[endSyl];
          if (!bounded) continue;
          if (J.startsWith(KKUM, after)) w = 1; // "뱀꿈"·"용꿈"처럼 꿈이 붙으면 확실한 상징
        }
        if (e.syl === 2 && !chained) w *= 0.8;
        cands.push({ e, endSyl, used, w });
      }
      if (cands.length === 0) {
        i++;
        continue;
      }
      cands.sort((a, b) => b.e.jamo.length - a.e.jamo.length);
      const best = cands[0];
      const emit = [best];
      for (const c of cands.slice(1)) {
        if (c.e.jamo.length === best.e.jamo.length) {
          emit.push(c); // 같은 길이의 다른 뜻(명사 "쥐"와 동사 "쥐다")은 둘 다
        } else if (best.e.keep && c.e.type === "symbol" && c.e.kind === "noun" && !isInflection(best.e.jamo, c.e.jamo)) {
          // keep 표시가 있는 긴 말("바다에 빠지다"=물에 빠지는 꿈) 안의 "바다" 같은 상징도 살리되 점수는 조금 낮춥니다
          emit.push({ ...c, w: c.w * 0.8 });
        }
      }
      for (const c of emit) {
        if (c.e.type === "block") continue;
        tokens.push({ type: c.e.type, id: c.e.id, text: c.e.text, w: c.w, at: i, end: c.endSyl });
      }
      lastEnd = best.endSyl;
      lastUsed = best.used;
      i = best.endSyl;
    }
    return tokens;
  };
}

/** 낱말 목록을 "s:뱀 / c:bite / a:구렁이" 같은 열쇠 → 점수 맵으로 바꿉니다(겹침 계산용). */
function keysOf(tokens) {
  const keys = new Map();
  const put = (k, w) => keys.set(k, Math.max(keys.get(k) || 0, w));
  for (const t of tokens) {
    put(t.type === "symbol" ? `s:${t.id}` : `c:${t.id}`, t.w);
    put(`a:${t.text}`, t.w);
  }
  return keys;
}

/** 글자 2개씩 겹침(바이그램) — 오타·사전에 없는 말을 위한 마지막 보조 수단 */
function bigrams(compact) {
  const set = new Set();
  const cs = [...compact];
  for (let i = 0; i + 1 < cs.length; i++) set.add(cs[i] + cs[i + 1]);
  return set;
}
function bigramScore(qGrams, textGrams) {
  if (qGrams.size === 0 || textGrams.size === 0) return 0;
  let hit = 0;
  for (const g of qGrams) if (textGrams.has(g)) hit++;
  return hit / qGrams.size;
}

export const MAX_RESULTS = 6;
// 꿈의 배경(장소)으로 자주 쓰이는 상징("성당에서 결혼식"의 성당)과, 장소로 쓰였다고 볼 끝말("집에", "집으로", "집 안", "우리 집에서")
const PLACE_SYMBOLS = new Set(["house", "church"]);
const PLACE_ENDING = /(에|에서|으로|로|안|앞|밖|안에|안으로|앞에|밖에)$/;
const MIN_SCORE = 0.5; // 이 아래는 결과로 안 보여 줌
const SITUATION_WEIGHT = 0.6; // 가장 비슷한 장면 점수를 상징 점수에 얼마나 보탤지

/**
 * @param symbols symbols.json의 symbols 배열
 * @param aliases aliases.json
 * @param titles  { [id]: { situations: [제목…], faq: [질문…] } } — pages.json에서 제목만 뽑은 것
 */
export function createDreamSearch({ symbols, aliases, titles = {} }) {
  const dict = buildDict(aliases);
  const parse = makeParser(dict);
  const symbolById = Object.fromEntries(symbols.map((s) => [s.id, s]));
  const primaryAlias = Object.fromEntries(
    Object.entries(aliases.symbols || {}).map(([id, list]) => [id, entryOf(list[0], "symbol", id).text])
  );
  const aliasOwner = new Map();
  const aliasWeight = new Map();
  for (const e of dict.entries) {
    if (e.type !== "symbol") continue;
    aliasOwner.set(e.text, e.id);
    aliasWeight.set(e.text, e.w);
  }

  // 상황별 풀이 제목·FAQ 질문을 미리 낱말로 풀어 둡니다(상징 120개 기준 800개 남짓, 수 ms).
  const pageIndex = {};
  for (const [id, t] of Object.entries(titles)) {
    pageIndex[id] = {
      situations: (t.situations || []).map((title, index) => ({ index, title, keys: keysOf(parse(title)) })),
      faq: (t.faq || []).map((q, index) => ({ index, q, keys: keysOf(parse(q)) })),
    };
  }

  // 바이그램 보조용 글자 뭉치: 라벨 + 짧은 해석 + 비슷한 말 전부
  const blobs = symbols.map((s) => {
    const words = [s.label, s.keyword, ...(aliases.symbols?.[s.id] || []).map((a) => (typeof a === "string" ? a : a.t))];
    return { id: s.id, grams: bigrams(normalizeText(words.join(" ")).replace(/ /g, "")) };
  });

  /** 검색어 열쇠와 제목 열쇠가 얼마나 겹치는지(자기 상징 이름 자체는 0점) */
  function overlap(qKeys, tKeys, ownId) {
    let score = 0;
    let total = 0; // 제목에 든 낱말 수(자기 상징 제외)
    let matched = 0;
    for (const [k, w] of tKeys) {
      if (k === `s:${ownId}`) continue;
      if (k.startsWith("a:")) {
        const text = k.slice(2);
        // 같은 상징의 특정한 말(구렁이·앞니·백마)이 똑같이 나왔을 때만 살짝 보탬("다리를"처럼 점수 낮은 말은 제외)
        if (qKeys.has(k) && aliasOwner.get(text) === ownId && text !== primaryAlias[ownId] && aliasWeight.get(text) >= 1) score += 0.2;
        continue;
      }
      total++;
      if (!qKeys.has(k)) continue;
      matched++;
      // 다른 상징이 함께 나온 건 수식어가 겹친 것보다 강한 신호
      score += Math.min(w, qKeys.get(k)) * (k.startsWith("s:") ? 1.2 : 1);
    }
    // 같은 점수면 제목의 낱말이 검색어에 더 많이 들어 있는 쪽("다리가 흔들리는" > "긴 다리를 끝까지 건너는")
    return total > 0 ? score + 0.1 * (matched / total) : score;
  }

  /** 제목에는 있는데 검색어에는 없는 낱말의 무게 — 점수가 같을 때 덜 어긋나는 장면을 고르는 데 씀
   *  ("집에 불이 났어" → "다른 사람의 집에 불이 나는 꿈"보다 "집이나 건물에 불이 나는 꿈") */
  function missOf(qKeys, tKeys, ownId) {
    let miss = 0;
    for (const [k, w] of tKeys) {
      if (k === `s:${ownId}` || k.startsWith("a:") || qKeys.has(k)) continue;
      miss += w;
    }
    return miss;
  }

  function search(query) {
    const tokens = parse(query);
    const qKeys = keysOf(tokens);
    const syls = [...normalizeText(query).replace(/ /g, "")];

    const base = new Map(); // 상징 id → { score, aliases, place }
    for (const t of tokens) {
      if (t.type !== "symbol") continue;
      const cur = base.get(t.id) || { score: 0, aliases: new Set(), place: true };
      cur.aliases.add(t.text);
      cur.score = Math.max(cur.score, t.w);
      // "집에 불이 났어"의 집처럼 장소로만 쓰였는지(어느 한 번이라도 주어·목적어로 쓰였으면 상징)
      if (!(PLACE_SYMBOLS.has(t.id) && PLACE_ENDING.test(syls.slice(t.at, t.end).join("")))) cur.place = false;
      base.set(t.id, cur);
    }
    const named = base.size > 0;
    // 장소로만 쓰인 집은 다른 상징이 함께 있을 때만 '배경'으로 낮춥니다 — 집 하나만 적었으면 그대로 집꿈
    const hasSubject = [...base.values()].some((b) => !b.place);

    const results = [];
    for (const s of symbols) {
      const b = base.get(s.id);
      const baseScore = b ? b.score : 0;
      const idx = pageIndex[s.id];
      const situations = (idx?.situations || [])
        .map((it) => ({ index: it.index, title: it.title, score: overlap(qKeys, it.keys, s.id), miss: missOf(qKeys, it.keys, s.id) }))
        .filter((it) => it.score > 0)
        .sort((a, b) => b.score - a.score || a.miss - b.miss);
      const faq = (idx?.faq || [])
        .map((it) => ({ index: it.index, q: it.q, score: overlap(qKeys, it.keys, s.id) }))
        .filter((it) => it.score >= 1)
        .sort((a, b) => b.score - a.score);
      const best = situations[0]?.score || 0;

      let score;
      let via = "symbol";
      if (baseScore > 0) {
        score = baseScore + SITUATION_WEIGHT * Math.min(best, 2) + 0.3 * Math.min(faq[0]?.score || 0, 2);
        if (b.place && hasSubject) {
          // 배경(장소)으로 쓰인 상징 — 비슷한 꿈 목록엔 남기되 1등·'함께 나온 꿈' 묶음에서는 뺍니다
          score *= 0.6;
          via = "place";
        }
      } else if (!named && best >= 1.2) {
        // 상징 이름 없이 장면만 적은 검색("한꺼번에 우수수 빠졌어") → 단서가 둘 이상 겹치는 장면의 꿈을 보여 줍니다
        score = 0.5 * Math.min(best, 2);
        via = "situation";
      } else {
        continue;
      }
      if (score < MIN_SCORE) continue;
      results.push({
        id: s.id,
        score: Math.round(score * 100) / 100,
        via,
        situations: situations.slice(0, 2),
        faq: faq.slice(0, 1),
      });
    }
    results.sort((a, b) => b.score - a.score || (b.via === "symbol") - (a.via === "symbol"));

    const out = { query, tokens, results: results.slice(0, MAX_RESULTS), fallback: false, suggestions: [] };
    if (out.results.length === 0) {
      out.fallback = true;
      out.suggestions = suggestByBigram(query);
      // 글자 겹침으로도 못 찾으면("ㅂㅐㅁ"처럼 자모만 쳤을 때) 자동 완성 후보라도 보여 줍니다
      if (out.suggestions.length === 0) {
        const seen = new Set();
        for (const s of suggest(query, 8)) {
          if (seen.has(s.id)) continue;
          seen.add(s.id);
          out.suggestions.push({ id: s.id, score: 0 });
          if (out.suggestions.length >= 4) break;
        }
      }
    }
    return out;
  }

  function suggestByBigram(query) {
    const q = bigrams(normalizeText(query).replace(/ /g, ""));
    return blobs
      .map((b) => ({ id: b.id, score: Math.round(bigramScore(q, b.grams) * 100) / 100 }))
      .filter((b) => b.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  // 자동 완성 후보: 상징(이름·검색명·비슷한 말) + 상황 제목. 자모 단위라 "ㅂ", "배"만 쳐도 "뱀"이 잡힙니다.
  // 글자 단위로 묶어 두어야 "이빨"이 "구름이 빠르게"의 "이 빠" 속에서 잡히는 일이 없습니다.
  const wordJamos = (text) =>
    normalizeText(text)
      .split(" ")
      .filter(Boolean)
      .map((w) => [...w].map(toJamo)); // 어절 → 글자별 자모
  // 어절별 글자 자모 + 띄어쓰기를 없앤 전체("호랑이에게 쫓"처럼 여러 어절을 이어 칠 때용)
  const wordSet = (text) => {
    const words = wordJamos(text);
    return words.length > 1 ? [...words, words.flat()] : words;
  };
  const completions = [];
  for (const s of symbols) {
    const display = titles[s.id]?.searchName || s.label;
    const names = [...new Set([s.label, titles[s.id]?.searchName].filter(Boolean))];
    const extra = (aliases.symbols?.[s.id] || []).map((a) => (typeof a === "string" ? a : a.t));
    completions.push({ type: "symbol", id: s.id, text: display, names: names.flatMap(wordSet), words: extra.flatMap(wordSet), len: [...display].length });
  }
  for (const [id, t] of Object.entries(titles)) {
    (t.situations || []).forEach((title, index) =>
      completions.push({ type: "situation", id, index, text: title, names: wordSet(title), words: [], len: [...title].length })
    );
  }
  /**
   * 글자 경계에서 시작하는 자모 접두 일치 점수(작을수록 좋음, 없으면 -1).
   * 어절 첫머리 0 / 어절 안 글자 +2, 입력이 글자 중간에서 끝나면("전남"↔"전나무") +0.5
   */
  function matchAt(words, p) {
    let best = -1;
    for (const chars of words) {
      for (let i = 0; i < chars.length; i++) {
        if (!chars[i].startsWith(p[0])) continue;
        let acc = "";
        let aligned = false;
        for (let j = i; j < chars.length && acc.length < p.length; j++) {
          acc += chars[j];
          if (acc === p) aligned = true;
        }
        if (!acc.startsWith(p)) continue;
        const score = (i === 0 ? 0 : 2) + (aligned ? 0 : 0.5);
        if (best < 0 || score < best) best = score;
      }
    }
    return best;
  }

  function suggest(prefix, limit = 8) {
    const p = toJamo(normalizeText(prefix).replace(/ /g, ""));
    if (!p) return [];
    return completions
      .map((c) => {
        const onName = matchAt(c.names, p);
        const onWord = onName < 0 ? matchAt(c.words, p) : -1;
        if (onName < 0 && onWord < 0) return null;
        // 이름(검색명·라벨·제목)에 맞은 것 > 비슷한 말에 맞은 것, 상징 > 상황 제목
        // (상황 제목은 600개가 넘어 "배"처럼 짧게 치면 "배신"·"배우자" 같은 제목이 상징 "뱀"을 밀어내기 쉬워서,
        //  글자 중간에서 맞은 상징 이름(+0.5)보다도 뒤에 오게 0.75를 더함)
        const rank = (onName >= 0 ? onName : onWord + 1) + (c.type === "symbol" ? 0 : 0.75);
        return { ...c, rank };
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank || a.len - b.len)
      .slice(0, limit)
      .map(({ type, id, index, text }) => (type === "symbol" ? { type, id, text } : { type, id, index, text }));
  }

  return { search, suggest, parse, symbolById };
}
