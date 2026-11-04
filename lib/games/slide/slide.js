// 슬라이드 퍼즐 규칙: N×N 판에 조각 N²-1개와 빈칸 하나. 빈칸과 같은 줄의 조각을 누르면
// 그 조각부터 빈칸 쪽으로 한꺼번에 밀려요. 모든 조각이 제자리(1, 2, 3 … 순서, 빈칸은 오른쪽 아래)에 오면 완성.
// 섞기는 늘 풀 수 있는 판만, 처음부터 맞춰진 판은 나오지 않아요.
// 비행기오락실 앱의 src/games/slide/slide.ts를 옮겼어요(화면과 상관없는 순수한 계산).

/** 고를 수 있는 칸 수와 난이도. 3×3은 너무 금방 끝나서 뺐어요 */
export const SIZES = [
  { size: 4, level: "입문" },
  { size: 5, level: "보통" },
  { size: 6, level: "어려움" },
  { size: 7, level: "고수" },
  { size: 8, level: "도전!" },
];

export const EMPTY = 0;

/** 다 맞춘 판 { size, cells }. cells는 왼쪽 위부터 가로로, 1 ~ N²-1 조각 번호, 0 빈칸 */
export function solvedBoard(size) {
  const cells = Array.from({ length: size * size }, (_, i) => i + 1);
  cells[cells.length - 1] = EMPTY;
  return { size, cells };
}

/** 제자리에 있는 조각 수(빈칸은 안 세요) */
export function correctCount(board) {
  let count = 0;
  board.cells.forEach((v, i) => {
    if (v === i + 1) count++;
  });
  return count;
}

export const isSolved = (board) => correctCount(board) === board.size * board.size - 1;

/**
 * 풀 수 있는 판인지. 조각을 한 줄로 늘어놓았을 때 순서가 뒤바뀐 쌍의 수(뒤바뀜)를 세요.
 *  - 가로가 홀수: 빈칸이 위아래로 움직여도 뒤바뀜의 홀짝이 그대로 → 짝수여야 풀려요
 *  - 가로가 짝수: 위아래로 한 칸 움직일 때마다 뒤바뀜 홀짝과 빈칸 줄이 같이 바뀌어요
 *    → (뒤바뀜 + 빈칸 줄)의 홀짝이 다 맞춘 판(뒤바뀜 0, 빈칸 맨 아래 줄)과 같아야 풀려요
 */
export function isSolvable(board) {
  const tiles = board.cells.filter((v) => v !== EMPTY);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) inversions++;
  if (board.size % 2 === 1) return inversions % 2 === 0;
  const emptyRow = Math.floor(board.cells.indexOf(EMPTY) / board.size);
  return (inversions + emptyRow) % 2 === (board.size - 1) % 2;
}

/** 씨앗이 같으면 같은 순서로 나오는 0 이상 1 미만의 수(오늘의 판을 모두 같게 만들 때) */
export function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 섞은 판. 풀 수 없게 나오면 두 조각을 바꿔 풀 수 있게 하고, 다 맞춰졌으면 다시 섞어요 */
export function shuffledBoard(size, random = Math.random) {
  for (;;) {
    const cells = solvedBoard(size).cells;
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    const board = { size, cells };
    if (!isSolvable(board)) {
      // 빈칸이 아닌 두 칸을 바꾸면 뒤바뀜이 하나 늘거나 줄어 홀짝이 바뀌어요
      const [a, b] = cells.map((v, i) => (v === EMPTY ? -1 : i)).filter((i) => i >= 0);
      [cells[a], cells[b]] = [cells[b], cells[a]];
    }
    if (!isSolved(board)) return board;
  }
}

/** index 칸의 조각을 눌렀을 때 밀린 판. 밀 수 없으면(빈칸이거나 다른 줄) null */
export function slideAt(board, index) {
  const { size, cells } = board;
  const empty = cells.indexOf(EMPTY);
  if (index < 0 || index >= cells.length || index === empty) return null;
  const sameRow = Math.floor(index / size) === Math.floor(empty / size);
  const sameCol = index % size === empty % size;
  if (!sameRow && !sameCol) return null;
  const step = sameRow ? (index > empty ? 1 : -1) : index > empty ? size : -size;
  const next = cells.slice();
  // 빈칸 바로 옆 조각부터 차례로 빈칸 자리로 당겨요
  let hole = empty;
  while (hole !== index) {
    next[hole] = next[hole + step];
    hole += step;
  }
  next[index] = EMPTY;
  return { size, cells: next };
}

/** 방향키로 움직일 칸: 빈칸 쪽으로 조각이 움직이니, 왼쪽 키면 빈칸 오른쪽 조각이에요. 없으면 -1 */
export function neighborFor(board, key) {
  const { size, cells } = board;
  const empty = cells.indexOf(EMPTY);
  const row = Math.floor(empty / size);
  const col = empty % size;
  if (key === "ArrowLeft") return col < size - 1 ? empty + 1 : -1;
  if (key === "ArrowRight") return col > 0 ? empty - 1 : -1;
  if (key === "ArrowUp") return row < size - 1 ? empty + size : -1;
  if (key === "ArrowDown") return row > 0 ? empty - size : -1;
  return -1;
}

/* ---------- 그림과 오늘의 판 ---------- */

export const PICTURE_COUNT = 50;
export const pictureUrl = (i) => `/games/slide/slide-${String(i + 1).padStart(2, "0")}.jpg`;

/** 날짜("2026-11-04") → 오늘의 판. 누구나 같은 판과 그림이에요. 월~목 4×4 · 금·토·일 5×5, 그림은 50장을 빠짐없이 돌아요 */
export function dailyBoard(key) {
  const DAY = 86400000;
  const n = Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY);
  const weekday = new Date(n * DAY).getUTCDay();
  const size = weekday === 0 || weekday >= 5 ? 5 : 4;
  return { board: shuffledBoard(size, seededRandom(n * 2654435761)), picture: (n * 17) % PICTURE_COUNT }; // 17: 50과 서로소
}

/** 시간 글자: 1:23.4 (1시간 넘으면 61:00.0처럼 분으로 세요) */
export function formatTime(ms) {
  const tenths = Math.floor(ms / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths % 10}`;
}
