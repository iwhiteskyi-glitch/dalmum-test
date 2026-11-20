// 도둑잡기 검증: 카드·짝 버리기·뽑기·탈출·도둑과 점수·혼자 하기 방(컴퓨터 차례)·결과 바로 보기. 실행: node scripts/games/check-thief.mjs
// 읽을거리(thief-tips)에 쓴 숫자도 여기서 계산해 보여 줘요(씨앗 고정이라 다시 돌려도 같아요).
import { isJoker, rankOf } from "../../lib/games/onecard/cards.js";
import { thiefLogic } from "../../lib/games/thief/logic.js";
import { deckOf, discardPairs, drawCard, hoverCard, isOpening, nextRound, pauseAfter, sourceOf, startMatch } from "../../lib/games/thief/match.js";
import { finishBots, ME, onlyBotsLeft, sendFromMe, startRoom, tickRoom } from "../../lib/games/localRoom.js";
import { seededRandom } from "../../lib/games/slide/slide.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};

/* ---------- 카드와 짝 ---------- */
check("카드 53장(조커 1장)", deckOf().length === 53 && deckOf().filter(isJoker).length === 1);
{
  const { hand, pairs } = discardPairs(["S7", "H7", "D7", "XC", "CK", "SK", "H2"]);
  check("같은 숫자 두 장씩 버리고(7 셋 중 둘, K 둘) 조커는 남김", pairs.length === 2 && hand.length === 3 && hand.includes("XC") && hand.filter((c) => rankOf(c) === "7").length === 1);
}
{
  const r = seededRandom(5);
  let ok = true;
  for (let g = 0; g < 200; g++) {
    const m = startMatch({ lives: 3, turnSeconds: 0 }, ["a", "b", "c"], 0, r);
    for (const h of Object.values(m.round.hands)) {
      const ranks = h.filter((c) => !isJoker(c)).map(rankOf);
      ok &&= new Set(ranks).size === ranks.length; // 손에 같은 숫자가 둘 있으면 안 돼요
    }
    ok &&= Object.values(m.round.hands).flat().filter(isJoker).length === 1;
  }
  check("나눠 준 뒤 손에는 짝이 없고 조커는 한 장", ok);
}

/* ---------- 둘이 할 때: 두 사람 손의 숫자가 같고, 조커를 든 쪽이 한 장 더 많아요 ---------- */
{
  const r = seededRandom(6);
  let same = true;
  let oneMore = true;
  for (let g = 0; g < 500; g++) {
    let m = startMatch({ lives: 3, turnSeconds: 0 }, ["a", "b"], 0, r);
    while (!m.round.over) {
      const [x, y] = ["a", "b"].map((id) => m.round.hands[id]);
      const ranks = (h) => h.filter((c) => !isJoker(c)).map(rankOf).sort().join();
      same &&= ranks(x) === ranks(y);
      const holder = x.some(isJoker) ? x : y;
      const other = holder === x ? y : x;
      oneMore &&= holder.length === other.length + 1;
      const src = sourceOf(m.round);
      m = drawCard(m, m.round.turn, Math.floor(r() * m.round.hands[src].length), 0, r);
    }
  }
  check("둘이: 두 사람 손의 숫자는 늘 같음", same);
  check("둘이: 조커를 든 사람이 늘 한 장 더 많음", oneMore);
}

