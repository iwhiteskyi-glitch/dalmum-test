// 오델로 규칙: 8×8 판, 가운데 네 칸에서 시작, 상대 돌을 내 돌 사이에 끼우면 뒤집기,
// 둘 곳이 없으면 차례를 넘기고(패스), 둘 다 둘 곳이 없으면 끝나서 돌이 많은 쪽이 이겨요.
// 화면·연결과 상관없는 순수한 계산이라 검증 스크립트(plain node)에서도 그대로 불러 써요.

export const SIZE = 8;
export const CELLS = 64;
/** 칸 값: 0 빈칸, 1 흑(먼저 둠, side 0), 2 백(side 1) */
export const EMPTY = 0;
export const stoneOf = (side) => side + 1;

const DIRS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

/** 칸마다 8방향으로 판 끝까지의 칸 목록(미리 계산해 두면 빨라요) */
export const RAYS = Array.from({ length: CELLS }, (_, i) => {
  const r0 = Math.floor(i / SIZE);
  const c0 = i % SIZE;
  return DIRS.map(([dr, dc]) => {
    const ray = [];
    for (let r = r0 + dr, c = c0 + dc; r >= 0 && r < SIZE && c >= 0 && c < SIZE; r += dr, c += dc) ray.push(r * SIZE + c);
    return ray;
  }).filter((ray) => ray.length >= 2);
});

export function newState() {
  const cells = new Array(CELLS).fill(EMPTY);
  cells[27] = 2; // d4 백
  cells[28] = 1; // e4 흑
  cells[35] = 1; // d5 흑
  cells[36] = 2; // e5 백
  return { cells, turn: 0, last: null, passed: null };
}

/** idx에 me를 두면 뒤집히는 칸들(없으면 빈 배열) */
export function flipsAt(cells, idx, me) {
  if (cells[idx] !== EMPTY) return [];
  const opp = 3 - me;
  const flips = [];
  for (const ray of RAYS[idx]) {
    let n = 0;
    while (n < ray.length && cells[ray[n]] === opp) n++;
    if (n > 0 && n < ray.length && cells[ray[n]] === me) for (let k = 0; k < n; k++) flips.push(ray[k]);
  }
  return flips;
}

/** side가 둘 수 있는 칸들 */
export function legalMoves(cells, side) {
  const me = stoneOf(side);
  const out = [];
  for (let i = 0; i < CELLS; i++) if (cells[i] === EMPTY && flipsAt(cells, i, me).length) out.push(i);
  return out;
}

export function count(cells) {
  let black = 0;
  let white = 0;
  for (const v of cells) {
    if (v === 1) black++;
    else if (v === 2) white++;
  }
  return { black, white };
}

/**
 * 수 두기. 반환: { state, end } — end는 끝났을 때 { winner: 0|1|null, black, white }
 * 둘 수 없는 칸이면 null. 다음 사람이 둘 곳이 없으면 자동으로 한 번 쉬어요(passed에 쉰 쪽 기록).
 */
export function play(state, idx) {
  const me = stoneOf(state.turn);
  const flips = flipsAt(state.cells, idx, me);
  if (!Number.isInteger(idx) || !flips.length) return null;
  const cells = [...state.cells];
  cells[idx] = me;
  for (const f of flips) cells[f] = me;
  const other = 1 - state.turn;
  let turn = other;
  let passed = null;
  if (!legalMoves(cells, other).length) {
    if (legalMoves(cells, state.turn).length) {
      turn = state.turn;
      passed = other;
    } else {
      const { black, white } = count(cells);
      const winner = black === white ? null : black > white ? 0 : 1;
      return { state: { cells, turn: other, last: idx, passed: null, flipped: flips }, end: { winner, black, white } };
    }
  }
  return { state: { cells, turn, last: idx, passed, flipped: flips }, end: null };
}
