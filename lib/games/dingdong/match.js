// 띵동 다섯 경기 진행: 카드 나눠 주기, 차례대로 펼치기, 호출 버튼 판정, 벌칙, 탈락, 3분 제한, 승수.
// 방장 폰만 이 상태를 바꾸고, 더미 속 카드를 뺀 공개 상태(PublicMatch)를 모두에게 알린다.
//
// 카드: 간식 4가지(p 프레첼, j 주스, c 컵케이크, s 탄산음료)가 1~5개 그려져 있다 ('p3' = 프레첼 3개).
// 진행: 차례인 사람이 자기 더미 맨 위 카드를 펼쳐 자기 앞에 놓는다 → 사람마다 맨 위 카드만 보인다
// → 보이는 카드에서 한 간식이 딱 5개면 누구나 버튼을 누른다 → 맞으면 펼친 카드 전부를 가져가고,
// 틀리면 남은 사람들에게 한 장씩 준다 → 더미가 비면 바로 탈락 → 한 사람만 남거나 3분이 지나면 판 끝.
//
// 공정하게 판정하기: 폰마다 신호가 닿는 속도가 달라서, 도착 순서가 아니라 반응 시간으로 고른다.
// 펼칠 때마다 판 번호(seq)가 커지고, 누르는 폰은 "내가 본 판 번호"와 "그 판이 내 화면에 뜬 뒤 누르기까지 걸린 시간"을 보낸다.
// 방장은 첫 누름이 오면 조금 더 받아 본 뒤, 자기가 본 판에서 5개였던 사람 중 가장 빨랐던 사람을 고른다.
// 더 받아 보는 시간은 가장 느린 폰의 왕복 시간만큼 (폰마다 2초마다 재 둔다): 화면에 늦게 뜬 폰이 빨리 눌러도
// 그 누름이 방장에게 닿을 때까지 기다려야 공평하다 (처음 블루투스로 이어진 동안은 1~2초 걸리기도 한다).
// 막 다음 카드가 펼쳐진 순간에 누른 것도, 그 사람이 본 판(바로 앞 판)에서 5개였으면 맞다.
import { shuffle } from "../onecard/cards.js";
import { pickOpener, SPIN_MS } from "../opening.js";
export const SNACKS = ["p", "j", "c", "s"];
/** 그림 개수별 장수 (간식마다 같다). 간식마다 14장, 모두 56장 */
export const COPIES = { 1: 5, 2: 3, 3: 3, 4: 2, 5: 1 };
/** 이 개수가 모이면 누른다 */
export const TARGET = 5;
export const WINS_OPTIONS = [1, 2, 3];
/** 차례 시간(초): 이 안에 안 펼치면 저절로 펼친다 */
export const TURN_SECONDS = [3, 5];
export const BOT_SPEEDS = ["slow", "normal", "fast"];
/** 판 시간 제한: 끝나면 더미 카드가 가장 많은 사람이 이긴다 */
export const ROUND_MS = 180_000;
/** 첫 누름이 온 뒤 다른 사람의 누름을 더 받아 보는 시간 */
export const BELL_WINDOW_MS = 300;
/** 느린 폰을 기다리는 가장 긴 시간 */
export const MAX_BELL_WINDOW_MS = 2_500;
/** 잰 왕복 시간에 더 얹어 기다리는 여유 */
const BELL_MARGIN_MS = 150;
/** 폰마다 왕복 시간을 재는 간격 */
export const PING_MS = 2_000;
/** 왕복 시간은 최근 몇 번 중 가장 긴 것을 쓴다 (블루투스는 들쭉날쭉해서) */
const RTT_SAMPLES = 3;
/** 판정 결과(카드 쓸려 가기·벌칙)를 보여 주고 다음 차례까지 쉬는 시간 */
export const BELL_PAUSE_MS = 1_800;
/** 판 시작 전 카드 더미를 보여 주는 시간 */
export const START_MS = 1_200;
/** 반응 시간으로 받아들이는 가장 긴 값 (이상한 값을 막는다) */
export const MAX_REACT_MS = 60_000;
export const DEFAULT_DINGDONG_SETTINGS = { winsToChampion: 2, turnSeconds: 5, botSpeed: "normal" };
export function isValidDingDongSettings(value) {
  const v = value;
  return (
    typeof v === "object" &&
    v !== null &&
    WINS_OPTIONS.includes(v.winsToChampion) &&
    TURN_SECONDS.includes(v.turnSeconds) &&
    BOT_SPEEDS.includes(v.botSpeed)
  );
}
export const snackOf = (card) => card[0];
export const countOf = (card) => Number(card.slice(1));
/** 56장: 간식 4가지 × (1개 5장, 2개 3장, 3개 3장, 4개 2장, 5개 1장) */
export function deckOf() {
  return SNACKS.flatMap((snack) =>
    Object.entries(COPIES).flatMap(([count, copies]) => Array.from({ length: copies }, () => `${snack}${count}`)),
  );
}
/** 보이는 카드에서 한 간식이 딱 5개인지 */
export function hasFive(tops) {
  const sums = {};
  for (const card of tops) if (card) sums[snackOf(card)] = (sums[snackOf(card)] ?? 0) + countOf(card);
  return Object.values(sums).includes(TARGET);
}
const topOf = (cards) => (cards && cards.length > 0 ? cards[cards.length - 1] : null);
export function toPublic(match) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { piles, faceUp, bell, prevFive, ...rest } = match.round;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { net, ...shown } = match;
  const map = (f) => Object.fromEntries(rest.seats.map((id) => [id, f(id)]));
  return {
    ...shown,
    round: {
      ...rest,
      pileCounts: map((id) => piles[id]?.length ?? 0),
      tops: map((id) => topOf(faceUp[id])),
      upCounts: map((id) => faceUp[id]?.length ?? 0),
      belling: bell !== null,
    },
  };
}
/** 지금 보이는 카드 (사람마다 맨 위) */
export const topsOf = (round) => round.seats.map((id) => topOf(round.faceUp[id]));
export const isRoundOver = (match) => match.round.over;
export const isMatchOver = (match) => match.champions.length > 0;
/** 아직 아무도 펼치지 않은 첫 판 (룰렛을 돌리는 판) */
export const isOpening = (match) => match.roundNumber === 1 && match.round.seq === 0 && !match.round.over;
/** 쉬는 중인지 (판 시작 전, 판정 결과를 보여 주는 중). 이때는 펼치기·누르기를 받지 않는다 */
export const isResting = (match, now) => now < match.round.turnEndsAt - match.settings.turnSeconds * 1000;
/** 아직 탈락하지 않은 사람 (자리 순서) */
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
/**
 * 탁자 자리: 차례가 시계 방향으로 돌게 놓는다. 나는 아래쪽 (나 → 다음 사람 → …).
 * 2명: 위 상대 / 아래 나. 3명: 위 두 사람 / 아래 나. 4명: 위 두 사람 / 아래 다음 사람·나
 */
