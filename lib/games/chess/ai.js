// 체스 컴퓨터 상대. 규칙 파일(rules.js)은 화면과 판정을 맡고, 여기서는 빠르게 계산하려고
// 숫자 배열 판을 따로 써서 "두고 → 되돌리기"를 반복하며 여러 수 앞을 살펴봐요(알파베타 탐색).
//  - 점수: 말의 가치(폰 100, 나이트 320, 비숍 330, 룩 500, 퀸 900) + 말마다 좋은 자리 표
//  - 탐색: 정해진 깊이까지 + 잡는 수는 조용해질 때까지 더 살펴봄(잡고 잡히기 계산)
//  - 단계: 낮을수록 얕게 보고, 수마다 점수를 크게 흔들거나 가끔 아무 수나 둬요
import { legalMovesFrom, PROMOTION_PIECES, play } from "./rules.js";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

// 말 번호: 1 폰 2 나이트 3 비숍 4 룩 5 퀸 6 킹 (백은 +, 흑은 -)
const CODE = { P: 1, N: 2, B: 3, R: 4, Q: 5, K: 6 };
const VALUE = [0, 100, 320, 330, 500, 900, 0];
const PROMO_LETTER = ["", "", "N", "B", "R", "Q"];

// 좋은 자리 표(백 기준, 0번이 a8). 흑은 위아래를 뒤집어(sq ^ 56) 씁니다.
const PST = [
  null,
  [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
];
// 말이 적게 남은 끝판에는 킹이 가운데로 나오는 게 좋아요.
const KING_END = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];

// 칸마다 미리 계산한 이동 목록
const rc = (sq) => [sq >> 3, sq & 7];
const onBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const KNIGHT_TO = [];
const KING_TO = [];
const RAYS = []; // RAYS[sq][0..3] 직선(룩), [4..7] 대각선(비숍)
const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
for (let sq = 0; sq < 64; sq++) {
  const [r, c] = rc(sq);
  KNIGHT_TO[sq] = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ]
    .filter(([dr, dc]) => onBoard(r + dr, c + dc))
    .map(([dr, dc]) => (r + dr) * 8 + c + dc);
  KING_TO[sq] = DIRS.filter(([dr, dc]) => onBoard(r + dr, c + dc)).map(([dr, dc]) => (r + dr) * 8 + c + dc);
  RAYS[sq] = DIRS.map(([dr, dc]) => {
    const ray = [];
    for (let rr = r + dr, cc = c + dc; onBoard(rr, cc); rr += dr, cc += dc) ray.push(rr * 8 + cc);
    return ray;
  });
}
// 이 칸에서 말이 움직이거나 잡히면 잃는 캐슬링 권리(1 K, 2 Q, 4 k, 8 q)
const CASTLE_KEEP = new Array(64).fill(15);
CASTLE_KEEP[60] = 15 & ~3;
CASTLE_KEEP[63] = 15 & ~1;
CASTLE_KEEP[56] = 15 & ~2;
CASTLE_KEEP[4] = 15 & ~12;
CASTLE_KEEP[7] = 15 & ~4;
CASTLE_KEEP[0] = 15 & ~8;

/* ───────────── 판 ───────────── */

function fromState(state) {
  const b = new Int8Array(64);
  const kings = [0, 0];
  for (let i = 0; i < 64; i++) {
    const ch = state.squares[i];
    if (ch === ".") continue;
    const t = CODE[ch.toUpperCase()];
    const white = ch === ch.toUpperCase();
    b[i] = white ? t : -t;
    if (t === 6) kings[white ? 0 : 1] = i;
  }
  let castle = 0;
  if (state.castling.includes("K")) castle |= 1;
  if (state.castling.includes("Q")) castle |= 2;
  if (state.castling.includes("k")) castle |= 4;
  if (state.castling.includes("q")) castle |= 8;
  return { b, side: state.turn === "w" ? 1 : -1, castle, ep: state.enPassant ?? -1, kings, stack: [] };
}

/** by(1 백, -1 흑)가 sq를 공격하는지 */
function attacked(pos, sq, by) {
  const b = pos.b;
  const [r, c] = rc(sq);
  const pr = by === 1 ? r + 1 : r - 1;
  if (pr >= 0 && pr < 8) {
    if (c > 0 && b[pr * 8 + c - 1] === by) return true;
    if (c < 7 && b[pr * 8 + c + 1] === by) return true;
  }
  for (const t of KNIGHT_TO[sq]) if (b[t] === 2 * by) return true;
  for (const t of KING_TO[sq]) if (b[t] === 6 * by) return true;
  const rays = RAYS[sq];
  for (let d = 0; d < 8; d++) {
    const ray = rays[d];
    for (let i = 0; i < ray.length; i++) {
      const p = b[ray[i]];
      if (!p) continue;
      if (p * by > 0) {
        const t = p * by;
        if (t === 5 || (d < 4 ? t === 4 : t === 3)) return true;
      }
      break;
    }
  }
  return false;
}

