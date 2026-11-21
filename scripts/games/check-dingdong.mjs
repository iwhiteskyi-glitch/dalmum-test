// 띵동 다섯 검증: 카드·5개 판정·펼치기·누르기(맞음·땡)·탈락·3분·혼자 하기 방(가짜 시계). 실행: node scripts/games/check-dingdong.mjs
// 읽을거리(dingdong-tips)에 쓴 숫자도 여기서 계산해 보여 줘요(카드 섞기까지 씨앗 고정이라 다시 돌려도 같아요).
import { BOT_REACT } from "../../lib/games/dingdong/bot.js";
import { makeDingDongLogic } from "../../lib/games/dingdong/logic.js";
import { countOf, deckOf, flipCard, hasFive, isResting, pressBell, resolveBell, ROUND_MS, snackOf, startMatch, topsOf } from "../../lib/games/dingdong/match.js";
import { ME, onlyBotsLeft, finishBots, sendFromMe, startRoom, tickRoom } from "../../lib/games/localRoom.js";
import { seededRandom } from "../../lib/games/slide/slide.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};

/* ---------- 카드와 5개 ---------- */
const deck = deckOf();
check("카드 56장(간식 4가지 × 14장)", deck.length === 56 && ["p", "j", "c", "s"].every((s) => deck.filter((c) => snackOf(c) === s).length === 14));
check("한 간식 그림 수 합 = 1×5+2×3+3×3+4×2+5 = 33", deck.filter((c) => snackOf(c) === "p").reduce((a, c) => a + countOf(c), 0) === 33);
check("프레첼 2 + 프레첼 3 = 5", hasFive(["p2", "p3"]));
check("프레첼 5 하나만 보여도 5", hasFive(["p5", "j2"]));
check("프레첼 5 + 프레첼 1 = 6은 아님", !hasFive(["p5", "p1"]));
check("서로 다른 간식은 따로 셈(프레첼 2 + 주스 3)", !hasFive(["p2", "j3"]));

/* ---------- 펼치기·누르기 ---------- */
{
  const r = seededRandom(4);
  let m = startMatch({ winsToChampion: 1, turnSeconds: 5, botSpeed: "normal" }, ["a", "b"], 0, r);
  const restEnd = m.round.turnEndsAt - 5000;
  check("시작하자마자는 쉬는 중(룰렛·더미 보여 주기)", isResting(m, 0) && !isResting(m, restEnd));
  const t = restEnd + 10;
  const first = m.round.turn;
  check("차례가 아니면 못 펼침", flipCard(m, first === "a" ? "b" : "a", t) === null);
  // 보이는 카드를 정해 두고 누르기를 시험해요
  const set = (tops, now) => ({ ...m, round: { ...m.round, faceUp: { a: [tops[0]], b: [tops[1]] }, seq: 3, seqAt: now, resolvedSeq: 2, turnEndsAt: now + 5000 } });
  let five = set(["p2", "p3"], t);
  five = pressBell(five, "b", 3, 800, t + 800);
  five = pressBell(five, "a", 3, 600, t + 850);
  const won = resolveBell(five, t + 1200);
  check("맞게 누른 사람 중 반응이 더 빠른 쪽이 펼친 카드를 가져감", won.round.lastBell.winner === "a" && won.round.lastBell.taken === 2 && won.round.piles.a.length === m.round.piles.a.length + 2);
  let wrong = set(["p2", "j3"], t);
  wrong = pressBell(wrong, "a", 3, 500, t + 500);
  const paid = resolveBell(wrong, t + 900);
  check("5개가 아닌데 누르면 땡: 다른 사람에게 한 장씩", paid.round.lastBell.winner === null && paid.round.piles.a.length === m.round.piles.a.length - 1 && paid.round.piles.b.length === m.round.piles.b.length + 1);
  check("판정 뒤에는 잠깐 쉬어요", isResting(won, t + 1300));
}

