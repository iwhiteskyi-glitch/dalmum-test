// 숫자 타일 검증: 타일·묶음 규칙·첫 등록·차례 마치기·막힘·혼자 하기 방(컴퓨터 차례). 실행: node scripts/games/check-tiles.mjs
// 읽을거리(tiles-tips)에 쓴 숫자도 여기서 계산해 보여 줘요(씨앗 고정이라 다시 돌려도 같아요).
import { allTiles, colorOf, draftProblem, FIRST_JOKER, groupSum, handValue, isValidGroup, numberOf, runStart, setNumber, shuffle, TILE_COUNT } from "../../lib/games/tiles/tiles.js";
import { planTurn } from "../../lib/games/tiles/bot.js";
import { tilesLogic } from "../../lib/games/tiles/logic.js";
import { drawTile, editDraft, finishTurn, startMatch } from "../../lib/games/tiles/match.js";
import { ME, sendFromMe, startRoom, tickRoom } from "../../lib/games/localRoom.js";
import { seededRandom } from "../../lib/games/slide/slide.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};
// 색 c(0~3), 숫자 n(1~13), 벌 k(0~1)의 타일 번호
const T = (c, n, k = 0) => c * 26 + k * 13 + (n - 1);
const J = FIRST_JOKER;

/* ---------- 타일과 묶음 ---------- */
check("타일 106개(색 4 × 1~13 × 2벌 + 조커 2)", TILE_COUNT === 106 && allTiles().length === 106);
check("번호 → 색·숫자", colorOf(T(2, 7, 1)) === 2 && numberOf(T(2, 7, 1)) === 7 && numberOf(T(3, 13)) === 13);
check("같은 숫자: 색이 다른 7 셋", setNumber([T(0, 7), T(1, 7), T(2, 7)]) === 7);
check("같은 숫자: 같은 색이 섞이면 안 됨", setNumber([T(0, 7), T(0, 7, 1), T(2, 7)]) === null);
check("이어진 숫자: 같은 색 4·5·6", runStart([T(1, 4), T(1, 5), T(1, 6)]) === 4);
check("이어진 숫자: 13 다음 1로는 안 이어짐", runStart([T(1, 12), T(1, 13), T(1, 1)]) === null);
check("조커는 빈 자리를 채움(4·☺·6)", isValidGroup([T(1, 4), J, T(1, 6)]) && groupSum([T(1, 4), J, T(1, 6)]) === 15);
check("두 개로는 묶음이 안 됨", !isValidGroup([T(0, 1), T(0, 2)]));
check("남은 값: 조커는 30", handValue([J, T(0, 5)]) === 35);

