// 도둑잡기 컴퓨터 참가자. 방장 폰이 컴퓨터 대신 뽑는다.
// 뽑을 카드는 뒷면만 보이니 사람과 같은 조건으로 아무 자리나 고른다.
// 사람처럼 바로 뽑지 않고, 카드를 들어 보고 가끔 다른 카드로 바꿔 든 뒤에 가져간다.
import { SPIN_MS } from "../opening.js";
import { dealMsFor, isOpening, onlyBotsPlaying, pauseAfter, sourceOf } from "./match.js";
/** 뽑기 결과·짝 버리기를 다 보여준 뒤 컴퓨터가 카드를 들기까지 */
export const BOT_TURN_MS = 700;
/** 카드를 든 채 고민하는 시간 */
export const BOT_HOLD_MS = 1_200;
/** 한 차례에 카드를 들어 보는 최대 횟수 */
const MAX_HOVERS = 3;
/** 든 카드를 다른 카드로 바꿔 들 확률 */
const SWITCH_CHANCE = 0.35;
function act(match, botId, random) {
  const { round } = match;
  if (round.over || round.turn !== botId) return null;
  const source = sourceOf(round);
  if (!source) return null;
  const count = round.hands[source].length;
  if (round.hover === null) return { type: "hover", index: Math.floor(random() * count) };
  if (count > 1 && round.hoverMoves < MAX_HOVERS && random() < SWITCH_CHANCE) {
    // 지금 든 카드 말고 다른 자리로
    const other = (round.hover + 1 + Math.floor(random() * (count - 1))) % count;
    return { type: "hover", index: other };
  }
  return { type: "draw", index: round.hover };
}
export const thiefBot = {
  act,
  delay: (match) => {
    const { round } = match;
    if (round.hover !== null) return BOT_HOLD_MS;
    if (round.lastDraw) return pauseAfter(round.lastDraw) + BOT_TURN_MS;
    // 판 시작: (첫 판 룰렛) + 짝 버리기를 보여준 뒤
    return (isOpening(match) ? SPIN_MS : 0) + dealMsFor(round.dealtPairs) + BOT_TURN_MS;
  },
  onlyBots: onlyBotsPlaying,
};
