import { VIBE_LINES, TITLE_TEMPLATES } from "./texts";

// 입력값(+다시 뽑기 횟수)이 같으면 같은 결과가 나오도록 씨앗값 기반 난수를 씁니다.
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

function pickFresh(rng, arr, used) {
  const fresh = arr.filter((x) => !used.has(x));
  const chosen = pick(rng, fresh.length ? fresh : arr);
  used.add(chosen);
  return chosen;
}

const AVATAR = {
  skins: ["#FFE1C4", "#F6C9A0", "#E7AD84", "#C98E66"],
  hairColors: ["#2F2A2A", "#5A3E2B", "#8B5A3C", "#D9A441", "#3E6B8A", "#8B6FB0", "#D9694F"],
  blushes: ["#FF9E9E", "#FFB3C6", "#FFC98B"],
  hairByGender: {
    male: ["short", "spiky", "sidepart", "curly"],
    female: ["long", "bob", "bun", "ponytail", "curly"],
    neutral: ["short", "spiky", "sidepart", "curly", "long", "bob", "bun", "ponytail"],
  },
  expressions: ["smile", "grin", "wink"],
  accessories: [null, null, "sunglasses", "strawhat", "cap", "flower", "ribbon"],
};

export function randomAvatar(rng, gender = "neutral") {
  return {
    skin: pick(rng, AVATAR.skins),
    hairColor: pick(rng, AVATAR.hairColors),
    blush: pick(rng, AVATAR.blushes),
    hair: pick(rng, AVATAR.hairByGender[gender] || AVATAR.hairByGender.neutral),
    expression: pick(rng, AVATAR.expressions),
    accessory: pick(rng, AVATAR.accessories),
  };
}

function eligiblePool(pool, style) {
  if (style === "any") return pool;
  if (style === "neutral") return pool.filter((n) => n.gender_style === "neutral");
  return pool.filter((n) => n.gender_style === style || n.gender_style === "neutral");
}

// 고른 분위기와 겹치는 태그가 많을수록 뽑힐 확률이 높지만, 항상 같은 이름만
// 나오지 않도록 확정이 아닌 "가중치 추첨"으로 뽑습니다.
function weightedSample(rng, items, weights, count) {
  const list = items.map((item, i) => ({ item, w: weights[i] }));
  const out = [];
  while (out.length < count && list.length) {
    const total = list.reduce((s, x) => s + x.w, 0);
    let r = rng() * total;
    let idx = 0;
    while (r >= list[idx].w && idx < list.length - 1) {
      r -= list[idx].w;
      idx++;
    }
    out.push(list[idx].item);
    list.splice(idx, 1);
  }
  return out;
}

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

/**
 * 이름 카드 3장을 만듭니다.
 * seen: 이전 뽑기에서 이미 보여준 이름(name_local) — 다시 뽑기 때 겹치지 않게 제외.
 * 남은 후보가 3개 미만이면 전체 후보에서 다시 뽑습니다.
 */
export function drawNameCards({ country, city, nick, style, moods, roll, seen }) {
  const rng = mulberry32(
    hashString([nick, country.code, city.city_code, style, moods.join(","), roll].join("|"))
  );
  const eligible = eligiblePool(country.name_pool, style);
  let candidates = eligible.filter((n) => !seen.has(n.name_local));
  const recycled = candidates.length < 3;
  if (recycled) candidates = eligible;

  const weights = candidates.map(
    (n) => 1 + 3 * n.vibe_tags.filter((v) => moods.includes(v)).length
  );
  const picked = weightedSample(rng, candidates, weights, 3);

  const usedLines = new Set();
  const usedTitles = new Set();
  const cards = picked.map((n) => {
    const matched = n.vibe_tags.filter((v) => moods.includes(v));
    const vibe = pick(rng, matched.length ? matched : n.vibe_tags);
    const line = pickFresh(rng, VIBE_LINES[vibe], usedLines);

    const kind = pick(rng, ["food", "attraction", "city"]);
    const attraction = pick(rng, city.attractions);
    const vars = {
      nick,
      city: city.city_name,
      food: pick(rng, city.foods).name,
      attraction: attraction.short || attraction.name,
    };
    const titleTpl = pickFresh(rng, TITLE_TEMPLATES[kind], usedTitles);

    return {
      ...n,
      vibe,
      blurb: fill(line, vars),
      title: fill(titleTpl, vars),
      avatar: randomAvatar(rng, n.gender_style),
    };
  });

  return { cards, recycled };
}
