// 오목 규칙: 15×15 판, 5목 판정, 장목(6목 이상)도 승리, 쌍삼 금지(흑·백 모두).
// 비행기오락실 앱(src/games/omok/omok.ts)의 규칙을 그대로 옮겨 왔어요. 화면·연결과 상관없는
// 순수한 계산이라 검증 스크립트(plain node)에서도 그대로 불러 쓸 수 있습니다.

export const SIZE = 15;
export const CELL_COUNT = SIZE * SIZE;
export const CENTER = 7 * SIZE + 7;

/** 칸 상태: 0 빈칸, 1 흑, 2 백 */
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

/** 가로, 세로, 두 대각선 */
export const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export const rowOf = (cell) => Math.floor(cell / SIZE);
export const colOf = (cell) => cell % SIZE;
export const inside = (row, col) => row >= 0 && row < SIZE && col >= 0 && col < SIZE;
export const other = (color) => (color === BLACK ? WHITE : BLACK);
/** 둔 순서로 색이 정해져요: 짝수 번째(0, 2, …)가 흑, 홀수 번째가 백 */
export const colorOfTurn = (moveCount) => (moveCount % 2 === 0 ? BLACK : WHITE);

export function gridOf(moves) {
  const grid = new Array(CELL_COUNT).fill(EMPTY);
  moves.forEach((cell, i) => (grid[cell] = i % 2 === 0 ? BLACK : WHITE));
  return grid;
}

/** 이 자리를 지나 한 방향으로 같은 색이 이어진 칸들 (이 자리 포함) */
function lineThrough(grid, cell, color, [dr, dc]) {
  const cells = [cell];
  for (const sign of [1, -1]) {
    let row = rowOf(cell) + dr * sign;
    let col = colOf(cell) + dc * sign;
    while (inside(row, col) && grid[row * SIZE + col] === color) {
      cells.push(row * SIZE + col);
      row += dr * sign;
      col += dc * sign;
    }
  }
  return cells;
}

/** 방금 둔 자리로 이겼으면 이긴 줄의 칸들, 아니면 null (장목도 승리) */
export function winningLine(grid, cell) {
  const color = grid[cell];
  if (color === EMPTY) return null;
  for (const direction of DIRECTIONS) {
    const cells = lineThrough(grid, cell, color, direction);
    if (cells.length >= 5) return cells;
  }
  return null;
}

/**
 * 한 방향으로 이 자리를 중심으로 앞뒤 4칸씩(9칸)을 읽는다.
 * 1 = 내 돌, 0 = 빈칸, 2 = 막힘(상대 돌 또는 판 밖)
 */
export function readLine(grid, cell, color, [dr, dc]) {
  const line = [];
  const r0 = rowOf(cell);
  const c0 = colOf(cell);
  for (let i = -4; i <= 4; i++) {
    const row = r0 + dr * i;
    const col = c0 + dc * i;
    if (!inside(row, col)) line.push(2);
    else {
      const stone = grid[row * SIZE + col];
      line.push(stone === EMPTY ? 0 : stone === color ? 1 : 2);
    }
  }
  return line;
}

/** 가운데(4번)를 포함한 "빈칸 + 내 돌 4개 + 빈칸"(열린 4)이 있는지 */
export function hasOpenFour(line) {
  for (let start = 0; start + 5 < line.length; start++) {
    const includesCenter = start + 1 <= 4 && 4 <= start + 4;
    if (!includesCenter || line[start] !== 0 || line[start + 5] !== 0) continue;
    if (line[start + 1] === 1 && line[start + 2] === 1 && line[start + 3] === 1 && line[start + 4] === 1) return true;
  }
  return false;
}

/** 가운데를 포함해 내 돌이 이어진 길이 */
export function runLength(line) {
  let length = 1;
  for (let i = 3; i >= 0 && line[i] === 1; i--) length++;
  for (let i = 5; i < line.length && line[i] === 1; i++) length++;
  return length;
}

/**
 * 이미 4인지: 4개가 이어져 있거나, 빈칸 하나만 채우면 5가 되는 모양(예: ●●●_●).
 * 4는 3으로 세지 않는다 (4·3은 둘 수 있다)
 */
export function isFour(line) {
  if (runLength(line) >= 4) return true;
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== 0) continue;
    line[i] = 1;
    const five = runLength(line) >= 5;
    line[i] = 0;
    if (five) return true;
  }
  return false;
}

/** 이 방향이 "열린 3"인지: 빈칸 하나를 더 채우면 가운데를 포함한 열린 4가 되는 모양 */
export function isOpenThree(line) {
  if (isFour(line)) return false;
  for (let i = 0; i < line.length; i++) {
    if (i === 4 || line[i] !== 0) continue;
    line[i] = 1;
    const open = hasOpenFour(line);
    line[i] = 0;
    if (open) return true;
  }
  return false;
}

/** 이 자리에 두면 열린 3이 두 개 이상 생기는지 (쌍삼) */
export function isDoubleThree(grid, cell, color) {
  const before = grid[cell];
  grid[cell] = color;
  let threes = 0;
  for (const direction of DIRECTIONS) {
    if (isOpenThree(readLine(grid, cell, color, direction))) threes++;
  }
  grid[cell] = before;
  return threes >= 2;
}

/**
 * 이 자리에 둘 수 없는 이유. 둘 수 있으면 null
 * 'outside' 판 밖 · 'occupied' 이미 돌이 있음 · 'doubleThree' 쌍삼
 */
export function moveProblem(grid, color, cell) {
  if (!Number.isInteger(cell) || cell < 0 || cell >= CELL_COUNT) return "outside";
  if (grid[cell] !== EMPTY) return "occupied";
  // 두자마자 이기는 수는 쌍삼이어도 둘 수 있다
  grid[cell] = color;
  const wins = Boolean(winningLine(grid, cell));
  grid[cell] = EMPTY;
  if (!wins && isDoubleThree(grid, cell, color)) return "doubleThree";
  return null;
}

/**
 * 수 두기. 반환: { moves, outcome } — outcome은 "win"(방금 둔 쪽 승리) | "draw" | null
 * 둘 수 없는 수면 null
 */
export function play(moves, cell) {
  const grid = gridOf(moves);
  const color = colorOfTurn(moves.length);
  if (moveProblem(grid, color, cell)) return null;
  const next = [...moves, cell];
  grid[cell] = color;
  if (winningLine(grid, cell)) return { moves: next, outcome: "win" };
  if (next.length === CELL_COUNT) return { moves: next, outcome: "draw" };
  return { moves: next, outcome: null };
}

/** 화면용: 마지막 수로 이겼으면 이긴 줄의 칸들 */
export function lastWinningLine(moves) {
  const last = moves[moves.length - 1];
  return last === undefined ? null : winningLine(gridOf(moves), last);
}
