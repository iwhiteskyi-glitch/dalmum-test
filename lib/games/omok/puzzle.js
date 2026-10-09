// 오목 "오늘의 문제" 풀이기: 4를 연달아 만들어(상대는 매번 막을 수밖에 없음) 몇 수 안에 5목을 만드는지 따져요.
// 문제를 뽑을 때(정답이 딱 하나인지 확인)와, 화면에서 방문자가 둔 수가 맞는지 확인할 때 같이 써요.
// 쌍삼 금지는 양쪽 모두에게 적용돼요: 막아야 할 자리가 상대에게 쌍삼이면 상대는 막지 못해요.

import { SIZE, CELL_COUNT, EMPTY, DIRECTIONS, rowOf, colOf, inside, other, readLine, runLength, isFour, moveProblem } from "./rules.js";

/** 돌 주변 2칸 안의 빈칸들(4나 5가 생길 수 있는 자리는 모두 여기 들어가요) */
function candidates(grid, reach = 2) {
  const seen = new Uint8Array(CELL_COUNT);
  const list = [];
  for (let cell = 0; cell < CELL_COUNT; cell++) {
    if (grid[cell] === EMPTY) continue;
    const r0 = rowOf(cell);
    const c0 = colOf(cell);
    for (let dr = -reach; dr <= reach; dr++) {
      for (let dc = -reach; dc <= reach; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (!inside(r, c)) continue;
        const n = r * SIZE + c;
        if (grid[n] === EMPTY && !seen[n]) {
          seen[n] = 1;
          list.push(n);
        }
      }
    }
  }
  return list;
}

function makesFive(grid, cell, color) {
  if (grid[cell] !== EMPTY) return false;
  grid[cell] = color;
  let five = false;
  for (const d of DIRECTIONS) {
    if (runLength(readLine(grid, cell, color, d)) >= 5) {
      five = true;
      break;
    }
  }
  grid[cell] = EMPTY;
  return five;
}

/** color가 두면 4가 생기는 칸인지(둘 수 있는 칸만) */
export function makesFour(grid, cell, color) {
  if (grid[cell] !== EMPTY) return false;
  grid[cell] = color;
  let four = false;
  for (const d of DIRECTIONS) {
    if (isFour(readLine(grid, cell, color, d))) {
      four = true;
      break;
    }
  }
  grid[cell] = EMPTY;
  return four && !moveProblem(grid, color, cell);
}

/** color가 지금 바로 5목을 만들 수 있는 칸들 */
export function fiveCells(grid, color) {
  return candidates(grid, 1).filter((c) => makesFive(grid, c, color));
}

/**
 * 공격하는 쪽(color) 차례에 둘 수 있는 "4 연속" 수들과, 각 수에 상대가 막을 자리.
 * 상대에게 이미 4가 있으면 그 자리를 막는 수만 가능(그 수도 4여야 계속 몰아붙일 수 있어요).
 * 반환: [{ cell, block }] — block이 null이면 그 수로 바로 이기거나(5목·막을 곳 둘·상대가 못 막음) 상대가 이긴 것
 */
function attackMoves(grid, color) {
  const opp = other(color);
  const oppFives = fiveCells(grid, opp);
  let cells;
  if (oppFives.length >= 2) return [];
  if (oppFives.length === 1) {
    const b = oppFives[0];
    if (makesFive(grid, b, color)) return [{ cell: b, win: true }];
    if (!makesFour(grid, b, color)) return [];
    cells = [b];
  } else {
    cells = candidates(grid).filter((c) => makesFive(grid, c, color) || makesFour(grid, c, color));
  }
  const out = [];
  for (const cell of cells) {
    if (makesFive(grid, cell, color)) {
      out.push({ cell, win: true });
      continue;
    }
    grid[cell] = color;
    const threats = fiveCells(grid, color);
    let result;
    if (threats.length >= 2) result = { cell, win: true };
    else if (threats.length === 1 && moveProblem(grid, opp, threats[0])) result = { cell, win: true };
    else if (threats.length === 1) result = { cell, block: threats[0] };
    grid[cell] = EMPTY;
    if (result) out.push(result);
  }
  return out;
}

/** 이 수를 둔 뒤 남은 수(n) 안에 이기는지. n은 이 수를 포함한 공격 수 */
function winsWith(grid, color, move, n, budget) {
  if (move.win) return n >= (makesFive(grid, move.cell, color) ? 1 : 2);
  if (n < 3 || --budget.n < 0) return false;
  const opp = other(color);
  grid[move.cell] = color;
  grid[move.block] = opp;
  const ok = canWin(grid, color, n - 1, budget);
  grid[move.block] = EMPTY;
  grid[move.cell] = EMPTY;
  return ok;
}

function canWin(grid, color, n, budget) {
  for (const m of attackMoves(grid, color)) if (winsWith(grid, color, m, n, budget)) return true;
  return false;
}

/**
 * 공격하는 쪽(color)이 n수 안에 이기는 첫 수들. 계산이 너무 길어지면 null(판단 보류).
 * n은 마지막 5목까지 센 공격 쪽 수예요(예: 4·4 한 번 → 상대가 하나 막음 → 5목 = 2수).
 */
export function winningFirstMoves(grid, color, n, limit = 200000) {
  const budget = { n: limit };
  const wins = attackMoves(grid, color).filter((m) => winsWith(grid, color, m, n, budget)).map((m) => m.cell);
  return budget.n < 0 ? null : wins;
}

/** 공격 쪽이 두면 상대가 막을 자리(막을 곳이 하나뿐일 때). 화면에서 컴퓨터의 응수로 써요 */
export function forcedBlock(grid, color, cell) {
  const m = attackMoves(grid, color).find((x) => x.cell === cell);
  return m ? (m.win ? null : m.block) : undefined;
}
