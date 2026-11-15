/**
 * 스도쿠 한 판의 조작: 숫자 넣기·메모·지우기·되돌리기·힌트·채점과 문제 고르기(앱 play.ts·daily.ts를 옮겼어요).
 *  - 처음 주어진 칸(문제 칸)과 힌트로 연 칸은 못 바꿔요
 *  - 숫자를 넣으면 같은 줄·상자의 메모에서 그 숫자를 저절로 지워요
 *  - 넣을 때 정답인지 알려 주지 않아요. 다 채우면 정답과 비교해요
 *  - 9×9 문제는 문제 은행(bank.json, 단계마다 120문제)에서 골라 숫자·줄 순서를 바꿔 내요.
 *    은행은 크기가 커서(70KB) 화면에서는 필요할 때 따로 불러오고, 여기 함수들은 은행을 넘겨받아요.
 */
import { levelOf } from "../daily.js";
import { seededRandom } from "../slide/slide.js";
import { geometry, isFilled, isSolvedAs, solveUnique, STAGES, transformPuzzle, tryStagePuzzle } from "./sudoku.js";

/** 한 판에 쓸 수 있는 힌트 수 */
export const HINTS_PER_GAME = 3;

/** 단계마다 난이도 이름과 한 줄 설명(1단계부터) */
export const STAGE_INFO = [
  { level: "연습", note: "4×4로 규칙 익히기" },
  { level: "쉬움", note: "6×6, 빈칸이 적어요" },
  { level: "보통", note: "6×6, 빈칸이 늘어요" },
  { level: "아주 쉬움", note: "9×9 첫걸음, 숫자 38개" },
  { level: "쉬움", note: "숫자 30개, 한 칸씩 찾기" },
  { level: "보통", note: "줄과 상자가 겹치는 자리 보기" },
  { level: "조금 어려움", note: "두 칸 짝 찾기가 필요해요" },
  { level: "어려움", note: "세 칸 짝·X-윙이 필요해요" },
  { level: "아주 어려움", note: "XY-윙 같은 고급 기술 한 번" },
  { level: "최고 난이도", note: "고급 기술을 여러 번 써요" },
];
export const STAGE_COUNT = STAGES.length;

export function newPlay(puzzle, solution, size) {
  return {
    size,
    puzzle,
    solution,
    grid: puzzle.slice(),
    notes: new Array(puzzle.length).fill(0),
    hinted: [],
    hintsLeft: HINTS_PER_GAME,
    history: [],
  };
}

/** 고칠 수 없는 칸(문제 칸·힌트 칸) */
export const isLocked = (play, cell) => play.puzzle[cell] !== 0 || play.hinted.includes(cell);

/** 되돌리기는 최근 이만큼까지 */
const HISTORY_LIMIT = 200;
const remember = (play) => [...play.history, { grid: play.grid, notes: play.notes }].slice(-HISTORY_LIMIT);

/** 칸에 숫자를 넣어요. 같은 숫자가 이미 있으면 지워요(한 번 더 누르면 빼기) */
export function placeDigit(play, cell, digit) {
  if (isLocked(play, cell)) return play;
  const grid = play.grid.slice();
  const notes = play.notes.slice();
  if (grid[cell] === digit) {
    grid[cell] = 0;
  } else {
    grid[cell] = digit;
    notes[cell] = 0;
    for (const p of geometry(play.size).peers[cell]) notes[p] &= ~(1 << digit);
  }
  return { ...play, grid, notes, history: remember(play) };
}

/** 메모를 켜고 꺼요(숫자가 들어 있는 칸에는 메모하지 않아요) */
export function toggleNote(play, cell, digit) {
  if (isLocked(play, cell) || play.grid[cell]) return play;
  const notes = play.notes.slice();
  notes[cell] ^= 1 << digit;
  return { ...play, notes, history: remember(play) };
}

/** 칸을 비워요(숫자와 메모 모두) */
export function eraseCell(play, cell) {
  if (isLocked(play, cell) || (!play.grid[cell] && !play.notes[cell])) return play;
  const grid = play.grid.slice();
  const notes = play.notes.slice();
  grid[cell] = 0;
  notes[cell] = 0;
  return { ...play, grid, notes, history: remember(play) };
}

