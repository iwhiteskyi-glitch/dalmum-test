// 판 직접 채우기 계산 (화면과 상관없는 순수한 계산)
import { CELL_COUNT } from "./bingo.js";
export function emptyDraft() {
  return Array.from({ length: CELL_COUNT }, () => null);
}
/** 아직 판에 놓지 않은 숫자 중 가장 작은 것. 판이 다 찼거나 남은 숫자가 없으면 null */
export function nextUnused(draft, maxNumber) {
  if (!draft.includes(null)) return null;
  const used = new Set(draft);
  for (let n = 1; n <= maxNumber; n++) if (!used.has(n)) return n;
  return null;
}
/** 빈칸에 숫자를 놓는다. 이미 쓴 숫자이거나 빈칸이 아니면 그대로 */
export function placeNumber(draft, cell, number) {
  if (draft[cell] !== null || draft.includes(number)) return draft;
  return draft.map((value, i) => (i === cell ? number : value));
}
export function clearCell(draft, cell) {
  return draft.map((value, i) => (i === cell ? null : value));
}
/** 남은 빈칸을 아직 안 쓴 숫자로 무작위로 채운다 */
export function fillRemainingRandom(draft, maxNumber, random = Math.random) {
  const used = new Set(draft);
  const unused = Array.from({ length: maxNumber }, (_, i) => i + 1).filter((n) => !used.has(n));
  for (let i = unused.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [unused[i], unused[j]] = [unused[j], unused[i]];
  }
  let next = 0;
  return draft.map((value) => value ?? unused[next++]);
}
/** 다 채워졌으면 완성된 판, 아니면 null */
export function finishDraft(draft) {
  return draft.every((value) => value !== null) ? draft : null;
}
