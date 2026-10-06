// 오목 컴퓨터 상대. 단계(1~10)마다 실수하는 정도와 미리 내다보는 깊이를 다르게 해서
// 실력을 조절합니다. 서버 없이 방문자의 기기 안에서 계산해요.
//
// 생각하는 방법
//  1) 빈칸마다 "내가 두면 생기는 모양(5목·열린 4·4·열린 3·…)"과 "상대가 두면 생기는 모양"에
//     점수를 매겨 더한다(공격 + 수비).
//  2) 높은 단계는 여기에 "4를 연달아 두어 이기는 수순"(VCF)과 "3·4로 몰아붙여 이기는 수순"(VCT)을
//     찾아보고, 상대에게 그런 수순이 생기는 자리도 미리 막는다.
//  3) 낮은 단계는 일부러 수비를 건너뛰거나(실수), 좋은 수 몇 개 중에서 무작위로 고른다.
//
// 쌍삼 금지는 컴퓨터에게도 똑같이 적용되고, 상대가 둘 수 없는 쌍삼 자리는 막을 필요가 없다고 봐요.

import {
  SIZE,
  CELL_COUNT,
  CENTER,
  EMPTY,
  DIRECTIONS,
  rowOf,
  colOf,
  inside,
  other,
  gridOf,
  colorOfTurn,
  readLine,
  hasOpenFour,
  runLength,
  isFour,
  isOpenThree,
  moveProblem,
} from "./rules.js";

/* ───────────── 모양 읽기 ───────────── */

const FIVE = 6;
const OPEN4 = 5;
const FOUR = 4;
const OPEN3 = 3;
const THREE = 2;
const OPEN2 = 1;
const NONE = 0;

/** grid[cell]에 color 돌이 놓여 있다고 보고, 한 방향의 모양 */
function shapeOf(grid, cell, color, direction) {
  const line = readLine(grid, cell, color, direction);
  if (runLength(line) >= 5) return FIVE;
  if (hasOpenFour(line)) return OPEN4;
  if (isFour(line)) return FOUR;
  if (isOpenThree(line)) return OPEN3;
  let open2 = false;
  for (let i = 0; i < 9; i++) {
    if (line[i] !== 0) continue;
    line[i] = 1;
    const four = isFour(line);
    const three = !four && !open2 && isOpenThree(line);
    line[i] = 0;
    if (four) return THREE;
    if (three) open2 = true;
  }
  return open2 ? OPEN2 : NONE;
}

/** 이 칸에 color를 두면 네 방향에서 생기는 모양 개수 */
function shapesAt(grid, cell, color) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  grid[cell] = color;
  for (const d of DIRECTIONS) counts[shapeOf(grid, cell, color, d)]++;
  grid[cell] = EMPTY;
  return counts;
}

const WIN_NOW = 1e8;
const WIN_NEXT = 1e6; // 열린 4, 4·4, 4·3: 다음 수에 반드시 이김

/** 이 칸에 color를 두는 값. 둘 수 없는 칸(쌍삼)이면 0 */
function cellValue(grid, cell, color) {
  if (moveProblem(grid, color, cell)) return 0;
  const c = shapesAt(grid, cell, color);
  if (c[FIVE]) return WIN_NOW;
  if (c[OPEN4] || c[FOUR] >= 2 || (c[FOUR] && c[OPEN3])) return WIN_NEXT;
  return c[FOUR] * 12000 + c[OPEN3] * 5000 + c[THREE] * 600 + c[OPEN2] * 300 + nearBonus(grid, cell, color);
}

/**
 * 상대가 이 칸에 두면 생기는 위협의 값(막을 가치). 상대가 둘 수 없는 쌍삼 자리는 0.
 * seeThree가 false면 상대의 3(열린 3·열린 4로 이어지는 모양)을 못 알아챈 것처럼 낮게 봐요.
 */