/* ---------- 첫 등록과 차례 마치기 ---------- */
{
  const board = [];
  check("첫 등록 30 미만이면 못 마침", draftProblem(board, [[T(0, 1), T(0, 2), T(0, 3)]], false, true) === "meldTooSmall");
  check("첫 등록 30 이상이면 됨(10·11·12 = 33)", draftProblem(board, [[T(0, 10), T(0, 11), T(0, 12)]], false, true) === null);
  check("첫 등록 제한 없음이면 1·2·3도 됨", draftProblem(board, [[T(0, 1), T(0, 2), T(0, 3)]], false, false) === null);
  const old = [[T(1, 5), T(1, 6), T(1, 7)]];
  check("첫 등록 때 판의 묶음을 건드리면 안 됨", draftProblem(old, [[T(1, 5), T(1, 6), T(1, 7), T(1, 8)]], false, true) === "touchedBoard");
  check("등록 뒤에는 판의 묶음에 붙여도 됨", draftProblem(old, [[T(1, 5), T(1, 6), T(1, 7), T(1, 8)]], true, true) === null);
  check("아무것도 안 내면 못 마침", draftProblem(old, old, true, true) === "nothingLaid");
  check("규칙에 안 맞는 묶음이 있으면 못 마침", draftProblem(old, [...old, [T(0, 1), T(2, 9)]], true, true) === "invalidGroup");
}
{
  const r = seededRandom(3);
  let m = startMatch({ winsToChampion: 1, meld30: false, turnSeconds: 0 }, ["a", "b"], 0, r);
  const a = m.round.turn;
  const fake = T(3, 13, 1);
  check("손에 없는 타일로는 판을 못 고침", m.round.hands[a].includes(fake) || editDraft(m, a, [[fake]]) === null);
  const before = m.round.poolCount ?? m.round.pool.length;
  m = drawTile(m, a, 0);
  check("가져가면 1장 받고 차례가 넘어감", m.round.hands[a].length === 15 && m.round.pool.length === before - 1 && m.round.turn !== a);
  // 막힘: 더미가 비고 모두 한 바퀴 넘기면 남은 값이 적은 사람이 이겨요
  let s = { ...m, round: { ...m.round, pool: [] } };
  s = drawTile(s, s.round.turn, 0);
  s = drawTile(s, s.round.turn, 0);
  const vals = s.round.order.map((id) => handValue(s.round.hands[id]));
  check("막히면 남은 값이 가장 적은 사람이 이김", s.round.winners.length > 0 && s.round.winners.every((id) => handValue(s.round.hands[id]) === Math.min(...vals)));
}

/* ---------- 혼자 하기 방: 가짜 시계로 끝까지 ---------- */
function playRoom(bots, seed, settings) {
  const r = seededRandom(seed);
  let now = 1000;
  const players = [ME, ...Array.from({ length: bots }, (_, i) => `bot-${i + 1}`)];
  let room = startRoom(tilesLogic, { ...settings, turnSeconds: 0 }, players, now);
  let myTurns = 0;
  let laid = 0;
  for (let step = 0; step < 200000; step++) {
    const m = room.view.match;
    if (m) {
      if (m.champions.length) return { room, myTurns, laid };
      if (m.round.winners.length) room = sendFromMe(room, { type: "next" }, now);
      else if (m.round.turn === ME && (!m.round.opening || now > 7000)) {
        // 나도 컴퓨터와 같은 방법으로: 고쳐 보내고 → 마치기, 낼 게 없으면 가져가기
        myTurns++;
        const plan = planTurn(room.view.myHand, m.round.board, m.round.melded.includes(ME), m.settings.meld30);
        if (plan) {
          room = sendFromMe(room, { type: "edit", draft: plan }, now);
          const before = room.view.myHand.length;
          room = sendFromMe(room, { type: "done" }, now);
          if (room.view.myHand.length < before || room.view.match.round.winners.includes(ME)) laid++;
        } else room = sendFromMe(room, { type: "draw" }, now);
      }
    }
    room = tickRoom(room, now, r);
    now += 250;
  }
  return { room, stuck: true };
}
{
  const res = playRoom(3, 41, { winsToChampion: 2, meld30: true });
  check(`컴퓨터 3명과 2승 경기가 끝까지 감(내 차례 ${res.myTurns}번 · 내려놓은 차례 ${res.laid}번)`, !res.stuck && res.room.view.match.champions.length > 0 && res.laid > 0);
  check("내 화면에는 내 손만(남의 손은 장수만)", Array.isArray(res.room.view.myHand) && !("hands" in res.room.view.match.round));
}

