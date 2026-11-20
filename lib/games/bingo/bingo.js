// 빙고 판과 줄 세기, 게임 설정 (연결 방식과 상관없는 순수한 계산)
import { isTurnChoice } from "../turnClock.js";
export const BOARD_SIZE = 5;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
/** 5×5 판의 모든 줄 수 (가로 5 + 세로 5 + 대각선 2). 12줄 완성 = 25칸 전부 = 블랙빙고 */
export const BLACKOUT = BOARD_SIZE * 2 + 2;
export const NUMBER_RANGES = [25, 50, 75, 100];
export const LINE_TARGETS = [1, 2, 3, 4, 5, BLACKOUT];
export const WINS_TO_CHAMPION = [1, 3, 5];
/** 차례 시간(초). 0은 혼자 하기 (제한 없음) */
export const BINGO_TURN_SECONDS = [15, 30];
export const FILL_MODES = ["random", "manual"];
export const DEFAULT_SETTINGS = {
  maxNumber: 25,
  lineTarget: 3,
  winsToChampion: 3,
  fillMode: "random",
  turnSeconds: 15,
};
/** 1~25에서는 모든 판에 같은 숫자가 다 있어서, 블랙빙고면 항상 전원 동시 완성이 된다 */
export function isAllowedCombination(maxNumber, lineTarget) {
  return !(lineTarget === BLACKOUT && maxNumber === CELL_COUNT);
}
export function isValidSettings(settings) {
  return (
    NUMBER_RANGES.includes(settings.maxNumber) &&
    LINE_TARGETS.includes(settings.lineTarget) &&
    WINS_TO_CHAMPION.includes(settings.winsToChampion) &&
    FILL_MODES.includes(settings.fillMode) &&
    isTurnChoice(settings.turnSeconds, BINGO_TURN_SECONDS) &&
    isAllowedCombination(settings.maxNumber, settings.lineTarget)
  );
}
/** 1~maxNumber 중 겹치지 않는 25개를 무작위로 골라 배치한다 */
export function createBoard(maxNumber, random = Math.random) {
  const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
  // 섞기 (Fisher-Yates)
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers.slice(0, CELL_COUNT);
}
/** 다른 폰에서 받은 판이 규칙에 맞는지 확인한다 */
export function isValidBoard(board, maxNumber) {
  return (
    Array.isArray(board) &&
    board.length === CELL_COUNT &&
    board.every((n) => Number.isInteger(n) && n >= 1 && n <= maxNumber) &&
    new Set(board).size === CELL_COUNT
  );
}
/** 모든 줄을 칸 번호(0~24)로 나타낸 목록 */
export const LINES = (() => {
  const range = Array.from({ length: BOARD_SIZE }, (_, i) => i);
  const rows = range.map((r) => range.map((c) => r * BOARD_SIZE + c));
  const columns = range.map((c) => range.map((r) => r * BOARD_SIZE + c));
  const diagonal = range.map((i) => i * BOARD_SIZE + i);
  const antiDiagonal = range.map((i) => i * BOARD_SIZE + (BOARD_SIZE - 1 - i));
  return [...rows, ...columns, diagonal, antiDiagonal];
})();
/** 불린 숫자로 완성된 줄 수 */
export function countLines(board, called) {
  const calledSet = new Set(called);
  return LINES.filter((line) => line.every((cell) => calledSet.has(board[cell]))).length;
}
/** 완성된 줄에 속한 칸 번호들 (화면에서 줄을 강조할 때 사용) */
export function completedCells(board, called) {
  const calledSet = new Set(called);
  const cells = new Set();
  for (const line of LINES) {
    if (line.every((cell) => calledSet.has(board[cell]))) line.forEach((cell) => cells.add(cell));
  }
  return cells;
}
