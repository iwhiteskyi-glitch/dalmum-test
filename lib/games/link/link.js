// 비행기오락실 앱 src/games/link/link.ts를 그대로 옮겼어요(tsc로 JS로 바꿈). 규칙을 고치면 앱과 판이 달라지니 조심해요.
// 짝꿍 잇기 규칙: 같은 그림 타일 두 개를 빈칸으로만 지나가는, 두 번까지 꺾인 선으로 이을 수 있으면 둘 다 없앤다.
// 선은 가로·세로로만 가고, 판 바깥 테두리 한 줄도 지나갈 수 있다. 타일을 모두 없애면 성공.
//  - 미끄러짐이 없는 판은 처음부터 끝까지 풀 수 있는 것만 낸다 (만든 뒤 한 번 풀어 보고 확인).
//    미끄러짐이 있는 판은 없앨 때마다 판이 바뀌어 어차피 중간에 막힐 수 있어서, 막히면 섞는 것으로 충분하다
//    (무작위로 풀어 보면 8×12 아래로 미끄러짐은 거의 다 막혀서, 확인하려면 판 만들기가 너무 오래 걸린다)
//  - 이을 수 있는 쌍이 하나도 없으면 남은 타일 자리를 섞는다 (화면에서 "섞었어요!")
//  - 미끄러짐: 쌍을 없앤 뒤 남은 타일이 한쪽으로 밀려 빈칸을 채운다 (뒤 단계)
// 씨앗(숫자)이 같으면 같은 판이 나온다 → 방 대결·오늘의 퍼즐에서 모두 같은 판
// (연결 방식과 상관없는 순수한 계산)
import { seededRandom } from "../slide/slide.js";
/**
 * 타일 그림 36가지. 칸 값은 이 목록의 번호다.
 * 주의: 오늘의 퍼즐 판이 날짜마다 바뀌지 않도록 순서를 바꾸거나 중간에 끼우지 않는다 (새 그림은 맨 뒤에)
 */
export const TILE_PICTURES = [
  "donut",
  "icecream",
  "sandwich",
  "noodles",
  "banana",
  "strawberry",
  "coffee",
  "cookie",
  "plane",
  "cloud",
  "rainbow",
  "sun",
  "balloon",
  "star",
  "suitcase",
  "passport",
  "camera",
  "sunglasses",
  "pillow",
  "backpack",
  "headphones",
  "ticket",
  "window",
  "eyemask",
  "globe",
  "compass",
  "palm",
  "lighthouse",
  "tent",
  "mountain",
  "sandcastle",
  "sailboat",
  "pretzel",
  "juice",
  "cupcake",
  "soda",
];
/** 한 그림이 판에 들어가는 장 수 (2쌍) */
export const COPIES = 4;
/** 빈칸 */
export const EMPTY = -1;
/** 판마다 무작위로 고를 때 쓰는 미끄러짐 */
export const RANDOM_SLIDES = ["down", "up", "left", "right", "center"];
/** 혼자 하기 단계 (1 ~ 10). seconds: 제한 시간 */
export const LEVELS = [
  { cols: 6, rows: 6, kinds: 9, slide: "none", seconds: 180 },
  { cols: 6, rows: 8, kinds: 12, slide: "none", seconds: 180 },
  { cols: 7, rows: 8, kinds: 14, slide: "none", seconds: 180 },
  { cols: 8, rows: 8, kinds: 16, slide: "down", seconds: 180 },
  { cols: 8, rows: 10, kinds: 20, slide: "none", seconds: 240 },
  { cols: 8, rows: 10, kinds: 20, slide: "down", seconds: 240 },
  { cols: 8, rows: 10, kinds: 20, slide: "left", seconds: 240 },
  { cols: 8, rows: 12, kinds: 24, slide: "down", seconds: 300 },
  { cols: 8, rows: 12, kinds: 24, slide: "center", seconds: 300 },
  { cols: 8, rows: 12, kinds: 24, slide: "random", seconds: 240 },
];
/** 무한 도전 (10단계를 깬 뒤): 3분에서 시작해 판마다 10초씩 줄고 2분 아래로는 안 줄어든다. round는 1부터 */
export function endlessSpec(round) {
  return { cols: 8, rows: 12, kinds: 24, slide: "random", seconds: Math.max(120, 180 - (round - 1) * 10) };
}
/** 방 대결 판 크기 */
export const ROOM_SIZES = {
  small: { cols: 6, rows: 8, kinds: 12 },
  normal: { cols: 8, rows: 10, kinds: 20 },
  large: { cols: 8, rows: 12, kinds: 24 },
};
/** 남은 타일 수 */
export const tilesLeft = (board) => board.cells.filter((v) => v !== EMPTY).length;
export const isCleared = (board) => tilesLeft(board) === 0;
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
/**
 * 두 칸을 이을 수 있으면 선이 꺾이는 점들 (처음·끝 포함, 2~4개), 없으면 null.
 * 같은 그림이 아니거나 같은 칸이거나 빈칸이면 null.
 * 바깥 테두리 한 줄을 붙인 판에서 "선분 몇 개로 가는지"를 넓게 퍼지며 센다 (선분 3개 = 두 번 꺾임까지).
 */
