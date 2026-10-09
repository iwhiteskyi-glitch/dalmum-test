// 장기 "오늘의 문제" 풀이기: 장군을 계속 부르며 몇 수 안에 외통을 만드는지 따져요.
// 장군을 받는 쪽은 한수쉼을 할 수 없어서, 막는 쪽이 둘 수 있는 수가 분명하게 정해져요.
// 문제를 뽑을 때(정답이 딱 하나인지 확인)와, 화면에서 방문자가 둔 수가 맞는지 확인할 때 같이 써요.

import { POINTS, sideOfPiece, pseudoTargets, inCheck, legalTargets, play } from "./rules.js";

function moved(squares, from, to) {
  const next = squares.split("");
  next[to] = next[from];
  next[from] = ".";
  return next.join("");
}

/** 지금 차례인 쪽이 둘 수 있는 모든 수 */
export function allMoves(state) {
  const list = [];
  for (let f = 0; f < POINTS; f++) {
    if (sideOfPiece(state.squares[f]) !== state.turn) continue;
    for (const t of legalTargets(state, f)) list.push({ from: f, to: t });
  }
  return list;
}

/** 장군이 되는 수들(상대 궁을 공격하면서, 내 궁은 안전한 수) */
export function checkMoves(state) {
  const me = state.turn;
  const list = [];
  for (let f = 0; f < POINTS; f++) {
    if (sideOfPiece(state.squares[f]) !== me) continue;
    for (const t of pseudoTargets(state.squares, f)) {
      const next = moved(state.squares, f, t);
      if (inCheck(next, 1 - me) && !inCheck(next, me)) list.push({ from: f, to: t });
    }
  }
  return list;
}

/** 이 장군 수를 두면 남은 n수(이 수 포함) 안에 외통이 되는지 */
function matesWith(state, m, n, budget) {
  if (--budget.n < 0) return false;
  const me = state.turn;
  const r = play(state, m);
  if (!r) return false;
  if (r.end) return r.end.winner === me;
  if (n <= 1) return false;
  for (const reply of allMoves(r.state)) {
    const r2 = play(r.state, reply);
    if (!r2 || r2.end) return false; // 막는 쪽이 오히려 외통을 만들면 실패
    if (!mates(r2.state, n - 1, budget)) return false;
  }
  return true;
}

function mates(state, n, budget) {
  for (const m of checkMoves(state)) if (matesWith(state, m, n, budget)) return true;
  return false;
}

/** 지금 차례인 쪽이 장군만으로 n수 안에 외통을 만드는 첫 수들. 계산이 너무 길어지면 null */
export function matingFirstMoves(state, n, limit = 20000) {
  const s = { ...state, ply: 0, lastPassed: false };
  const budget = { n: limit };
  const wins = checkMoves(s).filter((m) => matesWith(s, m, n, budget));
  return budget.n < 0 ? null : wins;
}

/** 막는 쪽의 응수: 외통을 가장 늦추는 수(남은 수가 같으면 처음 것) */
export function bestDefense(state, n) {
  const replies = allMoves(state);
  let best = null;
  let bestLeft = -1;
  for (const reply of replies) {
    const r = play({ ...state, ply: 0 }, reply);
    if (!r || r.end) continue;
    let left = n; // n-1수 안에 외통이 안 되면 가장 좋은 응수
    for (let k = 1; k < n; k++) {
      const w = matingFirstMoves(r.state, k);
      if (w && w.length) {
        left = k;
        break;
      }
    }
    if (left > bestLeft) {
      bestLeft = left;
      best = reply;
    }
  }
  return best;
}