export function tableRows(seats, me) {
  const at = seats.indexOf(me);
  if (at < 0) return [seats.slice(0, 2), seats.slice(2)].filter((row) => row.length > 0);
  const order = [...seats.slice(at), ...seats.slice(0, at)];
  if (order.length === 2) return [[order[1]], [order[0]]];
  if (order.length === 3) return [[order[1], order[2]], [order[0]]];
  return [
    [order[2], order[3]],
    [order[1], order[0]],
  ];
}
/**
 * 더미가 빈 사람을 탈락시키고, 그 사람의 펼친 카드는 치운다 (남은 사람 카드만으로 세게).
 * 부르는 쪽(펼치기·판정)이 판 번호를 올리므로 여기서는 올리지 않는다
 */
function withOut(round) {
  const out = [...round.out];
  const faceUp = { ...round.faceUp };
  for (const id of round.seats) {
    if ((round.piles[id]?.length ?? 0) > 0 || out.includes(id)) continue;
    out.push(id);
    faceUp[id] = [];
  }
  return out.length === round.out.length ? round : { ...round, out, faceUp };
}
function endRound(match, winners, timeUp) {
  const wins = { ...match.wins };
  for (const id of winners) wins[id] = (wins[id] ?? 0) + 1;
  const champions = match.players.filter((p) => wins[p] >= match.settings.winsToChampion);
  return { ...match, wins, champions, round: { ...match.round, bell: null, over: true, winners, timeUp } };
}
/** 더미 카드가 가장 많은 사람 (동점이면 모두) */
function mostCards(round) {
  const active = activeOf(round);
  const best = Math.max(0, ...active.map((id) => round.piles[id].length));
  return active.filter((id) => round.piles[id].length === best);
}
/** 남은 사람이 한 명 이하면 판을 끝낸다 */
function settle(match) {
  const active = activeOf(match.round);
  if (active.length > 1) return match;
  return endRound(match, active, false);
}
/** 차례를 넘긴다. restMs만큼 쉰 다음 차례 시간이 흐른다 */
function setTurn(match, turn, now, restMs = 0) {
  const turnEndsAt = now + restMs + match.settings.turnSeconds * 1000;
  return { ...match, round: { ...match.round, turn, turnEndsAt } };
}
function roundFor(settings, players, starter, now, random, waitMs = 0) {
  const start = Math.max(0, players.indexOf(starter));
  const seats = [...players.slice(start), ...players.slice(0, start)];
  const deck = shuffle(deckOf(), random);
  // 똑같이 나누고 남는 장은 뺀다
  const each = Math.floor(deck.length / seats.length);
  const piles = Object.fromEntries(seats.map((id, i) => [id, deck.slice(i * each, (i + 1) * each)]));
  const startAt = now + waitMs + START_MS;
  return {
    seats,
    out: [],
    turn: seats[0],
    piles,
    faceUp: Object.fromEntries(seats.map((id) => [id, []])),
    seq: 0,
    seqAt: startAt,
    prevFive: false,
    resolvedSeq: -1,
    bell: null,
    lastBell: null,
    turnEndsAt: startAt + settings.turnSeconds * 1000,
    endsAt: startAt + ROUND_MS,
    over: false,
    winners: [],
    timeUp: false,
  };
}
export function startMatch(settings, players, now, random) {
  // 첫 판 선공은 무작위로 정하고, 화면에서 룰렛이 멈출 때까지 시작을 미룬다
  const starter = pickOpener(players, random);
  return {
    settings,
    players,
    roundNumber: 1,
    wins: Object.fromEntries(players.map((p) => [p, 0])),
    champions: [],
    net: { pingAt: 0, rtt: {} },
    round: roundFor(settings, players, starter, now, random, SPIN_MS),
  };
}
export function nextRound(match, now, random) {
  if (!isRoundOver(match) || isMatchOver(match)) return null;
  // 다음 판은 이긴 사람부터 (동점이면 그중 자리가 앞선 사람, 이긴 사람이 나갔으면 지난 판 먼저 한 사람 다음부터)
  const { winners, seats } = match.round;
  const winner = winners.find((id) => match.players.includes(id));
  const stillHere = { seats: seats.filter((id) => match.players.includes(id)), out: [] };
  const starter = winner ?? nextAfter(stillHere, seats[0]) ?? match.players[0];
  return {
    ...match,
    roundNumber: match.roundNumber + 1,
    round: roundFor(match.settings, match.players, starter, now, random),
  };
}
export const restartMatch = (match, now, random) => ({
  ...startMatch(match.settings, match.players, now, random),
  net: match.net,
});
/** 왕복 시간 하나를 적어 둔다 (방장이 보낸 시각 sentAt에 대한 답이 now에 왔다) */
export function recordPong(match, from, sentAt, now) {
  const rtt = now - sentAt;
  if (!match.players.includes(from) || !Number.isFinite(rtt) || rtt < 0 || rtt > 30_000) return match;
  const samples = [...(match.net.rtt[from] ?? []), rtt].slice(-RTT_SAMPLES);
  return { ...match, net: { ...match.net, rtt: { ...match.net.rtt, [from]: samples } } };
}
/** 누른 사람(from) 말고 다른 사람들 중 가장 느린 폰을 기다리는 시간 */
export function bellWindowMs(match, from) {
  const others = match.players.filter((id) => id !== from);
  const worst = Math.max(0, ...others.flatMap((id) => match.net.rtt[id] ?? []));
  return Math.min(MAX_BELL_WINDOW_MS, Math.max(BELL_WINDOW_MS, worst + BELL_MARGIN_MS));
}
/** 펼치기: 차례인 사람이 자기 더미 맨 위 카드를 펼친다. 마지막 카드였으면 탈락. 할 수 없으면 null */
export function flipCard(match, from, now) {
  const { round } = match;
  if (round.over || round.turn !== from || round.bell || isResting(match, now)) return null;
  const pile = round.piles[from];
  if (!pile || pile.length === 0) return null;
  const card = pile[pile.length - 1];
  const flipped = withOut({
    ...round,
    piles: { ...round.piles, [from]: pile.slice(0, -1) },
    faceUp: { ...round.faceUp, [from]: [...round.faceUp[from], card] },
    seq: round.seq + 1,
    seqAt: now,
    prevFive: hasFive(topsOf(round)),
  });
  const next = settle({ ...match, round: flipped });
  if (next.round.over) return next;
  return setTurn(next, nextAfter(flipped, from), now);
}
/**
 * 호출 버튼: seq는 누른 사람 화면의 판 번호, reactMs는 그 판이 화면에 뜬 뒤 누르기까지 걸린 시간.
 * 첫 누름이면 누름 받기를 열고, 이미 열려 있으면 더한다. 받을 수 없는 누름이면 null
 */