/* ---------- 혼자 하기 방: 가짜 시계 ---------- */
/** 나는 5개가 보이면 myReact ms 뒤에 누르고(놓치지 않음), 내 차례면 0.6초 뒤에 펼쳐요 */
function playRoom(bots, speed, myReact, seed, wins = 1, wrongRate = 0) {
  const r = seededRandom(seed);
  let now = 1000;
  const players = [ME, ...Array.from({ length: bots }, (_, i) => `bot-${i + 1}`)];
  // 방장의 카드 섞기도 씨앗으로 고정해서, 다시 돌려도 같은 숫자가 나와요
  let room = startRoom(makeDingDongLogic(seededRandom(seed * 7 + 3)), { winsToChampion: wins, turnSeconds: 5, botSpeed: speed }, players, now);
  let seqAt = { key: "", at: 0 };
  let pressed = "";
  const stats = { myBells: 0, botBells: 0, rounds: 0, timeUps: 0 };
  let lastBell = 0;
  for (let step = 0; step < 400000; step++) {
    const g = room.game;
    if (g.round.over) {
      stats.rounds++;
      if (g.round.timeUp) stats.timeUps++;
      if (g.champions.length) return { room, stats };
      room = sendFromMe(room, { type: "next" }, now);
      lastBell = 0;
      continue;
    }
    const resting = isResting(g, now);
    const key = `${g.roundNumber}-${g.round.seq}`;
    if (seqAt.key !== key) seqAt = { key, at: Math.max(now, g.round.turnEndsAt - 5000) };
    if (!resting && !g.round.out.includes(ME)) {
      if (hasFive(topsOf(g.round)) && g.round.seq > g.round.resolvedSeq && pressed !== key && now - seqAt.at >= myReact) {
        pressed = key;
        room = sendFromMe(room, { type: "press", seq: g.round.seq, reactMs: now - seqAt.at }, now);
      } else if (wrongRate > 0 && !hasFive(topsOf(g.round)) && g.round.seq > g.round.resolvedSeq && pressed !== key && now - seqAt.at >= myReact) {
        // 실수: 5개가 아닌데 이 비율로 잘못 눌러요(판 번호마다 한 번만 정해요)
        pressed = key;
        if (r() < wrongRate) {
          stats.wrongs = (stats.wrongs ?? 0) + 1;
          room = sendFromMe(room, { type: "press", seq: g.round.seq, reactMs: now - seqAt.at }, now);
        }
      } else if (g.round.turn === ME && !g.round.bell && now - seqAt.at >= 600) room = sendFromMe(room, { type: "flip" }, now);
    }
    if (onlyBotsLeft(room)) room = finishBots(room, now, r);
    const b = room.game.round.lastBell;
    if (b && b.n !== lastBell) {
      lastBell = b.n;
      if (b.winner === ME) stats.myBells++;
      else if (b.winner) stats.botBells++;
    }
    room = tickRoom(room, now, r);
    now += 50;
  }
  return { room, stats, stuck: true };
}
{
  const res = playRoom(2, "normal", 800, 51, 2);
  check(`컴퓨터 2명(보통)과 2승 경기가 끝까지 감(내 띵동 ${res.stats.myBells} · 컴퓨터 ${res.stats.botBells})`, !res.stuck && res.room.game.champions.length > 0);
  const slow = playRoom(1, "fast", 5000, 52);
  check("내가 아주 느리면 빠른 컴퓨터가 띵동을 가져감", !slow.stuck && slow.stats.botBells > slow.stats.myBells);
  check("판은 3분 안에 끝남", ROUND_MS === 180000);
}

/* ---------- 읽을거리에 쓴 숫자 ---------- */
{
  // 둘이 할 때 맨 위 두 장으로 5개가 보일 확률(정확히 세기)
  let five = 0;
  let total = 0;
  for (let i = 0; i < deck.length; i++)
    for (let j = 0; j < deck.length; j++) {
      if (i === j) continue;
      total++;
      if (hasFive([deck[i], deck[j]])) five++;
    }
  const one = deck.filter((c) => countOf(c) === 5).length;
  console.log(`\n[읽을거리용 통계] 5개짜리 카드 ${one}장(${((one / 56) * 100).toFixed(1)}%) · 둘이 맨 위 두 장으로 5개가 보일 확률 ${((five / total) * 100).toFixed(1)}%`);
  // 보이는 카드 수(사람 수)마다 5개가 보일 확률(무작위로 뽑은 n장)
  const r = seededRandom(9);
  const out = [];
  for (const n of [2, 3, 4]) {
    let hit = 0;
    const T = 200000;
    for (let t = 0; t < T; t++) {
      const pick = new Set();
      while (pick.size < n) pick.add(Math.floor(r() * 56));
      if (hasFive([...pick].map((k) => deck[k]))) hit++;
    }
    out.push(`${n}장 ${((hit / T) * 100).toFixed(1)}%`);
  }
  console.log(`  보이는 카드 n장에서 5개가 보일 확률: ${out.join(" · ")}`);
  for (const [k, v] of Object.entries(BOT_REACT)) console.log(`  컴퓨터 ${k}: ${v.min / 1000}~${v.max / 1000}초, 놓칠 확률 ${v.miss * 100}%`);
  // 내 반응 시간별로 보통 컴퓨터 2명과 1판씩 겨룬 결과
  for (const [speed, ms, bots = 2, wrongRate = 0] of [["normal", 600], ["normal", 900], ["normal", 1200], ["normal", 1500], ["fast", 600], ["fast", 900], ["slow", 1500], ["slow", 2000], ["normal", 1000, 3], ["normal", 1200, 3], ["normal", 1000, 2, 0.1], ["normal", 1000, 2, 0.2], ["normal", 1000, 2, 0.3]]) {
    let wins = 0;
    let mine = 0;
    let all = 0;
    let timeUps = 0;
    const G = 100;
    for (let g = 0; g < G; g++) {
      const res = playRoom(bots, speed, ms, 1000 + g, 1, wrongRate);
      if (res.room.game.champions.includes(ME)) wins++;
      mine += res.stats.myBells;
      all += res.stats.myBells + res.stats.botBells;
      timeUps += res.stats.timeUps;
    }
    console.log(`  내가 ${ms / 1000}초에 누를 때${wrongRate ? `(5개 아닐 때 ${wrongRate * 100}% 실수)` : ""} · 컴퓨터 ${bots}명(${speed}): 판 승률 ${((wins / G) * 100).toFixed(0)}% · 띵동을 가져간 비율 ${((mine / all) * 100).toFixed(0)}% · 3분이 다 된 판 ${((timeUps / G) * 100).toFixed(0)}%`);
  }
}

console.log(failed ? `\n실패 ${failed}개` : "\n모두 통과");
process.exit(failed ? 1 : 0);
