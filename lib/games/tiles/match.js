// 숫자 타일 경기 진행: 나눠 주기, 차례, 판 고치기(draft), 차례 마치기, 타일 가져가기, 판 끝(손 비움·막힘), 승수.
// 방장 폰만 이 상태를 바꾸고, 손패와 더미를 뺀 공개 상태(PublicMatch)를 모두에게 알린다.
import { SPIN_MS } from "../opening.js";
import { allTiles, draftProblem, flatten, HAND_SIZE, handValue, isPossibleDraft, laidTiles, shuffle } from "./tiles.js";
export const WINS_OPTIONS = [1, 2, 3];
/** 차례 시간(초). 0이면 제한 없음 */
export const TURN_SECONDS = [60, 120, 0];
export const DEFAULT_TILES_SETTINGS = { winsToChampion: 1, meld30: true, turnSeconds: 120 };
export function isValidTilesSettings(value) {
  const v = value;
  return (
    typeof v === "object" &&
    v !== null &&
    WINS_OPTIONS.includes(v.winsToChampion) &&
    typeof v.meld30 === "boolean" &&
    TURN_SECONDS.includes(v.turnSeconds)
  );
}
export function toPublic(match) {
  const { hands, pool, ...rest } = match.round;
  const handCounts = Object.fromEntries(Object.entries(hands).map(([id, hand]) => [id, hand.length]));
  return { ...match, round: { ...rest, handCounts, poolCount: pool.length } };
}
const zeroFor = (players) => Object.fromEntries(players.map((p) => [p, 0]));
const endsAt = (settings, now) => (settings.turnSeconds > 0 ? now + settings.turnSeconds * 1000 : null);
function roundFor(settings, players, first, opening, now, random) {
  const start = Math.max(0, players.indexOf(first));
  const order = [...players.slice(start), ...players.slice(0, start)];
  const pool = shuffle(allTiles(), random);
  const hands = {};
  for (const id of order) hands[id] = pool.splice(0, HAND_SIZE);
  const round = {
    order,
    turn: order[0],
    board: [],
    draft: [],
    hands,
    pool,
    melded: [],
    turnEndsAt: endsAt(settings, opening ? now + SPIN_MS : now),
    passes: 0,
    winners: [],
    opening,
    finalHands: null,
  };
  return round;
}
/** opener는 룰렛으로 뽑힌 선공 (없으면 룰렛 없이 맨 앞 사람부터) */
export function startMatch(settings, players, now, random, opener) {
  return {
    settings,
    players,
    roundNumber: 1,
    wins: zeroFor(players),
    champions: [],
    round: roundFor(settings, players, opener ?? players[0], opener !== undefined, now, random),
  };
}
export const isRoundOver = (match) => match.round.winners.length > 0;
export const isMatchOver = (match) => match.champions.length > 0;
export function nextRound(match, now, random) {
  if (!isRoundOver(match) || isMatchOver(match)) return null;
  const roundNumber = match.roundNumber + 1;
  // 다음 판은 지난 판에 이긴 사람부터
  const first = match.round.winners[0];
  return { ...match, roundNumber, round: roundFor(match.settings, match.players, first, false, now, random) };
}
export function restartMatch(match, now, random, opener) {
  return startMatch(match.settings, match.players, now, random, opener);
}
const myTurn = (match, playerId) => !isRoundOver(match) && !isMatchOver(match) && match.round.turn === playerId;
/** 지금 차례인 사람이 판을 고친다 (고치는 중에는 규칙에 안 맞아도 된다). 모양이 안 되면 null */
export function editDraft(match, playerId, draft) {
  if (!myTurn(match, playerId)) return null;
  const { round } = match;
  if (!isPossibleDraft(round.board, draft, round.hands[playerId])) return null;
  return { ...match, round: { ...round, draft } };
}
function nextTurn(match, now) {
  const { round } = match;
  const turn = round.order[(round.order.indexOf(round.turn) + 1) % round.order.length];
  return {
    ...match,
    round: { ...round, turn, draft: round.board, turnEndsAt: endsAt(match.settings, now), opening: false },
  };
}
/** 판이 끝남: 승자와 승수, 우승 */
function endRound(match, winners) {
  const wins = { ...match.wins };
  winners.forEach((p) => (wins[p] += 1));
  const champions = match.players.filter((p) => wins[p] >= match.settings.winsToChampion);
  const { round } = match;
  return {
    ...match,
    wins,
    champions,
    round: { ...round, draft: round.board, turnEndsAt: null, winners, finalHands: { ...round.hands } },
  };
}
/** 차례 마치기: 고친 판을 확정한다. 규칙에 안 맞으면 null */
export function finishTurn(match, playerId, now) {
  if (!myTurn(match, playerId)) return null;
  const { round, settings } = match;
  const melded = round.melded.includes(playerId);
  if (draftProblem(round.board, round.draft, melded, settings.meld30) !== null) return null;
  const laid = new Set(laidTiles(round.board, round.draft));
  const hand = round.hands[playerId].filter((t) => !laid.has(t));
  const next = {
    ...match,
    round: {
      ...round,
      board: round.draft,
      hands: { ...round.hands, [playerId]: hand },
      melded: melded ? round.melded : [...round.melded, playerId],
      passes: 0,
    },
  };
  if (hand.length === 0) return endRound(next, [playerId]);
  return nextTurn(next, now);
}
/** 막혀서 끝남: 남은 값이 가장 적은 사람(들)이 이긴다 */
function stalemate(match) {
  const { round } = match;
  const values = round.order.map((id) => handValue(round.hands[id]));
  const min = Math.min(...values);
  return endRound(
    match,
    round.order.filter((_, i) => values[i] === min),
  );
}
/**
 * 타일 하나 가져가고 차례를 넘긴다 (고치던 판은 되돌린다).
 * 더미가 비어 있으면 그냥 넘기고, 모두가 한 바퀴 연달아 넘기면 판이 막힌 것으로 끝난다
 */
