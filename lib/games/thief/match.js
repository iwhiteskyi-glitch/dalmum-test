// 도둑잡기 경기 진행: 카드 나눠 주기, 짝 버리기, 옆 사람 카드 뽑기, 탈출, 도둑(조커) 정하기, 벌점.
// 모두 같은 점수(3·5점)로 시작해서 도둑이 될 때마다 1점을 잃고, 0점이 되는 사람이 꼴찌 (그 순간 경기 끝).
// 카드는 원카드와 같은 글자를 쓴다 ('S7', 'HA', 조커 'XC'). 조커 한 장이 도둑이고, 같은 숫자 두 장이 짝이다.
// 방장 폰만 이 상태를 바꾸고, 손패를 뺀 공개 상태(PublicMatch)를 모두에게 알린다. 손패는 그 사람에게만 보낸다.
//
// 진행: 다 나눠 주고 짝은 저절로 버린다 → 차례인 사람은 다음 사람(아직 카드가 있는 사람) 패에서 한 장을 뽑는다
// → 짝이 맞으면 바로 버린다 → 손이 빈 사람은 탈출 → 조커를 든 한 사람만 남으면 그 사람이 도둑(1점 잃음).
// 차례는 뽑힌 사람에게 넘어간다. 뽑을 카드는 자리 번호로 고르고, 뽑을 때마다 두 사람의 패를 섞어 자리로는 알 수 없게 한다.
// 뽑기 전에 카드를 "들어 볼" 수 있다 (hover). 들린 카드는 모두에게 보여서, 뽑히는 사람은 조커가 들리면 두근거린다.
import { pickOpener, SPIN_MS } from "../opening.js";
import { COLOR_JOKER, isJoker, RANKS, rankOf, shuffle, SUITS } from "../onecard/cards.js";
/** 시작 점수 */
export const LIVES_OPTIONS = [3, 5];
/** 차례 시간(초) */
export const TURN_SECONDS = [15, 30];
/**
 * 뽑은 뒤 다음 차례가 시작되기까지 쉬는 시간: 모두가 뽑기 결과(뒤집기·짝)를 다 본 다음에 다음 사람이 움직이게.
 * 다음 차례의 끝 시각에 더해 두므로, 화면은 "남은 시간 - 차례 시간"으로 쉬는 중인지 안다 (첫 판 룰렛과 같은 방법)
 */
export const PAUSE_PAIR_MS = 2_200;
export const PAUSE_DRAW_MS = 1_600;
export const pauseAfter = (draw) => (!draw ? 0 : draw.pair ? PAUSE_PAIR_MS : PAUSE_DRAW_MS);
// ── 판 시작: 받은 카드 전부를 보여주고 짝을 한 쌍씩 날려 보낸다. 이게 끝나야 첫 차례가 시작된다 ──
// 방장(차례 시작 시각)과 화면(날리는 박자)이 같은 계산을 쓴다. 모든 사람 칸이 같은 박자로 줄어든다.
/** 받은 카드 전부를 보여주는 시간 */
export const DEAL_SHOW_MS = 1_000;
/** 마지막 짝이 날아가기 시작한 뒤 첫 차례까지 */
const DEAL_END_MS = 1_000;
/** 짝 하나씩 날아가는 간격 (짝이 아주 많으면 조금 빨리) */
const DEAL_STEP_MS = 450;
const DEAL_FLY_MAX_MS = 4_500;
export const dealStepMs = (maxPairs) => Math.min(DEAL_STEP_MS, DEAL_FLY_MAX_MS / Math.max(maxPairs, 1));
export const maxDealtPairs = (dealtPairs) => Math.max(0, ...Object.values(dealtPairs));
/** 짝 버리기를 보여주는 전체 시간 */
export function dealMsFor(dealtPairs) {
  const pairs = maxDealtPairs(dealtPairs);
  return DEAL_SHOW_MS + pairs * dealStepMs(pairs) + DEAL_END_MS;
}
export const DEFAULT_THIEF_SETTINGS = { lives: 3, turnSeconds: 15 };
export function isValidThiefSettings(value) {
  const v = value;
  return (
    typeof v === "object" &&
    v !== null &&
    LIVES_OPTIONS.includes(v.lives) &&
    (TURN_SECONDS.includes(v.turnSeconds) || v.turnSeconds === 0)
  );
}
/** 이 판에 쓰는 카드: A~K 네 무늬와 조커 한 장, 53장.
 * (A~7만 쓰는 '적은 카드'도 있었지만 3~4명이면 짝을 버리고 1~2장으로 시작하는 사람이 생겨 금방 끝나서 뺐다) */
