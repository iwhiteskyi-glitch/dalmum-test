/**
 * 스도쿠 규칙과 문제 만들기(비행기오락실 앱 src/games/sudoku/sudoku.ts를 그대로 옮겼어요. 순수한 계산만 있어요).
 *  - N×N 판(4×4·6×6·9×9). 가로줄·세로줄·작은 상자마다 1~N이 한 번씩 들어가야 해요
 *  - 숫자를 넣을 때는 정답인지 알려 주지 않고, 판을 다 채우면 정답과 비교해 채점해요
 *  - 같은 줄·상자에 같은 숫자가 겹치면 그 칸들을 알려 줘요(규칙상 바로 보이는 실수만)
 *  - 난이도는 "풀 때 필요한 기술"로 정해요(사람이 쓰는 풀이 기술을 쉬운 것부터 써 보고, 가장 어려운 기술 단계)
 *  - 문제는 답이 하나뿐인 것만 만들어요
 */
export const SIZES = [4, 6, 9];
/** 작은 상자 모양 (가로 boxCols칸 × 세로 boxRows칸) */
export const BOX = {
  4: { rows: 2, cols: 2 },
  6: { rows: 2, cols: 3 },
  9: { rows: 3, cols: 3 },
};
const geometries = new Map();
export function geometry(size) {
  const cached = geometries.get(size);
  if (cached) return cached;
  const { rows: br, cols: bc } = BOX[size];
  const cells = size * size;
  const rowOf = [];
  const colOf = [];
  const boxOf = [];
  const rows = Array.from({ length: size }, () => []);
  const cols = Array.from({ length: size }, () => []);
  const boxes = Array.from({ length: size }, () => []);
  const boxesPerRow = size / bc;
  for (let i = 0; i < cells; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    const b = Math.floor(r / br) * boxesPerRow + Math.floor(c / bc);
    rowOf.push(r);
    colOf.push(c);
    boxOf.push(b);
    rows[r].push(i);
    cols[c].push(i);
    boxes[b].push(i);
  }
  const peers = [];
  for (let i = 0; i < cells; i++) {
    const set = new Set([...rows[rowOf[i]], ...cols[colOf[i]], ...boxes[boxOf[i]]]);
    set.delete(i);
    peers.push([...set]);
  }
  let all = 0;
  for (let d = 1; d <= size; d++) all |= 1 << d;
  const geo = {
    size,
    cells,
    rowOf,
    colOf,
    boxOf,
    rows,
    cols,
    boxes,
    units: [...rows, ...cols, ...boxes],
    peers,
    all,
  };
  geometries.set(size, geo);
  return geo;
}
const bit = (d) => 1 << d;
function popcount(mask) {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}
/** 표시에 들어 있는 숫자들 (작은 것부터) */
function digitsOf(mask) {
  const out = [];
  for (let d = 1; mask >> d; d++) if (mask & bit(d)) out.push(d);
  return out;
}
// ── 글자로 바꾸기 (문제 은행·메시지용) ──
/** "0"은 빈칸. 9×9는 81글자 */
export const gridToString = (grid) => grid.join("");
export function gridFromString(text) {
  return [...text].map((ch) => (ch === "." ? 0 : Number(ch)));
}
/** 글자 길이로 판 크기를 안다 */
export function sizeOfCells(cells) {
  const size = Math.round(Math.sqrt(cells));
  if (size !== 4 && size !== 6 && size !== 9) throw new Error(`sudoku: bad size ${cells}`);
  return size;
}
// ── 채점·겹침 ──
/** 같은 줄·상자에 같은 숫자가 겹친 칸들 */
export function conflicts(grid, size) {
  const geo = geometry(size);
  const out = new Set();
  for (const unit of geo.units) {
    const seen = new Map();
    for (const i of unit) {
      const v = grid[i];
      if (!v) continue;
      const other = seen.get(v);
      if (other !== undefined) {
        out.add(other);
        out.add(i);
      } else seen.set(v, i);
    }
  }
  return out;
}
export const filledCount = (grid) => grid.reduce((n, v) => n + (v ? 1 : 0), 0);
export const isFilled = (grid) => grid.every((v) => v !== 0);
/** 다 채운 판이 정답과 같은지 */
export const isSolvedAs = (grid, solution) => grid.every((v, i) => v === solution[i]);
// ── 기계 풀이 (답 개수 세기) ──
/**
 * 답을 limit개까지 센다. 답이 하나뿐인지 볼 때는 limit 2.
 * random을 주면 숫자를 넣어 보는 순서를 섞는다 (빈 판에서 꽉 찬 판을 무작위로 만들 때)
 */
