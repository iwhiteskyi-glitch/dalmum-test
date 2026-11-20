// 원카드 컴퓨터 참가자 (실력은 "보통" 하나). 방장 폰이 컴퓨터 대신 카드를 낸다 ("원카드!" 버튼은 사람끼리만 쓴다).
// 자기 패와 공개된 것(맨 위 카드, 사람마다 남은 장수)만 보고 정한다.
// 공격 카드와 조커는 아껴 두었다가 누가 곧 끝날 것 같으면 쓰고, 7은 패에 많은 무늬로 바꾼다.
import { SPIN_MS } from "../opening.js";
import { attackOf, canPlay, isJoker, rankOf, SUITS, suitOf } from "./cards.js";
import { isOpening, onlyBotsPlaying, topOf } from "./match.js";
/** 판이 바뀐 뒤 컴퓨터가 움직이기까지 (사람이 카드를 읽을 틈) */
export const BOT_DELAY_MS = 1_500;
/** 패에 가장 많은 무늬 (7로 바꿀 무늬) */
export function bestSuit(hand) {
  let best = SUITS[0];
  let most = -1;
  for (const suit of SUITS) {
    const count = hand.filter((card) => suitOf(card) === suit).length;
    if (count > most) [best, most] = [suit, count];
  }
  return best;
}
/** 낼 카드 점수: 클수록 먼저 낸다. danger는 누가 곧 끝날 것 같을 때 */
function score(card, hand, danger) {
  const sameSuit = hand.filter((c) => suitOf(c) === suitOf(card)).length;
  if (attackOf(card) > 0) return danger ? 30 + attackOf(card) : isJoker(card) ? -20 : -10 + sameSuit;
  const rank = rankOf(card);
  if (rank === "K") return 20; // 한 번 더 내므로 먼저 쓴다
  if (rank === "7") return -5 + sameSuit; // 무늬를 바꿀 수 있으니 아껴 둔다
  return (danger && rank === "J" ? 25 : 0) + sameSuit;
}
/** 공격을 받고 있으면 가장 약한 카드로 넘기고, 아니면 점수가 가장 높은 카드 */
export function chooseCard(hand, options, attacked, danger) {
  if (attacked) return [...options].sort((a, b) => attackOf(a) - attackOf(b))[0];
  return [...options].sort((a, b) => score(b, hand, danger) - score(a, hand, danger))[0];
}
function act(match, botId) {
  const { round } = match;
  if (round.winner !== null || round.turn !== botId) return null;
  const hand = round.hands[botId];
  const options = hand.filter((card) => canPlay(card, topOf(round), round.suit, round.attack));
  if (options.length === 0) return { type: "draw" };
  const danger = round.order.some((id) => id !== botId && round.hands[id].length <= 2);
  const card = chooseCard(hand, options, round.attack > 0, danger);
  const rest = hand.filter((c) => c !== card);
  return { type: "play", card, suit: rankOf(card) === "7" && rest.length > 0 ? bestSuit(rest) : null };
}
export const oneCardBot = {
  act,
  delay: (match) => (isOpening(match) ? SPIN_MS + BOT_DELAY_MS : BOT_DELAY_MS),
  onlyBots: onlyBotsPlaying,
};
