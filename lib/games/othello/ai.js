// 오델로 컴퓨터 상대. 단계마다 내다보는 깊이(몇 수 앞까지 계산하는지)와 실수 정도를 다르게 해요.
//  - 낮은 단계: 무작위에 가깝거나, 그 자리에서 가장 많이 뒤집는 수만 노려요(초보가 흔히 하는 방식).
//  - 높은 단계: 모서리·변·둘 수 있는 곳의 수(행동력)를 따지며 여러 수 앞을 계산하고,
//    빈칸이 적게 남으면 끝까지 정확히 계산해서 최선의 수를 둬요.
import { CELLS, EMPTY, RAYS, legalMoves } from "./rules.js";

// 칸마다 가치: 모서리는 아주 좋고, 모서리 바로 옆(X·C 자리)은 모서리를 내주기 쉬워 나빠요.
const WEIGHTS = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120,
];
const CORNERS = [0, 7, 56, 63];
// 모서리를 이미 차지했으면 그 옆 칸은 더 이상 위험하지 않아요.
const CORNER_NEIGHBORS = { 0: [1, 8, 9], 7: [6, 15, 14], 56: [48, 57, 49], 63: [62, 55, 54] };

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** 둔 뒤 뒤집힌 칸 목록(되돌리기용). 둘 수 없으면 null */
function doMove(cells, idx, me) {
  if (cells[idx] !== EMPTY) return null;
  const opp = 3 - me;
  let flipped = null;
  for (const ray of RAYS[idx]) {
    let n = 0;
    while (n < ray.length && cells[ray[n]] === opp) n++;
    if (n > 0 && n < ray.length && cells[ray[n]] === me) {
      if (!flipped) flipped = [];
      for (let k = 0; k < n; k++) {
        cells[ray[k]] = me;
        flipped.push(ray[k]);
      }
    }
  }
  if (!flipped) return null;
  cells[idx] = me;
  return flipped;
}
function undoMove(cells, idx, flipped, me) {
  cells[idx] = EMPTY;
  const opp = 3 - me;
  for (const f of flipped) cells[f] = opp;
}

function movesFor(cells, me) {
  const out = [];
  for (let i = 0; i < CELLS; i++) {
    if (cells[i] !== EMPTY) continue;
    const flipped = doMove(cells, i, me);
    if (flipped) {
      undoMove(cells, i, flipped, me);
      out.push(i);
    }
  }
  return out;
}

/** me 입장의 점수 */
function evaluate(cells, me) {
  const opp = 3 - me;
  let pos = 0;
  let mine = 0;
  let theirs = 0;
  for (let i = 0; i < CELLS; i++) {
    const v = cells[i];
    if (v === EMPTY) continue;
    let w = WEIGHTS[i];
    if (w < 0) {
      // 모서리를 이미 누가 가졌으면 옆 칸의 나쁜 점수는 지워요
      for (const c of CORNERS) if (cells[c] !== EMPTY && CORNER_NEIGHBORS[c].includes(i)) w = 4;
    }
    if (v === me) {
      pos += w;
      mine++;
    } else {
      pos -= w;
      theirs++;
    }
  }
  const myMob = movesFor(cells, me).length;
  const opMob = movesFor(cells, opp).length;
  const mobility = myMob + opMob ? (100 * (myMob - opMob)) / (myMob + opMob) : 0;
  const empties = 64 - mine - theirs;
  const discs = empties < 14 ? (mine - theirs) * (14 - empties) : 0;
  return pos + mobility * 0.9 + discs;
}

const WIN = 100000;

