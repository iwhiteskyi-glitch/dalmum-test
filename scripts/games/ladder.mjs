// 미니게임 컴퓨터 단계 검증(오델로·체스·장기): 이웃한 단계끼리 먼저/나중을 번갈아 두게 해서
// 높은 단계가 더 많이 이기는지, 한 수에 시간이 얼마나 걸리는지 봅니다.
// 실행: node scripts/games/ladder.mjs <othello|chess|janggi> [판 수=8] [시작 단계=1] [끝 단계=9]
const [, , GAME = "othello", gamesArg = "8", fromArg = "1", toArg = "9"] = process.argv;
const GAMES_N = Number(gamesArg);

const adapters = {
  async othello() {
    const R = await import("../../lib/games/othello/rules.js");
    const A = await import("../../lib/games/othello/ai.js");
    return {
      init: () => R.newState(),
      turn: (s) => s.turn,
      apply: (s, m) => {
        const r = R.play(s, m);
        return r && { state: r.state, winner: r.end ? r.end.winner : undefined };
      },
      pick: (s, level) => A.chooseMove(s, level),
      limit: 80,
    };
  },
  async chess() {
    const A = await import("../../lib/games/chess/ai.js");
    const R = await import("../../lib/games/chess/rules.js");
    return {
      init: () => R.newState(),
      turn: (s) => R.turnOf(s),
      apply: (s, m) => {
        const r = R.play(s, m);
        return r && { state: r.state, winner: r.end ? r.end.winner : undefined };
      },
      pick: (s, level) => A.pickMove(s, level),
      limit: 300,
    };
  },
  async janggi() {
    const A = await import("../../lib/games/janggi/ai.js");
    const R = await import("../../lib/games/janggi/rules.js");
    return {
      init: () => R.newState("HEEH", "HEEH"),
      turn: (s) => R.turnOf(s),
      apply: (s, m) => {
        const r = R.play(s, m);
        return r && { state: r.state, winner: r.end ? r.end.winner : undefined };
      },
      pick: (s, level) => A.pickMove(s, level),
      limit: 400,
    };
  },
};

const g = await adapters[GAME]();
const time = {};
function game(firstLevel, secondLevel) {
  let s = g.init();
  for (let ply = 0; ply < g.limit; ply++) {
    const side = g.turn(s);
    const level = side === 0 ? firstLevel : secondLevel;
    const t = performance.now();
    const m = g.pick(s, level);
    (time[level] ||= []).push(performance.now() - t);
    if (m === null || m === undefined) throw new Error(`수를 못 찾음: ${level}단계`);
    const r = g.apply(s, m);
    if (!r) throw new Error(`잘못된 수: ${level}단계 ${JSON.stringify(m)}`);
    s = r.state;
    if (r.winner !== undefined) return r.winner;
  }
  return null;
}

for (let k = Number(fromArg); k <= Number(toArg); k++) {
  let high = 0;
  let low = 0;
  let draw = 0;
  for (let i = 0; i < GAMES_N; i++) {
    const highFirst = i % 2 === 0;
    const w = highFirst ? game(k + 1, k) : game(k, k + 1);
    if (w === null) draw++;
    else if ((w === 0) === highFirst) high++;
    else low++;
  }
  console.log(`${GAME} ${k}단계 vs ${k + 1}단계: ${k + 1}단계 ${high}승 · ${k}단계 ${low}승 · 무 ${draw}`);
}
const fmt = (a) => `평균 ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(0)}ms · 최대 ${Math.max(...a).toFixed(0)}ms`;
for (const [level, a] of Object.entries(time)) console.log(`  ${level}단계 생각 시간: ${fmt(a)}`);
