// 체스 규칙: 말의 움직임, 체크, 캐슬링, 앙파상, 프로모션, 체크메이트와 무승부 판정.
// 비행기오락실 앱(src/games/chess/chess.ts)의 규칙을 그대로 옮겨 왔어요(화면·연결과 상관없는 순수한 계산).
//
// 판 상태(state)
//  squares: 64칸을 한 글자씩. 0번이 왼쪽 위(흑 쪽 a8), 63번이 오른쪽 아래(백 쪽 h1).
//    대문자는 백, 소문자는 흑 (K 킹, Q 퀸, R 룩, B 비숍, N 나이트, P 폰), '.'은 빈칸
//  turn: 'w' | 'b' · castling: 아직 할 수 있는 캐슬링(KQkq) · enPassant: 앙파상으로 갈 수 있는 칸
//  halfmove: 50수 규칙용 · history: 3번 반복 확인용 배치 기록 · lastMove · captured

export const PROMOTION_PIECES = ["Q", "R", "B", "N"];
const INITIAL = "rnbqkbnr" + "pppppppp" + ".".repeat(32) + "PPPPPPPP" + "RNBQKBNR";

export const rowOf = (sq) => Math.floor(sq / 8);
export const colOf = (sq) => sq % 8;
const at = (row, col) => row * 8 + col;
const inside = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

export const colorOf = (piece) => (piece === "." ? null : piece === piece.toUpperCase() ? "w" : "b");
const enemy = (color) => (color === "w" ? "b" : "w");
const typeOf = (piece) => piece.toUpperCase();

const KNIGHT_STEPS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];
const KING_STEPS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];
const ROOK_DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const BISHOP_DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/** 배치를 짧은 글자로 줄인다 (3번 반복 확인용) */
function positionKey(board) {
  const text = `${board.squares}${board.turn}${board.castling}${board.enPassant ?? "-"}`;
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

export function newState() {
  const base = { squares: INITIAL, turn: "w", castling: "KQkq", enPassant: null };
  return { ...base, halfmove: 0, history: [positionKey(base)], lastMove: null, captured: { w: "", b: "" } };
}

/** 이 칸이 by 쪽 말에게 공격받고 있는지 */
export function isAttacked(squares, sq, by) {
  const row = rowOf(sq);
  const col = colOf(sq);
  const mine = (piece, type) => colorOf(piece) === by && typeOf(piece) === type;
  const pawnRow = by === "w" ? row + 1 : row - 1;
  for (const dc of [-1, 1]) {
    if (inside(pawnRow, col + dc) && mine(squares[at(pawnRow, col + dc)], "P")) return true;
  }
  for (const [dr, dc] of KNIGHT_STEPS) {
    if (inside(row + dr, col + dc) && mine(squares[at(row + dr, col + dc)], "N")) return true;
  }
  for (const [dr, dc] of KING_STEPS) {
    if (inside(row + dr, col + dc) && mine(squares[at(row + dr, col + dc)], "K")) return true;
  }
  const slide = (dirs, types) =>
    dirs.some(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      while (inside(r, c)) {
        const piece = squares[at(r, c)];
        if (piece !== ".") return colorOf(piece) === by && types.includes(typeOf(piece));
        r += dr;
        c += dc;
      }
      return false;
    });
  return slide(ROOK_DIRS, ["R", "Q"]) || slide(BISHOP_DIRS, ["B", "Q"]);
}

export function inCheck(board, color) {
  const king = board.squares.indexOf(color === "w" ? "K" : "k");
  return king >= 0 && isAttacked(board.squares, king, enemy(color));
}