export function drawTile(match, playerId, now) {
  if (!myTurn(match, playerId)) return null;
  const { round } = match;
  if (round.pool.length === 0) {
    const passes = round.passes + 1;
    const next = { ...match, round: { ...round, draft: round.board, passes } };
    return passes >= round.order.length ? stalemate(next) : nextTurn(next, now);
  }
  const pool = [...round.pool];
  const tile = pool.pop();
  const hands = { ...round.hands, [playerId]: [...round.hands[playerId], tile] };
  return nextTurn({ ...match, round: { ...round, draft: round.board, hands, pool, passes: 0 } }, now);
}
/** 시간이 다 됐으면 가져가기로 처리. 아니면 null */
export function timeout(match, now) {
  const { round } = match;
  if (round.turnEndsAt === null || now < round.turnEndsAt || isRoundOver(match)) return null;
  return drawTile(match, round.turn, now);
}
/** 경기 도중 나간 사람을 뺀다. 손패는 더미 밑에 넣고, 그 사람 차례였으면 다음 사람에게 */
export function removePlayer(match, playerId, now) {
  if (!match.players.includes(playerId)) return match;
  const { round } = match;
  const without = (record) => Object.fromEntries(Object.entries(record).filter(([p]) => p !== playerId));
  const order = round.order.filter((p) => p !== playerId);
  const hands = without(round.hands);
  const pool = [...(round.hands[playerId] ?? []), ...round.pool];
  let next = {
    ...match,
    players: match.players.filter((p) => p !== playerId),
    wins: without(match.wins),
    champions: match.champions.filter((p) => p !== playerId),
    round: {
      ...round,
      order,
      hands,
      pool,
      melded: round.melded.filter((p) => p !== playerId),
      winners: round.winners.filter((p) => p !== playerId),
      finalHands: round.finalHands ? without(round.finalHands) : null,
    },
  };
  if (round.turn === playerId && order.length > 0 && !isRoundOver(match)) {
    // 나간 사람의 다음 사람 차례로 (원래 순서에서 찾는다)
    const index = round.order.indexOf(playerId);
    const turn = round.order[(index + 1) % round.order.length];
    next = { ...next, round: { ...next.round, turn: turn === playerId ? order[0] : turn } };
    next = { ...next, round: { ...next.round, draft: next.round.board, turnEndsAt: endsAt(match.settings, now) } };
  }
  return next;
}
/** 지금 차례인 사람이 고치는 중인 판에서 손에 남은 타일 수 (화면용) */
export const liveHandCount = (round, playerId) =>
  round.handCounts[playerId] - (round.turn === playerId ? laidTiles(round.board, round.draft).length : 0);
export { flatten };
