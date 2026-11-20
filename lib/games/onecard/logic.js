import { oneCardBot } from "./bot.js";
import { isCard, isSuit } from "./cards.js";
import * as rules from "./match.js";
import { DEFAULT_ONECARD_SETTINGS, isValidOneCardSettings } from "./match.js";
export function makeOneCardLogic(random = Math.random) {
  const stateTo = (match, now, to = "all") => ({
    to,
    message: { type: "state", match: rules.toPublic(match), left: Math.max(0, match.round.turnEndsAt - now) },
  });
  const handTo = (match, id) => ({
    to: id,
    message: { type: "hand", hand: match.round.hands[id] ?? [] },
  });
  const allHands = (match) => match.players.map((id) => handTo(match, id));
  /** 바뀌었으면 공개 상태를 모두에게, 손패가 바뀐 사람에게는 손패를 보낸다 */
  const changed = (state, next, now) => {
    if (!next) return { state, outbox: [] };
    const hands = next.players
      .filter((id) => next.round.hands[id] !== state.round.hands[id])
      .map((id) => handTo(next, id));
    return { state: next, outbox: [stateTo(next, now), ...hands] };
  };
  /** 새 판: 모두의 손패가 바뀐다 */
  const dealt = (next, now) => ({
    state: next,
    outbox: [stateTo(next, now), ...allHands(next)],
  });
  function receive(state, from, message, hostId, now) {
    switch (message.type) {
      case "play":
        return changed(state, rules.playCard(state, from, message.card, message.suit, now), now);
      case "draw":
        return changed(state, rules.drawCards(state, from, now, random), now);
      case "call":
        return changed(state, rules.callOneCard(state, from, message.target, message.seen, random), now);
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
    defaultSettings: DEFAULT_ONECARD_SETTINGS,
    isValidSettings: isValidOneCardSettings,
    parseMessage: parseOneCardMessage,
    untimed: (settings) => ({ ...settings, turnSeconds: 0 }),
    host: {
      start: (settings, players, now) => dealt(rules.startMatch(settings, players, now, random), now),
      receive,
      welcomeBack: (state, playerId, now) => [stateTo(state, now, playerId), handTo(state, playerId)],
      playerLeft: (state, playerId, now) => changed(state, rules.removePlayer(state, playerId, now), now),
      tick: (state, now) => changed(state, rules.advanceTime(state, now, random), now),
      forceEnd: (state, now) => changed(state, rules.endByFewestCards(state), now),
    },
    bot: oneCardBot,
    client: {
      init: (settings) => ({ settings, match: null, myHand: [], left: 0, stamp: 0 }),
      receive: (view, message) => {
        if (message.type === "state") {
          const { match, left } = message;
          return { view: { ...view, match, settings: match.settings, left, stamp: view.stamp + 1 } };
        }
        if (message.type === "hand") return { view: { ...view, myHand: message.hand } };
        return { view };
      },
    },
  };
}
export function parseOneCardMessage(data) {
  const m = data;
  switch (m?.type) {
    case "play":
      return isCard(m.card) && (m.suit === null || isSuit(m.suit))
        ? { type: "play", card: m.card, suit: m.suit }
        : null;
    case "call":
      return typeof m.target === "string" && typeof m.seen === "boolean"
        ? { type: "call", target: m.target, seen: m.seen }
        : null;
    case "draw":
    case "next":
    case "restart":
      return { type: m.type };
    case "state":
      return typeof m.match === "object" &&
        m.match !== null &&
        Array.isArray(m.match.players) &&
        Number.isInteger(m.left)
        ? m
        : null;
    case "hand":
      return Array.isArray(m.hand) && m.hand.every(isCard) ? { type: "hand", hand: m.hand } : null;
    default:
      return null;
  }
}
export const oneCardLogic = makeOneCardLogic();