export function deckOf() {
  return [...SUITS.flatMap((suit) => RANKS.map((rank) => `${suit}${rank}`)), COLOR_JOKER];
}
/** 같은 숫자 두 장씩 버린다 (조커는 짝이 없다). 버린 짝 목록과 남은 패 */
export function discardPairs(hand) {
  const waiting = new Map();
  const pairs = [];
  const rest = [];
  for (const card of hand) {
    if (isJoker(card)) {
      rest.push(card);
      continue;
    }
    const partner = waiting.get(rankOf(card));
    if (partner) {
      pairs.push([partner, card]);
      waiting.delete(rankOf(card));
    } else waiting.set(rankOf(card), card);
  }
  return { hand: [...rest, ...hand.filter((card) => [...waiting.values()].includes(card))], pairs };
}
export function toPublic(match) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hands, discards, ...rest } = match.round;
  const handCounts = Object.fromEntries(Object.entries(hands).map(([id, hand]) => [id, hand.length]));
  return { ...match, round: { ...rest, handCounts } };
}
export const isRoundOver = (match) => match.round.over;
export const isMatchOver = (match) => match.loser !== null;
/** 아직 아무도 뽑지 않은 첫 판 (룰렛을 돌리는 판) */
export const isOpening = (match) => match.roundNumber === 1 && match.round.lastDraw === null && !match.round.over;
/** 아직 카드가 있어 판에 남은 사람 (자리 순서) */
export const activeOf = (round) => round.seats.filter((id) => !round.out.includes(id));
/** id 다음 자리에서부터 판에 남은 첫 사람 (id 자신은 빼고). 없으면 null */
export function nextAfter(round, id) {
  const { seats } = round;
  const start = seats.indexOf(id);
  for (let i = 1; i <= seats.length; i++) {
    const candidate = seats[(start + i) % seats.length];
    if (candidate !== id && !round.out.includes(candidate)) return candidate;
  }
  return null;
}
/** 차례인 사람이 뽑을 상대 (다음 자리의 남은 사람) */
export const sourceOf = (round) => nextAfter(round, round.turn);
/** 손이 빈 사람을 나간 사람 목록에 더한다 */
function withOut(round, ids) {
  const out = [...round.out];
  for (const id of ids) if (round.hands[id]?.length === 0 && !out.includes(id)) out.push(id);
  return out.length === round.out.length ? round : { ...round, out };
}
const holderOfJoker = (round) => Object.keys(round.hands).find((id) => round.hands[id].includes(COLOR_JOKER)) ?? null;
function endRound(match, thief) {
  const points = thief ? { ...match.points, [thief]: Math.max(0, (match.points[thief] ?? 0) - 1) } : match.points;
  const loser = thief && points[thief] === 0 ? thief : null;
  return { ...match, points, loser, round: { ...match.round, over: true, thief } };
}
/** 남은 사람이 한 명 이하면 판을 끝낸다 (남은 사람은 조커만 들고 있다) */
function settle(match) {
  if (activeOf(match.round).length > 1) return match;
  return endRound(match, holderOfJoker(match.round));
}
function setTurn(match, turn, now) {
  const turnEndsAt = now + match.settings.turnSeconds * 1000;
  return { ...match, round: { ...match.round, turn, turnEndsAt, hover: null, hoverMoves: 0 } };
}
function roundFor(settings, players, starter, now, random, waitMs = 0) {
  const start = Math.max(0, players.indexOf(starter));
  const seats = [...players.slice(start), ...players.slice(0, start)];
  const deck = shuffle(deckOf(), random);
  const dealt = Object.fromEntries(seats.map((id) => [id, []]));
  deck.forEach((card, i) => dealt[seats[i % seats.length]].push(card));
  const hands = {};
  const dealtPairs = {};
  const discards = {};
  for (const id of seats) {
    const { hand, pairs } = discardPairs(dealt[id]);
    hands[id] = shuffle(hand, random);
    dealtPairs[id] = pairs.length;
    discards[id] = pairs.flat();
  }
  const base = {
    seats,
    out: [],
    turn: seats[0],
    hands,
    dealtPairs,
    discards,
    pairCount: Object.values(dealtPairs).reduce((a, b) => a + b, 0),
    lastDraw: null,
    hover: null,
    hoverMoves: 0,
    turnEndsAt: now + waitMs + dealMsFor(dealtPairs) + settings.turnSeconds * 1000,
    over: false,
    thief: null,
  };
  const round = withOut(base, seats);
  // 먼저 할 사람이 처음부터 다 버렸으면 다음 남은 사람부터
  const turn = round.out.includes(seats[0]) ? (nextAfter(round, seats[0]) ?? seats[0]) : seats[0];
  return { ...round, turn };
}
function begin(match, round) {
  return settle({ ...match, round });
}
export function startMatch(settings, players, now, random) {
  // 첫 판 선공은 무작위로 정하고, 화면에서 룰렛이 멈출 때까지 시작을 미룬다
  const starter = pickOpener(players, random);
  return begin(
    {
      settings,
      players,
      roundNumber: 1,
      points: Object.fromEntries(players.map((p) => [p, settings.lives])),
      loser: null,
    },
    roundFor(settings, players, starter, now, random, SPIN_MS),
  );
}
export function nextRound(match, now, random) {
  if (!isRoundOver(match) || isMatchOver(match)) return null;
  // 다음 판은 지난 판 도둑부터 (무효였으면 지난 판 먼저 한 사람 다음부터)
  const { thief, seats } = match.round;
  const stillHere = { seats: seats.filter((id) => match.players.includes(id)), out: [] };
  const starter = thief && match.players.includes(thief) ? thief : (nextAfter(stillHere, seats[0]) ?? match.players[0]);
  const { settings, players, points, loser } = match;
  return begin(
    { settings, players, points, loser, roundNumber: match.roundNumber + 1 },
    roundFor(settings, players, starter, now, random),
  );
}
export const restartMatch = (match, now, random) => startMatch(match.settings, match.players, now, random);
/** 뽑기: 차례인 사람이 다음 사람 패의 index번째 카드를 가져온다. 짝이 맞으면 버린다. 할 수 없으면 null */
export function drawCard(match, from, index, now, random) {
  const { round } = match;
  if (round.over || round.turn !== from) return null;
  const source = sourceOf(round);
  if (!source) return null;
  const giver = round.hands[source];
  if (!Number.isInteger(index) || index < 0 || index >= giver.length) return null;
  const card = giver[index];
  const mine = round.hands[from];
  const partner = isJoker(card) ? undefined : mine.find((c) => !isJoker(c) && rankOf(c) === rankOf(card));
  const drawer = partner ? mine.filter((c) => c !== partner) : [...mine, card];
  const seq = (round.lastDraw?.seq ?? 0) + 1;
  const drawn = withOut(
    {
      ...round,
      hands: {
        ...round.hands,
        [source]: shuffle(
          giver.filter((_, i) => i !== index),
          random,
        ),
        [from]: shuffle(drawer, random),
      },
      pairCount: round.pairCount + (partner ? 1 : 0),
      lastDraw: { seq, from: source, to: from, pair: partner ? [partner, card] : null },
      hover: null,
      hoverMoves: 0,
    },
    [source, from],
  );
  const next = settle({ ...match, round: drawn });
  if (next.round.over) return next;
  return setTurn(next, nextAfter(drawn, from), now + pauseAfter(drawn.lastDraw));
}
/** 카드 들어 보기: 차례인 사람이 다음 사람 패의 index번째 카드를 들어 모두에게 보여 준다. 할 수 없으면 null */
export function hoverCard(match, from, index) {
  const { round } = match;
  if (round.over || round.turn !== from || round.hover === index) return null;
  const source = sourceOf(round);
  if (!source || !Number.isInteger(index) || index < 0 || index >= round.hands[source].length) return null;
  return { ...match, round: { ...round, hover: index, hoverMoves: round.hoverMoves + 1 } };
}
/** 아무 카드나 뽑는다 (시간이 다 됐을 때) */
export function drawRandom(match, now, random) {
  const source = sourceOf(match.round);
  if (!source) return null;
  const count = match.round.hands[source].length;
  return drawCard(match, match.round.turn, Math.floor(random() * count), now, random);
}
/** 시간이 흐름: 차례 시간이 끝나면 들고 있던 카드를, 안 들었으면 아무 카드나 뽑는다. 바뀐 게 없으면 null */
export function advanceTime(match, now, random) {
  if (match.round.over || match.settings.turnSeconds <= 0 || now < match.round.turnEndsAt) return null;
  const { hover, turn } = match.round;
  if (hover !== null) return drawCard(match, turn, hover, now, random);
  return drawRandom(match, now, random);
}
/** 컴퓨터끼리만 남았을 때 바로 결과: 지금 조커를 든 사람이 도둑 */
export const endNow = (match) => (match.round.over ? match : endRound(match, holderOfJoker(match.round)));
/** 사람이 모두 빠지고 컴퓨터끼리 판이 이어지는 중인지 */
export const onlyBotsPlaying = (match, isBot) => !match.round.over && activeOf(match.round).every(isBot);
/**
 * 경기 도중 나간 사람을 뺀다. 조커를 들고 있었으면 그 판은 무효(벌점 없음).
 * 아니면 그 사람 카드의 짝(같은 숫자)을 다른 사람 패에서도 빼서, 남은 카드가 모두 짝이 맞게 한다
 */
