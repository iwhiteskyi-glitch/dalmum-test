// 빙고 컴퓨터 참가자 (실력은 "보통" 하나). 방장 폰이 컴퓨터 대신 판을 내고 숫자를 부른다.
// 반칙하지 않도록 자기 판만 본다 (다른 사람 판은 방장 폰에 있어도 보지 않는다).
import { SPIN_MS } from "../opening.js";
import { createBoard, LINES } from "./bingo.js";
import { isMatchOver, isRoundOver } from "./match.js";
/** 판을 내기까지 / 숫자를 부르기까지 기다리는 시간 (사람이 보고 따라올 수 있게) */
export const BOT_BOARD_MS = 400;
export const BOT_PICK_MS = 1100;
/**
 * 부를 숫자 고르기: 이미 많이 찬 줄을 채우는 숫자일수록 좋다
 * (줄마다 4^찬 칸 수를 더한다 → 줄을 완성하는 숫자를 가장 먼저, 같으면 여러 줄에 걸친 숫자).
 * 점수가 비슷하면 조금 섞어서 매번 똑같이 두지 않는다
 */
export function chooseBingoNumber(board, called, random) {
  const calledSet = new Set(called);
  const marked = board.map((n) => calledSet.has(n));
  let best = null;
  let bestScore = -Infinity;
  board.forEach((number, cell) => {
    if (marked[cell]) return;
    let score = 0;
    for (const line of LINES) {
      if (!line.includes(cell)) continue;
      score += 4 ** line.filter((c) => marked[c]).length;
    }
    score += random() * 0.9;
    if (score > bestScore) {
      bestScore = score;
      best = number;
    }
  });
  return best;
}
export const bingoBot = {
  act: (state, botId, random) => {
    if (state.phase === "dealing") {
      if (state.boards[botId] || !state.players.includes(botId)) return null;
      return { type: "board", dealId: state.dealId, board: createBoard(state.settings.maxNumber, random) };
    }
    const { match } = state;
    if (!match || isRoundOver(match) || isMatchOver(match) || match.round.turn !== botId) return null;
    const number = chooseBingoNumber(state.boards[botId], match.round.called, random);
    return number === null ? null : { type: "pick", number };
  },
  delay: (state) => {
    if (state.phase === "dealing") return BOT_BOARD_MS;
    return state.match?.round.opening ? SPIN_MS + BOT_PICK_MS : BOT_PICK_MS;
  },
};
