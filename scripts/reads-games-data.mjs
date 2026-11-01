// 읽을거리(미니게임 글)에 쓸 숫자를 사이트의 실제 컴퓨터 코드로 계산해요.
// 실행: node scripts/reads-games-data.mjs <모드> <게임> [인자…]  → 결과 한 줄(JSON)을 화면에 찍어요.
//   self   <게임> <단계> <판 수>   같은 단계끼리 두어 먼저 둔 쪽·나중 둔 쪽 승률(돌 뒤집기는 귀 차지·돌 수도 기록)
//   ladder <게임> <단계 k> <판 수>  k단계 vs k+1단계, 먼저/나중을 번갈아 두어 위 단계가 몇 판 이기는지
// 게임: omok | othello | chess | janggi
import { performance } from "node:perf_hooks";

const [, , MODE, GAME, aArg, nArg] = process.argv;
const LEVEL = Number(aArg);
const N = Number(nArg);

async function adapter(name) {
  if (name === "omok") {
    const R = await import("../lib/games/omok/rules.js");
    const A = await import("../lib/games/omok/ai.js");
    return {
      init: () => [],
      turn: (moves) => moves.length % 2,
      apply: (moves, cell) => {
        const r = R.play(moves, cell);
        if (!r) return null;
        const winner = r.outcome === "win" ? (r.moves.length % 2 === 1 ? 0 : 1) : r.outcome === "draw" ? null : undefined;
        return { state: r.moves, winner, over: r.outcome === "win" || r.outcome === "draw" };
      },
      pick: (moves, level) => A.chooseMove(moves, level, Math.random),
      limit: 225,
    };
  }
  const R = await import(`../lib/games/${name}/rules.js`);
  const A = await import(`../lib/games/${name}/ai.js`);
  const init = name === "janggi" ? () => R.newState("HEEH", "HEEH") : () => R.newState();
  const turn = name === "othello" ? (s) => s.turn : (s) => R.turnOf(s);
  const pick = name === "othello" ? (s, l) => A.chooseMove(s, l) : (s, l) => A.pickMove(s, l);
  return {
    init,
    turn,
    apply: (s, m) => {
      const r = R.play(s, m);
      if (!r) return null;
      return { state: r.state, winner: r.end ? r.end.winner : undefined, over: !!r.end };
    },
    pick,
    limit: { othello: 80, chess: 300, janggi: 400 }[name],
  };
}

const g = await adapter(GAME);
const think = {};

/** 한 판: firstLevel이 먼저(흑·초·백 차례 0). 반환 { winner: 0 먼저 | 1 나중 | null 무승부, plies, state } */
function game(firstLevel, secondLevel) {
  let s = g.init();
  for (let ply = 0; ply < g.limit; ply++) {
    const side = g.turn(s);
    const level = side === 0 ? firstLevel : secondLevel;
    const t = performance.now();
    const m = g.pick(s, level);
    (think[level] ||= []).push(performance.now() - t);
    const r = g.apply(s, m);
    if (!r) throw new Error(`잘못된 수 ${GAME} ${level}단계`);
    s = r.state;
    if (r.over || r.winner !== undefined) return { winner: r.winner ?? null, plies: ply + 1, state: s };
  }
  return { winner: null, plies: g.limit, state: s, cut: true };
}

/** 돌 뒤집기 끝난 판에서 귀 4칸·돌 수를 세요(0 = 먼저 둔 흑). */
function othelloFacts(state) {
  const cells = state.cells || state.board;
  const corners = [0, 7, 56, 63];
  const cornerCount = [0, 0];
  const discs = [0, 0];
  cells.forEach((c, i) => {
    const side = c === 1 ? 0 : c === 2 ? 1 : c === "B" || c === "b" ? 0 : c === "W" || c === "w" ? 1 : -1;
    if (side < 0) return;
    discs[side]++;
    if (corners.includes(i)) cornerCount[side]++;
  });
  return { cornerCount, discs };
}

const stats = (a) => ({
  avg: Math.round(a.reduce((x, y) => x + y, 0) / a.length),
  max: Math.round(Math.max(...a)),
});
const out = { mode: MODE, game: GAME, level: LEVEL, games: N };

if (MODE === "self") {
  const res = { first: 0, second: 0, draw: 0, cut: 0, plies: [] };
  const oth = [];
  for (let i = 0; i < N; i++) {
    const r = game(LEVEL, LEVEL);
    if (r.cut) res.cut++;
    if (r.winner === 0) res.first++;
    else if (r.winner === 1) res.second++;
    else res.draw++;
    res.plies.push(r.plies);
    if (GAME === "othello") oth.push({ winner: r.winner, ...othelloFacts(r.state) });
  }
  out.first = res.first;
  out.second = res.second;
  out.draw = res.draw;
  out.cut = res.cut;
  out.plies = stats(res.plies);
  if (GAME === "othello") out.othello = oth;
} else if (MODE === "ladder") {
  let high = 0, low = 0, draw = 0, cut = 0;
  for (let i = 0; i < N; i++) {
    const highFirst = i % 2 === 0;
    const r = highFirst ? game(LEVEL + 1, LEVEL) : game(LEVEL, LEVEL + 1);
    if (r.cut) cut++;
    if (r.winner === null) draw++;
    else if ((r.winner === 0) === highFirst) high++;
    else low++;
  }
  Object.assign(out, { high, low, draw, cut });
} else throw new Error("모드: self | ladder");

out.think = Object.fromEntries(Object.entries(think).map(([k, a]) => [k, stats(a)]));
console.log(JSON.stringify(out));
