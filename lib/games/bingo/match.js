// 여러 판에 걸친 경기 진행: 차례, 숫자 부르기, 판 승리, 승수, 최종 우승.
// 방장 폰만 이 상태를 바꾸고, 바뀐 결과를 모두에게 알린다.
import { countLines } from "./bingo.js";
function zeroFor(players) {
  return Object.fromEntries(players.map((p) => [p, 0]));
}
function roundFor(players, first, opening) {
  const start = Math.max(0, players.indexOf(first));
  const order = [...players.slice(start), ...players.slice(0, start)];
  return { order, turn: order[0], called: [], lines: zeroFor(order), winners: [], opening };
}
/** 새 경기를 만들고 첫 판을 시작한다. opener는 룰렛으로 뽑힌 선공 (없으면 룰렛 없이 맨 앞 사람부터) */
export function startMatch(settings, players, opener) {
  return {
    settings,
    players,
    roundNumber: 1,
    wins: zeroFor(players),
    champions: [],
    round: roundFor(players, opener ?? players[0], opener !== undefined),
  };
}
export function isRoundOver(match) {
  return match.round.winners.length > 0;
}
export function isMatchOver(match) {
  return match.champions.length > 0;
}
/** 이번 판이 끝났고 우승자가 아직 없을 때, 다음 판을 시작한다 */
export function nextRound(match) {
  if (!isRoundOver(match) || isMatchOver(match)) return null;
  const roundNumber = match.roundNumber + 1;
  // 다음 판은 지난 판에 이긴 사람부터
  return { ...match, roundNumber, round: roundFor(match.players, match.round.winners[0], false) };
}
/** 같은 사람들로 승수를 0으로 돌리고 처음부터 다시 시작한다 */
export function restartMatch(match, opener) {
  return startMatch(match.settings, match.players, opener);
}
/** 경기 도중 나간 사람을 뺀다. 그 사람 차례였으면 다음 사람에게 넘긴다 */
export function removePlayer(match, playerId) {
  if (!match.players.includes(playerId)) return match;
  const { round } = match;
  const order = round.order.filter((p) => p !== playerId);
  let turn = round.turn;
  if (turn === playerId && order.length > 0) {
    const index = round.order.indexOf(playerId);
    turn = round.order[(index + 1) % round.order.length];
  }
  const without = (record) => Object.fromEntries(Object.entries(record).filter(([p]) => p !== playerId));
  return {
    ...match,
    players: match.players.filter((p) => p !== playerId),
    wins: without(match.wins),
    champions: match.champions.filter((p) => p !== playerId),
    round: {
      ...round,
      order,
      turn,
      lines: without(round.lines),
      winners: round.winners.filter((p) => p !== playerId),
    },
  };
}
/**
 * 숫자 부르기. 규칙에 맞지 않으면 null (무시).
 * - 판이 끝났거나, 자기 차례가 아니거나, 이미 불렸거나, 내 판에 없는 숫자면 무시
 */
export function pickNumber(match, boards, playerId, number) {
  const { round, settings } = match;
  if (isRoundOver(match) || isMatchOver(match)) return null;
  if (round.turn !== playerId) return null;
  if (round.called.includes(number)) return null;
  if (!boards[playerId]?.includes(number)) return null;
  const called = [...round.called, number];
  const lines = Object.fromEntries(round.order.map((p) => [p, countLines(boards[p], called)]));
  const winners = round.order.filter((p) => lines[p] >= settings.lineTarget);
  if (winners.length === 0) {
    const next = round.order[(round.order.indexOf(playerId) + 1) % round.order.length];
    return { ...match, round: { ...round, called, lines, turn: next, opening: false } };
  }
  const wins = { ...match.wins };
  winners.forEach((p) => (wins[p] += 1));
  const champions = match.players.filter((p) => wins[p] >= settings.winsToChampion);
  return { ...match, wins, champions, round: { ...round, called, lines, winners, opening: false } };
}
