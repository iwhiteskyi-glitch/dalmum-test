// 빙고 검증: 판·줄 세기·경기 규칙·혼자 하기 방(컴퓨터 차례)·기록. 실행: node scripts/games/check-bingo.mjs
// 읽을거리(bingo-tips)에 쓴 숫자도 여기서 계산해 보여 줘요(씨앗 고정이라 다시 돌려도 같아요).
import { BLACKOUT, countLines, createBoard, isAllowedCombination, isValidBoard, LINES } from "../../lib/games/bingo/bingo.js";
import { BOT_PICK_MS, chooseBingoNumber } from "../../lib/games/bingo/bot.js";
import { emptyDraft, fillRemainingRandom, finishDraft, nextUnused, placeNumber } from "../../lib/games/bingo/fill.js";
import { bingoLogic, submitBoard } from "../../lib/games/bingo/logic.js";
import { pickNumber, startMatch } from "../../lib/games/bingo/match.js";
import { SPIN_MS } from "../../lib/games/opening.js";
import { actFromMe, ME, sendFromMe, startRoom, tickRoom } from "../../lib/games/localRoom.js";
import { seededRandom } from "../../lib/games/slide/slide.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};

/* ---------- 판과 줄 ---------- */
check("줄은 12개(가로 5·세로 5·대각선 2)", LINES.length === 12 && BLACKOUT === 12);
{
  const board = Array.from({ length: 25 }, (_, i) => i + 1);
  check("가로 첫 줄만 불리면 1줄", countLines(board, [1, 2, 3, 4, 5]) === 1);
  check("대각선 1·7·13·19·25 → 1줄", countLines(board, [1, 7, 13, 19, 25]) === 1);
  check("25칸 다 불리면 12줄", countLines(board, board) === 12);
}
{
  const r = seededRandom(1);
  let ok = true;
  for (const max of [25, 50, 75, 100]) for (let i = 0; i < 50; i++) ok &&= isValidBoard(createBoard(max, r), max);
  check("무작위 판은 늘 겹치지 않는 25칸", ok);
  check("1~25 블랙빙고는 못 고름(모두 동시에 끝나서)", !isAllowedCombination(25, BLACKOUT) && isAllowedCombination(50, BLACKOUT));
}
{
  let d = emptyDraft();
  d = placeNumber(d, 0, 7);
  check("직접 채우기: 같은 숫자 두 번은 안 놓임", placeNumber(d, 1, 7) === d && nextUnused(d, 25) === 1);
  const full = finishDraft(fillRemainingRandom(d, 25, seededRandom(3)));
  check("남은 칸 랜덤으로 채우면 올바른 판(놓은 7은 그대로)", isValidBoard(full, 25) && full[0] === 7);
}

/* ---------- 경기 규칙 ---------- */
{
  const settings = { maxNumber: 25, lineTarget: 1, winsToChampion: 1, fillMode: "random" };
  // b 판은 1~5가 줄마다 하나씩 흩어져 있어서 a만 줄이 생겨요
  const b = Array(25).fill(0);
  [1, 7, 13, 19, 20].forEach((cell, i) => (b[cell] = i + 1));
  let fill = 6;
  for (let i = 0; i < 25; i++) if (!b[i]) b[i] = fill++;
  const boards = { a: Array.from({ length: 25 }, (_, i) => i + 1), b };
  let m = startMatch(settings, ["a", "b"], "a");
  check("차례가 아니면 못 부름", pickNumber(m, boards, "b", 1) === null);
  check("내 판에 없는 숫자는 못 부름", pickNumber(m, boards, "a", 26) === null);
  for (const [who, n] of [["a", 1], ["b", 2], ["a", 3], ["b", 4]]) m = pickNumber(m, boards, who, n);
  check("이미 불린 숫자는 못 부름", pickNumber(m, boards, "a", 1) === null);
  m = pickNumber(m, boards, "a", 5);
  check("가로 1~5 완성 → a 승리·우승", m.round.winners.join() === "a" && m.champions.join() === "a");
}

