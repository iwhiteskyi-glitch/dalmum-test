// 체스 규칙·컴퓨터 검증. 실행: node scripts/games/check-chess.mjs
// 규칙은 앱 테스트의 핵심(캐슬링·앙파상·프로모션·체크메이트·스테일메이트)을 다시 확인하고,
// 컴퓨터 계산 판의 수 생성이 규칙 판과 똑같은지(perft) 비교해요.
import { newState, play, allLegalMoves, turnOf } from "../../lib/games/chess/rules.js";
import { pickMove, perft } from "../../lib/games/chess/ai.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};
const sq = (name) => (8 - Number(name[1])) * 8 + (name.charCodeAt(0) - 97);
const go = (state, ...names) => {
  let s = state;
  let last = null;
  for (const n of names) {
    const [a, b, promo] = n.split("-");
    last = play(s, { from: sq(a), to: sq(b), promotion: promo });
    if (!last) throw new Error(`둘 수 없는 수 ${n}`);
    s = last.state;
  }
  return { state: s, end: last.end };
};
const s0 = newState();
check("처음 판: 백이 둘 수 있는 수 20개", allLegalMoves(s0).length === 20);
// 바보 메이트
const fool = go(s0, "f2-f3", "e7-e5", "g2-g4", "d8-h4");
check("바보 메이트: 흑 승리(체크메이트)", fool.end && fool.end.winner === 1 && fool.end.reason === "체크메이트");
// 캐슬링
const castled = go(s0, "e2-e4", "e7-e5", "g1-f3", "b8-c6", "f1-c4", "g8-f6", "e1-g1");
check("킹 쪽 캐슬링: 룩이 f1로", castled.state.squares[sq("f1")] === "R" && castled.state.squares[sq("g1")] === "K");
// 앙파상
const ep = go(s0, "e2-e4", "a7-a6", "e4-e5", "d7-d5", "e5-d6");
check("앙파상: d5 폰이 잡혀요", ep.state.squares[sq("d5")] === "." && ep.state.squares[sq("d6")] === "P");
// 프로모션
{
  const s = { ...newState(), squares: "........" + ".P......" + ".".repeat(40) + "......k." + "K.......", castling: "" };
  const r = play(s, { from: sq("b7"), to: sq("b8"), promotion: "N" });
  check("프로모션: 고른 말(나이트)로 바뀌어요", r && r.state.squares[sq("b8")] === "N");
}
// 스테일메이트
{
  const squares = "k......." + "..Q....." + "........".repeat(5) + "K.......";
  const s = { ...newState(), squares, castling: "", turn: "w" };
  const r = play(s, { from: sq("c7"), to: sq("b6") });
  check("스테일메이트는 무승부", r && r.end && r.end.winner === null);
}

// 컴퓨터 판의 수 생성 = 규칙 판의 수 생성(여러 배치에서 개수 비교)
{
  let s = newState();
  let same = true;
  for (let i = 0; i < 60; i++) {
    const legal = allLegalMoves(s).length;
    // pickMove 내부 계산 판의 합법 수 개수는 chooseMove가 1단계 무작위로 고를 때 쓰는 목록과 같아요
    let count = 0;
    const seen = new Set();
    for (let k = 0; k < 400 && seen.size < legal + 1; k++) {
      const m = pickMove(s, 1, () => 0.0001 + ((k * 0.6180339) % 1) * 0.9998);
      if (m) seen.add(`${m.from}-${m.to}`);
      count++;
    }
    if (seen.size > legal) same = false;
    const m = pickMove(s, 3);
    const r = play(s, m);
    if (!r) {
      same = false;
      break;
    }
    if (r.end) break;
    s = r.state;
  }
  check("컴퓨터가 고르는 수는 모두 규칙상 둘 수 있는 수", same);
}
// 메이트 한 수 찾기
{
  // 백: Qh5 Bc4 → Qxf7#
  const s = go(s0, "e2-e4", "e7-e5", "f1-c4", "b8-c6", "d1-h5", "g8-f6").state;
  for (const level of [6, 9]) {
    const m = pickMove(s, level);
    check(`${level}단계는 한 수 메이트(Qxf7#)를 놓치지 않아요`, m && m.from === sq("h5") && m.to === sq("f7"));
  }
}
// 단계마다 끝까지 두어도 잘못된 수가 없어요
for (const level of [1, 4, 8]) {
  let s = newState();
  let ok = true;
  for (let i = 0; i < 160; i++) {
    const m = pickMove(s, level);
    const r = m && play(s, m);
    if (!r) {
      ok = false;
      break;
    }
    if (r.end) break;
    s = r.state;
  }
  check(`${level}단계끼리 끝까지 둬도 잘못된 수가 없어요`, ok);
}
// 수 생성 개수(perft) — 체스 프로그램 검증에 쓰는 알려진 정답과 비교
check("perft 시작 판 깊이 3 = 8902", perft(newState(), 3) === 8902);
{
  const kiwi = {
    ...newState(),
    squares: "r...k..r" + "p.ppqpb." + "bn..pnp." + "...PN..." + ".p..P..." + "..N..Q.p" + "PPPBBPPP" + "R...K..R",
  };
  check("perft kiwipete 깊이 3 = 97862 (캐슬링·앙파상·프로모션 포함)", perft(kiwi, 3) === 97862);
}
console.log(failed ? `\n${failed}개 실패` : "\n모두 통과");
process.exit(failed ? 1 : 0);
