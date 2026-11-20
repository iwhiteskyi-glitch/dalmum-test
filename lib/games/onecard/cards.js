// 원카드 카드 규칙: 카드 표기, 낼 수 있는지, 공격 세기.
// 카드는 짧은 글자로 주고받는다 ('S7' = 스페이드 7, 'H10', 'DA', 'CK', 조커는 'XB' 흑백 / 'XC' 컬러)
export const SUITS = ["S", "H", "D", "C"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const BLACK_JOKER = "XB";
export const COLOR_JOKER = "XC";
export const HAND_SIZE = 7;
/** 패가 이만큼 되면 파산 */
export const BUST_SIZE = 20;
export const allCards = () => [
  ...SUITS.flatMap((suit) => RANKS.map((rank) => `${suit}${rank}`)),
  BLACK_JOKER,
  COLOR_JOKER,
];
const ALL = new Set(allCards());
export const isCard = (value) => typeof value === "string" && ALL.has(value);
export const isSuit = (value) => SUITS.includes(value);
export const isJoker = (card) => card === BLACK_JOKER || card === COLOR_JOKER;
export const suitOf = (card) => card[0];
export const rankOf = (card) => card.slice(1);
/** 공격 카드면 먹일 장수, 아니면 0 (세기 순서도 된다: 2 < A < 흑백 조커 < 컬러 조커) */
export function attackOf(card) {
  if (card === COLOR_JOKER) return 7;
  if (card === BLACK_JOKER) return 5;
  const rank = rankOf(card);
  if (rank === "A") return 3;
  return rank === "2" ? 2 : 0;
}
/**
 * 이 카드를 낼 수 있는지. suit는 지금 내야 할 무늬 (조커 다음이면 null = 아무 카드나), attack은 쌓인 공격 장수.
 * 공격을 받는 중이면 같거나 더 센 공격 카드만 (2 위의 A는 같은 무늬만), 아니면 무늬나 숫자가 같은 카드. 조커는 언제든 낼 수 있다
 */
export function canPlay(card, top, suit, attack) {
  if (attack > 0) {
    const strongEnough = attackOf(card) > 0 && attackOf(card) >= attackOf(top);
    const aceOnTwo = rankOf(card) === "A" && rankOf(top) === "2";
    return strongEnough && (!aceOnTwo || suitOf(card) === suitOf(top));
  }
  if (isJoker(card) || suit === null) return true;
  return suitOf(card) === suit || rankOf(card) === rankOf(top);
}
/** 내 패를 보여줄 순서: 무늬별로 A·2…K, 조커는 맨 뒤 */
export function sortHand(hand) {
  const order = (card) =>
    isJoker(card) ? 100 + attackOf(card) : SUITS.indexOf(suitOf(card)) * 20 + RANKS.indexOf(rankOf(card));
  return [...hand].sort((a, b) => order(a) - order(b));
}
export function shuffle(items, random) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