/* ---------- 경기 규칙 ---------- */
function playOut(m, r) {
  let guard = 0;
  while (!m.round.over && guard++ < 2000) {
    const src = sourceOf(m.round);
    m = drawCard(m, m.round.turn, Math.floor(r() * m.round.hands[src].length), 0, r);
  }
  return m;
}
{
  const r = seededRandom(9);
  let m = startMatch({ lives: 3, turnSeconds: 0 }, ["a", "b", "c"], 0, r);
  check("남의 차례에는 못 뽑음", drawCard(m, m.round.seats.find((id) => id !== m.round.turn), 0, 0, r) === null);
  const src = sourceOf(m.round);
  check("카드 들어 보기는 모두에게 보이는 자리 번호", hoverCard(m, m.round.turn, 0)?.round.hover === 0);
  const before = m.round.hands[src].length;
  const after = drawCard(m, m.round.turn, 0, 0, r);
  check("뽑으면 뽑힌 사람 1장 줄고, 차례는 뽑힌 사람에게", after.round.hands[src].length === before - 1 && (after.round.turn === src || after.round.out.includes(src)));
  check("뽑은 뒤 쉬는 시간(짝 2.2초·아니면 1.6초)", after.round.turnEndsAt === pauseAfter(after.round.lastDraw) && pauseAfter(after.round.lastDraw) >= 1600);
  m = playOut(m, r);
  const thief = m.round.thief;
  check("끝까지 하면 조커를 든 한 사람만 남고 그 사람이 도둑(1점 잃음)", m.round.over && thief && m.round.hands[thief].length === 1 && isJoker(m.round.hands[thief][0]) && m.points[thief] === 2);
  const n2 = nextRound(m, 0, r);
  check("다음 판은 지난 판 도둑부터", n2.round.seats[0] === thief && n2.roundNumber === 2);
}

/* ---------- 혼자 하기 방: 가짜 시계로 끝까지 ---------- */
function playRoom(bots, seed, lives) {
  const r = seededRandom(seed);
  let now = 1000;
  const players = [ME, ...Array.from({ length: bots }, (_, i) => `bot-${i + 1}`)];
  let room = startRoom(thiefLogic, { lives, turnSeconds: 0 }, players, now);
  let finished = 0;
  let rounds = 0;
  for (let step = 0; step < 200000; step++) {
    const m = room.view.match;
    if (m) {
      if (m.loser) return { room, finished, rounds };
      if (m.round.over) {
        rounds++;
        room = sendFromMe(room, { type: "next" }, now);
      } else if (m.round.turn === ME && now >= m.round.turnEndsAt) {
        const src = sourceOf(m.round);
        room = sendFromMe(room, { type: "draw", index: Math.floor(r() * m.round.handCounts[src]) }, now);
      } else if (onlyBotsLeft(room)) {
        room = finishBots(room, now, r);
        finished++;
        continue;
      }
    }
    room = tickRoom(room, now, r);
    now += 250;
  }
  return { room, stuck: true };
}
{
  const res = playRoom(3, 31, 3);
  const m = res.room.view.match;
  check(`컴퓨터 3명과 3점 경기가 꼴찌가 나올 때까지 감(${res.rounds + 1}판)`, !res.stuck && m.loser && m.points[m.loser] === 0);
  check("내 화면에는 내 패만(남의 패는 장수만)", Array.isArray(res.room.view.myHand) && !("hands" in m.round));
  // 방장의 카드 섞기는 Math.random이라 판마다 달라요. 내가 먼저 탈출하는 경기가 나올 때까지 몇 번 더 해요
  let finished = res.finished;
  for (let k = 0; k < 10 && !finished; k++) finished = playRoom(3, 40 + k, 3).finished;
  check(`내가 탈출하고 컴퓨터끼리 남으면 바로 끝냄(${finished}번)`, finished > 0);
  const opening = startRoom(thiefLogic, { lives: 3, turnSeconds: 0 }, [ME, "bot-1"], 0);
  check("첫 판은 룰렛 시간만큼 쉰 뒤 시작", isOpening(opening.game) && opening.view.left >= 5100);
}