/** 말의 움직임만 본 수 (내 킹이 위험해지는지는 아직 따지지 않음). 프로모션은 퀸으로 대표 */
function pseudoMoves(board, from) {
  const piece = board.squares[from];
  const color = colorOf(piece);
  if (!color || color !== board.turn) return [];
  const row = rowOf(from);
  const col = colOf(from);
  const moves = [];
  const add = (to) => moves.push({ from, to });
  const canLand = (r, c) => inside(r, c) && colorOf(board.squares[at(r, c)]) !== color;

  switch (typeOf(piece)) {
    case "P": {
      const dir = color === "w" ? -1 : 1;
      const startRow = color === "w" ? 6 : 1;
      const lastRow = color === "w" ? 0 : 7;
      const push = (to) => moves.push(rowOf(to) === lastRow ? { from, to, promotion: "Q" } : { from, to });
      if (inside(row + dir, col) && board.squares[at(row + dir, col)] === ".") {
        push(at(row + dir, col));
        if (row === startRow && board.squares[at(row + 2 * dir, col)] === ".") add(at(row + 2 * dir, col));
      }
      for (const dc of [-1, 1]) {
        if (!inside(row + dir, col + dc)) continue;
        const to = at(row + dir, col + dc);
        if (colorOf(board.squares[to]) === enemy(color) || to === board.enPassant) push(to);
      }
      break;
    }
    case "N":
      for (const [dr, dc] of KNIGHT_STEPS) if (canLand(row + dr, col + dc)) add(at(row + dr, col + dc));
      break;
    case "K": {
      for (const [dr, dc] of KING_STEPS) if (canLand(row + dr, col + dc)) add(at(row + dr, col + dc));
      // 캐슬링: 킹과 룩이 움직인 적 없고, 사이가 비어 있고, 킹이 지금·지나가는·도착하는 칸이 공격받지 않을 때
      const homeRow = color === "w" ? 7 : 0;
      const rights = color === "w" ? { king: "K", queen: "Q" } : { king: "k", queen: "q" };
      if (row === homeRow && col === 4 && !isAttacked(board.squares, from, enemy(color))) {
        const empty = (...cols) => cols.every((c) => board.squares[at(homeRow, c)] === ".");
        const safe = (...cols) => cols.every((c) => !isAttacked(board.squares, at(homeRow, c), enemy(color)));
        if (board.castling.includes(rights.king) && empty(5, 6) && safe(5, 6)) add(at(homeRow, 6));
        if (board.castling.includes(rights.queen) && empty(1, 2, 3) && safe(2, 3)) add(at(homeRow, 2));
      }
      break;
    }
    default: {
      const type = typeOf(piece);
      const dirs = type === "R" ? ROOK_DIRS : type === "B" ? BISHOP_DIRS : [...ROOK_DIRS, ...BISHOP_DIRS];
      for (const [dr, dc] of dirs) {
        let r = row + dr;
        let c = col + dc;
        while (inside(r, c)) {
          const target = board.squares[at(r, c)];
          if (colorOf(target) === color) break;
          add(at(r, c));
          if (target !== ".") break;
          r += dr;
          c += dc;
        }
      }
    }
  }
  return moves;
}

/** 수를 둔 뒤의 판 (규칙 확인 없이 그대로 옮긴다) */
function move(board, m) {
  const squares = board.squares.split("");
  const piece = squares[m.from];
  const color = colorOf(piece);
  const type = typeOf(piece);
  let taken = squares[m.to];

  if (type === "P" && m.to === board.enPassant && taken === ".") {
    const capturedAt = at(rowOf(m.from), colOf(m.to));
    taken = squares[capturedAt];
    squares[capturedAt] = ".";
  }
  squares[m.to] = piece;
  squares[m.from] = ".";
  if (type === "P" && (rowOf(m.to) === 0 || rowOf(m.to) === 7)) {
    const promoted = m.promotion ?? "Q";
    squares[m.to] = color === "w" ? promoted : promoted.toLowerCase();
  }
  if (type === "K" && Math.abs(colOf(m.to) - colOf(m.from)) === 2) {
    const row = rowOf(m.from);
    const kingSide = colOf(m.to) === 6;
    const rookFrom = at(row, kingSide ? 7 : 0);
    const rookTo = at(row, kingSide ? 5 : 3);
    squares[rookTo] = squares[rookFrom];
    squares[rookFrom] = ".";
  }
  const lost = { 60: "KQ", 4: "kq", 63: "K", 56: "Q", 7: "k", 0: "q" };
  const castling = board.castling
    .split("")
    .filter((right) => !(lost[m.from] ?? "").includes(right) && !(lost[m.to] ?? "").includes(right))
    .join("");
  const enPassant =
    type === "P" && Math.abs(rowOf(m.to) - rowOf(m.from)) === 2 ? at((rowOf(m.from) + rowOf(m.to)) / 2, colOf(m.from)) : null;
  const irreversible = type === "P" || taken !== ".";
  const next = { squares: squares.join(""), turn: enemy(color), castling, enPassant };
  const key = positionKey(next);
  return {
    ...next,
    halfmove: irreversible ? 0 : board.halfmove + 1,
    history: irreversible ? [key] : [...board.history, key],
    lastMove: { from: m.from, to: m.to },
    captured: taken === "." ? board.captured : { ...board.captured, [color]: board.captured[color] + taken },
  };
}

