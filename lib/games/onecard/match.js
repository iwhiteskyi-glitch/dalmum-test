// 원카드 경기 진행: 나눠 주기, 카드 내기·먹기, 특수 카드, "원카드!" 외치기, 파산, 승수.
// 방장 폰만 이 상태를 바꾸고, 손패와 더미를 뺀 공개 상태(PublicMatch)를 모두에게 알린다.
//
// "원카드!" 외치기: 패가 2장인 사람의 차례가 되면 버튼이 뜬다(chance). 이때 남이 누르면 이번 기회엔 잠긴다.
// 그 사람이 카드를 내서 1장이 되면(call) 3초 안에 먼저 누른 쪽이 이긴다. 본인이면 안전, 남이면 본인이 1장 먹는다.
// 버튼은 사람끼리만 쓴다: 컴퓨터는 사람과 속도를 맞출 수 없어서, 컴퓨터가 1장이 될 때나 판에 사람이 혼자면 뜨지 않는다.
import { pickOpener, SPIN_MS } from "../opening.js";
import { attackOf, BUST_SIZE, canPlay, HAND_SIZE, allCards, isJoker, rankOf, shuffle, suitOf } from "./cards.js";
export const WINS_OPTIONS = [1, 2, 3];
/** 차례 시간(초) */
export const TURN_SECONDS = [15, 30];
/** 1장이 된 뒤 외칠 수 있는 시간 */
export const CALL_MS = 3000;
/** 낸 카드 더미에 보여줄 장수 */
export const RECENT_SIZE = 6;
export const DEFAULT_ONECARD_SETTINGS = { winsToChampion: 2, turnSeconds: 15 };
export function isValidOneCardSettings(value) {
  const v = value;
  return (
    typeof v === "object" &&
    v !== null &&
    WINS_OPTIONS.includes(v.winsToChampion) &&
    TURN_SECONDS.includes(v.turnSeconds)
  );
}
export const topOf = (round) => round.discard[round.discard.length - 1];
export function toPublic(match) {
  const { hands, pool, discard, ...rest } = match.round;
  const handCounts = Object.fromEntries(Object.entries(hands).map(([id, hand]) => [id, hand.length]));
  return { ...match, round: { ...rest, handCounts, poolCount: pool.length, top: topOf(match.round) } };
}
export const isRoundOver = (match) => match.round.winner !== null;
/** 아직 아무도 움직이지 않은 첫 판 (룰렛을 돌리는 판) */
export const isOpening = (match) =>
  match.roundNumber === 1 && match.round.recent.length === 1 && match.round.lastDraw === null;
