// 숫자 타일을 방에 끼우는 부분: 주고받는 메시지, 방장이 하는 일, 화면 상태.
// 손패는 방장이 그 사람에게만 보내고, 판·개수 같은 공개 상태는 모두에게 보낸다.
// 고치는 중인 판(draft)도 그때그때 모두에게 보내서, 다른 사람이 고치는 모습이 실시간으로 보인다.
import { pickOpener } from "../opening.js";
import { tilesBot } from "./bot.js";
import * as rules from "./match.js";
import { DEFAULT_TILES_SETTINGS, isValidTilesSettings } from "./match.js";
import { isTile } from "./tiles.js";
export function makeTilesLogic(random = Math.random) {
  const stateTo = (match, to = "all") => ({
    to,
    message: { type: "state", match: rules.toPublic(match) },
  });
  const handTo = (match, id) => ({
    to: id,
    message: { type: "hand", hand: match.round.hands[id] ?? [] },
  });
  const allHands = (match) => match.round.order.map((id) => handTo(match, id));
  const unchanged = (state) => ({ state, outbox: [] });
  function receive(state, from, message, hostId, now) {
    switch (message.type) {
      case "edit": {
        const next = rules.editDraft(state, from, message.draft);
        return next ? { state: next, outbox: [stateTo(next)] } : unchanged(state);
      }
      case "done": {
        const next = rules.finishTurn(state, from, now);
        if (!next) return unchanged(state);
        // 판이 끝났으면 손패가 공개되므로 따로 보낼 것이 없다
        return { state: next, outbox: [stateTo(next), handTo(next, from)] };
      }
      case "draw": {
        const next = rules.drawTile(state, from, now);
        return next ? { state: next, outbox: [stateTo(next), handTo(next, from)] } : unchanged(state);
      }
      case "next": {
        if (from !== hostId) return unchanged(state);
        const next = rules.nextRound(state, now, random);
        return next ? { state: next, outbox: [stateTo(next), ...allHands(next)] } : unchanged(state);
      }
      case "restart": {
        if (from !== hostId || !rules.isMatchOver(state)) return unchanged(state);
        const next = rules.restartMatch(state, now, random, pickOpener(state.players, random));
        return { state: next, outbox: [stateTo(next), ...allHands(next)] };
      }
      default:
        return unchanged(state); // 방장에게 오면 안 되는 메시지
    }
  }
  return {
    minPlayers: 2,
    maxPlayers: 4,
    defaultSettings: DEFAULT_TILES_SETTINGS,
    isValidSettings: isValidTilesSettings,
    parseMessage: parseTilesMessage,
    untimed: (settings) => ({ ...settings, turnSeconds: 0 }),
    host: {
      start: (settings, players, now) => {
        const state = rules.startMatch(settings, players, now, random, pickOpener(players, random));
        return { state, outbox: [stateTo(state), ...allHands(state)] };
      },
      receive,
      welcomeBack: (state, playerId) => [stateTo(state, playerId), handTo(state, playerId)],
      playerLeft: (state, playerId, now) => {
        const next = rules.removePlayer(state, playerId, now);
        return { state: next, outbox: [stateTo(next)] };
      },
      tick: (state, now) => {
        const next = rules.timeout(state, now);
        // 시간이 다 된 사람은 타일을 받았으니 손패도 다시 보낸다
        return next ? { state: next, outbox: [stateTo(next), handTo(next, state.round.turn)] } : unchanged(state);
      },
    },
    bot: tilesBot,
    client: {
      init: (settings) => ({ settings, match: null, myHand: [] }),
      receive: (view, message) => {
        if (message.type === "state") {
          return { view: { ...view, match: message.match, settings: message.match.settings } };
        }
        if (message.type === "hand") return { view: { ...view, myHand: message.hand } };
        return { view };
      },
    },
  };
}
const isGroupList = (value) => Array.isArray(value) && value.every((g) => Array.isArray(g) && g.every(isTile));
export function parseTilesMessage(data) {
  const m = data;
  switch (m?.type) {
    case "edit":
      return isGroupList(m.draft) ? { type: "edit", draft: m.draft } : null;
    case "done":
    case "draw":
    case "next":
    case "restart":
      return { type: m.type };
    case "state":
      return typeof m.match === "object" && m.match !== null && Array.isArray(m.match.players) ? m : null;
    case "hand":
      return Array.isArray(m.hand) && m.hand.every(isTile) ? { type: "hand", hand: m.hand } : null;
    default:
      return null;
  }
}
export const tilesLogic = makeTilesLogic();