export function undo(play) {
  const last = play.history[play.history.length - 1];
  if (!last) return play;
  // 힌트로 연 칸은 되돌려도 그대로
  const grid = last.grid.slice();
  for (const i of play.hinted) grid[i] = play.solution[i];
  return { ...play, grid, notes: last.notes, history: play.history.slice(0, -1) };
}

/**
 * 힌트: 고른 칸이 비었거나 틀렸으면 그 칸을, 아니면 비었거나 틀린 칸 중 하나를 정답으로 열어요.
 * 연 칸 번호도 돌려줘요(없으면 null)
 */
export function takeHint(play, selected, random = Math.random) {
  if (play.hintsLeft <= 0) return { play, cell: null };
  const open = (i) => !isLocked(play, i) && play.grid[i] !== play.solution[i];
  let cell = selected !== null && open(selected) ? selected : null;
  if (cell === null) {
    const choices = play.grid.flatMap((_, i) => (open(i) ? [i] : []));
    if (choices.length === 0) return { play, cell: null };
    cell = choices[Math.floor(random() * choices.length)];
  }
  const grid = play.grid.slice();
  const notes = play.notes.slice();
  const digit = play.solution[cell];
  grid[cell] = digit;
  notes[cell] = 0;
  for (const p of geometry(play.size).peers[cell]) notes[p] &= ~(1 << digit);
  return {
    play: { ...play, grid, notes, hinted: [...play.hinted, cell], hintsLeft: play.hintsLeft - 1, history: remember(play) },
    cell,
  };
}

/** "incomplete" 다 못 채움 · "wrong" 다 채웠는데 틀림 · "solved" 다 맞음 */
export function checkPlay(play) {
  if (!isFilled(play.grid)) return "incomplete";
  return isSolvedAs(play.grid, play.solution) ? "solved" : "wrong";
}

/** 숫자마다 판에 몇 개 들어갔는지(다 쓴 숫자 버튼을 흐리게) */
export function digitCounts(play) {
  const counts = new Array(play.size + 1).fill(0);
  for (const v of play.grid) if (v) counts[v]++;
  return counts;
}

/* ---------- 문제 고르기 ---------- */

/** 10단계를 깬 뒤 무한 도전은 이 단계들의 문제에서 골라요 */
export const ENDLESS_STAGES = [8, 9, 10];

/** 단계 문제 하나. 4×4·6×6은 바로 만들고, 9×9는 은행에서 골라 모양을 바꿔요 */
export function stagePuzzle(stage, bank, random = Math.random) {
  const spec = STAGES[stage - 1];
  if (spec.size !== 9) {
    for (;;) {
      const made = tryStagePuzzle(spec, random);
      if (made) return { ...made, size: spec.size };
    }
  }
  const list = bank[String(stage)];
  const text = list[Math.floor(random() * list.length)];
  const puzzle = transformPuzzle([...text].map(Number), 9, random);
  return { puzzle, solution: solveUnique(puzzle, 9), size: 9 };
}

export function endlessPuzzle(bank, random = Math.random) {
  return stagePuzzle(ENDLESS_STAGES[Math.floor(random() * ENDLESS_STAGES.length)], bank, random);
}

/* ---------- 오늘의 스도쿠 ---------- */

/** 오늘의 문제와 같은 요일표(월~목 보통 · 금·토·일 어려움)를 단계로 바꿔요 */
export const DAILY_STAGE = { easy: 5, medium: 6, hard: 7 };

/**
 * 날짜("2026-11-14") → 오늘의 스도쿠. 같은 날에는 누구나 같은 판이에요.
 * 은행 120문제를 7칸씩 건너뛰며 고르고(120과 서로소라 빠짐없이 돌아요), 날짜 번호로 숫자·줄 순서를 바꿔서
 * 같은 은행 문제가 다시 나와도 판 모양은 달라요.
 * 주의: 지난 날짜의 판이 바뀌지 않도록 bank.json의 5·6·7단계 목록은 고치거나 다시 만들지 않아요.
 */
export function dailySudoku(key, bank) {
  const n = Math.floor(Date.parse(`${key}T00:00:00Z`) / 86400000);
  const level = levelOf(key);
  const list = bank[String(DAILY_STAGE[level])];
  const text = list[(n * 7) % list.length];
  const puzzle = transformPuzzle([...text].map(Number), 9, seededRandom(n * 7919 + 101));
  return { puzzle, solution: solveUnique(puzzle, 9), size: 9, level };
}