const inCheck = (pos, side) => attacked(pos, pos.kings[side === 1 ? 0 : 1], -side);

// 수: from | to<<6 | promo<<12 | flag<<15 (flag 1 앙파상, 2 캐슬링, 4 폰 두 칸)
const mk = (f, t, promo = 0, flag = 0) => f | (t << 6) | (promo << 12) | (flag << 15);
const mFrom = (m) => m & 63;
const mTo = (m) => (m >> 6) & 63;
const mPromo = (m) => (m >> 12) & 7;
const mFlag = (m) => m >> 15;

function genMoves(pos, capsOnly) {
  const { b, side } = pos;
  const out = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq] * side;
    if (p <= 0) continue;
    if (p === 1) {
      const dir = side === 1 ? -8 : 8;
      const r = sq >> 3;
      const c = sq & 7;
      const start = side === 1 ? 6 : 1;
      const last = side === 1 ? 1 : 6; // 이 줄에서 한 칸 가면 프로모션
      const one = sq + dir;
      if (!b[one]) {
        if (r === last) for (const pr of [5, 2, 4, 3]) out.push(mk(sq, one, pr));
        else if (!capsOnly) {
          out.push(mk(sq, one));
          if (r === start && !b[one + dir]) out.push(mk(sq, one + dir, 0, 4));
        }
      }
      for (const dc of [-1, 1]) {
        const cc = c + dc;
        if (cc < 0 || cc > 7) continue;
        const to = one + dc;
        if (b[to] * side < 0) {
          if (r === last) for (const pr of [5, 2, 4, 3]) out.push(mk(sq, to, pr));
          else out.push(mk(sq, to));
        } else if (to === pos.ep) out.push(mk(sq, to, 0, 1));
      }
    } else if (p === 2 || p === 6) {
      for (const t of p === 2 ? KNIGHT_TO[sq] : KING_TO[sq]) {
        const q = b[t] * side;
        if (q > 0) continue;
        if (capsOnly && q === 0) continue;
        out.push(mk(sq, t));
      }
      if (p === 6 && !capsOnly) {
        if (side === 1 && sq === 60) {
          if (pos.castle & 1 && !b[61] && !b[62] && b[63] === 4 && !attacked(pos, 60, -1) && !attacked(pos, 61, -1) && !attacked(pos, 62, -1))
            out.push(mk(60, 62, 0, 2));
          if (pos.castle & 2 && !b[59] && !b[58] && !b[57] && b[56] === 4 && !attacked(pos, 60, -1) && !attacked(pos, 59, -1) && !attacked(pos, 58, -1))
            out.push(mk(60, 58, 0, 2));
        } else if (side === -1 && sq === 4) {
          if (pos.castle & 4 && !b[5] && !b[6] && b[7] === -4 && !attacked(pos, 4, 1) && !attacked(pos, 5, 1) && !attacked(pos, 6, 1))
            out.push(mk(4, 6, 0, 2));
          if (pos.castle & 8 && !b[3] && !b[2] && !b[1] && b[0] === -4 && !attacked(pos, 4, 1) && !attacked(pos, 3, 1) && !attacked(pos, 2, 1))
            out.push(mk(4, 2, 0, 2));
        }
      }
    } else {
      const from = p === 4 ? 0 : p === 3 ? 4 : 0;
      const to = p === 4 ? 4 : 8;
      const rays = RAYS[sq];
      for (let d = from; d < to; d++) {
        const ray = rays[d];
        for (let i = 0; i < ray.length; i++) {
          const t = ray[i];
          const q = b[t] * side;
          if (q > 0) break;
          if (q < 0) {
            out.push(mk(sq, t));
            break;
          }
          if (!capsOnly) out.push(mk(sq, t));
        }
      }
    }
  }
  return out;
}

function make(pos, m) {
  const { b } = pos;
  const f = mFrom(m);
  const t = mTo(m);
  const flag = mFlag(m);
  const p = b[f];
  let cap = b[t];
  let capSq = t;
  if (flag === 1) {
    capSq = t + (pos.side === 1 ? 8 : -8);
    cap = b[capSq];
    b[capSq] = 0;
  }
  pos.stack.push({ m, cap, capSq, castle: pos.castle, ep: pos.ep });
  const promo = mPromo(m);
  b[t] = promo ? promo * pos.side : p;
  b[f] = 0;
  if (flag === 2) {
    if (t === 62) {
      b[61] = b[63];
      b[63] = 0;
    } else if (t === 58) {
      b[59] = b[56];
      b[56] = 0;
    } else if (t === 6) {
      b[5] = b[7];
      b[7] = 0;
    } else if (t === 2) {
      b[3] = b[0];
      b[0] = 0;
    }
  }
  if (p === 6) pos.kings[0] = t;
  else if (p === -6) pos.kings[1] = t;
  pos.castle &= CASTLE_KEEP[f] & CASTLE_KEEP[t];
  pos.ep = flag === 4 ? (f + t) >> 1 : -1;
  pos.side = -pos.side;
}

