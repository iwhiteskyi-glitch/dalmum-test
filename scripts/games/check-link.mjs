// 짝꿍 잇기 검증: 선 찾기·미끄러짐·섞기·단계 판·오늘의 판. 실행: node scripts/games/check-link.mjs
// 읽을거리(link-tips)에 쓴 숫자(처음 이을 수 있는 쌍 수, 섞기 횟수 등)도 여기서 계산해 보여 줘요.
import {
  allPairs,
  applySlide,
  EMPTY,
  endlessSpec,
  findPath,
  isCleared,
  LEVELS,
  makeBoard,
  removePair,
  reshuffle,
  TILE_PICTURES,
  tilesLeft,
} from "../../lib/games/link/link.js";
import { breakWithPower, linkPair, newPlay, shufflePlay, takeHint } from "../../lib/games/link/play.js";
import { dailyLinkBoard, DAILY_SPECS, starsFor } from "../../lib/games/link/record.js";
import { seededRandom } from "../../lib/games/slide/slide.js";
import { levelOf } from "../../lib/games/daily.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};
const E = EMPTY;

/* ---------- 선 찾기 ---------- */
{
  // 3×3 꽉 찬 판: 맨 윗줄 양 끝의 0은 위쪽 바깥 테두리로 두 번 꺾어 이어져요. 대각선 구석끼리는 세 번 꺾여야 해서 안 돼요
  const b = { cols: 3, rows: 3, slide: "none", cells: [0, 1, 1, 2, 3, 2, 4, 4, 0] };
  const top = { cols: 3, rows: 3, slide: "none", cells: [0, 1, 0, 2, 3, 2, 4, 5, 4] };
  check("바로 옆 같은 그림은 곧은 선", findPath(b, 1, 2)?.length === 2);
  check("테두리를 돌아 두 번 꺾임까지", findPath(top, 0, 2)?.length === 4 && findPath(top, 6, 8)?.length === 4);
  check("대각선 구석끼리는 세 번 꺾여야 해서 못 이음", findPath(b, 0, 8) === null);
  check("다른 그림은 못 이음", findPath(b, 0, 1) === null);
  check("같은 칸은 못 이음", findPath(b, 0, 0) === null);
  const blocked = { cols: 4, rows: 4, slide: "none", cells: [1, 2, 3, 4, 5, 0, 6, 7, 8, 9, 0, 10, 11, 12, 13, 14] };
  check("안쪽에 갇힌 둘은 세 번 꺾여야 해서 못 이음", findPath(blocked, 5, 10) === null);
  const open = { ...blocked, cells: blocked.cells.map((v, i) => (i === 6 || i === 9 ? E : v)) };
  check("빈칸이 생기면 이음", findPath(open, 5, 10) !== null);
}

/* ---------- 미끄러짐 ---------- */
{
  const b = { cols: 3, rows: 3, slide: "down", cells: [0, E, 1, E, 2, E, 3, E, 4] };
  check("아래로 미끄러짐", JSON.stringify(applySlide(b).cells) === JSON.stringify([E, E, E, 0, E, 1, 3, 2, 4]));
  const c = { cols: 4, rows: 1, slide: "center", cells: [0, E, E, 1] };
  check("가운데로 모임", JSON.stringify(applySlide(c).cells) === JSON.stringify([E, 0, 1, E]));
}

/* ---------- 한 판 진행 ---------- */
{
  const random = seededRandom(5);
  const board = makeBoard(LEVELS[0], random);
  let play = newPlay(board);
  const ids = new Set(play.ids);
  check("처음 이름표는 칸마다 하나", ids.size === board.cells.length);
  const hint = takeHint(play);
  check("힌트는 이을 수 있는 쌍", hint && findPath(play.board, ...hint.pair) !== null && hint.play.hintsLeft === 2);
  let steps = 0;
  while (!isCleared(play.board) && steps++ < 200) {
    const pair = allPairs(play.board, true)[0];
    if (!pair) {
      play = shufflePlay(play, random);
      continue;
    }
    play = linkPair(play, ...pair).play;
  }
  check("1단계 판을 끝까지 풀 수 있음", isCleared(play.board));
  const p2 = newPlay(makeBoard(LEVELS[3], seededRandom(9)));
  const powered = breakWithPower(p2, 0);
  check("파워는 같은 그림 하나와 함께 깨요", powered && tilesLeft(powered.play.board) === p2.board.cells.length - 2);
  check("이름표도 판과 같이 미끄러짐", powered.play.ids.every((id, i) => (id === E) === (powered.play.board.cells[i] === E)));
}