function threatValue(grid, cell, opp, seeThree) {
  if (moveProblem(grid, opp, cell)) return 0;
  const c = shapesAt(grid, cell, opp);
  if (c[FIVE]) return WIN_NOW;
  if (seeThree) {
    if (c[OPEN4] || c[FOUR] >= 2 || (c[FOUR] && c[OPEN3])) return WIN_NEXT;
    return c[FOUR] * 12000 + c[OPEN3] * 5000 + c[THREE] * 600 + c[OPEN2] * 300 + nearBonus(grid, cell, opp);
  }
  return (c[FOUR] + c[OPEN4]) * 600 + (c[OPEN3] + c[THREE] + c[OPEN2]) * 250 + nearBonus(grid, cell, opp);
}

/** 주변(가로세로대각 1~2칸)에 내 돌이 있으면 조금 더 */
function nearBonus(grid, cell, color) {
  const r0 = rowOf(cell);
  const c0 = colOf(cell);
  let bonus = 0;
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      if (!dr && !dc) continue;
      const r = r0 + dr;
      const c = c0 + dc;
      if (!inside(r, c)) continue;
      const s = grid[r * SIZE + c];
      if (s === color) bonus += Math.abs(dr) <= 1 && Math.abs(dc) <= 1 ? 8 : 3;
      else if (s !== EMPTY) bonus += 1;
    }
  }
  // 가운데 쪽을 조금 선호
  return bonus + (7 - Math.max(Math.abs(r0 - 7), Math.abs(c0 - 7))) * 0.5;
}

/** 돌 주변 2칸 안의 빈칸들 */
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

/* ───────────── 수순 찾기(VCF·VCT) ───────────── */

// 계산량 제한: 수(n)와 시간(until, ms) 중 먼저 닿는 쪽에서 멈춰요. 느린 폰에서는 그만큼 덜 찾아봐요.
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const out = (budget) => budget.n <= 0 || (budget.until !== undefined && now() > budget.until);
const tick = (budget) => {
  budget.n--;
  return out(budget);
};

/** color가 이 칸에 두면 5목이 되는지 */
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

/** color가 지금 바로 5목을 만들 수 있는 칸들 */
function fiveCells(grid, color, cells) {
  return cells.filter((c) => makesFive(grid, c, color));
}

/** color가 두면 4(또는 5)가 생기는 칸들 — 둘 수 있는 칸만 */
function fourMoves(grid, color, cells) {
  const out = [];
  for (const cell of cells) {
    if (grid[cell] !== EMPTY) continue;
    grid[cell] = color;
    let four = false;
    for (const d of DIRECTIONS) {
      const line = readLine(grid, cell, color, d);
      if (isFour(line)) {
        four = true;
        break;
      }
    }
    grid[cell] = EMPTY;
    if (four && !moveProblem(grid, color, cell)) out.push(cell);
  }
  return out;
}

/** 이 칸 주변(4방향 4칸) */
function lineNeighbors(cell) {
  const out = [];
  const r0 = rowOf(cell);
  const c0 = colOf(cell);
  for (const [dr, dc] of DIRECTIONS) {
    for (let i = -4; i <= 4; i++) {
      if (!i) continue;
      const r = r0 + dr * i;
      const c = c0 + dc * i;
      if (inside(r, c)) out.push(r * SIZE + c);
    }
  }
  return out;
}

/**
 * VCF: color가 4를 연달아 두어(상대는 매번 막을 수밖에 없음) 이기는 첫 수. 없으면 null.
 * budget.n 으로 계산량을 제한해요.
 */
