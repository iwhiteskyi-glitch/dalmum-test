// 오목 컴퓨터 단계 검증: 이웃한 단계끼리(k vs k+1) 흑백을 번갈아 여러 판 두게 해서
// 높은 단계가 더 많이 이기는지, 한 수 생각에 시간이 얼마나 걸리는지 봅니다.
// 실행: node scripts/games/omok-ladder.mjs [판 수(기본 20)] [시작 단계] [끝 단계]
import { play } from "../../lib/games/omok/rules.js";
import { chooseMove } from "../../lib/games/omok/ai.js";

const GAMES = Number(process.argv[2] || 20);
const FROM = Number(process.argv[3] || 1);
const TO = Number(process.argv[4] || 9);

let seed = 12345;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const time = {};
/** 흑 단계, 백 단계로 한 판. 반환: 1 흑 승, 2 백 승, 0 무승부 */
function game(blackLevel, whiteLevel) {
  let moves = [];
  for (;;) {
    const level = moves.length % 2 === 0 ? blackLevel : whiteLevel;
    const t = performance.now();
    const cell = chooseMove(moves, level, random);
    const dt = performance.now() - t;
    (time[level] ||= []).push(dt);
    const r = play(moves, cell);
    if (!r) throw new Error(`둘 수 없는 수: 단계 ${level}, 칸 ${cell}, ${moves.length}수째`);
    moves = r.moves;
    if (r.outcome === "win") return moves.length % 2 === 1 ? 1 : 2;
    if (r.outcome === "draw") return 0;
  }
}

// 기준 상대 모드: REF=단계 를 주면 모든 단계를 그 단계와 두게 해서 승률이 고르게 오르는지 봐요.
const REF = Number(process.env.REF || 0);
if (REF) {
  for (let k = FROM; k <= TO; k++) {
    let win = 0;
    let lose = 0;
    for (let g = 0; g < GAMES; g++) {
      const kBlack = g % 2 === 0;
      const r = kBlack ? game(k, REF) : game(REF, k);
      if (r === 0) continue;
      if ((r === 1) === kBlack) win++;
      else lose++;
    }
    console.log(`${k}단계 vs 기준 ${REF}단계: ${win}승 ${lose}패 (${GAMES - win - lose}무)`);
  }
}
for (let k = FROM; !REF && k <= TO; k++) {
  let low = 0;
  let high = 0;
  let draw = 0;
  let highAsWhite = 0;
  for (let g = 0; g < GAMES; g++) {
    const highBlack = g % 2 === 0;
    const r = highBlack ? game(k + 1, k) : game(k, k + 1);
    if (r === 0) draw++;
    else if ((r === 1) === highBlack) {
      high++;
      if (!highBlack) highAsWhite++;
    } else low++;
  }
  console.log(`${k}단계 vs ${k + 1}단계: ${k + 1}단계 ${high}승(백으로 ${highAsWhite}) · ${k}단계 ${low}승 · 무 ${draw}`);
}
const fmt = (a) => `평균 ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1)}ms · 최대 ${Math.max(...a).toFixed(0)}ms`;
for (const [level, a] of Object.entries(time)) console.log(`  ${level}단계 생각 시간: ${fmt(a)}`);