/* ---------- 읽을거리에 쓴 숫자 ---------- */
function simulate(n, games, seed, lives = 3) {
  const r = seededRandom(seed);
  const ids = Array.from({ length: n }, (_, i) => `p${i}`);
  let draws = 0;
  let startHolderThief = 0;
  let firstOut = 0;
  const thiefBySeat = Array(n).fill(0);
  let startCards = 0;
  let pairsAtDeal = 0;
  let jokerMoves = 0;
  let plainDraws = 0;
  let plainPairs = 0;
  for (let g = 0; g < games; g++) {
    let m = startMatch({ lives, turnSeconds: 0 }, ids, 0, r);
    const holder = Object.keys(m.round.hands).find((id) => m.round.hands[id].some(isJoker));
    startCards += Object.values(m.round.hands).reduce((a, h) => a + h.length, 0) / n;
    pairsAtDeal += m.round.pairCount;
    let t = 0;
    let jokerAt = holder;
    while (!m.round.over && t < 5000) {
      const src = sourceOf(m.round);
      const idx = Math.floor(r() * m.round.hands[src].length);
      const plain = !isJoker(m.round.hands[src][idx]);
      m = drawCard(m, m.round.turn, idx, 0, r);
      if (plain) {
        plainDraws++;
        if (m.round.lastDraw.pair) plainPairs++;
      }
      const now = Object.keys(m.round.hands).find((id) => m.round.hands[id].some(isJoker));
      if (now !== jokerAt) jokerMoves++;
      jokerAt = now;
      t++;
    }
    draws += t;
    if (m.round.thief === holder) startHolderThief++;
    thiefBySeat[m.round.seats.indexOf(m.round.thief)]++;
    if (m.round.out[0] === m.round.seats[0]) firstOut++;
  }
  const pct = (x) => `${((x / games) * 100).toFixed(1)}%`;
  return {
    draws: (draws / games).toFixed(1),
    startHolder: pct(startHolderThief),
    bySeat: thiefBySeat.map(pct),
    startCards: (startCards / games).toFixed(1),
    pairsAtDeal: (pairsAtDeal / games).toFixed(1),
    jokerMoves: (jokerMoves / games).toFixed(1),
    pairRate: `${((plainPairs / plainDraws) * 100).toFixed(1)}%`,
  };
}
function matchLength(n, lives, games, seed) {
  const r = seededRandom(seed);
  const ids = Array.from({ length: n }, (_, i) => `p${i}`);
  let rounds = 0;
  let maxRounds = 0;
  for (let g = 0; g < games; g++) {
    let m = startMatch({ lives, turnSeconds: 0 }, ids, 0, r);
    let k = 1;
    for (;;) {
      m = playOut(m, r);
      if (m.loser) break;
      m = nextRound(m, 0, r);
      k++;
    }
    rounds += k;
    maxRounds = Math.max(maxRounds, k);
  }
  return { avg: (rounds / games).toFixed(1), max: maxRounds };
}
const N = 20000;
console.log("\n[읽을거리용 통계] 각 2만 판(뽑는 자리는 무작위)");
for (const n of [2, 3, 4]) {
  const s = simulate(n, N, 2026);
  console.log(`  ${n}명: 짝 버린 뒤 평균 ${s.startCards}장으로 시작 · 처음 버리는 짝 모두 합쳐 ${s.pairsAtDeal}쌍 · 한 판 평균 ${s.draws}번 뽑음 · 조커가 손을 옮긴 횟수 평균 ${s.jokerMoves}번 · 처음 조커를 받은 사람이 도둑 ${s.startHolder} · 자리별 도둑(먼저 뽑는 사람부터) ${s.bySeat.join(" / ")} · 조커 아닌 카드를 뽑았을 때 짝이 맞은 비율 ${s.pairRate}`);
}
for (const [n, lives] of [[2, 3], [3, 3], [4, 3], [4, 5]]) {
  const s = matchLength(n, lives, 5000, 77);
  console.log(`  ${n}명 · 시작 ${lives}점: 꼴찌가 나올 때까지 평균 ${s.avg}판(가장 길면 ${s.max}판)`);
}

console.log(failed ? `\n실패 ${failed}개` : "\n모두 통과");
process.exit(failed ? 1 : 0);
