// 비행기오락실 앱 src/games/link/play.ts를 그대로 옮겼어요(tsc로 JS로 바꿈).
// 짝꿍 잇기 한 판 진행: 판과 함께 타일마다 이름표(id)를 들고 다닌다.
// 화면이 이름표로 같은 타일을 알아보고, 미끄러질 때 제자리에서 새 자리로 움직이게 그린다.
// (연결 방식과 상관없는 순수한 계산)
import { applySlide, EMPTY, findPair, isCleared, removePair, reshuffleMoves } from "./link.js";
export const HINTS = 3;
export function newPlay(board, hints = HINTS) {
  const ids = board.cells.map((v, i) => (v === EMPTY ? EMPTY : i));
  return { board, ids, hintsLeft: hints };
}
/** 두 칸 잇기. 이을 수 없으면 null. 없애고 미끄러진 판을 돌려준다 (막혔는지도) */
export function linkPair(play, a, b) {
  const result = removePair(play.board, a, b);
  if (!result) return null;
  const removed = [a, b].map((index) => ({ id: play.ids[index], index, picture: play.board.cells[index] }));
  const ids = play.ids.slice();
  ids[a] = EMPTY;
  ids[b] = EMPTY;
  // 이름표도 판과 똑같이 미끄러뜨린다
  const slidIds = applySlide({ ...play.board, cells: ids }).cells;
  const next = { ...play, board: result.board, ids: slidIds };
  return { play: next, path: result.path, removed, stuck: !isCleared(next.board) && !findPair(next.board) };
}
/**
 * 파워(5콤보)로 깨기: index 타일과 같은 그림 중 가장 가까운 하나를 선과 상관없이 함께 없앤다.
 * 같은 그림이 없으면(그럴 일은 없지만) null. 선은 없다(path 빈 목록)
 */
export function breakWithPower(play, index) {
  const { board } = play;
  const picture = board.cells[index];
  if (picture === EMPTY) return null;
  const col = index % board.cols;
  const row = Math.floor(index / board.cols);
  let partner = -1;
  let best = Infinity;
  board.cells.forEach((v, i) => {
    if (i === index || v !== picture) return;
    const d = Math.abs((i % board.cols) - col) + Math.abs(Math.floor(i / board.cols) - row);
    if (d < best) {
      best = d;
      partner = i;
    }
  });
  if (partner < 0) return null;
  const removed = [index, partner].map((i) => ({ id: play.ids[i], index: i, picture }));
  const cells = board.cells.slice();
  const ids = play.ids.slice();
  for (const i of [index, partner]) {
    cells[i] = EMPTY;
    ids[i] = EMPTY;
  }
  const next = {
    ...play,
    board: applySlide({ ...board, cells }),
    ids: applySlide({ ...board, cells: ids }).cells,
  };
  return { play: next, path: [], removed, stuck: !isCleared(next.board) && !findPair(next.board) };
}
/** 남은 타일 섞기. 이름표도 타일을 따라가서, 화면에서 타일이 새 자리로 날아간다 */
export function shufflePlay(play, random) {
  const { board, from } = reshuffleMoves(play.board, random);
  return { ...play, board, ids: from.map((source) => (source === EMPTY ? EMPTY : play.ids[source])) };
}
/** 힌트: 이을 수 있는 쌍 하나. 힌트가 없거나 쌍이 없으면 null */
export function takeHint(play) {
  if (play.hintsLeft <= 0) return null;
  const pair = findPair(play.board);
  if (!pair) return null;
  return { play: { ...play, hintsLeft: play.hintsLeft - 1 }, pair };
}