export function countSolutions(grid, size, limit = 2, random) {
  const geo = geometry(size);
  const rowUsed = new Int32Array(size);
  const colUsed = new Int32Array(size);
  const boxUsed = new Int32Array(size);
  const work = grid.slice();
  for (let i = 0; i < geo.cells; i++) {
    const v = work[i];
    if (!v) continue;
    const b = bit(v);
    const r = geo.rowOf[i];
    const c = geo.colOf[i];
    const x = geo.boxOf[i];
    if ((rowUsed[r] | colUsed[c] | boxUsed[x]) & b) return { count: 0, solution: null };
    rowUsed[r] |= b;
    colUsed[c] |= b;
    boxUsed[x] |= b;
  }
  let count = 0;
  let solution = null;
  const search = () => {
    // 넣을 수 있는 숫자가 가장 적은 빈칸부터
    let best = -1;
    let bestMask = 0;
    let bestCount = 99;
    for (let i = 0; i < geo.cells; i++) {
      if (work[i]) continue;
      const mask = geo.all & ~(rowUsed[geo.rowOf[i]] | colUsed[geo.colOf[i]] | boxUsed[geo.boxOf[i]]);
      const n = popcount(mask);
      if (n < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = n;
        if (n <= 1) break;
      }
    }
    if (best < 0) {
      count++;
      if (!solution) solution = work.slice();
      return count >= limit;
    }
    if (bestCount === 0) return false;
    const digits = digitsOf(bestMask);
    if (random) shuffle(digits, random);
    const r = geo.rowOf[best];
    const c = geo.colOf[best];
    const x = geo.boxOf[best];
    for (const d of digits) {
      const b = bit(d);
      work[best] = d;
      rowUsed[r] |= b;
      colUsed[c] |= b;
      boxUsed[x] |= b;
      const stop = search();
      work[best] = 0;
      rowUsed[r] &= ~b;
      colUsed[c] &= ~b;
      boxUsed[x] &= ~b;
      if (stop) return true;
    }
    return false;
  };
  search();
  return { count, solution };
}
/** 답이 하나뿐인 문제의 답 (없거나 여럿이면 null) */
export function solveUnique(grid, size) {
  const { count, solution } = countSolutions(grid, size, 2);
  return count === 1 ? solution : null;
}
function shuffle(list, random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
// ── 사람 풀이 (난이도 판정) ──
/**
 * 풀이 기술 단계
 * 1 그 칸에 들어갈 숫자가 하나뿐 (naked single)
 * 2 그 줄·상자에서 그 숫자가 갈 곳이 하나뿐 (hidden single)
 * 3 상자 안의 후보가 한 줄에만 있음 / 줄 안의 후보가 한 상자에만 있음 (locked candidates)
 * 4 두 칸·두 숫자 짝 (naked/hidden pair)
 * 5 세 칸·세 숫자 짝, X-윙 (naked/hidden triple, X-wing)
 * 6 XY-윙, 소드피시 (XY-wing, swordfish)
 * 이 기술로 못 풀면 UNSOLVED (문제로 쓰지 않는다)
 */
export const TIER_WEIGHT = [0, 1, 2, 6, 12, 25, 40];
export const UNSOLVED = 99;
export function grade(puzzle, size) {
  const geo = geometry(size);
  const grid = puzzle.slice();
  const cands = new Array(geo.cells).fill(0);
  for (let i = 0; i < geo.cells; i++) {
    if (grid[i]) continue;
    let mask = geo.all;
    for (const p of geo.peers[i]) if (grid[p]) mask &= ~bit(grid[p]);
    cands[i] = mask;
  }
  let empty = grid.filter((v) => !v).length;
  const uses = [0, 0, 0, 0, 0, 0, 0];
  let tier = 0;
  let score = 0;
  const place = (i, d) => {
    grid[i] = d;
    cands[i] = 0;
    empty--;
    for (const p of geo.peers[i]) cands[p] &= ~bit(d);
  };
  /** 칸의 후보에서 숫자들을 지운다 (바뀌었으면 true) */
  const remove = (i, mask) => {
    if (grid[i] || !(cands[i] & mask)) return false;
    cands[i] &= ~mask;
    return true;
  };
  const nakedSingle = () => {
    for (let i = 0; i < geo.cells; i++) {
      if (!grid[i] && popcount(cands[i]) === 1) {
        place(i, digitsOf(cands[i])[0]);
        return true;
      }
    }
    return false;
  };
  const hiddenSingle = () => {
    for (const unit of geo.units) {
      for (let d = 1; d <= size; d++) {
        let spot = -1;
        let n = 0;
        for (const i of unit) {
          if (!grid[i] && cands[i] & bit(d)) {
            spot = i;
            n++;
          }
        }
        if (n === 1) {
          place(spot, d);
          return true;
        }
      }
    }
    return false;
  };
  const lockedCandidates = () => {
    let progress = false;
    // 상자 안에서 한 줄에만 있으면 그 줄의 나머지에서 지운다 (pointing)
    for (const box of geo.boxes) {
      for (let d = 1; d <= size; d++) {
        const spots = box.filter((i) => !grid[i] && cands[i] & bit(d));
        if (spots.length < 2) continue;
        const r = geo.rowOf[spots[0]];
        if (spots.every((i) => geo.rowOf[i] === r)) {
          for (const i of geo.rows[r])
            if (geo.boxOf[i] !== geo.boxOf[spots[0]]) progress = remove(i, bit(d)) || progress;
        }
        const c = geo.colOf[spots[0]];
        if (spots.every((i) => geo.colOf[i] === c)) {
          for (const i of geo.cols[c])
            if (geo.boxOf[i] !== geo.boxOf[spots[0]]) progress = remove(i, bit(d)) || progress;
        }
        if (progress) return true;
      }
    }
    // 줄 안에서 한 상자에만 있으면 그 상자의 나머지에서 지운다 (claiming)
    for (const line of [...geo.rows, ...geo.cols]) {
      for (let d = 1; d <= size; d++) {
        const spots = line.filter((i) => !grid[i] && cands[i] & bit(d));
        if (spots.length < 2) continue;
        const x = geo.boxOf[spots[0]];
        if (!spots.every((i) => geo.boxOf[i] === x)) continue;
        const inLine = new Set(line);
        for (const i of geo.boxes[x]) if (!inLine.has(i)) progress = remove(i, bit(d)) || progress;
        if (progress) return true;
      }
    }
    return false;
  };
  /** k칸의 후보를 합쳐 숫자가 k개뿐이면, 그 숫자들은 묶음의 다른 칸에 못 온다 */
  const nakedSubset = (k) => {
    for (const unit of geo.units) {
      const open = unit.filter((i) => !grid[i] && popcount(cands[i]) >= 2 && popcount(cands[i]) <= k);
      for (const pick of combinations(open, k)) {
        let union = 0;
        for (const i of pick) union |= cands[i];
        if (popcount(union) !== k) continue;
        let progress = false;
        for (const i of unit) if (!pick.includes(i)) progress = remove(i, union) || progress;
        if (progress) return true;
      }
    }
    return false;
  };
  /** k개 숫자가 갈 수 있는 칸이 합쳐 k칸뿐이면, 그 칸들에는 그 숫자들만 남는다 */
  const hiddenSubset = (k) => {
    for (const unit of geo.units) {
      const placed = unit.reduce((m, i) => m | (grid[i] ? bit(grid[i]) : 0), 0);
      const digits = [];
      for (let d = 1; d <= size; d++) if (!(placed & bit(d))) digits.push(d);
      if (digits.length <= k) continue;
      for (const pick of combinations(digits, k)) {
        const mask = pick.reduce((m, d) => m | bit(d), 0);
        const spots = unit.filter((i) => !grid[i] && cands[i] & mask);
        if (spots.length !== k) continue;
        let progress = false;
        for (const i of spots) progress = remove(i, geo.all & ~mask) || progress;
        if (progress) return true;
      }
    }
    return false;
  };
  /** X-윙(k=2)·소드피시(k=3): k줄에서 숫자 d의 자리가 같은 k칸 세로줄에만 있으면 그 세로줄의 다른 칸에서 지운다 */
  const fish = (k) => {
    for (const [bases, covers, coverOf] of [
      [geo.rows, geo.cols, geo.colOf],
      [geo.cols, geo.rows, geo.rowOf],
    ]) {
      for (let d = 1; d <= size; d++) {
        const lines = [];
        bases.forEach((base, line) => {
          let mask = 0;
          let n = 0;
          for (const i of base) {
            if (!grid[i] && cands[i] & bit(d)) {
              mask |= 1 << coverOf[i];
              n++;
            }
          }
          if (n >= 2 && n <= k) lines.push({ line, mask });
        });
        for (const pick of combinations(lines, k)) {
          const union = pick.reduce((m, l) => m | l.mask, 0);
          if (popcount(union) !== k) continue;
          const baseLines = new Set(pick.map((l) => l.line));
          let progress = false;
          for (let c = 0; c < size; c++) {
            if (!(union & (1 << c))) continue;
            for (const i of covers[c]) {
              const line = coverOf === geo.colOf ? geo.rowOf[i] : geo.colOf[i];
              if (!baseLines.has(line)) progress = remove(i, bit(d)) || progress;
            }
          }
          if (progress) return true;
        }
      }
    }
    return false;
  };
  /** XY-윙: 가운데 칸 {x,y}, 그와 이어진 두 칸 {x,z}·{y,z} → 두 칸 모두와 이어진 칸에서 z를 지운다 */
  const xyWing = () => {
    for (let pivot = 0; pivot < geo.cells; pivot++) {
      if (grid[pivot] || popcount(cands[pivot]) !== 2) continue;
      const wings = geo.peers[pivot].filter(
        (i) => !grid[i] && popcount(cands[i]) === 2 && popcount(cands[i] & cands[pivot]) === 1,
      );
      for (const [a, b] of combinations(wings, 2)) {
        const za = cands[a] & ~cands[pivot];
        const zb = cands[b] & ~cands[pivot];
        if (za !== zb || (cands[a] & cands[pivot]) === (cands[b] & cands[pivot])) continue;
        const peersB = new Set(geo.peers[b]);
        let progress = false;
        for (const i of geo.peers[a]) if (i !== pivot && i !== b && peersB.has(i)) progress = remove(i, za) || progress;
        if (progress) return true;
      }
    }
    return false;
  };
  const steps = [
    [1, nakedSingle],
    [2, hiddenSingle],
    [3, lockedCandidates],
    [4, () => nakedSubset(2)],
    [4, () => hiddenSubset(2)],
    [5, () => nakedSubset(3)],
    [5, () => hiddenSubset(3)],
    [5, () => fish(2)],
    [6, xyWing],
    [6, () => fish(3)],
  ];
  while (empty > 0) {
    let used = 0;
    for (const [level, step] of steps) {
      if (step()) {
        used = level;
        break;
      }
    }
    if (!used) return { tier: UNSOLVED, score, uses, givens: filledCount(puzzle), final: grid };
    uses[used]++;
    score += TIER_WEIGHT[used];
    tier = Math.max(tier, used);
  }
  return { tier, score, uses, givens: filledCount(puzzle), final: grid };
}
function combinations(list, k) {
  const out = [];
  const pick = [];
  const walk = (start) => {
    if (pick.length === k) {
      out.push(pick.slice());
      return;
    }
    for (let i = start; i <= list.length - (k - pick.length); i++) {
      pick.push(list[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return out;
}
// ── 문제 만들기 ──
/** 무작위로 꽉 찬 정답 판 */
export function randomSolution(size, random) {
  const empty = new Array(size * size).fill(0);
  const { solution } = countSolutions(empty, size, 1, random);
  if (!solution) throw new Error("sudoku: no solution");
  return solution;
}
/**
 * 정답 판에서 칸을 무작위로 지워 답이 하나뿐인 가장 적은 문제를 만든다.
 * symmetric이면 가운데를 중심으로 마주 보는 칸을 함께 지운다 (보기 좋은 모양)
 */
export function carvePuzzle(solution, size, random, symmetric = true) {
  const cells = size * size;
  const puzzle = solution.slice();
  const order = shuffle(
    Array.from({ length: cells }, (_, i) => i),
    random,
  );
  for (const i of order) {
    if (!puzzle[i]) continue;
    const j = cells - 1 - i;
    const pair = symmetric && j !== i && puzzle[j] ? [i, j] : [i];
    for (const k of pair) puzzle[k] = 0;
    if (countSolutions(puzzle, size, 2).count !== 1) for (const k of pair) puzzle[k] = solution[k];
  }
  return puzzle;
}
/** 쉽게 만들려고 정답에서 숫자를 다시 채워 givens개가 되게 한다 (늘 답은 하나) */
export function addGivens(puzzle, solution, givens, random) {
  const out = puzzle.slice();
  const empties = shuffle(
    out.flatMap((v, i) => (v ? [] : [i])),
    random,
  );
  let count = filledCount(out);
  for (const i of empties) {
    if (count >= givens) break;
    out[i] = solution[i];
    count++;
  }
  return out;
}
// ── 같은 난이도로 모양 바꾸기 ──
/**
 * 숫자 바꾸기·같은 띠 안에서 줄 바꾸기·띠끼리 바꾸기 (정사각 상자면 뒤집기도).
 * 답이 하나뿐인 것과 풀이 기술(난이도)은 그대로다. 문제 은행 하나로 많은 문제를 낸다
 */
export function transformPuzzle(puzzle, size, random) {
  const { rows: br, cols: bc } = BOX[size];
  const digits = shuffle(
    Array.from({ length: size }, (_, i) => i + 1),
    random,
  );
  const lineOrder = (band, bands) =>
    shuffle(
      Array.from({ length: bands }, (_, i) => i),
      random,
    ).flatMap((b) =>
      shuffle(
        Array.from({ length: band }, (_, i) => b * band + i),
        random,
      ),
    );
  const rowMap = lineOrder(br, size / br);
  const colMap = lineOrder(bc, size / bc);
  const transpose = br === bc && random() < 0.5;
  const out = new Array(size * size).fill(0);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = puzzle[rowMap[r] * size + colMap[c]];
      const [tr, tc] = transpose ? [c, r] : [r, c];
      out[tr * size + tc] = v ? digits[v - 1] : 0;
    }
  }
  return out;
}
/**
 * 1 4×4 연습, 2~3 6×6, 4~10 9×9 (아주 쉬움 → 최고). 10단계를 깨면 무한(8~10단계 문제)
 * 9×9는 문제 은행(bank.json, scripts/make-sudoku-bank.mjs)에서, 4×4·6×6은 폰에서 바로 만든다
 */
export const STAGES = [
  { stage: 1, size: 4, tiers: [1, 2], givens: 6 },
  { stage: 2, size: 6, tiers: [1, 2], givens: 16 },
  { stage: 3, size: 6, tiers: [2, 3] }, // 6×6이라도 처음 숫자가 적으면 가끔 아주 어려워져서 4단계(9×9 아주 쉬움)보다 어렵지 않게 막는다
  { stage: 4, size: 9, tiers: [1, 2], givens: 38 },
  { stage: 5, size: 9, tiers: [1, 2], givens: 30 },
  { stage: 6, size: 9, tiers: [3, 3] },
  { stage: 7, size: 9, tiers: [4, 4] },
  { stage: 8, size: 9, tiers: [5, 5] },
  { stage: 9, size: 9, tiers: [6, 6], maxAdvanced: 1 },
  { stage: 10, size: 9, tiers: [6, 6], minAdvanced: 2 },
];
/** 문제가 그 단계 조건에 맞는지 */
export function fitsStage(spec, g) {
  if (g.tier < spec.tiers[0] || g.tier > spec.tiers[1]) return false;
  if (spec.minAdvanced !== undefined && g.uses[6] < spec.minAdvanced) return false;
  if (spec.maxAdvanced !== undefined && g.uses[6] > spec.maxAdvanced) return false;
  return true;
}
/** 그 단계 조건에 맞는 문제를 하나 만들어 본다 (안 맞으면 null, 여러 번 부른다) */
export function tryStagePuzzle(spec, random) {
  const solution = randomSolution(spec.size, random);
  let puzzle = carvePuzzle(solution, spec.size, random);
  if (spec.givens !== undefined) {
    // 쉬운 단계: 가장 적은 문제부터 이미 조건 안이어야 하고, 숫자를 더 채운 뒤에도 다시 확인한다
    if (!fitsStage(spec, grade(puzzle, spec.size))) return null;
    puzzle = addGivens(puzzle, solution, spec.givens, random);
  }
  return fitsStage(spec, grade(puzzle, spec.size)) ? { puzzle, solution } : null;
}
