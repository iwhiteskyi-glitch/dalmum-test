// 숫자 타일: 타일과 묶음의 규칙 (연결·화면과 상관없는 순수한 계산).
// 타일은 0~105 번호 하나로 나타낸다. 0~103은 색 4가지 × 숫자 1~13 × 2벌, 104·105는 조커.
// 타일마다 번호가 다르므로 "같은 타일이 두 번"은 번호가 겹치는지만 보면 된다.
export const COLORS = 4;
export const MAX_NUMBER = 13;
export const COPIES = 2;
export const JOKERS = 2;
/** 색 하나의 타일 수 (1~13 × 2벌) */
const PER_COLOR = MAX_NUMBER * COPIES;
export const TILE_COUNT = COLORS * PER_COLOR + JOKERS; // 106
export const FIRST_JOKER = COLORS * PER_COLOR; // 104
/** 처음 나눠 주는 타일 수 */
export const HAND_SIZE = 14;
/** 첫 등록에 필요한 숫자 합 */
export const MELD_MIN = 30;
/** 판이 끝났을 때 손에 남은 조커의 값 */
export const JOKER_VALUE = 30;
/** 같은 숫자 묶음의 최대 길이 (색이 4가지) */
export const SET_MAX = COLORS;
export const isJoker = (tile) => tile >= FIRST_JOKER;
export const isTile = (value) => Number.isInteger(value) && value >= 0 && value < TILE_COUNT;
/** 색 번호 0~3 (조커는 -1) */
export const colorOf = (tile) => (isJoker(tile) ? -1 : Math.floor(tile / PER_COLOR));
/** 숫자 1~13 (조커는 0) */
export const numberOf = (tile) => (isJoker(tile) ? 0 : ((tile % PER_COLOR) % MAX_NUMBER) + 1);
export function allTiles() {
  return Array.from({ length: TILE_COUNT }, (_, i) => i);
}
/** 섞기 (random: 0 이상 1 미만) */
export function shuffle(items, random) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
/**
 * 같은 숫자 묶음인지: 3~4개, 조커가 아닌 타일은 숫자가 같고 색이 모두 다르다.
 * 맞으면 그 숫자(조커만 있으면 0), 아니면 null
 */
export function setNumber(group) {
  if (group.length < 3 || group.length > SET_MAX) return null;
  let number = 0;
  const colors = new Set();
  for (const tile of group) {
    if (isJoker(tile)) continue;
    const n = numberOf(tile);
    if (number === 0) number = n;
    else if (n !== number) return null;
    const c = colorOf(tile);
    if (colors.has(c)) return null;
    colors.add(c);
  }
  return number;
}
/**
 * 이어진 숫자 묶음인지: 3개 이상, 같은 색, 놓인 순서대로 숫자가 1씩 커진다 (조커는 빈 숫자를 채운다). 13 다음에 1로 이어지지 않는다.
 * 맞으면 첫 칸의 숫자, 아니면 null
 */
export function runStart(group) {
  if (group.length < 3 || group.length > MAX_NUMBER) return null;
  let start = 0;
  let color = -1;
  group.forEach((tile, i) => {
    if (isJoker(tile) || start === -1) return;
    const n = numberOf(tile) - i;
    if (start === 0) {
      start = n;
      color = colorOf(tile);
    } else if (n !== start || colorOf(tile) !== color) start = -1;
  });
  if (start <= 0) return null;
  return start + group.length - 1 <= MAX_NUMBER ? start : null;
}
export const isValidGroup = (group) => setNumber(group) !== null || runStart(group) !== null;
/** 묶음의 숫자 합 (조커는 그 자리의 숫자로). 두 가지로 다 읽히면 큰 쪽 */
export function groupSum(group) {
  let best = 0;
  const set = setNumber(group);
  if (set !== null) best = set * group.length;
  const start = runStart(group);
  if (start !== null) {
    const n = group.length;
    best = Math.max(best, (n * (2 * start + n - 1)) / 2);
  }
  return best;
}
/** 손에 남은 타일의 값 (판이 끝났을 때 적은 쪽이 이긴다). 조커는 30 */
export const handValue = (hand) => hand.reduce((sum, t) => sum + (isJoker(t) ? JOKER_VALUE : numberOf(t)), 0);
export const flatten = (board) => board.flat();
const sameGroup = (a, b) => a.length === b.length && a.every((t, i) => t === b[i]);
/**
 * 고치는 중인 판(draft)이 모양상 가능한지: 같은 타일이 두 번 없고, 원래 판의 타일은 다 있고, 새 타일은 모두 내 손에 있던 것.
 * 묶음이 규칙에 맞는지는 보지 않는다 (고치는 중에는 어긋나도 된다)
 */
export function isPossibleDraft(board, draft, hand) {
  const tiles = flatten(draft);
  if (!tiles.every(isTile) || new Set(tiles).size !== tiles.length) return false;
  if (draft.some((g) => g.length === 0)) return false;
  const inDraft = new Set(tiles);
  if (!flatten(board).every((t) => inDraft.has(t))) return false;
  const allowed = new Set([...flatten(board), ...hand]);
  return tiles.every((t) => allowed.has(t));
}
/** 이번 차례에 손에서 판으로 내린 타일 */
export function laidTiles(board, draft) {
  const was = new Set(flatten(board));
  return flatten(draft).filter((t) => !was.has(t));
}
/**
 * 차례를 마칠 수 있는지. 못 마치면 이유.
 * melded: 첫 등록을 이미 했는지. meld30: 첫 등록 30점 규칙을 쓰는지
 */
export function draftProblem(board, draft, melded, meld30) {
  if (!draft.every(isValidGroup)) return "invalidGroup";
  if (laidTiles(board, draft).length === 0) return "nothingLaid";
  if (melded || !meld30) return null;
  // 첫 등록: 원래 판의 묶음은 그대로 남아 있어야 하고, 새 묶음들의 합이 30 이상
  const untouched = board.every((g) => draft.some((d) => sameGroup(g, d)));
  if (!untouched) return "touchedBoard";
  const fresh = draft.filter((d) => !board.some((g) => sameGroup(g, d)));
  return fresh.reduce((sum, g) => sum + groupSum(g), 0) >= MELD_MIN ? null : "meldTooSmall";
}
/** 정렬: 색순(색 → 숫자) / 숫자순(숫자 → 색). 조커는 맨 뒤 */
export function sortTiles(hand, by) {
  const key = (t) =>
    isJoker(t) ? 1000 + t : by === "color" ? colorOf(t) * 100 + numberOf(t) : numberOf(t) * 100 + colorOf(t);
  return [...hand].sort((a, b) => key(a) - key(b));
}
