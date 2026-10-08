// 장기 규칙: 상차림, 말의 움직임(궁성 대각선, 포 넘기, 마·상 멱), 장군, 외통, 빅장, 한수쉼.
// 비행기오락실 앱(src/games/janggi/janggi.ts)의 규칙을 그대로 옮겨 왔어요(화면·연결과 상관없는 순수한 계산).
// 웹에서는 컴퓨터와 두는 한 판이 끝없이 길어지지 않게, 200수가 지나면 전통 점수 계산으로 승부를 정해요.
//
// 판 상태(state)
//  squares: 90개 교차점을 한 글자씩. 0번이 왼쪽 위(한 쪽), 89번이 오른쪽 아래(초 쪽).
//    대문자는 초(먼저 두는 쪽), 소문자는 한. K 궁, A 사, E 상, H 마, R 차, C 포, P 졸·병. '.'은 빈 곳
//  turn: 0 초 / 1 한 · lastMove · lastPassed(바로 전 수가 한수쉼) · captured · ply(지금까지 둔 수)

export const COLS = 9;
export const ROWS = 10;
export const POINTS = COLS * ROWS;
export const MOVE_LIMIT = 200;

/** 상차림: 자기 쪽에서 봤을 때 왼쪽부터 마(H)·상(E) 순서 */
export const SETUPS = ["HEHE", "EHEH", "HEEH", "EHHE"];
export const SETUP_NAMES = { HEHE: "마상마상", EHEH: "상마상마", HEEH: "마상상마", EHHE: "상마마상" };

export const rowOf = (p) => Math.floor(p / COLS);
export const colOf = (p) => p % COLS;
const at = (row, col) => row * COLS + col;
const inside = (row, col) => row >= 0 && row < ROWS && col >= 0 && col < COLS;

/** 0: 초(대문자), 1: 한(소문자), null: 빈 곳 */
export const sideOfPiece = (piece) => (piece === "." ? null : piece === piece.toUpperCase() ? 0 : 1);
const typeOf = (piece) => piece.toUpperCase();

/** 궁성 안인지. side를 주면 그 쪽 궁성만 (초는 아래 7~9줄, 한은 위 0~2줄) */
export function inPalace(row, col, side) {
  if (col < 3 || col > 5) return false;
  const top = row >= 0 && row <= 2;
  const bottom = row >= 7 && row <= 9;
  if (side === 0) return bottom;
  if (side === 1) return top;
  return top || bottom;
}
const isPalaceCenter = (row, col) => col === 4 && (row === 1 || row === 8);

/** 궁성 안의 대각선 선을 따라 한 칸 갈 수 있는지 (모서리 ↔ 가운데) */
export function diagonalLinked(row, col, dr, dc) {
  const toRow = row + dr;
  const toCol = col + dc;
  if (!inPalace(row, col) || !inPalace(toRow, toCol)) return false;
  if (row <= 2 !== toRow <= 2) return false;
  return isPalaceCenter(row, col) || isPalaceCenter(toRow, toCol);
}

const ORTHOGONAL = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIAGONAL = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const EMPTY_HE = "R..A.A..R";
function baseSquares() {
  const rows = [EMPTY_HE.toLowerCase(), "....k....", ".c.....c.", "p.p.p.p.p", ".........", ".........", "P.P.P.P.P", ".C.....C.", "....K....", EMPTY_HE];
  return rows.join("").split("");
}

/** 두 사람의 상차림대로 마·상을 놓는다. 한은 자기 쪽에서 본 왼쪽이 판의 오른쪽이다 */
export function placeSetup(squares, cho, han) {
  const next = [...squares];
  [1, 2, 6, 7].forEach((col, i) => (next[at(9, col)] = cho[i]));
  [7, 6, 2, 1].forEach((col, i) => (next[at(0, col)] = han[i].toLowerCase()));
  return next;
}

export function newState(choSetup = "HEEH", hanSetup = "HEEH") {
  return {
    squares: placeSetup(baseSquares(), choSetup, hanSetup).join(""),
    turn: 0,
    lastMove: null,
    lastPassed: false,
    captured: { cho: "", han: "" },
    ply: 0,
  };
}