function unmake(pos) {
  const { m, cap, capSq, castle, ep } = pos.stack.pop();
  const { b } = pos;
  pos.side = -pos.side;
  const f = mFrom(m);
  const t = mTo(m);
  const flag = mFlag(m);
  const moved = mPromo(m) ? pos.side : b[t];
  b[f] = moved;
  b[t] = 0;
  b[capSq] = cap;
  if (flag === 2) {
    if (t === 62) {
      b[63] = b[61];
      b[61] = 0;
    } else if (t === 58) {
      b[56] = b[59];
      b[59] = 0;
    } else if (t === 6) {
      b[7] = b[5];
      b[5] = 0;
    } else if (t === 2) {
      b[0] = b[3];
      b[3] = 0;
    }
  }
  if (moved === 6) pos.kings[0] = f;
  else if (moved === -6) pos.kings[1] = f;
  pos.castle = castle;
  pos.ep = ep;
}

/** 지금 둘 쪽 기준 점수 */
function evaluate(pos) {
  const { b } = pos;
  let score = 0;
  let heavy = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq];
    if (p && p !== 6 && p !== -6 && p !== 1 && p !== -1) heavy += VALUE[p > 0 ? p : -p];
  }
  const endgame = heavy <= 1300;
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq];
    if (!p) continue;
    if (p > 0) score += VALUE[p] + (p === 6 && endgame ? KING_END[sq] : PST[p][sq]);
    else score -= VALUE[-p] + (p === -6 && endgame ? KING_END[sq ^ 56] : PST[-p][sq ^ 56]);
  }
  return score * pos.side;
}

const MATE = 100000;

function order(pos, moves) {
  const { b } = pos;
  const key = (m) => {
    const cap = b[mTo(m)];
    let s = 0;
    if (cap) s += 10 * VALUE[cap > 0 ? cap : -cap] - VALUE[Math.abs(b[mFrom(m)])] / 10 + 1000;
    if (mPromo(m)) s += 900 + VALUE[mPromo(m)];
    return s;
  };
  return moves.map((m) => [key(m), m]).sort((x, y) => y[0] - x[0]).map((x) => x[1]);
}