export function findPath(board, a, b) {
  const { cols, rows, cells } = board;
  if (a === b || cells[a] === EMPTY || cells[a] !== cells[b]) return null;
  const W = cols + 2;
  const H = rows + 2;
  const toExt = (i) => (Math.floor(i / cols) + 1) * W + (i % cols) + 1;
  const free = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) return true;
    return cells[(y - 1) * cols + (x - 1)] === EMPTY;
  };
  const start = toExt(a);
  const goal = toExt(b);
  const segs = new Array(W * H).fill(Infinity);
  const from = new Array(W * H).fill(-1);
  segs[start] = 0;
  let frontier = [start];
  for (let s = 1; s <= 3 && frontier.length > 0; s++) {
    const next = [];
    for (const p of frontier) {
      const px = p % W;
      const py = Math.floor(p / W);
      for (const [dx, dy] of DIRS) {
        let x = px + dx;
        let y = py + dy;
        while (x >= 0 && y >= 0 && x < W && y < H) {
          const q = y * W + x;
          if (q === goal) {
            from[goal] = p;
            return pathOf(from, goal, start, W);
          }
          if (!free(x, y)) break;
          if (segs[q] > s) {
            segs[q] = s;
            from[q] = p;
            next.push(q);
          }
          x += dx;
          y += dy;
        }
      }
    }
    frontier = next;
  }
  return null;
}
function pathOf(from, goal, start, W) {
  const points = [];
  for (let p = goal; ; p = from[p]) {
    points.push({ col: (p % W) - 1, row: Math.floor(p / W) - 1 });
    if (p === start) break;
  }
  return points.reverse();
}
/** 그림별 타일 자리 */
function byPicture(board) {
  const groups = new Map();
  board.cells.forEach((v, i) => {
    if (v === EMPTY) return;
    const list = groups.get(v);
    if (list) list.push(i);
    else groups.set(v, [i]);
  });
  return [...groups.values()];
}
/** 이을 수 있는 쌍 모두. first면 처음 찾은 하나만 */
export function allPairs(board, first = false) {
  const pairs = [];
  for (const list of byPicture(board))
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++)
        if (findPath(board, list[i], list[j])) {
          pairs.push([list[i], list[j]]);
          if (first) return pairs;
        }
  return pairs;
}
/** 이을 수 있는 쌍 하나 (힌트·막힘 확인용). 없으면 null */
export const findPair = (board) => allPairs(board, true)[0] ?? null;
/** 남은 타일을 미끄러짐 방향으로 민다 */
export function applySlide(board) {
  const { cols, rows, slide } = board;
  if (slide === "none") return board;
  const cells = board.cells.slice();
  const at = (c, r) => r * cols + c;
  // 한 줄(칸 번호 목록)의 타일을 앞쪽으로 모은다
  const pack = (line) => {
    const tiles = line.map((i) => cells[i]).filter((v) => v !== EMPTY);
    line.forEach((i, k) => (cells[i] = k < tiles.length ? tiles[k] : EMPTY));
  };
  const range = (from, to) => Array.from({ length: to - from }, (_, k) => from + k);
  if (slide === "down" || slide === "up")
    for (let c = 0; c < cols; c++) {
      const line = range(0, rows).map((r) => at(c, r));
      pack(slide === "down" ? line.reverse() : line);
    }
  else
    for (let r = 0; r < rows; r++) {
      const line = range(0, cols).map((c) => at(c, r));
      if (slide === "left") pack(line);
      else if (slide === "right") pack(line.reverse());
      else {
        const half = Math.floor(cols / 2);
        pack(line.slice(0, half).reverse());
        pack(line.slice(half));
      }
    }
  return { ...board, cells };
}
/** 쌍 없애기. 이을 수 없으면 null, 없애면 미끄러짐까지 한 판 */
export function removePair(board, a, b) {
  const path = findPath(board, a, b);
  if (!path) return null;
  const cells = board.cells.slice();
  cells[a] = EMPTY;
  cells[b] = EMPTY;
  return { board: applySlide({ ...board, cells }), path };
}
function shuffleInPlace(list, random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}
/** 남은 타일의 자리만 섞는다. 이을 수 있는 쌍이 생길 때까지 (빈칸 자리는 그대로) */
export function reshuffle(board, random) {
  return reshuffleMoves(board, random).board;
}
/**
 * 섞기 + 어느 타일이 어디로 갔는지. from[i]: 지금 i칸에 있는 타일이 원래 있던 칸 (빈칸은 EMPTY).
 * 화면은 이걸로 타일을 새 자리로 날아가게 그린다
 */
