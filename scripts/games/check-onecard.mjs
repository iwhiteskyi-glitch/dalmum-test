// 원카드 검증: 카드 규칙·특수 카드·공격·파산·혼자 하기 방(컴퓨터 차례)·결과 바로 보기. 실행: node scripts/games/check-onecard.mjs
// 읽을거리(onecard-tips)에 쓴 숫자도 여기서 계산해 보여 줘요(씨앗 고정이라 다시 돌려도 같아요).
import { allCards, attackOf, BUST_SIZE, canPlay, HAND_SIZE, isJoker, rankOf, suitOf } from "../../lib/games/onecard/cards.js";
import { bestSuit, chooseCard, oneCardBot } from "../../lib/games/onecard/bot.js";
import { oneCardLogic } from "../../lib/games/onecard/logic.js";
import { drawCards, isOpening, playCard, startMatch, topOf } from "../../lib/games/onecard/match.js";
import { finishBots, ME, onlyBotsLeft, sendFromMe, startRoom, tickRoom } from "../../lib/games/localRoom.js";
import { seededRandom } from "../../lib/games/slide/slide.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};

/* ---------- 카드 규칙 ---------- */
check("카드 54장(조커 2장)", allCards().length === 54 && allCards().filter(isJoker).length === 2);
check("같은 무늬·같은 숫자는 낼 수 있음", canPlay("H3", "H9", "H", 0) && canPlay("S9", "H9", "H", 0) && !canPlay("S3", "H9", "H", 0));
check("7로 바꾼 무늬를 따라야 함", canPlay("C4", "H7", "C", 0) && !canPlay("H4", "H7", "C", 0));
check("조커 다음은 아무 카드나", canPlay("D5", "XB", null, 0));
check("공격 세기 2 < A < 흑백 조커 < 컬러 조커", attackOf("S2") === 2 && attackOf("SA") === 3 && attackOf("XB") === 5 && attackOf("XC") === 7);
check("공격 중엔 같거나 센 공격 카드만", canPlay("D2", "S2", "S", 2) && canPlay("XB", "SA", "S", 3) && !canPlay("S9", "S2", "S", 2) && !canPlay("D2", "SA", "S", 3));
check("2 위의 A는 같은 무늬만", canPlay("SA", "S2", "S", 2) && !canPlay("HA", "S2", "S", 2));

/* ---------- 경기 규칙(정해 둔 패로) ---------- */
function fixed(hands, top, order = Object.keys(hands)) {
  const m = startMatch({ winsToChampion: 1, turnSeconds: 0 }, order, 0, seededRandom(1));
  const used = new Set([...Object.values(hands).flat(), top]);
  const pool = allCards().filter((c) => !used.has(c));
  return { ...m, round: { ...m.round, order, turn: order[0], hands, pool, discard: [top], suit: suitOf(top), recent: [{ seq: 0, card: top, by: null }] } };
}
{
  let m = fixed({ a: ["HK", "H3", "S9"], b: ["D4", "D5"], c: ["C4", "C5"] }, "H9");
  m = playCard(m, "a", "HK", null, 0);
  check("K: 한 번 더", m.round.turn === "a");
  m = fixed({ a: ["HJ", "S9"], b: ["D4", "D5"], c: ["C4", "C5"] }, "H9");
  check("J: 다음 사람 건너뜀(셋이면 c 차례)", playCard(m, "a", "HJ", null, 0).round.turn === "c");
  m = fixed({ a: ["HQ", "S9"], b: ["D4", "D5"], c: ["C4", "C5"] }, "H9");
  const q = playCard(m, "a", "HQ", null, 0);
  check("Q: 방향 바뀜(셋이면 c 차례)", q.round.turn === "c" && q.round.direction === -1);
  m = fixed({ a: ["H7", "S9"], b: ["D4", "D5"] }, "H9");
  check("7은 무늬를 골라야 냄", playCard(m, "a", "H7", null, 0) === null && playCard(m, "a", "H7", "D", 0).round.suit === "D");
  m = fixed({ a: ["H2", "S9"], b: ["D4", "D5"] }, "H9");
  const atk = drawCards(playCard(m, "a", "H2", null, 0), "b", 0, seededRandom(2));
  check("2 공격을 못 넘기면 2장 먹음", atk.round.hands.b.length === 4 && atk.round.attack === 0 && atk.round.event?.kind === "ate");
  m = fixed({ a: ["H2", "S9"], b: ["D2", "D5"], c: ["C4", "C5"] }, "H9");
  m = playCard(playCard(m, "a", "H2", null, 0), "b", "D2", null, 0);
  check("공격은 넘기면 더해짐(2+2=4)", m.round.attack === 4 && m.round.turn === "c");
  m = fixed({ a: ["S9"], b: ["D4", "D5"] }, "H9");
  check("마지막 카드를 내면 그 판 승리", playCard(m, "a", "S9", null, 0).round.winner === "a");
  m = fixed({ a: ["XC", "S9"], b: Array.from({ length: 14 }, (_, i) => allCards()[13 + i]), c: ["C4", "C5"] }, "H9");
  const bust = drawCards(playCard(m, "a", "XC", null, 0), "b", 0, seededRandom(3));
  check(`${BUST_SIZE}장 이상이면 파산하고 판에서 빠짐`, bust.round.busted.includes("b") && !bust.round.order.includes("b") && bust.round.discard.length > 2);
}

