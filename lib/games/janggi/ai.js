// 장기 컴퓨터 상대. 체스와 같은 방식(알파베타 탐색)으로 여러 수 앞을 살펴봐요.
//  - 빠르게 계산하려고 숫자 배열 판을 쓰고, 탐색 중에는 "궁을 잡는 수"가 나오면 그쪽이 이긴 것으로 봐요
//    (그래서 자기 궁을 위험하게 두는 수는 자연스럽게 피해요). 처음 고르는 수만 규칙 파일로 한 번 더 확인해요.
//  - 점수: 말의 가치(차 13, 포 7, 마 5, 상 3, 사 3, 졸 2 — 전통 점수) + 졸이 앞으로 나간 정도, 말이 움직일 수 있는 곳
//  - 단계: 낮을수록 얕게 보고, 점수를 크게 흔들거나 가끔 아무 수나 둬요
import { COLS, ROWS, POINTS, inPalace, diagonalLinked, legalTargets, sideOfPiece, canPass } from "./rules.js";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

// 말 번호: 1 궁 2 사 3 상 4 마 5 차 6 포 7 졸 (초는 +, 한은 -)
const CODE = { K: 1, A: 2, E: 3, H: 4, R: 5, C: 6, P: 7 };
const VALUE = [0, 0, 300, 300, 500, 1300, 700, 200];
const KING_CAPTURE = 1000000;

const at = (r, c) => r * COLS + c;
const inside = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const ORTHO = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIAG = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function fromState(state) {
  const b = new Int8Array(POINTS);
  for (let i = 0; i < POINTS; i++) {
    const ch = state.squares[i];
    if (ch === ".") continue;
    const t = CODE[ch.toUpperCase()];
    b[i] = ch === ch.toUpperCase() ? t : -t;
  }
  return { b, side: state.turn === 0 ? 1 : -1 };
}

/** pos.side 쪽의 모든 수 [from, to] (궁 안전은 따지지 않음) */
function genMoves(pos, capsOnly) {
  const { b, side } = pos;
  const out = [];
  const sideIdx = side === 1 ? 0 : 1;
  const push = (f, r, c) => {
    if (!inside(r, c)) return;
    const t = at(r, c);
    const q = b[t] * side;
    if (q > 0) return;
    if (capsOnly && q === 0) return;
    out.push(f * 128 + t);
  };
  for (let f = 0; f < POINTS; f++) {
    const p = b[f] * side;
    if (p <= 0) continue;
    const row = (f / COLS) | 0;
    const col = f % COLS;
    switch (p) {
      case 1:
      case 2:
        for (const [dr, dc] of ORTHO) if (inPalace(row + dr, col + dc, sideIdx)) push(f, row + dr, col + dc);
        for (const [dr, dc] of DIAG) if (diagonalLinked(row, col, dr, dc) && inPalace(row + dr, col + dc, sideIdx)) push(f, row + dr, col + dc);
        break;
      case 5: {
        const ray = (dr, dc, diagonal) => {
          let r = row;
          let c = col;
          for (;;) {
            if (diagonal && !diagonalLinked(r, c, dr, dc)) break;
            r += dr;
            c += dc;
            if (!inside(r, c)) break;
            const q = b[at(r, c)];
            if (q) {
              push(f, r, c);
              break;
            }
            if (!capsOnly) out.push(f * 128 + at(r, c));
          }
        };
        for (const [dr, dc] of ORTHO) ray(dr, dc, false);
        for (const [dr, dc] of DIAG) ray(dr, dc, true);
        break;
      }
      case 6: {
        const ray = (dr, dc, diagonal) => {
          let r = row;
          let c = col;
          let jumped = false;
          for (;;) {
            if (diagonal && !diagonalLinked(r, c, dr, dc)) break;
            r += dr;
            c += dc;
            if (!inside(r, c)) break;
            const q = b[at(r, c)];
            if (!jumped) {
              if (!q) continue;
              if (q === 6 || q === -6) break; // 포는 포를 넘지 못해요
              jumped = true;
              continue;
            }
            if (!q) {
              if (!capsOnly) out.push(f * 128 + at(r, c));
              continue;
            }
            if (q !== 6 && q !== -6 && q * side < 0) out.push(f * 128 + at(r, c));
            break;
          }
        };
        for (const [dr, dc] of ORTHO) ray(dr, dc, false);
        for (const [dr, dc] of DIAG) ray(dr, dc, true);
        break;
      }
      case 4:
        for (const [dr, dc] of ORTHO) {
          if (!inside(row + dr, col + dc) || b[at(row + dr, col + dc)]) continue;
          if (dr === 0) {
            push(f, row - 1, col + 2 * dc);
            push(f, row + 1, col + 2 * dc);
          } else {
            push(f, row + 2 * dr, col - 1);
            push(f, row + 2 * dr, col + 1);
          }
        }
        break;
      case 3:
        for (const [dr, dc] of ORTHO) {
          if (!inside(row + dr, col + dc) || b[at(row + dr, col + dc)]) continue;
          const sides = dr === 0 ? [
            [-1, dc],
            [1, dc],
          ] : [
            [dr, -1],
            [dr, 1],
          ];
          for (const [sr, sc] of sides) {
            const mr = row + dr + sr;
            const mc = col + dc + sc;
            if (!inside(mr, mc) || b[at(mr, mc)]) continue;
            push(f, mr + sr, mc + sc);
          }
        }
        break;
      case 7: {
        const fwd = side === 1 ? -1 : 1;
        push(f, row + fwd, col);
        push(f, row, col - 1);
        push(f, row, col + 1);
        for (const dc of [-1, 1]) {
          if (diagonalLinked(row, col, fwd, dc) && inPalace(row + fwd, col + dc, sideIdx === 0 ? 1 : 0)) push(f, row + fwd, col + dc);
        }
        break;
      }
    }
  }
  return out;
}

