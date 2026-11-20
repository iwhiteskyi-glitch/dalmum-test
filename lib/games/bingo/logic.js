// 빙고를 방에 끼우는 부분: 주고받는 메시지, 방장이 하는 일, 화면 상태.
// 연결과 상관없는 순수한 계산만 한다.
import { pickOpener, SPIN_MS } from "../opening.js";
import { leftOf } from "../turnClock.js";
import { bingoBot } from "./bot.js";
import { createBoard, DEFAULT_SETTINGS, isValidBoard, isValidSettings } from "./bingo.js";
import * as rules from "./match.js";
const out = (message, to = "all") => ({ to, message });
const unchanged = (state) => ({ state, outbox: [] });
/** 경기 상태 알림. 새 판을 모으는 중에는 지난 판 상태가 다시 보이지 않도록 보내지 않는다 */
const stateMessage = (state, now, to = "all") =>
  state.match && state.phase === "playing"
    ? [out({ type: "state", match: state.match, left: leftOf(state.turnEndsAt, now) }, to)]
    : [];
/** 이번 차례 시간을 새로 잰다 (첫 룰렛이 도는 시간은 빼고) */
function timed(state, now) {
  const seconds = state.settings.turnSeconds ?? 0;
  const { match } = state;
  if (seconds === 0 || state.phase !== "playing" || !match || rules.isRoundOver(match)) {
    return { ...state, turnEndsAt: null };
  }
  return { ...state, turnEndsAt: now + (match.round.opening ? SPIN_MS : 0) + seconds * 1000 };
}
/** 판을 다 낸 사람 알림 */
const readyMessage = (state, to = "all") =>
  out({ type: "ready", dealId: state.dealId, ready: Object.keys(state.boards) }, to);