/* ---------- 혼자 하기 방: 가짜 시계로 끝까지 ---------- */
function playRoom(bots, seed, wins, iGiveUp = false) {
  const r = seededRandom(seed);
  let now = 1000;
  const players = [ME, ...Array.from({ length: bots }, (_, i) => `bot-${i + 1}`)];
  let room = startRoom(oneCardLogic, { winsToChampion: wins, turnSeconds: 0 }, players, now);
  let early = false;
  let finished = false;
  for (let step = 0; step < 60000; step++) {
    const m = room.view.match;
    if (m) {
      if (m.champions.length) return { room, early, finished };
      if (m.round.winner !== null) room = sendFromMe(room, { type: "next" }, now);
      else if (m.round.turn === ME) {
        // 나는 컴퓨터와 같은 방법으로 두거나(iGiveUp이면 늘 먹어서 파산)
        const msg = iGiveUp ? { type: "draw" } : oneCardBot.act(room.game, ME, r, now);
        room = sendFromMe(room, msg, now);
      } else if (onlyBotsLeft(room)) {
        room = finishBots(room, now, r);
        finished = true;
        continue;
      }
    }
    const before = room.game;
    const seenAt = room.botSeenAt;
    room = tickRoom(room, now, r);
    if (room.game !== before && before.round.turn !== ME && before.round.winner === null) {
      const wait = isOpening(before) ? 5100 + 1500 : 1500;
      if (now - seenAt < wait) early = true;
    }
    now += 250;
  }
  return { room, early, stuck: true };
}
{
  const res = playRoom(3, 21, 2);
  const m = res.room.view.match;
  check("컴퓨터 3명과 2승 경기가 끝까지 감", !res.stuck && m.champions.length > 0);
  check("컴퓨터는 기다리는 시간을 지킴(첫 수는 룰렛까지)", !res.early);
  check("내 화면에는 내 패만(남의 패는 장수만)", Array.isArray(res.room.view.myHand) && !("hands" in m.round) && typeof m.round.handCounts === "object");
  const bust = playRoom(2, 22, 1, true);
  check("내가 파산하면 컴퓨터끼리 남은 판을 바로 끝냄", !bust.stuck && bust.finished && bust.room.view.match.round.busted.includes(ME) && bust.room.view.match.champions.length === 1);
}