export function reshuffleMoves(board, random) {
  const spots = board.cells.map((v, i) => (v === EMPTY ? -1 : i)).filter((i) => i >= 0);
  let result = { board, from: board.cells.map((v, i) => (v === EMPTY ? EMPTY : i)) };
  for (let tries = 0; tries < 200; tries++) {
    const sources = spots.slice();
    shuffleInPlace(sources, random);
    const cells = board.cells.slice();
    const from = result.from.slice();
    spots.forEach((i, k) => {
      cells[i] = board.cells[sources[k]];
      from[i] = sources[k];
    });
    result = { board: { ...board, cells }, from };
    if (findPair(result.board)) return result;
  }
  return result;
}
/** 막혔으면 섞은 판, 아니면 그대로. shuffled: 섞었는지 (화면에 "섞었어요!") */
export function unstuck(board, random) {
  if (isCleared(board) || findPair(board)) return { board, shuffled: false };
  return { board: reshuffle(board, random), shuffled: true };
}
/** 섞지 않고 끝까지 풀리는지: 이을 수 있는 쌍 중 하나를 무작위로 골라 없애기를 되풀이해 본다 */
export function solvesWithoutShuffle(board, random) {
  let current = board;
  while (!isCleared(current)) {
    const pairs = allPairs(current);
    if (pairs.length === 0) return false;
    const [a, b] = pairs[Math.floor(random() * pairs.length)];
    current = removePair(current, a, b).board;
  }
  return true;
}
/**
 * 새 판. 그림 kinds가지를 무작위로 골라 4장씩 섞어 깐다. 처음에 이을 쌍이 있어야 하고,
 * 미끄러짐이 없으면 섞지 않고 끝까지 풀리는 판이 나올 때까지 다시 깐다.
 * random이 같은 순서로 나오면 같은 판 (방·오늘의 퍼즐은 씨앗으로 만든 random을 준다)
 */
export function makeBoard(spec, random = Math.random) {
  const { cols, rows, kinds } = spec;
  if (cols * rows !== kinds * COPIES) throw new Error(`판 칸 수(${cols * rows})와 타일 수(${kinds * COPIES})가 다르다`);
  const slide = spec.slide === "random" ? RANDOM_SLIDES[Math.floor(random() * RANDOM_SLIDES.length)] : spec.slide;
  let board = null;
  for (let tries = 0; tries < 40; tries++) {
    const pictures = TILE_PICTURES.map((_, i) => i);
    shuffleInPlace(pictures, random);
    const cells = pictures.slice(0, kinds).flatMap((p) => Array(COPIES).fill(p));
    shuffleInPlace(cells, random);
    board = { cols, rows, cells, slide };
    // 풀어 보는 데 쓰는 무작위도 씨앗에서 나오게 해서, 어느 폰에서나 같은 판을 고른다
    const checkSeed = Math.floor(random() * 2 ** 31);
    if (!findPair(board)) continue;
    if (slide !== "none" || solvesWithoutShuffle(board, seededRandom(checkSeed))) return board;
  }
  return board;
}
