// 오늘의 문제 묶음 만들기: 뽑아 둔 문제들을 난이도별로 나누고 섞어서 public/games/puzzles/<게임>.json 으로 저장해요.
// 실행: node scripts/games/puzzles/build-daily.mjs <뽑은 파일이 있는 폴더>
//  - 폴더 안의 omok-*.json, janggi-*.json (omok-gen.mjs·janggi-gen.mjs 결과)
//  - 폴더 안의 chess-mates.json (chess-lichess.mjs 결과)
// 난이도: 오목 2수 쉬움·3수 보통·4수 이상 어려움 / 장기 1·2·3수 / 체스 1·2·3수 체크메이트
// 날짜에 문제를 붙이는 순서는 lib/games/daily.js 에서 정해요(이 파일의 순서대로 하루씩).
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { gridOf, colorOfTurn } from "../../../lib/games/omok/rules.js";
import { winningFirstMoves } from "../../../lib/games/omok/puzzle.js";
import { matingFirstMoves } from "../../../lib/games/janggi/puzzle.js";

const [, , dir] = process.argv;
const CAP = 500; // 난이도마다 최대 개수(쉬움·어려움은 1주에 2번씩이라 약 5년치)
const OUT = "public/games/puzzles";
mkdirSync(OUT, { recursive: true });

// 같은 결과가 나오게 정해진 씨앗으로 섞어요
function shuffle(list, seed) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const files = (prefix) =>
  readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
const save = (game, set) => {
  writeFileSync(join(OUT, `${game}.json`), JSON.stringify(set));
  console.log(`${game}: 쉬움 ${set.easy.length} · 보통 ${set.medium.length} · 어려움 ${set.hard.length}`);
};

/* 오목: 돌 배치(b 흑 칸, w 백 칸)와 수(n)만 남기고, 정답이 여전히 하나인지 다시 확인 */
{
  const seen = new Set();
  const buckets = { easy: [], medium: [], hard: [] };
  for (const p of files("omok-")) {
    const grid = gridOf(p.moves);
    const key = grid.join("");
    if (seen.has(key)) continue;
    seen.add(key);
    const color = colorOfTurn(p.moves.length);
    const wins = winningFirstMoves(grid, color, p.n);
    const shorter = winningFirstMoves(grid, color, p.n - 1);
    if (!wins || wins.length !== 1 || !shorter || shorter.length) continue;
    const item = { b: p.moves.filter((_, i) => i % 2 === 0), w: p.moves.filter((_, i) => i % 2 === 1), n: p.n };
    buckets[p.n === 2 ? "easy" : p.n === 3 ? "medium" : "hard"].push(item);
  }
  const set = {};
  for (const [k, list] of Object.entries(buckets)) set[k] = shuffle(list, 11 + k.length).slice(0, CAP);
  save("omok", set);
}

/* 장기: 판(q)·차례(t)·수(n), 정답이 여전히 하나인지 다시 확인 */
{
  const seen = new Set();
  const buckets = { easy: [], medium: [], hard: [] };
  for (const p of files("janggi-")) {
    const key = p.squares + p.turn;
    if (seen.has(key)) continue;
    seen.add(key);
    const state = { squares: p.squares, turn: p.turn, lastMove: null, lastPassed: false, captured: { cho: "", han: "" }, ply: 0 };
    const wins = matingFirstMoves(state, p.n);
    if (!wins || wins.length !== 1) continue;
    if (p.n > 1) {
      const shorter = matingFirstMoves(state, p.n - 1);
      if (!shorter || shorter.length) continue;
    }
    buckets[["easy", "medium", "hard"][p.n - 1]].push({ q: p.squares, t: p.turn, n: p.n });
  }
  const set = {};
  for (const [k, list] of Object.entries(buckets)) set[k] = shuffle(list, 23 + k.length).slice(0, CAP);
  save("janggi", set);
}

/* 체스: 리체스 문제(f 처음 FEN, m 수순 — 첫 수는 상대가 방금 둔 수), 난이도마다 알맞은 점수대만 */
{
  const RANGE = { 1: [600, 1500], 2: [900, 1900], 3: [1200, 2200] };
  const buckets = { easy: [], medium: [], hard: [] };
  for (const p of JSON.parse(readFileSync(join(dir, "chess-mates.json"), "utf8"))) {
    const r = RANGE[p.n];
    if (!r || p.rating < r[0] || p.rating > r[1]) continue;
    buckets[["easy", "medium", "hard"][p.n - 1]].push({ f: p.fen, m: p.moves, n: p.n, id: p.id });
  }
  const set = {};
  for (const [k, list] of Object.entries(buckets)) set[k] = shuffle(list, 37 + k.length).slice(0, CAP);
  save("chess", set);
}
