import { activeOf, hasFive, isResting, onlyBotsPlaying, topsOf } from "./match.js";
/** 빠르기별 반응 시간(ms) 범위와 놓칠 확률 */
export const BOT_REACT = {
  slow: { min: 1_600, max: 2_600, miss: 0.15 },
  normal: { min: 1_000, max: 1_800, miss: 0.1 },
  fast: { min: 700, max: 1_200, miss: 0.05 },
};
/** 자기 차례에 펼치기까지 (빠르기별). 느린 컴퓨터도 5개를 볼 틈이 있게, 반응이 느리면 펼치기도 느리다 */
export const BOT_FLIP_MS = {
  slow: { min: 1_500, max: 2_700 },
  normal: { min: 1_100, max: 2_000 },
  fast: { min: 800, max: 1_500 },
};
/** 차례 시간이 끝나기 이만큼 전에는 펼친다 */
const FLIP_MARGIN_MS = 400;
/** 글자로 정하는 0~1 사이 수 (같은 글자면 늘 같다) */
export function unitOf(key) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}
const between = (range, unit) => Math.round(range.min + (range.max - range.min) * unit);
/** 이 판(번호)에서 이 컴퓨터의 반응: 놓치면 null */
export function reactionOf(match, botId) {
  const speed = BOT_REACT[match.settings.botSpeed] ?? BOT_REACT.normal;
  const key = `${match.roundNumber}-${match.round.seq}-${botId}`;
  if (unitOf(`miss-${key}`) < speed.miss) return null;
  return between(speed, unitOf(`react-${key}`));
}
function act(match, botId, _random, now = Date.now()) {
  const { round } = match;
  if (round.over || isResting(match, now) || !activeOf(round).includes(botId)) return null;
  const waited = now - round.seqAt;
  // 5개가 보이면 반응 시간이 지난 뒤 누른다
  if (round.seq > round.resolvedSeq && hasFive(topsOf(round)) && !round.bell?.presses.some((p) => p.id === botId)) {
    const reactMs = reactionOf(match, botId);
    if (reactMs !== null && waited >= reactMs) return { type: "press", seq: round.seq, reactMs };
  }
  // 자기 차례면 조금 뒤 펼친다
  if (round.turn === botId && !round.bell) {
    const turnStart = round.turnEndsAt - match.settings.turnSeconds * 1000;
    const range = BOT_FLIP_MS[match.settings.botSpeed] ?? BOT_FLIP_MS.normal;
    const flipAfter = Math.min(
      between(range, unitOf(`flip-${match.roundNumber}-${round.seq}-${botId}`)),
      match.settings.turnSeconds * 1000 - FLIP_MARGIN_MS,
    );
    if (now - turnStart >= flipAfter) return { type: "flip" };
  }
  return null;
}
export const dingDongBot = {
  act,
  // 반응 시간은 act가 시각을 보고 직접 잰다 (방장은 0.25초마다 물어본다)
  delay: () => 0,
  onlyBots: onlyBotsPlaying,
};