function findVcf(grid, color, depth, budget, cells = candidates(grid)) {
  if (depth <= 0 || out(budget)) return null;
  const opp = other(color);
  for (const cell of fourMoves(grid, color, cells)) {
    if (tick(budget)) return null;
    if (makesFive(grid, cell, color)) return cell;
    grid[cell] = color;
    // 상대가 막아야 하는 자리(내가 다음에 5목이 되는 칸)
    const near = lineNeighbors(cell);
    const threats = fiveCells(grid, color, near);
    let win = false;
    if (threats.length >= 2) {
      // 막을 곳이 둘 — 상대가 먼저 5목을 만들 수 없다면 이긴다
      win = fiveCells(grid, opp, candidates(grid, 1)).length === 0;
    } else if (threats.length === 1) {
      const block = threats[0];
      // 상대가 막는 대신 바로 5목을 만들 수 있으면 이 수순은 실패
      if (fiveCells(grid, opp, candidates(grid, 1)).length === 0 && !moveProblem(grid, opp, block)) {
        grid[block] = opp;
        // 막은 수로 상대에게 4가 생기면 따라가기 복잡해서 여기서 멈춰요
        const oppFour = fiveCells(grid, opp, lineNeighbors(block)).length > 0;
        if (!oppFour) win = findVcf(grid, color, depth - 1, budget, [...new Set([...cells, ...near, ...lineNeighbors(block)])]) !== null;
        grid[block] = EMPTY;
      } else if (moveProblem(grid, opp, block) === "doubleThree") {
        // 상대가 막을 자리가 쌍삼이라 둘 수 없다
        win = fiveCells(grid, opp, candidates(grid, 1)).length === 0;
      }
    }
    grid[cell] = EMPTY;
    if (win) return cell;
  }
  return null;
}

/** color가 두면 열린 3이 생기는 칸들(4는 제외) — 둘 수 있는 칸만 */
function openThreeMoves(grid, color, cells) {
  const out = [];
  for (const cell of cells) {
    if (grid[cell] !== EMPTY) continue;
    grid[cell] = color;
    let three = false;
    let four = false;
    for (const d of DIRECTIONS) {
      const line = readLine(grid, cell, color, d);
      if (isFour(line)) four = true;
      else if (isOpenThree(line)) three = true;
    }
    grid[cell] = EMPTY;
    if (three && !four && !moveProblem(grid, color, cell)) out.push(cell);
  }
  return out;
}

/** color가 이 칸에 두면 5목이나 열린 4가 생기는지(다음 수에 반드시 이기는 모양) */
function makesOpenFour(grid, cell, color) {
  if (grid[cell] !== EMPTY || moveProblem(grid, color, cell)) return false;
  grid[cell] = color;
  let ok = false;
  for (const d of DIRECTIONS) {
    const line = readLine(grid, cell, color, d);
    if (runLength(line) >= 5 || hasOpenFour(line)) {
      ok = true;
      break;
    }
  }
  grid[cell] = EMPTY;
  return ok;
}

/**
 * VCT: 4나 열린 3으로 계속 몰아붙여, 상대가 어떻게 막아도 이기는 첫 수. 없으면 null.
 * 상대가 3을 막는 대신 4로 반격하는 경우도 따져 봐요.
 */
function findVct(grid, color, depth, budget) {
  if (depth <= 0 || out(budget)) return null;
  const cells = candidates(grid);
  const fours = fourMoves(grid, color, cells);
  const threes = depth >= 2 ? openThreeMoves(grid, color, cells) : [];
  for (const cell of [...fours, ...threes]) {
    if (tick(budget)) return null;
    if (makesFive(grid, cell, color)) return cell;
    grid[cell] = color;
    const win = everyReplyLoses(grid, color, cell, depth, budget);
    grid[cell] = EMPTY;
    if (win) return cell;
  }
  return null;
}

