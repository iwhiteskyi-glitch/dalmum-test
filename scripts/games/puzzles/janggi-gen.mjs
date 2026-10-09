// 장기 "오늘의 문제" 뽑기(시험): 컴퓨터끼리 대국을 두게 하고, 대국 중
// "장군을 계속 불러 N수 안에 외통이 되고, 그 첫 수가 딱 하나인 장면"을 모아요.
// 실행: node scripts/games/puzzles/janggi-gen.mjs [판 수=100] [출력 파일]
import { writeFileSync } from "node:fs";
import { newState, play, SETUPS } from "../../../lib/games/janggi/rules.js";
import { chooseMove } from "../../../lib/games/janggi/ai.js";
import { matingFirstMoves } from "../../../lib/games/janggi/puzzle.js";

const [, , gamesArg = "100", outFile] = process.argv;
const GAMES = Number(gamesArg);
const MAX_N = 3;

const seen = new Set();
const puzzles = [];
const byN = {};
let positions = 0;
let gave = 0;
const t0 = Date.now();
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function examine(state) {
  for (let n = 1; n <= MAX_N; n++) {
    const wins = matingFirstMoves(state, n);
    if (wins === null) return false;
    if (!wins.length) continue;
    if (wins.length !== 1) return false;
    const key = state.squares + state.turn;
    if (seen.has(key)) return false;
    seen.add(key);
    puzzles.push({ squares: state.squares, turn: state.turn, n, answer: wins[0] });
    byN[n] = (byN[n] || 0) + 1;
    return true;
  }
  return false;
}

for (let g = 0; g < GAMES; g++) {
  const la = 1 + Math.floor(Math.random() * 6);
  const lb = 1 + Math.floor(Math.random() * 6);
  let state = newState(pick(SETUPS), pick(SETUPS));
  let found = 0;
  let skipUntil = 0;
  for (let ply = 0; ply < 200; ply++) {
    // 문제를 하나 찾으면 같은 수순의 뒷장면이 또 뽑히지 않게 10수 건너뛰어요
    if (ply >= 16 && found < 3 && ply >= skipUntil) {
      positions++;
      if (examine(state)) {
        found++;
        skipUntil = ply + 10;
      }
    }
    const m = chooseMove(state, state.turn === 0 ? la : lb);
    if (!m) break;
    const r = play(state, m);
    if (!r) break;
    state = r.state;
    if (r.end) break;
  }
  if (found) gave++;
  if ((g + 1) % 10 === 0) console.log(`${g + 1}판 · 문제 ${puzzles.length}개 · 수별 ${JSON.stringify(byN)} · ${((Date.now() - t0) / 1000).toFixed(0)}초`);
}
console.log(`끝: ${GAMES}판(문제가 나온 판 ${gave}) · 살펴본 장면 ${positions} · 문제 ${puzzles.length}개 · 수별 ${JSON.stringify(byN)}`);
if (outFile) writeFileSync(outFile, JSON.stringify(puzzles));