export const isMatchOver = (match) => match.champions.length > 0;
const isBotId = (id) => id.startsWith("bot-");
/** 이 사람에게 "원카드!" 버튼이 뜨는지: 사람이고, 겨룰 다른 사람이 판에 있을 때 */
const hasButton = (round, id) => !isBotId(id) && round.order.filter((p) => !isBotId(p)).length >= 2;
const isSpecial = (card) => attackOf(card) > 0 || isJoker(card) || ["7", "J", "Q", "K"].includes(rankOf(card));
/** 패가 2장이면 버튼을 띄운다 (같은 사람이 이어서 내면 잠긴 사람도 이어진다) */
function withChance(round) {
  const { turn, chance } = round;
  if (round.hands[turn].length !== 2 || !hasButton(round, turn)) return { ...round, chance: null };
  return { ...round, chance: chance?.target === turn ? chance : { target: turn, locked: [] } };
}
function setTurn(match, turn, now) {
  const round = withChance({ ...match.round, turn, turnEndsAt: now + match.settings.turnSeconds * 1000 });
  return { ...match, round };
}
/** id에서 지금 방향으로 steps칸 간 사람 */
function moved(round, id, steps) {
  const n = round.order.length;
  const index = round.order.indexOf(id);
  return round.order[(((index + steps * round.direction) % n) + n) % n];
}
function roundFor(settings, players, starter, now, random, waitMs = 0) {
  const start = Math.max(0, players.indexOf(starter));
  const order = [...players.slice(start), ...players.slice(0, start)];
  const pool = shuffle(allCards(), random);
  const hands = {};
  for (const id of order) hands[id] = pool.splice(0, HAND_SIZE);
  // 처음 뒤집는 카드는 특수 카드가 아닌 것으로
  const first = pool.splice(
    pool.findIndex((card) => !isSpecial(card)),
    1,
  )[0];
  const round = {
    order,
    turn: order[0],
    direction: 1,
    hands,
    pool,
    discard: [first],
    suit: suitOf(first),
    attack: 0,
    attackCards: [],
    recent: [{ seq: 0, card: first, by: null }],
    streak: null,
    lastDraw: null,
    turnEndsAt: now + waitMs + settings.turnSeconds * 1000,
    busted: [],
    chance: null,
    call: null,
    winner: null,
    finalHands: null,
    event: null,
    eventSeq: 0,
  };
  return round;
}
export function startMatch(settings, players, now, random) {
  return {
    settings,
    players,
    roundNumber: 1,
    wins: Object.fromEntries(players.map((p) => [p, 0])),
    champions: [],
    // 첫 판 선공은 무작위로 정하고, 화면에서 룰렛이 멈출 때까지 시작을 미룬다
    round: roundFor(settings, players, pickOpener(players, random), now, random, SPIN_MS),
  };
}
export function nextRound(match, now, random) {
  if (!isRoundOver(match) || isMatchOver(match)) return null;
  const roundNumber = match.roundNumber + 1;
  // 다음 판은 지난 판에 이긴 사람부터
  const starter = match.round.winner ?? match.players[0];
  return { ...match, roundNumber, round: roundFor(match.settings, match.players, starter, now, random) };
}
export const restartMatch = (match, now, random) => startMatch(match.settings, match.players, now, random);
const myTurn = (match, id) => !isRoundOver(match) && match.round.turn === id;
const withEvent = (round, event) => ({
  ...round,
  event,
  eventSeq: round.eventSeq + 1,
});
/** 사람이 모두 파산하고 컴퓨터끼리 판이 이어지는 중인지 */
export const onlyBotsPlaying = (match, isBot) => !isRoundOver(match) && match.round.order.every(isBot);
function endRound(match, winner) {
  const wins = { ...match.wins, [winner]: (match.wins[winner] ?? 0) + 1 };
  const champions = match.players.filter((p) => wins[p] >= match.settings.winsToChampion);
  const round = { ...match.round, winner, chance: null, call: null, finalHands: { ...match.round.hands } };
  return { ...match, wins, champions, round };
}
/** 지금 카드가 가장 적은 사람이 이긴 것으로 판을 끝낸다 (같으면 차례 순서가 빠른 쪽) */
export function endByFewestCards(match) {
  const { order, hands } = match.round;
  return endRound(
    match,
    order.reduce((best, id) => (hands[id].length < hands[best].length ? id : best)),
  );
}
/** 카드 내기. 7이면 suit로 바꿀 무늬를 함께 보낸다 (마지막 카드면 없어도 된다). 낼 수 없으면 null */
export function playCard(match, from, card, suit, now) {
  if (!myTurn(match, from)) return null;
  const { round } = match;
  const hand = round.hands[from];
  if (!hand.includes(card) || !canPlay(card, topOf(round), round.suit, round.attack)) return null;
  const rank = rankOf(card);
  const rest = hand.filter((c) => c !== card);
  if (rank === "7" && rest.length > 0 && !suit) return null;
  let nextSuit = suitOf(card);
  if (isJoker(card)) nextSuit = null;
  else if (rank === "7" && suit) nextSuit = suit;
  const direction = rank === "Q" ? -round.direction : round.direction;
  const seq = round.recent[round.recent.length - 1].seq + 1;
  const played = {
    ...round,
    hands: { ...round.hands, [from]: rest },
    discard: [...round.discard, card],
    suit: nextSuit,
    attack: round.attack + attackOf(card),
    attackCards: attackOf(card) > 0 ? [...round.attackCards, card] : round.attackCards,
    recent: [...round.recent, { seq, card, by: from }].slice(-RECENT_SIZE),
    streak: { id: from, count: round.streak?.id === from ? round.streak.count + 1 : 1 },
    direction,
    // 1장이 됐으면 외치기 시작. 버튼이 뜬 동안 미리 눌러 잠긴 사람은 계속 잠겨 있다
    call:
      rest.length === 1 && hasButton(round, from)
        ? { target: from, until: now + CALL_MS, locked: round.chance?.target === from ? round.chance.locked : [] }
        : round.call,
    chance: null,
  };
  const next = { ...match, round: played };
  if (rest.length === 0) return endRound(next, from);
  const two = played.order.length === 2;
  let steps = 1;
  if (rank === "K" || (rank === "Q" && two)) steps = 0;
  else if (rank === "J") steps = 2; // 두 명이면 두 칸 = 나에게 돌아온다
  return setTurn(next, moved(played, from, steps), now);
}
/** 카드를 받은 일을 적어 둔다 (화면이 더미에서 그 사람에게 날아가는 효과를 넣는다) */
const withDraw = (round, id, count) => ({
  ...round,
  lastDraw: { seq: (round.lastDraw?.seq ?? 0) + 1, id, count },
});
/** 더미에서 count장 준다. 더미가 비면 낸 카드(맨 위 빼고)를 섞어 쓰고, 그래도 없으면 있는 만큼만 */
function give(round, id, count, random) {
  let pool = [...round.pool];
  let discard = round.discard;
  const hand = [...round.hands[id]];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) {
      if (discard.length <= 1) break;
      pool = shuffle(discard.slice(0, -1), random);
      discard = discard.slice(-1);
    }
    hand.push(pool.pop());
  }
  return { ...round, pool, discard, hands: { ...round.hands, [id]: hand } };
}
/** 파산: 카드는 낸 카드 밑으로 돌아가고 판에서 빠진다. 혼자 남으면 그 사람이 이긴다 */
function bust(match, id, now) {
  const { round } = match;
  const turn = moved(round, id, 1);
  const out = withEvent(
    {
      ...round,
      order: round.order.filter((p) => p !== id),
      busted: [...round.busted, id],
      hands: { ...round.hands, [id]: [] },
      discard: [...round.hands[id], ...round.discard],
      call: round.call?.target === id ? null : round.call,
    },
    { kind: "bust", id },
  );
  const next = { ...match, round: out };
  return out.order.length === 1 ? endRound(next, out.order[0]) : setTurn(next, turn, now);
}
/** 못 내거나 안 낼 때: 쌓인 공격이 있으면 그만큼, 없으면 1장 먹고 차례를 넘긴다 */
export function drawCards(match, from, now, random) {
  if (!myTurn(match, from)) return null;
  const { round } = match;
  const count = round.attack || 1;
  const given = give({ ...round, attack: 0, attackCards: [], streak: null, chance: null }, from, count, random);
  const ate = given.hands[from].length - round.hands[from].length;
  const counted = withDraw(given, from, ate);
  const eaten = {
    ...match,
    round: round.attack > 0 ? withEvent(counted, { kind: "ate", id: from, count: ate }) : counted,
  };
  if (eaten.round.hands[from].length >= BUST_SIZE) return bust(eaten, from, now);
  return setTurn(eaten, moved(eaten.round, from, 1), now);
}
/**
 * "원카드!" 버튼. target은 누른 사람 화면의 대상, seen은 그 화면에서 이미 1장이 된 걸 봤는지.
 * 늦게 도착한 누르기가 다른 사람의 기회를 망치지 않게, 대상이 다르면 무시한다
 */