/** 방금 color가 cell에 몰아붙이는 수를 둔 뒤, 상대의 모든 응수에 대해 color가 이기는지 */
function everyReplyLoses(grid, color, cell, depth, budget) {
  const opp = other(color);
  // 상대가 바로 5목을 만들 수 있으면 실패
  if (fiveCells(grid, opp, candidates(grid, 1)).some((c) => !moveProblem(grid, opp, c))) return false;
  const near = lineNeighbors(cell);
  const myFives = fiveCells(grid, color, near);
  let replies;
  if (myFives.length >= 2) return true;
  if (myFives.length === 1) {
    // 4: 막을 곳은 한 군데뿐. 그 자리가 상대에게 쌍삼이면 못 막아요.
    if (moveProblem(grid, opp, myFives[0])) return true;
    replies = [myFives[0]];
  } else {
    // 열린 3: 이 줄에서 열린 4를 못 만들게 하는 자리 + 상대가 4로 반격하는 자리
    const stops = near.filter((e) => {
      if (grid[e] !== EMPTY || moveProblem(grid, opp, e)) return false;
      grid[e] = opp;
      const still = near.some((c) => makesOpenFour(grid, c, color));
      grid[e] = EMPTY;
      return !still;
    });
    const counters = fourMoves(grid, opp, candidates(grid)).filter((c) => !stops.includes(c));
    replies = [...stops, ...counters];
    if (!replies.length) return true;
  }
  for (const r of replies) {
    if (tick(budget)) return false;
    grid[r] = opp;
    let win;
    const oppFives = fiveCells(grid, opp, lineNeighbors(r));
    if (oppFives.length >= 2) win = false;
    else if (oppFives.length === 1) {
      // 상대가 4로 반격 → 반드시 막고 나서 계속
      const b = oppFives[0];
      if (moveProblem(grid, color, b)) win = false;
      else {
        grid[b] = color;
        win = findVct(grid, color, depth - 1, budget) !== null;
        grid[b] = EMPTY;
      }
    } else win = findVct(grid, color, depth - 1, budget) !== null;
    grid[r] = EMPTY;
    if (!win) return false;
  }
  return true;
}

/* ───────────── 단계별 성격 ───────────── */

/**
 * 사람이 컴퓨터를 이기는 길은 대개 "컴퓨터가 내 3을 못 보고 지나칠 때"예요. 그래서 단계마다
 * 상대 위협을 알아채는 확률을 정해 두고, 높은 단계일수록 미리 내다보는 깊이를 늘립니다.
 *  missWin: 내가 바로 5목을 만들 수 있는데 놓칠 확률
 *  seeFour: 상대의 4(바로 5목이 되는 자리)를 알아챌 확률
 *  seeThree: 상대의 3(곧 열린 4가 되는 모양)을 알아챌 확률
 *  defense: 수비를 얼마나 중요하게 보는지(공격 1 기준)
 *  pick·spread: 좋은 수 몇 개 중에서, 최고 점수와 이 비율 안의 수 가운데 무작위로 골라요
 *  vcf·vct: 4 연속 수순 / 3·4 수순을 몇 수까지 찾아볼지
 *  guard·guardVct: 상대에게 그런 수순이 생기는 자리를 미리 막을지(몇 수까지)
 *  think: 한 수에 쓰는 최대 시간(ms). 느린 기기에서는 그만큼 덜 찾아봐요.
 */
export const LEVELS = [
  null,
  { missWin: 0.3, seeFour: 0.55, seeThree: 0.1, defense: 0.5, pick: 6, spread: 0.8 },
  { missWin: 0.15, seeFour: 0.75, seeThree: 0.3, defense: 0.6, pick: 5, spread: 0.6 },
  { missWin: 0.05, seeFour: 0.9, seeThree: 0.5, defense: 0.7, pick: 4, spread: 0.45 },
  { missWin: 0, seeFour: 1, seeThree: 0.7, defense: 0.78, pick: 3, spread: 0.3 },
  { missWin: 0, seeFour: 1, seeThree: 0.85, defense: 0.84, pick: 3, spread: 0.2, vcf: 4 },
  { missWin: 0, seeFour: 1, seeThree: 0.95, defense: 0.88, pick: 2, spread: 0.12, vcf: 6 },
  { missWin: 0, seeFour: 1, seeThree: 1, defense: 0.9, pick: 2, spread: 0.08, vcf: 8, guard: true },
  { missWin: 0, seeFour: 1, seeThree: 1, defense: 0.92, pick: 2, spread: 0.05, vcf: 10, vct: 3, guard: true },
  { missWin: 0, seeFour: 1, seeThree: 1, defense: 0.94, pick: 2, spread: 0.03, vcf: 12, vct: 4, guard: true, guardVct: 2 },
  { missWin: 0, seeFour: 1, seeThree: 1, defense: 0.95, pick: 1, spread: 0.02, vcf: 14, vct: 5, guard: true, guardVct: 3, think: 2500 },
];

