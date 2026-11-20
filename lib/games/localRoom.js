/**
 * 혼자 하기 방: 이 브라우저가 방장이 되어 게임 상태를 갖고, 컴퓨터 참가자가 정해진 시간마다 움직여요.
 * 비행기오락실 앱의 방(src/room/host.ts)이 하는 일을 연결만 빼고 그대로 옮겼어요.
 *  - 게임 규칙(lib/games/<게임>/logic.js)은 앱과 같은 모양: host(진짜 상태) · client(내 화면 상태) · bot(컴퓨터)
 *  - 방장이 '나'에게 보내는 메시지만 내 화면 상태에 넣어요. 컴퓨터는 메시지를 받지 않고 방장 상태에서 자기 것만 봐요
 *  - 컴퓨터는 게임 상태가 바뀐 뒤 bot.delay만큼 기다렸다가 한 명씩 움직여요(여러 컴퓨터도 차례로 보여요)
 * 화면과 상관없는 순수한 계산만 해요(시계는 화면이 tickRoom을 자주 불러서 맞춰요).
 */

export const ME = "me";
export const botIdOf = (n) => `bot-${n}`;
export const isBotId = (id) => id !== ME;

/** 방장이 보낸 메시지를 내 화면 상태에 넣고, 내 화면이 답한 것은 다시 방장에게 보내요 */
function deliver(room, outbox, now) {
  let r = room;
  const queue = [...outbox];
  for (let guard = 0; queue.length && guard < 200; guard++) {
    const { to, message } = queue.shift();
    if (to !== "all" && to !== ME) continue;
    const { view, reply } = r.logic.client.receive(r.view, message);
    r = { ...r, view };
    if (reply) {
      const step = r.logic.host.receive(r.game, ME, reply, ME, now);
      r = { ...r, game: step.state };
      queue.push(...step.outbox);
    }
  }
  return r;
}

/** 새 게임. players는 차례 순서(나 + 컴퓨터들). 혼자 하기라 차례 시간은 없애요 */
export function startRoom(logic, settings, players, now) {
  const s = logic.untimed ? logic.untimed(settings) : settings;
  const step = logic.host.start(s, players, now);
  const room = { logic, players, game: step.state, view: logic.client.init(s), botSeen: null, botSeenAt: 0 };
  return deliver(room, step.outbox, now);
}

/** 내가 한 일(숫자 부르기·다음 판 등). 규칙에 맞지 않으면 그대로예요 */
export function sendFromMe(room, message, now) {
  const step = room.logic.host.receive(room.game, ME, message, ME, now);
  if (step.state === room.game && step.outbox.length === 0) return room;
  return deliver({ ...room, game: step.state }, step.outbox, now);
}

/** 내 화면 상태를 먼저 바꾸고, 답이 있으면 방장에게 보내요(빙고에서 직접 채운 판 내기처럼 화면이 먼저 아는 일) */
export function actFromMe(room, act, now) {
  const { view, reply } = act(room.view);
  const next = { ...room, view };
  return reply ? sendFromMe(next, reply, now) : next;
}

/** 컴퓨터 하나를 움직여요. 아무도 할 일이 없으면 null */
function botStep(room, game, now, random) {
  for (const id of room.players) {
    if (!isBotId(id)) continue;
    const message = room.logic.bot?.act(game, id, random, now);
    if (!message) continue;
    const step = room.logic.host.receive(game, id, message, ME, now);
    if (step.state === game && step.outbox.length === 0) continue; // 규칙에 맞지 않아 무시됨
    return step;
  }
  return null;
}

/** 시간이 흐름: 시간 제한이 있는 게임이면 알리고, 할 일이 있는 컴퓨터 하나가 움직여요 */
export function tickRoom(room, now, random = Math.random) {
  let r = room;
  const tick = r.logic.host.tick;
  if (tick) {
    const step = tick(r.game, now, false);
    if (step.state !== r.game || step.outbox.length > 0) r = deliver({ ...r, game: step.state }, step.outbox, now);
  }
  const bot = r.logic.bot;
  if (!bot) return r;
  if (r.game !== r.botSeen) return { ...r, botSeen: r.game, botSeenAt: now };
  if (now - r.botSeenAt < bot.delay(r.game)) return r;
  const step = botStep(r, r.game, now, random);
  return step ? deliver({ ...r, game: step.state }, step.outbox, now) : r;
}

/** 나는 끝나고 컴퓨터끼리만 남았는지(그 게임이 알려 줄 때만) */
export const onlyBotsLeft = (room) => Boolean(room.logic.bot?.onlyBots?.(room.game, isBotId));

/**
 * 결과 바로 보기: 컴퓨터끼리만 남았을 때 같은 규칙으로 남은 판을 순식간에 끝까지 돌려요.
 * 너무 오래 안 끝나면 게임이 정한 방법(forceEnd)으로 지금 상태에서 끝내요
 */
export function finishBots(room, now, random = Math.random, limit = 3000) {
  if (!onlyBotsLeft(room)) return room;
  let game = room.game;
  let outbox = [];
  for (let i = 0; i < limit && room.logic.bot.onlyBots(game, isBotId); i++) {
    const step = botStep(room, game, now, random);
    if (!step) break;
    game = step.state;
    outbox = step.outbox;
  }
  if (room.logic.bot.onlyBots(game, isBotId) && room.logic.host.forceEnd) {
    const step = room.logic.host.forceEnd(game, now);
    game = step.state;
    outbox = step.outbox;
  }
  return deliver({ ...room, game }, outbox, now);
}