/** 이 칸의 말이 실제로 둘 수 있는 수 (내 킹을 위험하게 하는 수는 뺀다) */
export function legalMovesFrom(board, from) {
  return pseudoMoves(board, from).filter((m) => !inCheck(move(board, m), board.turn));
}

export function allLegalMoves(board) {
  const out = [];
  for (let sq = 0; sq < 64; sq++) if (colorOf(board.squares[sq]) === board.turn) out.push(...legalMovesFrom(board, sq));
  return out;
}

function hasAnyLegalMove(board) {
  for (let sq = 0; sq < 64; sq++) {
    if (colorOf(board.squares[sq]) === board.turn && legalMovesFrom(board, sq).length > 0) return true;
  }
  return false;
}

/** 서로 체크메이트를 할 수 없는 말만 남았는지 */
export function isInsufficientMaterial(squares) {
  const others = [];
  for (let sq = 0; sq < 64; sq++) {
    const piece = squares[sq];
    if (piece !== "." && typeOf(piece) !== "K") others.push({ type: typeOf(piece), sq });
  }
  if (others.length === 0) return true;
  if (others.length === 1) return others[0].type === "B" || others[0].type === "N";
  const squareColor = (sq) => (rowOf(sq) + colOf(sq)) % 2;
  return others.every((p) => p.type === "B") && others.every((p) => squareColor(p.sq) === squareColor(others[0].sq));
}

/** 이 수가 프로모션(폰이 끝 줄에 닿음)인지 */
export function isPromotionMove(board, m) {
  const piece = board.squares[m.from];
  return typeOf(piece) === "P" && (rowOf(m.to) === 0 || rowOf(m.to) === 7);
}

/** 지금 둘 쪽: 0 백(먼저), 1 흑 */
export const turnOf = (state) => (state.turn === "w" ? 0 : 1);

const END_TEXT = {
  checkmate: "체크메이트",
  stalemate: "스테일메이트(둘 수가 없어 무승부)",
  insufficient: "체크메이트할 말이 부족해 무승부",
  repetition: "같은 배치가 세 번 나와 무승부",
  fiftyMoves: "50수 동안 잡거나 폰을 움직이지 않아 무승부",
};

/**
 * 수 두기: { state, end } — end는 { winner: 0|1|null, reason } · 둘 수 없는 수면 null
 */
export function play(board, m) {
  if (!m || !Number.isInteger(m.from) || !Number.isInteger(m.to)) return null;
  const legal = legalMovesFrom(board, m.from).find((x) => x.to === m.to);
  if (!legal) return null;
  if (legal.promotion && m.promotion && !PROMOTION_PIECES.includes(m.promotion)) return null;
  const mover = turnOf(board);
  const next = move(board, { ...legal, promotion: legal.promotion ? (m.promotion ?? "Q") : undefined });
  if (!hasAnyLegalMove(next)) {
    return inCheck(next, next.turn)
      ? { state: next, end: { winner: mover, reason: END_TEXT.checkmate } }
      : { state: next, end: { winner: null, reason: END_TEXT.stalemate } };
  }
  if (isInsufficientMaterial(next.squares)) return { state: next, end: { winner: null, reason: END_TEXT.insufficient } };
  const key = next.history[next.history.length - 1];
  if (next.history.filter((k) => k === key).length >= 3) return { state: next, end: { winner: null, reason: END_TEXT.repetition } };
  if (next.halfmove >= 100) return { state: next, end: { winner: null, reason: END_TEXT.fiftyMoves } };
  return { state: next, end: null };
}