export function callOneCard(match, from, target, seen, random) {
  const { round } = match;
  if (isRoundOver(match) || !round.order.includes(from)) return null;
  const { call, chance } = round;
  const lock = (locked) => [...locked, from];
  if (call?.target === target) {
    if (from === target) return { ...match, round: withEvent({ ...round, call: null }, { kind: "safe", id: from }) };
    if (call.locked.includes(from)) return null;
    if (!seen) return { ...match, round: { ...round, call: { ...call, locked: lock(call.locked) } } };
    const given = withDraw(give({ ...round, call: null }, target, 1, random), target, 1);
    return { ...match, round: withChance(withEvent(given, { kind: "caught", id: target, by: from })) };
  }
  if (chance?.target === target && from !== target && !chance.locked.includes(from)) {
    return { ...match, round: { ...round, chance: { ...chance, locked: lock(chance.locked) } } };
  }
  return null;
}
/** 시간이 흐름: 외치는 시간이 끝나면 벌칙 없이 넘어가고, 차례 시간이 끝나면 자동으로 먹는다. 바뀐 게 없으면 null */
export function advanceTime(match, now, random) {
  if (isRoundOver(match)) return null;
  const { round } = match;
  const expired = round.call !== null && now >= round.call.until;
  const next = expired ? { ...match, round: { ...round, call: null } } : match;
  if (match.settings.turnSeconds > 0 && now >= round.turnEndsAt) return drawCards(next, round.turn, now, random);
  return expired ? next : null;
}
/** 경기 도중 나간 사람을 뺀다. 카드는 낸 카드 밑으로 돌아가고, 그 사람 차례였으면 다음 사람에게 */
export function removePlayer(match, id, now) {
  if (!match.players.includes(id)) return match;
  const { round } = match;
  const without = (record) => Object.fromEntries(Object.entries(record).filter(([p]) => p !== id));
  const inRound = round.order.includes(id);
  const nextTurn = inRound && round.turn === id && round.order.length > 1 ? moved(round, id, 1) : round.turn;
  const next = {
    ...match,
    players: match.players.filter((p) => p !== id),
    wins: without(match.wins),
    champions: match.champions.filter((p) => p !== id),
    round: {
      ...round,
      order: round.order.filter((p) => p !== id),
      hands: without(round.hands),
      discard: [...(round.hands[id] ?? []), ...round.discard],
      busted: round.busted.filter((p) => p !== id),
      call: round.call?.target === id ? null : round.call,
      chance: round.chance?.target === id ? null : round.chance,
      finalHands: round.finalHands ? without(round.finalHands) : null,
    },
  };
  if (isRoundOver(match)) return next;
  if (next.round.order.length === 1) return endRound(next, next.round.order[0]);
  return round.turn === id ? setTurn(next, nextTurn, now) : next;
}
