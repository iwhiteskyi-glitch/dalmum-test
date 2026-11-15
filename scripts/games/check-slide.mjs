// 슬라이드 퍼즐 검증: 규칙 + 섞은 판이 실제로 풀리는지 끝까지 풀어 봐요. 실행: node scripts/games/check-slide.mjs
// 풀이는 사람이 푸는 순서와 같아요: 위 줄부터, 줄 끝 두 조각은 함께, 아래 두 줄은 왼쪽부터, 마지막은 남은 칸 전부.
// 단계마다 넓이 우선 탐색으로 가장 짧은 길을 찾아서, 판 전체의 최단은 아니어도 사람보다는 훨씬 짧아요.
import { dailyBoard, EMPTY, formatTime, isSolvable, isSolved, neighborFor, PICTURE_COUNT, seededRandom, shuffledBoard, slideAt, solvedBoard } from "../../lib/games/slide/slide.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};

/* ---------- 규칙 ---------- */

check("다 맞춘 판은 완성", isSolved(solvedBoard(4)));
const b = { size: 4, cells: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15] };
check("한 칸 밀면 완성", isSolved(slideAt(b, 15)));
const row = slideAt({ size: 4, cells: [1, 2, 3, 0, 5, 6, 7, 4, 9, 10, 11, 8, 13, 14, 15, 12] }, 0);
check("같은 줄은 한꺼번에 밀림", row.cells.slice(0, 4).join() === "0,1,2,3");
const col = slideAt({ size: 4, cells: [0, 2, 3, 4, 1, 6, 7, 8, 5, 10, 11, 12, 9, 13, 14, 15] }, 12);
check("같은 세로줄도 한꺼번에", [col.cells[0], col.cells[4], col.cells[8], col.cells[12]].join() === "1,5,9,0");
check("다른 줄은 못 밂", slideAt(b, 0) === null);
check("빈칸은 못 누름", slideAt(b, 14) === null);
check("14·15를 바꾼 판은 풀 수 없음", !isSolvable({ size: 4, cells: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0] }));
check("왼쪽 키는 빈칸 오른쪽 조각", neighborFor(b, "ArrowLeft") === 15);
check("위 키는 빈칸 아래 조각: 맨 아래 줄이면 없음", neighborFor(b, "ArrowUp") === -1);
check("시간 글자", formatTime(83450) === "1:23.4" && formatTime(3660000) === "61:00.0");

const random = seededRandom(1);
for (const size of [4, 5, 6, 7, 8]) {
  let ok = true;
  for (let i = 0; i < 2000; i++) {
    const s = shuffledBoard(size, random);
    if (!isSolvable(s) || isSolved(s) || new Set(s.cells).size !== size * size) ok = false;
  }
  check(`${size}×${size} 섞기 2000판 모두 풀 수 있는 판`, ok);
}

/* 무작위로 늘어놓으면 풀 수 있는 판이 절반인지(읽을거리에 쓴 값) */
for (const size of [4, 5]) {
  let n = 0;
  const trials = 200000;
  for (let t = 0; t < trials; t++) {
    const cells = solvedBoard(size).cells;
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    if (isSolvable({ size, cells })) n++;
  }
  console.log(`      ${size}×${size} 무작위 ${trials}판 중 풀 수 있는 판 ${((n / trials) * 100).toFixed(2)}%`);
}

/* ---------- 오늘의 판 ---------- */