/**
 * 컴퓨터의 다음 수(칸 번호). moves: 지금까지 둔 칸들, level: 1~10, random: 0~1 난수 함수
 */
export function chooseMove(moves, level, random = Math.random) {
  const cfg = LEVELS[Math.max(1, Math.min(10, level))];
  const grid = gridOf(moves);
  const me = colorOfTurn(moves.length);
  const opp = other(me);
  const until = now() + (cfg.think || 1500);

  // 첫 수는 가운데, 두 번째 수는 가운데 돌 바로 옆
  if (moves.length === 0) return CENTER;
  if (moves.length === 1) {
    const around = [-SIZE - 1, -SIZE, -SIZE + 1, -1, 1, SIZE - 1, SIZE, SIZE + 1]
      .map((d) => moves[0] + d)
      .filter((c) => c >= 0 && c < CELL_COUNT && Math.abs(colOf(c) - colOf(moves[0])) <= 1 && grid[c] === EMPTY);
    return around[Math.floor(random() * around.length)] ?? CENTER;
  }

  const cells = candidates(grid).filter((c) => !moveProblem(grid, me, c));
  if (!cells.length) {
    // 둘 곳이 주변에 없으면 아무 빈칸
    for (let c = 0; c < CELL_COUNT; c++) if (!moveProblem(grid, me, c)) return c;
    return -1;
  }

  const seeFour = random() < cfg.seeFour;
  const seeThree = seeFour && random() < cfg.seeThree;

  // 1) 바로 이기는 수
  const wins = fiveCells(grid, me, cells);
  if (wins.length && random() >= cfg.missWin) return wins[0];
  // 2) 상대 5목 막기
  const threats = fiveCells(grid, opp, candidates(grid)).filter((c) => !moveProblem(grid, opp, c));
  if (threats.length && seeFour) {
    const block = threats.find((c) => !moveProblem(grid, me, c));
    if (block !== undefined) return block;
  }
  // 3) 4를 연달아 두어 이기는 수순 / 3·4로 몰아붙이는 수순
  if (!threats.length) {
    if (cfg.vcf) {
      const v = findVcf(grid, me, cfg.vcf, { n: 4000, until: now() + (until - now()) * 0.3 });
      if (v !== null) return v;
    }
    if (cfg.vct) {
      const v = findVct(grid, me, cfg.vct, { n: 6000, until: now() + (until - now()) * 0.5 });
      if (v !== null) return v;
    }
  }

  // 4) 점수로 고르기: 공격 + 수비
  let scored = cells.map((cell) => ({
    cell,
    score: cellValue(grid, cell, me) + threatValue(grid, cell, opp, seeThree) * cfg.defense,
  }));
  scored.sort((a, b) => b.score - a.score);

  // 5) 높은 단계: 두고 나서 상대에게 이기는 수순이 생기는 자리는 피하기
  if (cfg.guard) {
    const top = scored.slice(0, 8);
    const safe = top.filter(({ cell }) => {
      if (now() > until) return true;
      if (cellValue(grid, cell, me) >= WIN_NEXT) return true;
      grid[cell] = me;
      const share = Math.max(30, (until - now()) / 8);
      let danger = findVcf(grid, opp, 8, { n: 800, until: now() + share }) !== null;
      if (!danger && cfg.guardVct) danger = findVct(grid, opp, cfg.guardVct, { n: 600, until: now() + share }) !== null;
      grid[cell] = EMPTY;
      return !danger;
    });
    if (safe.length) scored = safe;
  }

  // 6) 좋은 수 몇 개 중에서 고르기(낮은 단계일수록 넓게)
  const best = scored[0].score;
  const pool = scored.slice(0, cfg.pick).filter((s) => s.score >= best * (1 - cfg.spread));
  return pool[Math.floor(random() * pool.length)].cell;
}