/** 말의 움직임만 본 도착점들 (내 궁이 위험해지는지는 아직 따지지 않음) */
export function pseudoTargets(squares, from) {
  const piece = squares[from];
  const side = sideOfPiece(piece);
  if (side === null) return [];
  const row = rowOf(from);
  const col = colOf(from);
  const targets = [];
  const pieceAt = (r, c) => squares[at(r, c)];
  const canLand = (r, c) => inside(r, c) && sideOfPiece(pieceAt(r, c)) !== side;
  const add = (r, c) => {
    if (canLand(r, c)) targets.push(at(r, c));
  };

  switch (typeOf(piece)) {
    case "K":
    case "A":
      for (const [dr, dc] of ORTHOGONAL) if (inPalace(row + dr, col + dc, side)) add(row + dr, col + dc);
      for (const [dr, dc] of DIAGONAL) {
        if (diagonalLinked(row, col, dr, dc) && inPalace(row + dr, col + dc, side)) add(row + dr, col + dc);
      }
      break;
    case "R": {
      const ray = (dr, dc, diagonal) => {
        let r = row;
        let c = col;
        for (;;) {
          if (diagonal && !diagonalLinked(r, c, dr, dc)) break;
          r += dr;
          c += dc;
          if (!inside(r, c)) break;
          if (pieceAt(r, c) !== ".") {
            add(r, c);
            break;
          }
          targets.push(at(r, c));
        }
      };
      ORTHOGONAL.forEach(([dr, dc]) => ray(dr, dc, false));
      DIAGONAL.forEach(([dr, dc]) => ray(dr, dc, true));
      break;
    }
    case "C": {
      const ray = (dr, dc, diagonal) => {
        let r = row;
        let c = col;
        let jumped = false;
        for (;;) {
          if (diagonal && !diagonalLinked(r, c, dr, dc)) break;
          r += dr;
          c += dc;
          if (!inside(r, c)) break;
          const target = pieceAt(r, c);
          if (!jumped) {
            if (target === ".") continue;
            if (typeOf(target) === "C") break;
            jumped = true;
            continue;
          }
          if (target === ".") {
            targets.push(at(r, c));
            continue;
          }
          if (typeOf(target) !== "C" && sideOfPiece(target) !== side) targets.push(at(r, c));
          break;
        }
      };
      ORTHOGONAL.forEach(([dr, dc]) => ray(dr, dc, false));
      DIAGONAL.forEach(([dr, dc]) => ray(dr, dc, true));
      break;
    }
    case "H":
      for (const [dr, dc] of ORTHOGONAL) {
        if (!inside(row + dr, col + dc) || pieceAt(row + dr, col + dc) !== ".") continue;
        const sides = dr === 0 ? [-1, 1].map((s) => [s, dc]) : [-1, 1].map((s) => [dr, s]);
        for (const [sr, sc] of sides) add(row + dr + sr, col + dc + sc);
      }
      break;
    case "E":
      for (const [dr, dc] of ORTHOGONAL) {
        if (!inside(row + dr, col + dc) || pieceAt(row + dr, col + dc) !== ".") continue;
        const sides = dr === 0 ? [-1, 1].map((s) => [s, dc]) : [-1, 1].map((s) => [dr, s]);
        for (const [sr, sc] of sides) {
          const midRow = row + dr + sr;
          const midCol = col + dc + sc;
          if (!inside(midRow, midCol) || pieceAt(midRow, midCol) !== ".") continue;
          add(midRow + sr, midCol + sc);
        }
      }
      break;
    case "P": {
      const forward = side === 0 ? -1 : 1;
      add(row + forward, col);
      add(row, col - 1);
      add(row, col + 1);
      for (const dc of [-1, 1]) {
        if (diagonalLinked(row, col, forward, dc) && inPalace(row + forward, col + dc, side === 0 ? 1 : 0)) add(row + forward, col + dc);
      }
      break;
    }
  }
  return targets;
}

/** side 쪽 궁이 상대 말에게 공격받고 있는지 (장군) */
export function inCheck(squares, side) {
  const king = squares.indexOf(side === 0 ? "K" : "k");
  if (king < 0) return false;
  for (let p = 0; p < POINTS; p++) {
    if (sideOfPiece(squares[p]) === 1 - side && pseudoTargets(squares, p).includes(king)) return true;
  }
  return false;
}