function evaluate(pos) {
  const { b } = pos;
  let s = 0;
  for (let i = 0; i < POINTS; i++) {
    const p = b[i];
    if (!p) continue;
    const t = p > 0 ? p : -p;
    let v = VALUE[t];
    const row = (i / COLS) | 0;
    const col = i % COLS;
    if (t === 7) v += (p > 0 ? 6 - row : row - 3) * 12; // 졸이 앞으로 나갈수록 조금 더
    else if (t === 4 || t === 5) v += (4 - Math.abs(col - 4)) * 4; // 마·차는 가운데 쪽이 조금 더
    s += p > 0 ? v : -v;
  }
  return s * pos.side;
}

function order(pos, moves) {
  const { b } = pos;
  return moves
    .map((m) => {
      const cap = b[m % 128];
      return [cap ? VALUE[cap > 0 ? cap : -cap] * 10 - VALUE[Math.abs(b[(m / 128) | 0])] + (Math.abs(cap) === 1 ? 1e7 : 0) : 0, m];
    })
    .sort((x, y) => y[0] - x[0])
    .map((x) => x[1]);
}

function quiesce(pos, alpha, beta, ctx, qd = 0) {
  if ((++ctx.nodes & 1023) === 0 && now() > ctx.until) ctx.out = true;
  if (ctx.out) return 0;
  const stand = evaluate(pos);
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  if (qd > 6) return stand;
  const { b } = pos;
  for (const m of order(pos, genMoves(pos, true))) {
    const f = (m / 128) | 0;
    const t = m % 128;
    const cap = b[t];
    if (cap === 1 || cap === -1) return KING_CAPTURE;
    b[t] = b[f];
    b[f] = 0;
    pos.side = -pos.side;
    const v = -quiesce(pos, -beta, -alpha, ctx, qd + 1);
    pos.side = -pos.side;
    b[f] = b[t];
    b[t] = cap;
    if (ctx.out) return 0;
    if (v >= beta) return v;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

function search(pos, depth, alpha, beta, ctx) {
  if ((++ctx.nodes & 1023) === 0 && now() > ctx.until) ctx.out = true;
  if (ctx.out) return 0;
  if (depth <= 0) return ctx.quiet ? quiesce(pos, alpha, beta, ctx) : evaluate(pos);
  const { b } = pos;
  let best = -Infinity;
  for (const m of order(pos, genMoves(pos, false))) {
    const f = (m / 128) | 0;
    const t = m % 128;
    const cap = b[t];
    if (cap === 1 || cap === -1) return KING_CAPTURE + depth; // 궁을 잡을 수 있으면 이긴 것
    b[t] = b[f];
    b[f] = 0;
    pos.side = -pos.side;
    const v = -search(pos, depth - 1, -beta, -alpha, ctx);
    pos.side = -pos.side;
    b[f] = b[t];
    b[t] = cap;
    if (ctx.out) return 0;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  if (best === -Infinity) return 0; // 둘 수가 없으면 한수쉼과 비슷하게 봐요
  return best;
}

/** depth·max·quiet·noise·blunder·think: 체스 컴퓨터와 같은 뜻 */
export const LEVELS = [
  null,
  { depth: 1, noise: 500, blunder: 0.45 },
  { depth: 1, noise: 300, blunder: 0.25 },
  { depth: 1, quiet: true, noise: 180, blunder: 0.12 },
  { depth: 2, quiet: true, noise: 110, blunder: 0.06 },
  { depth: 2, quiet: true, noise: 60 },
  { depth: 3, quiet: true, noise: 35 },
  { depth: 3, quiet: true, noise: 15, max: 4 },
  { depth: 3, quiet: true, noise: 6, max: 4, think: 2000 },
  { depth: 4, quiet: true, noise: 0, max: 5, think: 2400 },
  { depth: 4, quiet: true, noise: 0, max: 6, think: 3000 },
];

export function chooseMove(state, level, random = Math.random) {
  const cfg = LEVELS[Math.max(1, Math.min(10, level))];
  // 처음 고르는 수는 규칙 파일로 확인한 합법 수만
  const moves = [];
  for (let f = 0; f < POINTS; f++) {
    if (sideOfPiece(state.squares[f]) !== state.turn) continue;
    for (const t of legalTargets(state, f)) moves.push(f * 128 + t);
  }
  if (!moves.length) return canPass(state) ? { pass: true } : null;
  const toMove = (m) => ({ from: (m / 128) | 0, to: m % 128 });
  const pos = fromState(state);
  if (moves.length === 1 || random() < (cfg.blunder || 0)) return toMove(moves[Math.floor(random() * moves.length)]);

  const began = now();
  const total = cfg.think || 1500;
  const ctx = { nodes: 0, until: began + total, out: false, quiet: Boolean(cfg.quiet) };
  const full = cfg.noise > 0;
  const { b } = pos;
  let list = order(pos, moves);
  let scored = null;
  for (let d = 1; d <= Math.max(cfg.depth, cfg.max || 0); d++) {
    if (d > cfg.depth && now() - began > total * 0.35) break;
    const out = [];
    let alpha = -Infinity;
    for (const m of list) {
      const f = (m / 128) | 0;
      const t = m % 128;
      const cap = b[t];
      b[t] = b[f];
      b[f] = 0;
      pos.side = -pos.side;
      const v = -search(pos, d - 1, -Infinity, full ? Infinity : -alpha, ctx);
      pos.side = -pos.side;
      b[f] = b[t];
      b[t] = cap;
      if (ctx.out) break;
      out.push({ m, v });
      if (v > alpha) alpha = v;
    }
    if (ctx.out) break;
    scored = out;
    list = [...out].sort((x, y) => y.v - x.v).map((x) => x.m);
    if (alpha >= KING_CAPTURE / 2) break;
  }
  if (!scored) scored = list.map((m) => ({ m, v: 0 }));
  for (const s of scored) s.v += (random() * 2 - 1) * (cfg.noise || 0);
  scored.sort((x, y) => y.v - x.v);
  return toMove(scored[0].m);
}

/** 화면·작업자 공통 입구 */
export function pickMove(state, level) {
  return chooseMove(state, level);
}

/** 검증용: 계산 판이 만든 수 목록("출발-도착", 궁 안전은 안 따짐) — 규칙 파일과 같은지 비교해요 */
export function pseudoMoveList(state) {
  return genMoves(fromState(state), false)
    .map((m) => `${(m / 128) | 0}-${m % 128}`)
    .sort();
}