function quiesce(pos, alpha, beta, ctx, qd = 0) {
  if ((++ctx.nodes & 1023) === 0 && now() > ctx.until) ctx.out = true;
  if (ctx.out) return 0;
  const stand = evaluate(pos);
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  if (qd > 8) return stand;
  for (const m of order(pos, genMoves(pos, true))) {
    make(pos, m);
    if (inCheck(pos, -pos.side)) {
      unmake(pos);
      continue;
    }
    const v = -quiesce(pos, -beta, -alpha, ctx, qd + 1);
    unmake(pos);
    if (ctx.out) return 0;
    if (v >= beta) return v;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

function search(pos, depth, alpha, beta, ply, ctx) {
  if ((++ctx.nodes & 1023) === 0 && now() > ctx.until) ctx.out = true;
  if (ctx.out) return 0;
  const checked = inCheck(pos, pos.side);
  if (checked && ply < 12) depth++; // 체크를 받으면 한 수 더 봐요
  if (depth <= 0) return ctx.quiet ? quiesce(pos, alpha, beta, ctx) : evaluate(pos);
  let legal = 0;
  let best = -Infinity;
  for (const m of order(pos, genMoves(pos, false))) {
    make(pos, m);
    if (inCheck(pos, -pos.side)) {
      unmake(pos);
      continue;
    }
    legal++;
    const v = -search(pos, depth - 1, -beta, -alpha, ply + 1, ctx);
    unmake(pos);
    if (ctx.out) return 0;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  if (!legal) return checked ? -MATE + ply : 0;
  return best;
}

/** 루트의 합법 수마다 점수(깊이 depth). full이면 모든 수를 정확히, 아니면 최선 수만 정확히(빠름) */
function rootScores(pos, moves, depth, ctx, full) {
  const out = [];
  let alpha = -Infinity;
  for (const m of moves) {
    make(pos, m);
    const v = -search(pos, depth - 1, -Infinity, full ? Infinity : -alpha, 1, ctx);
    unmake(pos);
    if (ctx.out) return null;
    out.push({ m, v });
    if (v > alpha) alpha = v;
  }
  return out;
}

/**
 * depth: 기본 깊이 · max: 시간이 남으면 더 깊이 · quiet: 잡고 잡히기를 끝까지 계산할지
 * noise: 수마다 점수 흔들림(센티폰) · blunder: 아무 수나 둘 확률 · think: 한 수 최대 시간(ms)
 */
export const LEVELS = [
  null,
  { depth: 1, noise: 400, blunder: 0.45 },
  { depth: 1, noise: 250, blunder: 0.25 },
  { depth: 1, quiet: true, noise: 150, blunder: 0.12 },
  { depth: 2, quiet: true, noise: 90, blunder: 0.06 },
  { depth: 2, quiet: true, noise: 50 },
  { depth: 3, quiet: true, noise: 30 },
  { depth: 3, quiet: true, noise: 12, max: 4 },
  { depth: 4, quiet: true, noise: 6, max: 4 },
  { depth: 4, quiet: true, noise: 0, max: 5, think: 2200 },
  { depth: 5, quiet: true, noise: 0, max: 8, think: 2800 },
];

export function chooseMove(state, level, random = Math.random) {
  const cfg = LEVELS[Math.max(1, Math.min(10, level))];
  const pos = fromState(state);
  const moves = order(pos, genMoves(pos, false)).filter((m) => {
    make(pos, m);
    const ok = !inCheck(pos, -pos.side);
    unmake(pos);
    return ok;
  });
  if (!moves.length) return null;
  if (moves.length === 1 || random() < (cfg.blunder || 0)) return moves[Math.floor(random() * moves.length)];

  const began = now();
  const total = cfg.think || 1500;
  const ctx = { nodes: 0, until: began + total, out: false, quiet: Boolean(cfg.quiet) };
  const full = cfg.noise > 0;
  let scored = null;
  let list = moves;
  for (let d = 1; d <= Math.max(cfg.depth, cfg.max || 0); d++) {
    // 기본 깊이를 넘어서는, 시간이 넉넉히(40% 미만 사용) 남았을 때만 한 단계 더 봐요
    if (d > cfg.depth && now() - began > total * 0.4) break;
    const r = rootScores(pos, list, d, ctx, full);
    if (!r) break;
    scored = r;
    // 다음 깊이는 좋은 수부터 보면 빨라요
    list = [...r].sort((a, b) => b.v - a.v).map((x) => x.m);
    if (Math.abs(r.reduce((a, x) => Math.max(a, x.v), -Infinity)) > MATE - 100) break; // 메이트를 찾았으면 그만
  }
  if (!scored) scored = moves.map((m) => ({ m, v: 0 }));
  // 같은 배치 세 번·50수 규칙으로 바로 비기는 수는 무승부(0점)로 봐요: 이기고 있으면 피하고, 지고 있으면 노려요
  for (const s of scored) {
    const r = play(state, toRuleMove(s.m));
    if (r && r.end && r.end.winner === null) s.v = 0;
  }
  for (const s of scored) s.v += (random() * 2 - 1) * (cfg.noise || 0);
  scored.sort((a, b) => b.v - a.v);
  return scored[0].m;
}

function toRuleMove(m) {
  const move = { from: mFrom(m), to: mTo(m) };
  if (mPromo(m)) move.promotion = PROMO_LETTER[mPromo(m)];
  return move;
}

/** 화면·작업자 공통 입구: 규칙 파일 형식의 수 { from, to, promotion } (없으면 null) */
export function pickMove(state, level, random = Math.random) {
  const m = chooseMove(state, level, random);
  if (m === null) return null;
  const move = toRuleMove(m);
  // 혹시 계산 판과 규칙 판이 어긋나면 규칙 쪽 합법 수 중에서 고르기
  const legal = legalMovesFrom(state, move.from).some((x) => x.to === move.to);
  if (legal && (!move.promotion || PROMOTION_PIECES.includes(move.promotion))) return move;
  for (let sq = 0; sq < 64; sq++) {
    const l = legalMovesFrom(state, sq);
    if (l.length) return l[0];
  }
  return null;
}

/** 검증용: 깊이 depth까지 가능한 수순의 개수(규칙 파일과 같은지 비교해요) */
export function perft(state, depth) {
  const pos = fromState(state);
  const walk = (d) => {
    if (d === 0) return 1;
    let n = 0;
    for (const m of genMoves(pos, false)) {
      make(pos, m);
      if (!inCheck(pos, -pos.side)) n += walk(d - 1);
      unmake(pos);
    }
    return n;
  };
  return walk(depth);
}