export function pressBell(match, from, seq, reactMs, now) {
  const { round } = match;
  if (typeof reactMs !== "number" || !Number.isFinite(reactMs) || reactMs < 0 || reactMs > MAX_REACT_MS) return null;
  // 판정이 끝난 판을 보고 누른 것: 받지 않고, 늦게 왔다는 것만 적어 둔다
  const { lastBell } = round;
  if (!round.over && lastBell && seq === round.resolvedSeq && !lastBell.late.some((p) => p.id === from)) {
    const late = [...lastBell.late, { id: from, reactMs, afterMs: now - lastBell.at }];
    return { ...match, round: { ...round, lastBell: { ...lastBell, late } } };
  }
  if (round.over || isResting(match, now) || !activeOf(round).includes(from)) return null;
  if (!Number.isInteger(seq) || (seq !== round.seq && seq !== round.seq - 1) || seq <= round.resolvedSeq) return null;
  if (round.bell?.presses.some((p) => p.id === from)) return null;
  const press = { id: from, seq, reactMs };
  const bell = round.bell
    ? { ...round.bell, presses: [...round.bell.presses, press] }
    : { openedAt: now, closesAt: now + bellWindowMs(match, from), presses: [press] };
  return { ...match, round: { ...round, bell } };
}
/** 그 사람이 본 판에서 5개였는지 */
const sawFive = (round, press) => (press.seq === round.seq ? hasFive(topsOf(round)) : round.prevFive);
/** 누름 받기를 닫고 판정한다: 맞힌 사람 중 가장 빨랐던 사람이 펼친 카드를 다 가져가고, 맞힌 사람이 없으면 틀린 사람들이 벌칙 */
export function resolveBell(match, now) {
  const { round } = match;
  if (!round.bell) return match;
  const presses = round.bell.presses.filter((p) => activeOf(round).includes(p.id));
  const right = presses.filter((p) => sawFive(round, p)).sort((a, b) => a.seq - b.seq || a.reactMs - b.reactMs);
  const winner = right[0]?.id ?? null;
  const piles = { ...round.piles };
  let faceUp = round.faceUp;
  let taken = 0;
  const paid = [];
  if (winner) {
    // 펼친 카드 전부를 이긴 사람 더미 밑에 넣는다
    const won = round.seats.flatMap((id) => round.faceUp[id] ?? []);
    taken = won.length;
    piles[winner] = [...won, ...piles[winner]];
    faceUp = Object.fromEntries(round.seats.map((id) => [id, []]));
  } else {
    // 틀리게 누른 사람은 남은 사람들에게 (자리 순서대로) 한 장씩 준다. 모자라면 있는 만큼
    for (const id of round.seats.filter((seat) => presses.some((p) => p.id === seat))) {
      const to = [];
      for (const other of activeOf(round)) {
        if (other === id || piles[id].length === 0) continue;
        piles[other] = [piles[id][0], ...piles[other]];
        piles[id] = piles[id].slice(1);
        to.push(other);
      }
      paid.push({ from: id, to });
    }
  }
  const resolved = withOut({
    ...round,
    piles,
    faceUp,
    seq: round.seq + 1,
    seqAt: now + BELL_PAUSE_MS,
    prevFive: false,
    resolvedSeq: round.seq,
    bell: null,
    lastBell: {
      n: (round.lastBell?.n ?? 0) + 1,
      winner,
      taken,
      paid,
      presses: presses.map((p) => ({ id: p.id, reactMs: Math.round(p.reactMs), right: sawFive(round, p) })),
      waitMs: round.bell.closesAt - round.bell.openedAt,
      at: now,
      late: [],
    },
  });
  const next = settle({ ...match, round: resolved });
  if (next.round.over) return next;
  // 맞히면 이긴 사람이 다음에 펼치고, 틀리면 하던 사람이 이어서 (그 사람이 탈락했으면 다음 사람)
  const turn = winner ?? (resolved.out.includes(round.turn) ? nextAfter(resolved, round.turn) : round.turn);
  return setTurn(next, turn, now, BELL_PAUSE_MS);
}
/** 시간이 흐름: 누름 받기가 끝나면 판정, 판 시간이 끝나면 판 끝, 차례 시간이 끝나면 저절로 펼친다. 바뀐 게 없으면 null */
export function advanceTime(match, now) {
  const { round } = match;
  if (round.over) return null;
  if (round.bell) return now >= round.bell.closesAt ? resolveBell(match, now) : null;
  if (isResting(match, now)) return null;
  if (now >= round.endsAt) return endRound(match, mostCards(round), true);
  if (now >= round.turnEndsAt) return flipCard(match, round.turn, now);
  return null;
}
/** 컴퓨터끼리만 남았을 때 바로 결과: 지금 더미 카드가 가장 많은 사람이 이긴다 */
export const endNow = (match) => (match.round.over ? match : endRound(match, mostCards(match.round), false));
/** 사람이 모두 빠지고 컴퓨터끼리 판이 이어지는 중인지 */
export const onlyBotsPlaying = (match, isBot) => !match.round.over && activeOf(match.round).every(isBot);
/** 경기 도중 나간 사람을 뺀다. 그 사람 카드(더미·펼친 카드)는 판에서 뺀다 */
export function removePlayer(match, id, now) {
  if (!match.players.includes(id)) return match;
  const { round } = match;
  const without = (record) => Object.fromEntries(Object.entries(record).filter(([p]) => p !== id));
  const players = match.players.filter((p) => p !== id);
  const base = { ...match, players, wins: without(match.wins), champions: match.champions.filter((p) => p !== id) };
  const seats = round.seats.filter((p) => p !== id);
  if (round.over || !round.seats.includes(id)) {
    return { ...base, round: { ...round, seats, piles: without(round.piles), faceUp: without(round.faceUp) } };
  }
  // 차례였으면 다음 남은 사람에게 (자리를 빼기 전에 정한다)
  const turnAfter = round.turn === id ? nextAfter(round, id) : round.turn;
  // 보이는 카드가 바뀌니 판 번호를 올리고, 받던 누름은 그 사람 것만 뺀다
  const presses = round.bell?.presses.filter((p) => p.id !== id) ?? [];
  const changed = (round.faceUp[id]?.length ?? 0) > 0;
  const cleaned = {
    ...round,
    seats,
    out: round.out.filter((p) => p !== id),
    piles: without(round.piles),
    faceUp: without(round.faceUp),
    seq: changed ? round.seq + 1 : round.seq,
    seqAt: changed ? now : round.seqAt,
    prevFive: changed ? false : round.prevFive,
    resolvedSeq: changed ? round.seq : round.resolvedSeq,
    bell: changed || presses.length === 0 ? null : { ...round.bell, presses },
  };
  const settled = settle({ ...base, round: cleaned });
  if (settled.round.over) return settled;
  return turnAfter && turnAfter !== round.turn ? setTurn(settled, turnAfter, now) : settled;
}