function moved(squares, from, to) {
  const next = squares.split("");
  next[to] = next[from];
  next[from] = ".";
  return next.join("");
}

/** 이 말이 실제로 갈 수 있는 곳 (내 궁을 공격받게 하는 수는 뺀다) */
export function legalTargets(state, from) {
  if (sideOfPiece(state.squares[from]) !== state.turn) return [];
  return pseudoTargets(state.squares, from).filter((to) => !inCheck(moved(state.squares, from, to), state.turn));
}

export function hasAnyLegalMove(state) {
  for (let p = 0; p < POINTS; p++) {
    if (sideOfPiece(state.squares[p]) === state.turn && legalTargets(state, p).length > 0) return true;
  }
  return false;
}

/** 궁끼리 같은 세로줄에서 사이에 아무것도 없이 마주 보는지 (빅장) */
export function isBikjang(squares) {
  const cho = squares.indexOf("K");
  const han = squares.indexOf("k");
  if (cho < 0 || han < 0 || colOf(cho) !== colOf(han)) return false;
  for (let row = rowOf(han) + 1; row < rowOf(cho); row++) if (squares[at(row, colOf(cho))] !== ".") return false;
  return true;
}

/** 전통 점수: 차 13, 포 7, 마 5, 상 3, 사 3, 졸·병 2 (나중에 두는 한에 덤 1.5) */
export const POINT_VALUE = { R: 13, C: 7, H: 5, E: 3, A: 3, P: 2, K: 0 };
export function scores(squares) {
  let cho = 0;
  let han = 1.5;
  for (const ch of squares) {
    if (ch === ".") continue;
    if (ch === ch.toUpperCase()) cho += POINT_VALUE[ch];
    else han += POINT_VALUE[ch.toUpperCase()];
  }
  return { cho, han };
}

export const turnOf = (state) => state.turn;

/** 장군을 받고 있는지(화면 표시용) */
export const checked = (state) => inCheck(state.squares, state.turn);

/** 한수쉼을 할 수 있는지: 장군 중에는 쉴 수 없어요 */
export const canPass = (state) => !inCheck(state.squares, state.turn);

/**
 * 수 두기: move = { from, to } 또는 { pass: true }
 * 반환: { state, end } — end는 { winner: 0|1|null, reason } · 둘 수 없는 수면 null
 */
export function play(state, move) {
  const side = state.turn;
  const opponent = 1 - side;
  if (move && move.pass) {
    if (inCheck(state.squares, side)) return null;
    const next = { ...state, turn: opponent, lastMove: null, lastPassed: true, ply: state.ply + 1 };
    if (state.lastPassed) return { state: next, end: { winner: null, reason: "둘 다 연달아 한수쉼을 해서 무승부" } };
    return { state: next, end: limitEnd(next) };
  }
  if (!move || !Number.isInteger(move.from) || !Number.isInteger(move.to)) return null;
  if (!legalTargets(state, move.from).includes(move.to)) return null;
  const taken = state.squares[move.to];
  const squares = moved(state.squares, move.from, move.to);
  const key = side === 0 ? "cho" : "han";
  const next = {
    squares,
    turn: opponent,
    lastMove: { from: move.from, to: move.to },
    lastPassed: false,
    captured: taken === "." ? state.captured : { ...state.captured, [key]: state.captured[key] + taken },
    ply: state.ply + 1,
  };
  if (inCheck(squares, opponent) && !hasAnyLegalMove(next)) return { state: next, end: { winner: side, reason: "외통(장군을 피할 수 없어요)" } };
  if (isBikjang(squares)) return { state: next, end: { winner: null, reason: "빅장(궁끼리 마주 봐서 무승부)" } };
  return { state: next, end: limitEnd(next) };
}

function limitEnd(state) {
  if (state.ply < MOVE_LIMIT) return null;
  const { cho, han } = scores(state.squares);
  return { winner: cho > han ? 0 : 1, reason: `${MOVE_LIMIT}수가 지나 점수로 판정(초 ${cho} : 한 ${han})` };
}