/* ---------- 읽을거리에 쓴 숫자 ---------- */
const N = 20000;
{
  // 처음 받은 14장으로 바로 첫 등록(30 이상)을 할 수 있는 확률 · 제한 없음이면 묶음 하나라도 낼 수 있는 확률(컴퓨터 방법 기준)
  const r = seededRandom(2026);
  let can30 = 0;
  let canAny = 0;
  let jokerIn = 0;
  let value = 0;
  for (let g = 0; g < N; g++) {
    const hand = shuffle(allTiles(), r).slice(0, 14);
    if (planTurn(hand, [], false, true)) can30++;
    if (planTurn(hand, [], false, false)) canAny++;
    if (hand.some((t) => t >= FIRST_JOKER)) jokerIn++;
    value += handValue(hand);
  }
  const pct = (x) => `${((x / N) * 100).toFixed(1)}%`;
  console.log(`\n[읽을거리용 통계] 처음 14장(2만 번): 바로 첫 등록(30 이상) 가능 ${pct(can30)} · 묶음 하나라도 가능 ${pct(canAny)} · 조커가 하나라도 있음 ${pct(jokerIn)} · 손의 값 평균 ${(value / N).toFixed(1)}`);
}
function simulate(n, meld30, games, seed) {
  const r = seededRandom(seed);
  const ids = Array.from({ length: n }, (_, i) => `p${i}`);
  let turns = 0;
  let firstWins = 0;
  let stalemates = 0;
  let meldTurn = 0;
  let melds = 0;
  let leftTiles = 0;
  let leftCount = 0;
  let winnerValue = 0;
  let jokerStarts = 0;
  let jokerStartWins = 0;
  for (let g = 0; g < games; g++) {
    let m = startMatch({ winsToChampion: 1, meld30, turnSeconds: 0 }, ids, 0, r);
    const first = m.round.turn;
    const jokerHolders = ids.filter((id) => m.round.hands[id].some((t) => t >= FIRST_JOKER));
    const meldedAt = {};
    let t = 0;
    while (!m.round.winners.length && t < 2000) {
      const id = m.round.turn;
      const plan = planTurn(m.round.hands[id], m.round.board, m.round.melded.includes(id), meld30);
      if (plan) {
        m = finishTurn(editDraft(m, id, plan), id, 0);
        if (!(id in meldedAt)) meldedAt[id] = Math.floor(t / n) + 1;
      } else m = drawTile(m, id, 0);
      t++;
    }
    turns += t;
    if (m.round.winners.length === 1 && m.round.winners[0] === first) firstWins++;
    if (m.round.passes >= n) {
      stalemates++;
      for (const id of ids) {
        leftTiles += m.round.hands[id].length;
        leftCount++;
      }
      winnerValue += handValue(m.round.hands[m.round.winners[0]]);
    }
    for (const id of jokerHolders) {
      jokerStarts++;
      if (m.round.winners.includes(id)) jokerStartWins++;
    }
    for (const id of ids) if (id in meldedAt) {
      meldTurn += meldedAt[id];
      melds++;
    }
  }
  const pct = (x) => `${((x / games) * 100).toFixed(1)}%`;
  return { rounds: (turns / games / n).toFixed(1), first: pct(firstWins), stalemate: pct(stalemates), meldAt: (meldTurn / melds).toFixed(1), left: (leftTiles / leftCount).toFixed(1), winnerValue: (winnerValue / stalemates).toFixed(1), jokerWin: `${((jokerStartWins / jokerStarts) * 100).toFixed(1)}%` };
}
for (const [n, meld30] of [[2, true], [2, false], [4, true], [4, false]]) {
  const s = simulate(n, meld30, 5000, 77);
  console.log(`  ${n}명 · 첫 등록 ${meld30 ? "30" : "자유"} (컴퓨터 방법끼리 5천 판): 한 판 평균 ${s.rounds}바퀴 · 선공 승률 ${s.first} · 막혀서 끝난 판 ${s.stalemate} · 첫 등록까지 평균 ${s.meldAt}번째 차례 · 막힌 판에서 한 사람 손에 남은 타일 평균 ${s.left}개 · 막힌 판 승자의 남은 값 평균 ${s.winnerValue} · 조커를 쥐고 시작한 사람의 승률 ${s.jokerWin}`);
}

console.log(failed ? `\n실패 ${failed}개` : "\n모두 통과");
process.exit(failed ? 1 : 0);