function negamax(cells, me, depth, alpha, beta, budget, passed) {
  if (budget.out || (++budget.n & 255) === 0 && now() > budget.until) {
    budget.out = true;
    return 0;
  }
  const opp = 3 - me;
  if (cells.indexOf(EMPTY) === -1) {
    let d = 0;
    for (const v of cells) d += v === me ? 1 : -1;
    return d > 0 ? WIN + d : d < 0 ? -WIN + d : 0;
  }
  if (depth === 0) return evaluate(cells, me);
  const moves = movesFor(cells, me);
  if (!moves.length) {
    if (passed) {
      // 둘 다 둘 곳이 없음: 끝
      let d = 0;
      for (const v of cells) d += v === me ? 1 : v === opp ? -1 : 0;
      return d > 0 ? WIN + d : d < 0 ? -WIN + d : 0;
    }
    return -negamax(cells, opp, depth, -beta, -alpha, budget, true);
  }
  // 좋은 칸부터 살펴보면 가지치기가 잘 돼요
  moves.sort((a, b) => WEIGHTS[b] - WEIGHTS[a]);
  let best = -Infinity;
  for (const m of moves) {
    const flipped = doMove(cells, m, me);
    const v = -negamax(cells, opp, depth - 1, -beta, -alpha, budget, false);
    undoMove(cells, m, flipped, me);
    if (budget.out) return 0;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

/** 루트에서 수마다 점수를 매겨요(깊이 depth). 시간이 다 되면 null */
function scoreMoves(cells, me, moves, depth, budget) {
  const opp = 3 - me;
  const out = [];
  for (const m of moves) {
    const flipped = doMove(cells, m, me);
    const v = -negamax(cells, opp, depth - 1, -Infinity, Infinity, budget, false);
    undoMove(cells, m, flipped, me);
    if (budget.out) return null;
    out.push({ m, v });
  }
  return out;
}

/**
 * depth: 기본으로 내다보는 깊이(시간이 남으면 그보다 깊게도 봐요: max)
 * solve: 빈칸이 이만큼 이하로 남으면 끝까지 계산
 * noise: 수마다 점수에 더하는 무작위 흔들림 / greedy: 가장 많이 뒤집는 수를 고르는 초보식
 */
export const LEVELS = [
  null,
  { random: true },
  { greedy: true, noise: 0.6 },
  { depth: 1, noise: 40 },
  { depth: 2, noise: 25 },
  { depth: 3, noise: 15 },
  { depth: 4, noise: 8, solve: 8 },
  { depth: 5, noise: 4, solve: 10 },
  { depth: 6, max: 7, noise: 2, solve: 12 },
  { depth: 6, max: 9, noise: 0, solve: 14 },
  { depth: 7, max: 12, noise: 0, solve: 16, think: 2500 },
];

export function chooseMove(state, level, random = Math.random) {
  const cfg = LEVELS[Math.max(1, Math.min(10, level))];
  const me = state.turn + 1;
  const cells = [...state.cells];
  const moves = movesFor(cells, me);
  if (!moves.length) return null;
  if (moves.length === 1) return moves[0];
  if (cfg.random) return moves[Math.floor(random() * moves.length)];
  if (cfg.greedy) {
    // 가장 많이 뒤집는 수(가끔은 아무 수)
    if (random() < cfg.noise * 0.5) return moves[Math.floor(random() * moves.length)];
    let best = moves[0];
    let bestN = -1;
    for (const m of moves) {
      const flipped = doMove(cells, m, me);
      const n = flipped.length + random() * 2;
      undoMove(cells, m, flipped, me);
      if (n > bestN) {
        bestN = n;
        best = m;
      }
    }
    return best;
  }

  const empties = cells.filter((v) => v === EMPTY).length;
  const budget = { n: 0, until: now() + (cfg.think || 1500), out: false };
  let scored = null;
  if (cfg.solve && empties <= cfg.solve) {
    scored = scoreMoves(cells, me, moves, empties, budget);
    budget.out = false;
    budget.until = Math.max(budget.until, now() + 300);
  }
  if (!scored) {
    // 정해진 깊이부터 한 칸씩 깊게: 시간이 다 되면 마지막으로 끝까지 계산한 결과를 써요
    for (let d = 1; d <= (cfg.max || cfg.depth); d++) {
      if (d > cfg.depth && now() > budget.until - 200) break;
      const r = scoreMoves(cells, me, moves, d, budget);
      if (!r) break;
      scored = r;
      if (d >= cfg.depth && now() > budget.until) break;
    }
  }
  if (!scored) scored = moves.map((m) => ({ m, v: WEIGHTS[m] }));
  for (const s of scored) s.v += (random() * 2 - 1) * (cfg.noise || 0);
  scored.sort((a, b) => b.v - a.v);
  return scored[0].m;
}

/** 화면·작업자 공통 입구 */
export function pickMove(state, level) {
  return chooseMove(state, level);
}