/* ---------- 읽을거리에 쓴 숫자 ---------- */
// 고르는 방법: bot = 앱 컴퓨터(공격 카드·조커는 아끼다가 누가 2장 이하면 씀, K 먼저, 7은 아낌)
//            rush = 낼 수 있는 카드 중 공격 카드를 가장 먼저(아끼지 않음), random = 낼 수 있는 것 아무거나
const pickers = {
  bot: (m, id, r) => oneCardBot.act(m, id, r, 0),
  random: (m, id, r) => {
    const round = m.round;
    const hand = round.hands[id];
    const options = hand.filter((c) => canPlay(c, topOf(round), round.suit, round.attack));
    if (!options.length) return { type: "draw" };
    const card = options[Math.floor(r() * options.length)];
    const rest = hand.filter((c) => c !== card);
    return { type: "play", card, suit: rankOf(card) === "7" && rest.length ? bestSuit(rest) : null };
  },
  rush: (m, id) => {
    const round = m.round;
    const hand = round.hands[id];
    const options = hand.filter((c) => canPlay(c, topOf(round), round.suit, round.attack));
    if (!options.length) return { type: "draw" };
    const card = round.attack > 0 ? chooseCard(hand, options, true, false) : [...options].sort((a, b) => attackOf(b) - attackOf(a))[0];
    const rest = hand.filter((c) => c !== card);
    return { type: "play", card, suit: rankOf(card) === "7" && rest.length ? bestSuit(rest) : null };
  },
};
function simulate(kinds, games, seed) {
  const r = seededRandom(seed);
  const ids = kinds.map((_, i) => `p${i}`);
  const wins = ids.map(() => 0);
  let firstWins = 0;
  let turns = 0;
  let busts = 0;
  let bustRounds = 0;
  const bustBy = ids.map(() => 0);
  let maxAttack = 0;
  let bigAttacks = 0;
  for (let g = 0; g < games; g++) {
    let m = startMatch({ winsToChampion: 1, turnSeconds: 0 }, ids, 0, r);
    const first = m.round.turn;
    let t = 0;
    while (m.round.winner === null && t < 3000) {
      const id = m.round.turn;
      const msg = pickers[kinds[ids.indexOf(id)]](m, id, r);
      if (msg.type === "draw" && m.round.attack >= 7) bigAttacks++;
      maxAttack = Math.max(maxAttack, m.round.attack);
      m = msg.type === "draw" ? drawCards(m, id, 0, r) : playCard(m, id, msg.card, msg.suit, 0);
      t++;
    }
    turns += t;
    busts += m.round.busted.length;
    if (m.round.busted.length) bustRounds++;
    m.round.busted.forEach((b) => bustBy[ids.indexOf(b)]++);
    wins[ids.indexOf(m.round.winner)]++;
    if (m.round.winner === first) firstWins++;
  }
  const pct = (x) => `${((x / games) * 100).toFixed(1)}%`;
  return { wins: wins.map(pct), first: pct(firstWins), turns: (turns / games).toFixed(1), bustRounds: pct(bustRounds), busts: (busts / games).toFixed(2), bustBy: bustBy.map(pct), maxAttack, bigAttacks: (bigAttacks / games).toFixed(2) };
}
const N = 20000;
console.log("\n[읽을거리용 통계] 각 2만 판(한 판만, 선공은 무작위)");
for (const [label, kinds] of [
  ["둘이 · 둘 다 컴퓨터 방식", ["bot", "bot"]],
  ["둘이 · 컴퓨터 방식 vs 아무거나", ["bot", "random"]],
  ["둘이 · 컴퓨터 방식 vs 공격 먼저(안 아낌)", ["bot", "rush"]],
  ["셋이 · 모두 컴퓨터 방식", ["bot", "bot", "bot"]],
  ["넷이 · 모두 컴퓨터 방식", ["bot", "bot", "bot", "bot"]],
  ["넷이 · 나(아무거나)+컴퓨터 3", ["random", "bot", "bot", "bot"]],
]) {
  const s = simulate(kinds, N, 2026);
  console.log(`  ${label}: 승률 ${s.wins.join(" / ")} · 선공 승률 ${s.first} · 한 판 평균 ${s.turns}차례 · 파산이 나온 판 ${s.bustRounds}(판마다 평균 ${s.busts}명) · 자리별 파산 ${s.bustBy.join(" / ")} · 7장 이상 먹은 일 판마다 ${s.bigAttacks}번 · 가장 크게 쌓인 공격 ${s.maxAttack}장`);
}
{
  // 처음 받은 7장에 공격 카드(2·A·조커, 10장)가 하나라도 있을 확률
  const comb = (n, k) => {
    let v = 1;
    for (let i = 0; i < k; i++) v = (v * (n - i)) / (i + 1);
    return v;
  };
  const atk = allCards().filter((c) => attackOf(c) > 0).length;
  const p = 1 - comb(54 - atk, HAND_SIZE) / comb(54, HAND_SIZE);
  console.log(`  공격 카드 ${atk}장 · 처음 7장에 공격 카드가 하나라도 있을 확률 ${(p * 100).toFixed(1)}%`);
  const special = allCards().filter((c) => ["7", "J", "Q", "K"].includes(rankOf(c))).length;
  console.log(`  특수 카드(7·J·Q·K) ${special}장`);
}

console.log(failed ? `\n실패 ${failed}개` : "\n모두 통과");
process.exit(failed ? 1 : 0);