/* ---------- 혼자 하기 방: 가짜 시계로 끝까지 ---------- */
function playRoom(settings, bots, seed, manual = false) {
  const r = seededRandom(seed);
  let now = 1000;
  const players = [ME, ...Array.from({ length: bots }, (_, i) => `bot-${i + 1}`)];
  let room = startRoom(bingoLogic, settings, players, now);
  let early = false;
  for (let step = 0; step < 20000; step++) {
    const v = room.view;
    if (v.phase === "dealing" && manual && !v.myBoard) room = actFromMe(room, (view) => submitBoard(view, createBoard(settings.maxNumber, r)), now);
    const m = v.match;
    if (v.phase === "playing" && m) {
      if (m.champions.length) return { room, early };
      if (m.round.winners.length) room = sendFromMe(room, { type: "next" }, now);
      else if (m.round.turn === ME) room = sendFromMe(room, { type: "pick", number: chooseBingoNumber(v.myBoard, m.round.called, r) }, now);
    }
    const before = room.game;
    const seenAt = room.botSeenAt;
    room = tickRoom(room, now, r);
    // 컴퓨터는 상태가 바뀐 뒤 정해진 시간(첫 판 첫 수는 룰렛 시간까지)이 지나야 움직여요
    if (room.game !== before && before.match && before.match.round.turn !== ME && before.phase === "playing") {
      const wait = before.match.round.opening ? SPIN_MS + BOT_PICK_MS : BOT_PICK_MS;
      if (now - seenAt < wait) early = true;
    }
    now += 250;
  }
  return { room, early, stuck: true };
}
{
  const res = playRoom({ maxNumber: 25, lineTarget: 3, winsToChampion: 3, fillMode: "random", turnSeconds: 0 }, 3, 11);
  const m = res.room.view.match;
  check("컴퓨터 3명과 3승 경기가 끝까지 감", !res.stuck && m.champions.length > 0 && Math.max(...Object.values(m.wins)) === 3);
  check("컴퓨터는 기다리는 시간을 지킴", !res.early);
  check("내 화면에는 내 판만(컴퓨터 판은 방장 상태에만)", res.room.view.myBoard && !("boards" in res.room.view));
  const res2 = playRoom({ maxNumber: 75, lineTarget: BLACKOUT, winsToChampion: 1, fillMode: "manual", turnSeconds: 0 }, 1, 12, true);
  check("직접 채우기·1~75 블랙빙고도 끝까지 감", !res2.stuck && res2.room.view.match.champions.length > 0);
  // 다시 하기: 승수가 0으로 돌아가요
  const again = sendFromMe(res.room, { type: "restart" }, 1e9);
  let room = again;
  for (let i = 0; i < 20 && room.view.phase !== "playing"; i++) room = tickRoom(room, 1e9 + i * 1000);
  check("다시 하기는 승수 0부터", room.view.phase === "playing" && Object.values(room.view.match.wins).every((w) => w === 0));
}