/** 모두에게 새 판을 만들어 보내달라고 한다 */
function deal(state, pending) {
  const next = {
    ...state,
    phase: "dealing",
    dealId: state.dealId + 1,
    pending,
    boards: {},
    turnEndsAt: null,
  };
  return { state: next, outbox: [out({ type: "deal", dealId: next.dealId })] };
}
/** 판이 모두 모였으면 경기를 시작(또는 다음 판)한다 */
function beginIfReady(state, now) {
  if (state.phase !== "dealing" || !state.players.every((id) => state.boards[id])) return unchanged(state);
  let match = null;
  const opener = pickOpener(state.players, Math.random);
  if (state.pending === "new" || !state.match) match = rules.startMatch(state.settings, state.players, opener);
  else if (state.pending === "next") match = rules.nextRound(state.match);
  else if (state.pending === "restart") match = rules.restartMatch(state.match, opener);
  if (!match) return unchanged(state);
  const next = timed({ ...state, phase: "playing", pending: null, match }, now);
  return { state: next, outbox: stateMessage(next, now) };
}
function hostReceive(state, from, message, hostId, now) {
  switch (message.type) {
    case "board": {
      if (state.phase !== "dealing" || message.dealId !== state.dealId) return unchanged(state);
      if (!state.players.includes(from)) return unchanged(state);
      if (!isValidBoard(message.board, state.settings.maxNumber)) return unchanged(state);
      const next = { ...state, boards: { ...state.boards, [from]: message.board } };
      const begun = beginIfReady(next, now);
      // 아직 다 모이지 않았으면 누가 냈는지 알린다
      return begun.state.phase === "playing" ? begun : { state: next, outbox: [readyMessage(next)] };
    }
    case "pick": {
      if (state.phase !== "playing" || !state.match) return unchanged(state);
      const match = rules.pickNumber(state.match, state.boards, from, message.number);
      if (!match) return unchanged(state);
      const next = timed({ ...state, match }, now);
      return { state: next, outbox: stateMessage(next, now) };
    }
    case "next": {
      const { match } = state;
      if (from !== hostId || state.phase !== "playing" || !match) return unchanged(state);
      if (!rules.isRoundOver(match) || rules.isMatchOver(match)) return unchanged(state);
      return deal(state, "next");
    }
    case "restart": {
      if (from !== hostId || state.phase !== "playing" || !state.match) return unchanged(state);
      if (!rules.isMatchOver(state.match)) return unchanged(state);
      return deal(state, "restart");
    }
    default:
      return unchanged(state); // 방장에게 오면 안 되는 메시지
  }
}
/** 시간이 다 되면 그 사람 판에서 아직 안 불린 숫자 하나를 대신 부른다 */
function tick(state, now, random = Math.random) {
  if (state.turnEndsAt === null || now < state.turnEndsAt || !state.match) return unchanged(state);
  const { round } = state.match;
  const left = (state.boards[round.turn] ?? []).filter((n) => !round.called.includes(n));
  if (left.length === 0) return unchanged({ ...state, turnEndsAt: null });
  const number = left[Math.floor(random() * left.length)];
  return hostReceive(state, round.turn, { type: "pick", number }, "", now);
}
/** 게임 중에 연결이 끊겼던 사람이 다시 들어옴: 판과 현재 상태를 다시 보내준다 */
function welcomeBack(state, playerId, now) {
  const board = state.boards[playerId];
  const outbox = [];
  if (state.phase === "dealing" && !board) {
    // 판을 아직 못 냈으면 판을 만들어 달라고 다시 요청
    outbox.push(out({ type: "deal", dealId: state.dealId }, playerId));
  } else if (board) {
    outbox.push(out({ type: "restore", dealId: state.dealId, board }, playerId));
  }
  if (state.phase === "dealing") outbox.push(readyMessage(state, playerId));
  outbox.push(...stateMessage(state, now, playerId));
  return outbox;
}
/** 경기 도중 한 사람이 빠짐. 판을 모으는 중이었으면 남은 판으로 시작할 수 있는지 본다 */
function playerLeft(state, playerId, now) {
  const { [playerId]: _left, ...boards } = state.boards;
  const next = {
    ...state,
    players: state.players.filter((id) => id !== playerId),
    boards,
    match: state.match ? rules.removePlayer(state.match, playerId) : null,
  };
  if (next.phase === "dealing") return beginIfReady(next, now);
  const clocked = timed(next, now);
  return { state: clocked, outbox: stateMessage(clocked, now) };
}
// ── 화면 상태 ────────────────────────────────
function clientInit(settings) {
  return { phase: "dealing", settings, match: null, myBoard: null, dealId: 0, ready: [], left: null, stamp: 0 };
}
function clientReceive(view, message, makeBoard = createBoard) {
  switch (message.type) {
    case "deal": {
      const dealing = { ...view, phase: "dealing", dealId: message.dealId, ready: [] };
      // 직접 채우기면 화면에서 다 채운 뒤 submitBoard로 보낸다
      if (view.settings.fillMode === "manual") return { view: { ...dealing, myBoard: null } };
      const board = makeBoard(view.settings.maxNumber);
      return { view: { ...dealing, myBoard: board }, reply: { type: "board", dealId: message.dealId, board } };
    }
    case "ready":
      return message.dealId === view.dealId ? { view: { ...view, ready: message.ready } } : { view };
    case "restore":
      return { view: { ...view, dealId: message.dealId, myBoard: message.board } };
    case "state":
      return {
        view: {
          ...view,
          phase: "playing",
          match: message.match,
          settings: message.match.settings,
          left: message.left ?? null,
          stamp: view.stamp + 1,
        },
      };
    default:
      return { view }; // 참가자에게 오면 안 되는 메시지
  }
}
/** 직접 채운 판을 낸다 */
export function submitBoard(view, board) {
  return { view: { ...view, myBoard: board }, reply: { type: "board", dealId: view.dealId, board } };
}
// ── 메시지 확인 ────────────────────────────────
export function parseBingoMessage(data) {
  const m = data;
  switch (m?.type) {
    case "deal":
      return Number.isInteger(m.dealId) ? m : null;
    case "board":
    case "restore":
      // 판 내용은 방장이 설정에 맞는지 따로 확인한다
      return Number.isInteger(m.dealId) && Array.isArray(m.board) ? m : null;
    case "ready":
      return Number.isInteger(m.dealId) && Array.isArray(m.ready) ? m : null;
    case "pick":
      return Number.isInteger(m.number) ? m : null;
    case "state":
      return typeof m.match === "object" && m.match !== null && Array.isArray(m.match.players) ? m : null;
    case "next":
    case "restart":
      return { type: m.type };
    default:
      return null;
  }
}
export const bingoLogic = {
  minPlayers: 2,
  maxPlayers: 4,
  defaultSettings: DEFAULT_SETTINGS,
  isValidSettings: (value) => typeof value === "object" && value !== null && isValidSettings(value),
  parseMessage: parseBingoMessage,
  untimed: (settings) => ({ ...settings, turnSeconds: 0 }),
  host: {
    start: (settings, players) =>
      deal(
        { phase: "dealing", settings, players, dealId: 0, pending: null, boards: {}, match: null, turnEndsAt: null },
        "new",
      ),
    receive: hostReceive,
    welcomeBack,
    playerLeft,
    tick: (state, now) => tick(state, now),
  },
  bot: bingoBot,
  client: {
    init: clientInit,
    receive: (view, message) => clientReceive(view, message),
  },
};