export function removePlayer(match, id, now) {
  if (!match.players.includes(id)) return match;
  const { round } = match;
  const without = (record) => Object.fromEntries(Object.entries(record).filter(([p]) => p !== id));
  const players = match.players.filter((p) => p !== id);
  const base = {
    ...match,
    players,
    points: without(match.points),
  };
  if (round.over || !round.seats.includes(id)) {
    return { ...base, round: { ...round, hands: without(round.hands), seats: round.seats.filter((p) => p !== id) } };
  }
  const leaving = round.hands[id] ?? [];
  const hands = without(round.hands);
  // 남은 카드끼리 짝이 맞게: 나간 사람 카드와 같은 숫자를 한 장씩 뺀다
  for (const card of leaving) {
    if (isJoker(card)) continue;
    const holder = Object.keys(hands).find((p) => hands[p].some((c) => !isJoker(c) && rankOf(c) === rankOf(card)));
    if (holder) hands[holder] = hands[holder].filter((c) => isJoker(c) || rankOf(c) !== rankOf(card));
  }
  // 차례였으면 다음 남은 사람에게 (자리를 빼기 전에 정한다)
  const turnAfter = round.turn === id ? nextAfter(round, id) : round.turn;
  const cleaned = withOut(
    {
      ...round,
      seats: round.seats.filter((p) => p !== id),
      out: round.out.filter((p) => p !== id),
      hands,
      // 카드가 빠져 자리 번호가 달라졌으니 들고 있던 카드는 내려놓는다
      hover: null,
    },
    Object.keys(hands),
  );
  const next = { ...base, round: cleaned };
  if (leaving.includes(COLOR_JOKER)) return endRound(next, null);
  const settled = settle(next);
  if (settled.round.over) return settled;
  // 차례인 사람이 빠졌거나 손이 비었으면 다음 남은 사람에게
  const turn =
    turnAfter && !cleaned.out.includes(turnAfter) && cleaned.seats.includes(turnAfter)
      ? turnAfter
      : nextAfter({ seats: round.seats, out: [...cleaned.out, id] }, round.turn);
  return turn && turn !== round.turn ? setTurn(settled, turn, now) : settled;
}
