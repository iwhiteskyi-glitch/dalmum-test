import { dingDongBot } from "./bot.js";
import * as rules from "./match.js";
import { DEFAULT_DINGDONG_SETTINGS, isValidDingDongSettings } from "./match.js";
export function makeDingDongLogic(random = Math.random) {
  const stateTo = (match, now, to = "all") => ({
    to,
    message: {
      type: "state",
      match: rules.toPublic(match),
      left: Math.max(0, Math.round(match.round.turnEndsAt - now)),
      endsIn: Math.max(0, Math.round(match.round.endsAt - now)),
    },
  });
  const changed = (state, next, now) => (next ? { state: next, outbox: [stateTo(next, now)] } : { state, outbox: [] });
  function receive(state, from, message, hostId, now) {
    switch (message.type) {
      case "flip":
        return changed(state, rules.flipCard(state, from, now), now);
      case "press":
        return changed(state, rules.pressBell(state, from, message.seq, message.reactMs, now), now);
      case "pong":
        return { state: rules.recordPong(state, from, message.t, now), outbox: [] };
      case "next":
        return changed(state, from === hostId ? rules.nextRound(state, now, random) : null, now);
      case "restart":
        return changed(
          state,
          from === hostId && rules.isMatchOver(state) ? rules.restartMatch(state, now, random) : null,
          now,
        );
      default:
        return { state, outbox: [] }; // 방장에게 오면 안 되는 메시지
    }
  }
  return {
    minPlayers: 2,
    maxPlayers: 4,
    defaultSettings: DEFAULT_DINGDONG_SETTINGS,
    isValidSettings: isValidDingDongSettings,
    parseMessage: parseDingDongMessage,
    host: {
      start: (settings, players, now) => {
        const match = rules.startMatch(settings, players, now, random);
        return { state: match, outbox: [stateTo(match, now)] };
      },
      receive,
      welcomeBack: (state, playerId, now) => [stateTo(state, now, playerId)],
      playerLeft: (state, playerId, now) => changed(state, rules.removePlayer(state, playerId, now), now),
      tick: (state, now) => {
        const step = changed(state, rules.advanceTime(state, now), now);
        if (now - step.state.net.pingAt < rules.PING_MS) return step;
        // 2초마다 모두의 연결 속도를 잰다 (상태는 다시 보내지 않는다)
        const pinged = { ...step.state, net: { ...step.state.net, pingAt: now } };
        return { state: pinged, outbox: [...step.outbox, { to: "all", message: { type: "ping", t: now } }] };
      },
      forceEnd: (state, now) => changed(state, rules.endNow(state), now),
    },
    bot: dingDongBot,
    client: {
      init: (settings) => ({ settings, match: null, left: 0, endsIn: 0, stamp: 0 }),
      receive: (view, message) => {
        if (message.type === "ping") return { view, reply: { type: "pong", t: message.t } };
        if (message.type !== "state") return { view };
        const { match, left, endsIn } = message;
        return { view: { ...view, match, settings: match.settings, left, endsIn, stamp: view.stamp + 1 } };
      },
    },
  };
}
const isMs = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
export function parseDingDongMessage(data) {
  const m = data;
  switch (m?.type) {
    case "flip":
    case "next":
    case "restart":
      return { type: m.type };
    case "ping":
    case "pong":
      return typeof m.t === "number" && Number.isFinite(m.t) ? { type: m.type, t: m.t } : null;
    case "press":
      return Number.isInteger(m.seq) && m.seq >= 0 && isMs(m.reactMs)
        ? { type: "press", seq: m.seq, reactMs: m.reactMs }
        : null;
    case "state":
      return typeof m.match === "object" &&
        m.match !== null &&
        Array.isArray(m.match.players) &&
        typeof m.match.round?.pileCounts === "object" &&
        typeof m.match.round?.tops === "object" &&
        isMs(m.left) &&
        isMs(m.endsIn)
        ? m
        : null;
    default:
      return null;
  }
}
export const dingDongLogic = makeDingDongLogic();