check("같은 날은 같은 판", dailyBoard("2026-11-04").board.cells.join() === dailyBoard("2026-11-04").board.cells.join());
check("수요일 4×4 · 금요일 5×5 · 일요일 5×5", dailyBoard("2026-11-04").board.size === 4 && dailyBoard("2026-11-06").board.size === 5 && dailyBoard("2026-11-08").board.size === 5);
{
  const seen = new Set();
  const pics = new Set();
  let solvable = true;
  let key = "2026-11-02";
  for (let i = 0; i < 1000; i++) {
    const d = dailyBoard(key);
    seen.add(d.board.cells.join());
    if (i < PICTURE_COUNT) pics.add(d.picture);
    if (!isSolvable(d.board)) solvable = false;
    key = new Date(Date.parse(`${key}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  }
  check("1000일 동안 모두 다른 판", seen.size === 1000);
  check("1000일 모두 풀 수 있는 판", solvable);
  check(`그림 ${PICTURE_COUNT}장이 ${PICTURE_COUNT}일 동안 겹치지 않음`, pics.size === PICTURE_COUNT);
}

/* ---------- 실제로 끝까지 풀기 ---------- */

/** cells에서 targets(값 목록)를 제자리로 옮기는 가장 짧은 한 칸 이동들. locked 칸은 건드리지 않아요 */
function place(size, cells, targets, locked) {
  const n = size * size;
  const start = [cells.indexOf(EMPTY), ...targets.map((v) => cells.indexOf(v))];
  const goal = targets.map((v) => v - 1);
  const seen = new Set([start.join()]);
  let frontier = [{ s: start, prev: null, blank: -1 }];
  while (frontier.length) {
    const next = [];
    for (const node of frontier) {
      if (node.s.slice(1).every((p, i) => p === goal[i])) {
        const path = [];
        for (let x = node; x.prev; x = x.prev) path.push(x.blank);
        return path.reverse();
      }
      const e = node.s[0];
      for (const d of [-1, 1, -size, size]) {
        const t = e + d;
        if (t < 0 || t >= n || locked.has(t)) continue;
        if (Math.abs(d) === 1 && Math.floor(t / size) !== Math.floor(e / size)) continue;
        const s = node.s.map((p, i) => (i > 0 && p === t ? e : p));
        s[0] = t;
        const k = s.join();
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ s, prev: node, blank: t });
      }
    }
    frontier = next;
  }
  return null;
}

/** 위 줄부터, 줄 끝 둘은 함께, 아래 두 줄은 왼쪽부터 맞춰서 움직인 조각 수를 돌려줘요. 못 풀면 null */
function solve(board) {
  const { size } = board;
  let cells = board.cells.slice();
  const locked = new Set();
  let moves = 0;
  const run = (targets) => {
    const path = place(size, cells, targets, locked);
    if (!path) return false;
    for (const t of path) {
      const e = cells.indexOf(EMPTY);
      cells[e] = cells[t];
      cells[t] = EMPTY;
    }
    moves += path.length;
    targets.forEach((v) => locked.add(v - 1));
    return true;
  };
  for (let r = 0; r < size - 2; r++) {
    const row = Array.from({ length: size }, (_, c) => r * size + c + 1);
    for (const v of row.slice(0, -2)) if (!run([v])) return null;
    if (!run(row.slice(-2))) return null;
  }
  for (let c = 0; c < size - 2; c++) if (!run([(size - 2) * size + c + 1, (size - 1) * size + c + 1])) return null;
  const a = size * size - size - 1;
  if (!run([a, a + 1, a + size])) return null;
  return isSolved({ size, cells }) ? moves : null;
}

for (const size of [4, 5, 6, 7, 8]) {
  const trials = size <= 5 ? 300 : size === 6 ? 60 : 15;
  const moves = [];
  let solved = 0;
  for (let i = 0; i < trials; i++) {
    const m = solve(shuffledBoard(size, random));
    if (m !== null) {
      solved++;
      moves.push(m);
    }
  }
  check(`${size}×${size} ${trials}판 끝까지 풀림`, solved === trials);
  const avg = moves.reduce((a, b) => a + b, 0) / moves.length;
  console.log(`      평균 ${avg.toFixed(0)}칸 이동 (최소 ${Math.min(...moves)} · 최대 ${Math.max(...moves)})`);
}

if (failed) {
  console.log(`\n실패 ${failed}개`);
  process.exit(1);
}
console.log("\n모두 통과");