/* ---------- 단계 판 ---------- */
const stats = [];
for (const [i, spec] of LEVELS.entries()) {
  let okCount = 0;
  let firstPairs = 0;
  let shuffles = 0;
  const N = 40;
  for (let k = 0; k < N; k++) {
    const random = seededRandom(1000 + i * 100 + k);
    const board = makeBoard(spec, random);
    const counts = new Map();
    for (const v of board.cells) counts.set(v, (counts.get(v) || 0) + 1);
    const fair = board.cells.length === spec.cols * spec.rows && [...counts.values()].every((n) => n === 4) && counts.size === spec.kinds;
    const first = allPairs(board).length;
    firstPairs += first;
    if (fair && first > 0) okCount++;
    // 이을 수 있는 쌍 중 하나를 무작위로 골라 끝까지 풀며 섞기가 몇 번 필요한지 세요
    let b = board;
    let guard = 0;
    while (!isCleared(b) && guard++ < 400) {
      const pairs = allPairs(b);
      if (!pairs.length) {
        b = reshuffle(b, random);
        shuffles++;
        continue;
      }
      const [x, y] = pairs[Math.floor(random() * pairs.length)];
      b = removePair(b, x, y).board;
    }
    if (!isCleared(b)) okCount = -999;
  }
  stats.push({ stage: i + 1, size: `${spec.cols}×${spec.rows}`, slide: spec.slide, kinds: spec.kinds, firstPairs: (firstPairs / N).toFixed(1), shuffles: (shuffles / N).toFixed(2) });
  check(`${i + 1}단계 ${spec.cols}×${spec.rows} ${spec.slide}: 그림마다 4장·처음 이을 쌍 있음·무작위로 끝까지 풀림 ${okCount}/${N}`, okCount === N);
}
check("무한 도전 시간은 3분에서 판마다 10초씩, 2분 아래로 안 줄어요", endlessSpec(1).seconds === 180 && endlessSpec(7).seconds === 120 && endlessSpec(30).seconds === 120);
check("★: 절반 넘게 남으면 3개, 4분의 1 넘게 2개", starsFor(80000, 180) === 3 && starsFor(100000, 180) === 2 && starsFor(170000, 180) === 1);
check("타일 그림 36가지", TILE_PICTURES.length === 36);

/* ---------- 오늘의 판 ---------- */
{
  const day = (n) => new Date(Date.parse("2026-11-16T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
  let ok = 0;
  const seen = new Set();
  for (let n = 0; n < 200; n++) {
    const key = day(n);
    const a = dailyLinkBoard(key);
    const b = dailyLinkBoard(key);
    const spec = DAILY_SPECS[levelOf(key)] ?? DAILY_SPECS.medium;
    if (JSON.stringify(a) === JSON.stringify(b) && a.cols === spec.cols && a.rows === spec.rows && allPairs(a, true).length) ok++;
    seen.add(JSON.stringify(a.cells));
  }
  check(`오늘의 판 200일: 다시 만들어도 같음·크기 맞음·처음 이을 쌍 있음 ${ok}/200`, ok === 200);
  check(`오늘의 판 200일이 모두 달라요 (${seen.size})`, seen.size === 200);
}

console.log("\n단계별 평균(판 40개씩): 처음 이을 수 있는 쌍 수 · 무작위로 풀 때 섞기 횟수");
for (const s of stats) console.log(`${s.stage}단계 ${s.size} ${s.slide} 그림 ${s.kinds}가지: 처음 쌍 ${s.firstPairs}개, 섞기 ${s.shuffles}번`);
console.log(failed ? `\n실패 ${failed}개` : "\n모두 통과");
process.exit(failed ? 1 : 0);