/* ---------- 읽을거리에 쓴 숫자 ---------- */
// 고르는 방법: smart = 앱 컴퓨터(찬 줄을 채우는 숫자), random = 내 판에서 아무거나
const pickers = {
  smart: (board, called, r) => chooseBingoNumber(board, called, r),
  random: (board, called, r) => {
    const left = board.filter((n) => !called.includes(n));
    return left[Math.floor(r() * left.length)];
  },
};
function simulate({ maxNumber, lineTarget, kinds, games, seed }) {
  const r = seededRandom(seed);
  const ids = kinds.map((_, i) => `p${i}`);
  const wins = ids.map(() => 0);
  let ties = 0;
  let calledSum = 0;
  let firstWins = 0;
  for (let g = 0; g < games; g++) {
    const boards = Object.fromEntries(ids.map((id) => [id, createBoard(maxNumber, r)]));
    const opener = ids[g % ids.length];
    let m = startMatch({ maxNumber, lineTarget, winsToChampion: 1, fillMode: "random" }, ids, opener);
    while (!m.round.winners.length) {
      const id = m.round.turn;
      const k = ids.indexOf(id);
      m = pickNumber(m, boards, id, pickers[kinds[k]](boards[id], m.round.called, r));
    }
    calledSum += m.round.called.length;
    if (m.round.winners.length > 1) ties++;
    else {
      wins[ids.indexOf(m.round.winners[0])]++;
      if (m.round.winners[0] === opener) firstWins++;
    }
  }
  const pct = (n) => `${((n / games) * 100).toFixed(1)}%`;
  return { avgCalled: (calledSum / games).toFixed(1), wins: wins.map(pct), ties: pct(ties), firstWins: pct(firstWins) };
}
const N = 20000;
console.log("\n[읽을거리용 통계] 판마다 선공을 돌아가며, 각 2만 판");
for (const [label, opt] of [
  ["1~25·3줄·둘 다 컴퓨터 방식", { maxNumber: 25, lineTarget: 3, kinds: ["smart", "smart"] }],
  ["1~25·3줄·컴퓨터 방식 vs 아무거나", { maxNumber: 25, lineTarget: 3, kinds: ["smart", "random"] }],
  ["1~50·3줄·컴퓨터 방식 vs 아무거나", { maxNumber: 50, lineTarget: 3, kinds: ["smart", "random"] }],
  ["1~50·3줄·둘 다 컴퓨터 방식", { maxNumber: 50, lineTarget: 3, kinds: ["smart", "smart"] }],
  ["1~25·1줄·둘 다 컴퓨터 방식", { maxNumber: 25, lineTarget: 1, kinds: ["smart", "smart"] }],
  ["1~25·5줄·둘 다 컴퓨터 방식", { maxNumber: 25, lineTarget: 5, kinds: ["smart", "smart"] }],
  ["1~50·블랙빙고·둘 다 컴퓨터 방식", { maxNumber: 50, lineTarget: BLACKOUT, kinds: ["smart", "smart"] }],
  ["1~25·3줄·넷 다 컴퓨터 방식", { maxNumber: 25, lineTarget: 3, kinds: ["smart", "smart", "smart", "smart"] }],
  ["1~25·3줄·나(아무거나)+컴퓨터 3", { maxNumber: 25, lineTarget: 3, kinds: ["random", "smart", "smart", "smart"] }],
]) {
  const s = simulate({ ...opt, games: N, seed: 2026 });
  console.log(`  ${label}: 끝날 때까지 불린 숫자 평균 ${s.avgCalled}개 · 승률 ${s.wins.join(" / ")} · 공동 승리 ${s.ties} · 선공이 이긴 판 ${s.firstWins}`);
}
{
  // 1~25 판에서 숫자 k개가 불렸을 때 3줄 이상일 확률(부르는 순서가 무작위일 때)
  const r = seededRandom(7);
  const board = Array.from({ length: 25 }, (_, i) => i + 1);
  const out = [];
  for (const k of [12, 14, 16, 18, 20]) {
    let hit = 0;
    for (let t = 0; t < N; t++) {
      const order = createBoard(25, r).slice(0, k);
      if (countLines(board, order) >= 3) hit++;
    }
    out.push(`${k}개 ${((hit / N) * 100).toFixed(1)}%`);
  }
  console.log(`  무작위로 숫자 k개가 지워졌을 때 3줄 이상일 확률: ${out.join(" · ")}`);
  // 3줄을 만드는 데 필요한 가장 적은 칸 수
  let min = 99;
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) min = Math.min(min, new Set([...LINES[i], ...LINES[j], ...LINES[k]]).size);
  console.log(`  3줄을 만드는 가장 적은 칸 수: ${min}칸`);
}

console.log(failed ? `\n실패 ${failed}개` : "\n모두 통과");
process.exit(failed ? 1 : 0);
