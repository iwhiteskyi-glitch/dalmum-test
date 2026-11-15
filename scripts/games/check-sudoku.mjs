// 스도쿠 검증: 규칙·조작·문제 은행·오늘의 스도쿠. 실행: node scripts/games/check-sudoku.mjs
// 읽을거리(sudoku-tips)에 쓴 숫자(단계별 처음 숫자 개수·기술 사용 횟수)도 여기서 계산해 보여 줘요.
import { readFileSync } from "node:fs";
import { conflicts, fitsStage, grade, solveUnique, STAGES, transformPuzzle, UNSOLVED } from "../../lib/games/sudoku/sudoku.js";
import { checkPlay, dailySudoku, digitCounts, eraseCell, newPlay, placeDigit, stagePuzzle, STAGE_INFO, takeHint, toggleNote, undo } from "../../lib/games/sudoku/play.js";
import { seededRandom } from "../../lib/games/slide/slide.js";
import { levelOf } from "../../lib/games/daily.js";

const bank = JSON.parse(readFileSync(new URL("../../lib/games/sudoku/bank.json", import.meta.url), "utf8"));

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};
const random = seededRandom(3);

/* ---------- 조작 ---------- */
{
  const { puzzle, solution, size } = stagePuzzle(4, bank, random);
  let play = newPlay(puzzle, solution, size);
  const given = puzzle.findIndex((v) => v);
  const empty = puzzle.findIndex((v) => !v);
  check("문제 칸은 못 바꿈", placeDigit(play, given, 1) === play);
  play = toggleNote(play, empty, 3);
  check("메모 켜기", play.notes[empty] === 1 << 3);
  play = placeDigit(play, empty, 5);
  check("숫자를 넣으면 그 칸 메모는 지워짐", play.grid[empty] === 5 && play.notes[empty] === 0);
  check("같은 숫자를 또 누르면 빠짐", placeDigit(play, empty, 5).grid[empty] === 0);
  check("되돌리기", undo(play).grid[empty] === 0 && undo(play).notes[empty] === 1 << 3);
  check("지우기", eraseCell(play, empty).grid[empty] === 0);
  const h = takeHint(newPlay(puzzle, solution, size), empty, random);
  check("힌트는 고른 칸을 정답으로", h.cell === empty && h.play.grid[empty] === solution[empty] && h.play.hintsLeft === 2);
  check("힌트 칸은 되돌려도 그대로", undo(h.play).grid[empty] === solution[empty]);
  check("다 못 채우면 incomplete", checkPlay(play) === "incomplete");
  check("정답이면 solved", checkPlay({ ...play, grid: solution.slice() }) === "solved");
  const wrong = solution.slice();
  const a = wrong.findIndex((v, i) => !puzzle[i]);
  wrong[a] = (wrong[a] % 9) + 1;
  check("다 채웠는데 틀리면 wrong", checkPlay({ ...play, grid: wrong }) === "wrong");
  check("겹친 숫자 찾기", conflicts(wrong, 9).size >= 2);
  check("숫자 개수 세기", digitCounts({ ...play, grid: solution }).slice(1).every((n) => n === 9));
  check("단계 설명 10개", STAGE_INFO.length === STAGES.length);
}

/* ---------- 작은 판(4×4·6×6)은 바로 만들어요 ---------- */
for (const stage of [1, 2, 3]) {
  let ok = true;
  const t = Date.now();
  for (let i = 0; i < 40; i++) {
    const { puzzle, solution, size } = stagePuzzle(stage, bank, random);
    if (size !== STAGES[stage - 1].size || solveUnique(puzzle, size)?.join() !== solution.join()) ok = false;
    if (!fitsStage(STAGES[stage - 1], grade(puzzle, size))) ok = false;
  }
  check(`${stage}단계 40문제: 답 하나 · 단계 조건 맞음 (한 문제 평균 ${((Date.now() - t) / 40).toFixed(1)}ms)`, ok);
}

/* ---------- 9×9 문제 은행 ---------- */
const stats = {};
for (let stage = 4; stage <= 10; stage++) {
  const list = bank[String(stage)];
  let ok = list.length === 120;
  const givens = [];
  const uses = [0, 0, 0, 0, 0, 0, 0];
  for (const text of list) {
    const puzzle = [...text].map(Number);
    const g = grade(puzzle, 9);
    if (g.tier === UNSOLVED || !fitsStage(STAGES[stage - 1], g) || !solveUnique(puzzle, 9)) ok = false;
    givens.push(g.givens);
    g.uses.forEach((n, k) => (uses[k] += n));
    // 모양을 바꿔도 답은 하나, 난이도 그대로
    const moved = transformPuzzle(puzzle, 9, random);
    const g2 = grade(moved, 9);
    if (!solveUnique(moved, 9) || g2.tier !== g.tier) ok = false;
  }
  stats[stage] = { min: Math.min(...givens), max: Math.max(...givens), avg: givens.reduce((a, b) => a + b, 0) / givens.length, uses };
  check(`${stage}단계 은행 120문제: 답 하나 · 단계 조건 맞음 · 모양 바꿔도 같은 난이도`, ok);
}

/* ---------- 오늘의 스도쿠 ---------- */
{
  check("같은 날은 같은 판", dailySudoku("2026-11-14", bank).puzzle.join() === dailySudoku("2026-11-14", bank).puzzle.join());
  check("요일표: 토요일 어려움 · 월요일 보통", dailySudoku("2026-11-14", bank).level === "hard" && dailySudoku("2026-11-16", bank).level === "medium");
  const seen = new Set();
  let ok = true;
  let key = "2026-11-14";
  for (let i = 0; i < 1000; i++) {
    const d = dailySudoku(key, bank);
    seen.add(d.puzzle.join());
    const stage = d.level === "hard" ? 7 : 6;
    if (!d.solution || d.level !== levelOf(key) || !fitsStage(STAGES[stage - 1], grade(d.puzzle, 9))) ok = false;
    key = new Date(Date.parse(`${key}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  }
  check("1000일 동안 모두 다른 판", seen.size === 1000);
  check("1000일 모두 답 하나 · 요일 난이도에 맞음", ok);
}

/* ---------- 읽을거리에 쓴 숫자 ---------- */
const NAMES = ["", "한 칸에 하나뿐", "한 줄에 한 자리뿐", "줄·상자 겹침", "두 칸 짝", "세 칸 짝·X-윙", "XY-윙·소드피시"];
console.log("\n      단계  처음 숫자(최소~최대, 평균)  기술 사용 평균(문제 하나당)");
for (const [stage, s] of Object.entries(stats)) {
  const per = s.uses.map((n) => n / 120).map((n, k) => (k && n ? `${NAMES[k]} ${n.toFixed(1)}` : "")).filter(Boolean).join(" · ");
  console.log(`      ${stage}단계  ${s.min}~${s.max} (${s.avg.toFixed(1)})  ${per}`);
}

if (failed) {
  console.log(`\n실패 ${failed}개`);
  process.exit(1);
}
console.log("\n모두 통과");
