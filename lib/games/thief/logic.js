// 도둑잡기를 방에 끼우는 부분: 주고받는 메시지, 방장이 하는 일, 화면 상태.
// 손패는 방장이 그 사람에게만 보내고, 장수·차례·탈출 같은 공개 상태는 모두에게 보낸다.
import { isCard } from "../onecard/cards.js";
import { thiefBot } from "./bot.js";
import * as rules from "./match.js";
import { DEFAULT_THIEF_SETTINGS, isValidThiefSettings } from "./match.js";
export function makeThiefLogic(random = Math.random) {
  const stateTo = (match, now, to = "all") => ({
    to,
    message: { type: "state", match: rules.toPublic(match), left: Math.max(0, match.round.turnEndsAt - now) },
  });
  const handTo = (match, id, drew) => {
    const hand = match.round.hands[id] ?? [];
    return { to: id, message: drew ? { type: "hand", hand, drew } : { type: "hand", hand } };
  };
  /** 새 판 손패: 처음 버린 짝도 함께 (화면이 받은 카드 전부에서 짝이 빠지는 모습을 보여준다) */
  const dealTo = (match, id) => ({
    to: id,
    message: {
      type: "hand",
      hand: match.round.hands[id] ?? [],
      deal: { key: `${match.roundNumber}`, discards: match.round.discards[id] ?? [] },
    },
  });
  /** 이번에 id가 뽑은 카드: 짝이 맞았으면 짝의 두 번째 장, 아니면 손에 새로 생긴 카드 */
  const drewBy = (state, next, id) => {
    const draw = next.round.lastDraw;
    if (!draw || draw.to !== id || draw.seq === state.round.lastDraw?.seq) return undefined;
    const before = state.round.hands[id] ?? [];
    const card = draw.pair ? draw.pair[1] : next.round.hands[id]?.find((c) => !before.includes(c));
    return card ? { key: `${next.roundNumber}-${draw.seq}`, card } : undefined;
  };
  /** 바뀌었으면 공개 상태를 모두에게, 손패가 바뀐 사람에게는 손패를 보낸다 */
  const changed = (state, next, now) => {
    if (!next) return { state, outbox: [] };
    const hands = next.players
      .filter((id) => next.round.hands[id] !== state.round.hands[id])
      .map((id) => handTo(next, id, drewBy(state, next, id)));
    return { state: next, outbox: [stateTo(next, now), ...hands] };
  };
  /** 새 판: 모두의 손패가 바뀐다 */
  const dealt = (next, now) => ({
    state: next,
    outbox: [stateTo(next, now), ...next.players.map((id) => dealTo(next, id))],
  });
  function receive(state, from, message, hostId, now) {
    switch (message.type) {
      case "draw":
        return changed(state, rules.drawCard(state, from, message.index, now, random), now);
      case "hover":
        return changed(state, rules.hoverCard(state, from, message.index), now);
      case "next": {
        const next = from === hostId ? rules.nextRound(state, now, random) : null;
        return next ? dealt(next, now) : { state, outbox: [] };
      }
      case "restart":
        return from === hostId && rules.isMatchOver(state)
          ? dealt(rules.restartMatch(state, now, random), now)
          : { state, outbox: [] };
      default:
        return { state, outbox: [] }; // 방장에게 오면 안 되는 메시지
    }
  }
  return {
    minPlayers: 2,
    maxPlayers: 4,
    defaultSettings: DEFAULT_THIEF_SETTINGS,
    isValidSettings: isValidThiefSettings,
    parseMessage: parseThiefMessage,
    untimed: (settings) => ({ ...settings, turnSeconds: 0 }),
    host: {
      start: (settings, players, now) => dealt(rules.startMatch(settings, players, now, random), now),
      receive,
      welcomeBack: (state, playerId, now) => [stateTo(state, now, playerId), dealTo(state, playerId)],
      playerLeft: (state, playerId, now) => changed(state, rules.removePlayer(state, playerId, now), now),
      tick: (state, now) => changed(state, rules.advanceTime(state, now, random), now),
      forceEnd: (state, now) => changed(state, rules.endNow(state), now),
    },
    bot: thiefBot,
    client: {
      init: (settings) => ({ settings, match: null, myHand: [], drew: null, deal: null, left: 0, stamp: 0 }),
      receive: (view, message) => {
        if (message.type === "state") {
          const { match, left } = message;
          return { view: { ...view, match, settings: match.settings, left, stamp: view.stamp + 1 } };
        }
        if (message.type === "hand") {
          const { hand, drew, deal } = message;
          return { view: { ...view, myHand: hand, drew: drew ?? view.drew, deal: deal ?? view.deal } };
        }
        return { view };
      },
    },
  };
}
export function parseThiefMessage(data) {
  const m = data;
  switch (m?.type) {
    case "draw":
    case "hover":
      return Number.isInteger(m.index) && m.index >= 0 ? { type: m.type, index: m.index } : null;
    case "next":
    case "restart":
      return { type: m.type };
    case "state":
      return typeof m.match === "object" &&
        m.match !== null &&
        Array.isArray(m.match.players) &&
        typeof m.match.round?.handCounts === "object" &&
        Number.isInteger(m.left)
        ? m
        : null;
    case "hand": {
      if (!Array.isArray(m.hand) || !m.hand.every(isCard)) return null;
      const out = { type: "hand", hand: m.hand };
      if (m.drew !== undefined) {
        if (typeof m.drew?.key !== "string" || !isCard(m.drew.card)) return null;
        out.drew = { key: m.drew.key, card: m.drew.card };
      }
      if (m.deal !== undefined) {
        const { deal } = m;
        if (typeof deal?.key !== "string" || !Array.isArray(deal.discards) || !deal.discards.every(isCard)) return null;
        out.deal = { key: deal.key, discards: deal.discards };
      }
      return out;
    }
    default:
      return null;
  }
}
export const thiefLogic = makeThiefLogic();
