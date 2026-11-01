// 오목 "오늘의 문제" 뽑기(시험): 컴퓨터끼리 대국을 두게 하고, 대국 중
// "4를 연달아 만들어 N수 안에 이기는 길이 있고, 그 첫 수가 딱 하나인 장면"을 모아요.
// 실행: node scripts/games/puzzles/omok-gen.mjs [판 수=200] [출력 파일]
import { writeFileSync } from "node:fs";
import { gridOf, colorOfTurn, play, BLACK } from "../../../lib/games/omok/rules.js";
import { chooseMove } from "../../../lib/games/omok/ai.js";
import { winningFirstMoves } from "../../../lib/games/omok/puzzle.js";

const [, , gamesArg = "200", outFile] = process.argv;
const GAMES = Number(gamesArg);
const MAX_N = 6;

const seen = new Set();
const puzzles = [];
const byN = {};
let positions = 0;
let gave = 0;
const t0 = Date.now();

function examine(moves) {
  const grid = gridOf(moves);
  const color = colorOfTurn(moves.length);
  // 가장 짧은 길이 몇 수인지
  for (let n = 1; n <= MAX_N; n++) {
    const wins = winningFirstMoves(grid, color, n);
    if (wins === null) return false;
    if (!wins.length) continue;
    if (n < 2 || wins.length !== 1) return false; // 한 수에 5목(너무 쉬움)이거나 정답이 여럿
    const key = grid.join("");
    if (seen.has(key)) return false;
    seen.add(key);
    puzzles.push({ moves: [...moves], color: color === BLACK ? "black" : "white", n, answer: wins[0] });
    byN[n] = (byN[n] || 0) + 1;
    return true;
  }
  return false;
}

for (let g = 0; g < GAMES; g++) {
  // 단계를 섞어서 다양한 판이 나오게(높은 단계는 느려서 2~8단계)
  const la = 2 + Math.floor(Math.random() * 7);
  const lb = 2 + Math.floor(Math.random() * 7);
  let moves = [];
  let found = 0;
  let skipUntil = 0;
  for (let ply = 0; ply < 225; ply++) {
    // 문제를 하나 찾으면 같은 수순의 뒷장면이 또 뽑히지 않게 10수 건너뛰어요
    if (moves.length >= 10 && found < 2 && ply >= skipUntil) {
      positions++;
      if (examine(moves)) {
        found++;
        skipUntil = ply + 10;
      }
    }
    const m = chooseMove(moves, moves.length % 2 === 0 ? la : lb);
    const r = play(moves, m);
    if (!r) break;
    moves = r.moves;
    if (r.outcome) break;
  }
  if (found) gave++;
  if ((g + 1) % 20 === 0) console.log(`${g + 1}판 · 문제 ${puzzles.length}개 · 수별 ${JSON.stringify(byN)} · ${((Date.now() - t0) / 1000).toFixed(0)}초`);
}
console.log(`끝: ${GAMES}판(문제가 나온 판 ${gave}) · 살펴본 장면 ${positions} · 문제 ${puzzles.length}개 · 수별 ${JSON.stringify(byN)}`);
if (outFile) writeFileSync(outFile, JSON.stringify(puzzles));
