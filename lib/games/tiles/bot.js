// 숫자 타일 컴퓨터 참가자 (실력은 "보통" 하나). 방장 폰이 컴퓨터 대신 판을 고치고 차례를 마친다.
// 자기 손패와 판만 보고 정한다 (다른 사람 손패는 보지 않는다).
// 하는 일: 손패로 만들 수 있는 묶음을 내려놓고, 판의 묶음 끝에 붙일 수 있는 타일을 붙인다. 판을 크게 다시 짜지는 않는다.
// 한 번에 다 하지 않고 "고치기 → (잠깐 뒤) 마치기" 두 번에 나눠서, 사람이 무엇을 냈는지 볼 수 있게 한다.
import { SPIN_MS } from "../opening.js";
import {
  colorOf,
  groupSum,
  isJoker,
  isValidGroup,
  MAX_NUMBER,
  MELD_MIN,
  numberOf,
  runStart,
  SET_MAX,
  setNumber,
} from "./tiles.js";
/** 판이 바뀐 뒤 컴퓨터가 움직이기까지 (사람이 판을 읽을 틈) */
export const BOT_DELAY_MS = 1_500;
const sameDraft = (a, b) =>
  a.length === b.length && a.every((g, i) => g.length === b[i].length && g.every((t, j) => t === b[i][j]));
/**
 * 손패로 만들 수 있는 묶음 후보 (조커는 묶음마다 많아야 하나, 부족한 자리 하나를 채울 때만).
 * 같은 숫자: 색이 다른 타일 3~4개. 이어진 숫자: 같은 색으로 3개 이상 이어진 것 (가장 긴 것)
 */
export function candidateGroups(hand) {
  const jokers = hand.filter(isJoker);
  const plain = hand.filter((t) => !isJoker(t));
  const out = [];
  // 같은 숫자
  for (let n = 1; n <= MAX_NUMBER; n++) {
    const byColor = new Map();
    for (const t of plain) if (numberOf(t) === n && !byColor.has(colorOf(t))) byColor.set(colorOf(t), t);
    const tiles = [...byColor.values()];
    if (tiles.length >= 3) out.push(tiles.slice(0, SET_MAX));
    else if (tiles.length === 2 && jokers.length > 0) out.push([...tiles, jokers[0]]);
  }
  // 이어진 숫자 (색마다 숫자를 한 벌만 써서 가장 긴 연속 구간, 빈 자리 하나는 조커로)
  for (let c = 0; c < 4; c++) {
    const byNumber = new Map();
    for (const t of plain) if (colorOf(t) === c && !byNumber.has(numberOf(t))) byNumber.set(numberOf(t), t);
    let n = 1;
    while (n <= MAX_NUMBER) {
      if (!byNumber.has(n)) {
        n++;
        continue;
      }
      // n부터 이어지는 구간. 빈 칸 하나는 조커로 메울 수 있다
      const run = [];
      let usedJoker = false;
      let k = n;
      while (k <= MAX_NUMBER) {
        if (byNumber.has(k)) run.push(byNumber.get(k));
        else if (!usedJoker && jokers.length > 0 && byNumber.has(k + 1)) {
          run.push(jokers[0]);
          usedJoker = true;
        } else break;
        k++;
      }
      if (run.length >= 3) out.push(run);
      n = k + 1;
    }
  }
  return out.filter(isValidGroup);
}
/** 서로 겹치지 않는 묶음들을 합이 큰 순서로 고른다 */
export function pickDisjoint(groups) {
  const sorted = [...groups].sort((a, b) => groupSum(b) - groupSum(a));
  const used = new Set();
  const picked = [];
  for (const g of sorted) {
    if (g.some((t) => used.has(t))) continue;
    g.forEach((t) => used.add(t));
    picked.push(g);
  }
  return picked;
}
/** 타일 하나를 판의 묶음 끝에 붙일 수 있으면 붙인 묶음, 아니면 null */
export function attach(group, tile) {
  if (isJoker(tile)) return null; // 조커는 아껴 둔다
  if (setNumber(group) !== null) {
    const next = [...group, tile];
    return setNumber(next) !== null ? next : null;
  }
  if (runStart(group) !== null) {
    const after = [...group, tile];
    if (runStart(after) !== null) return after;
    const before = [tile, ...group];
    if (runStart(before) !== null) return before;
  }
  return null;
}
/**
 * 이번 차례에 할 일: 고친 판. 낼 것이 없으면 null.
 * 첫 등록 전이면 손패 묶음만으로 30 이상일 때만 낸다 (규칙이 꺼져 있으면 묶음 하나면 된다)
 */
export function planTurn(hand, board, melded, meld30) {
  const fresh = pickDisjoint(candidateGroups(hand));
  if (!melded && meld30) {
    const sum = fresh.reduce((s, g) => s + groupSum(g), 0);
    return sum >= MELD_MIN ? [...board, ...fresh] : null;
  }
  let draft = [...board, ...fresh];
  const used = new Set(fresh.flat());
  let left = hand.filter((t) => !used.has(t));
  // 남은 타일을 판의 묶음 끝에 붙인다 (붙일 수 있는 동안 반복)
  let changed = true;
  while (changed) {
    changed = false;
    for (const tile of left) {
      const i = draft.findIndex((g) => attach(g, tile) !== null);
      if (i < 0) continue;
      draft = draft.map((g, j) => (j === i ? attach(g, tile) : g));
      left = left.filter((t) => t !== tile);
      changed = true;
      break;
    }
  }
  return left.length === hand.length ? null : draft;
}
export const tilesBot = {
  act: (state, botId) => {
    const { round } = state;
    if (round.turn !== botId || round.winners.length > 0 || state.champions.length > 0) return null;
    if (!sameDraft(round.draft, round.board)) return { type: "done" }; // 아까 고쳐 둔 판을 확정
    const plan = planTurn(round.hands[botId], round.board, round.melded.includes(botId), state.settings.meld30);
    return plan ? { type: "edit", draft: plan } : { type: "draw" };
  },
  delay: (match) => (match.round.opening ? SPIN_MS + BOT_DELAY_MS : BOT_DELAY_MS),
};
