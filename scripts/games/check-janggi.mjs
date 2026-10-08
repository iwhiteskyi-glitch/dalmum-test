// 장기 규칙·컴퓨터 검증. 실행: node scripts/games/check-janggi.mjs
// 앱 테스트(janggi.test.ts)의 핵심을 다시 확인하고, 컴퓨터 계산 판의 수 생성이 규칙과 같은지 비교해요.
import { COLS, newState, legalTargets, pseudoTargets, play, inCheck, isBikjang, sideOfPiece, POINTS, MOVE_LIMIT, scores } from "../../lib/games/janggi/rules.js";
import { pickMove, pseudoMoveList } from "../../lib/games/janggi/ai.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};
const at = (r, c) => r * COLS + c;
const pt = (p) => [Math.floor(p / COLS), p % COLS];
function boardWith(pieces, turn = 0) {
  const sq = Array(90).fill(".");
  for (const [r, c, p] of pieces) sq[at(r, c)] = p;
  return { ...newState(), squares: sq.join(""), turn };
}
const targets = (state, r, c) =>
  legalTargets(state, at(r, c))
    .map(pt)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const has = (list, rc) => list.some(([r, c]) => r === rc[0] && c === rc[1]);
const KINGS = [
  [9, 3, "K"],
  [0, 5, "k"],
];

// 상차림
{
  const s = newState("HEHE", "EHEH");
  check("상차림: 초는 왼쪽부터 마상마상", [1, 2, 6, 7].map((c) => s.squares[at(9, c)]).join("") === "HEHE");
  check("상차림: 한은 한 쪽에서 본 왼쪽부터 상마상마", [7, 6, 2, 1].map((c) => s.squares[at(0, c)]).join("") === "eheh");
}
// 말의 움직임
check("궁은 궁성 가운데에서 8방향", targets(boardWith([[8, 4, "K"], [0, 5, "k"]]), 8, 4).length === 8);
check("궁성 모서리 궁은 3곳", JSON.stringify(targets(boardWith(KINGS), 9, 3)) === JSON.stringify([[8, 3], [8, 4], [9, 4]]));
check("궁성 가장자리 가운데(8,3)에서는 대각선이 없어요", JSON.stringify(targets(boardWith([[8, 3, "A"], ...KINGS]), 8, 3)) === JSON.stringify([[7, 3], [8, 4]]));
{
  const r = targets(boardWith([[7, 3, "R"], [9, 4, "K"], [0, 5, "k"]]), 7, 3);
  check("차는 궁성 대각선 선을 따라서도 가요", has(r, [8, 4]) && has(r, [9, 5]) && has(r, [0, 3]) && has(r, [7, 8]));
}
{
  const r = targets(boardWith([[5, 0, "C"], [5, 2, "P"], [5, 5, "r"], ...KINGS]), 5, 0);
  check("포는 말 하나를 넘어서 가고 잡아요", has(r, [5, 3]) && has(r, [5, 4]) && has(r, [5, 5]) && !has(r, [5, 1]) && !has(r, [4, 0]));
  check("포는 포를 넘지 못해요", targets(boardWith([[5, 0, "C"], [5, 2, "c"], ...KINGS]), 5, 0).filter(([rr]) => rr === 5).length === 0);
  check("포는 포를 잡지 못해요", !has(targets(boardWith([[5, 0, "C"], [5, 2, "P"], [5, 4, "c"], ...KINGS]), 5, 0), [5, 4]));
}
check("마는 8곳", targets(boardWith([[5, 4, "H"], ...KINGS]), 5, 4).length === 8);
{
  const r = targets(boardWith([[5, 4, "H"], [4, 4, "P"], ...KINGS]), 5, 4);
  check("마는 멱이 막히면 못 가요", !has(r, [3, 3]) && !has(r, [3, 5]));
}
check("상은 직선 1 + 대각선 2", has(targets(boardWith([[5, 4, "E"], ...KINGS]), 5, 4), [2, 2]));
check("상은 지나가는 곳이 막히면 못 가요", !has(targets(boardWith([[5, 4, "E"], [3, 3, "p"], ...KINGS]), 5, 4), [2, 2]));
check("졸은 앞과 옆으로만", JSON.stringify(targets(boardWith([[5, 4, "P"], ...KINGS]), 5, 4)) === JSON.stringify([[4, 4], [5, 3], [5, 5]]));
check("졸은 상대 궁성에서 앞쪽 대각선 선으로도", has(targets(boardWith([[2, 3, "P"], [9, 3, "K"], [0, 5, "k"]]), 2, 3), [1, 4]));
// 장군과 외통
check("내 궁을 공격받게 하는 수는 둘 수 없어요", JSON.stringify(targets(boardWith([[9, 4, "K"], [7, 4, "A"], [0, 4, "r"], [0, 3, "k"]]), 7, 4)) === JSON.stringify([[8, 4]]));
{
  const s = boardWith([[9, 4, "K"], [7, 0, "r"], [0, 3, "k"], [1, 8, "r"]], 1);
  const r1 = play(s, { from: at(1, 8), to: at(8, 8) });
  const r2 = r1 && play({ ...r1.state, turn: 1 }, { from: at(7, 0), to: at(9, 0) });
  check("외통이면 이겨요", r1 && !inCheck(r1.state.squares, 0) && r2 && r2.end && r2.end.winner === 1);
}
// 빅장과 한수쉼
check("궁끼리 마주 보면 빅장", isBikjang(boardWith([[8, 4, "K"], [1, 4, "k"]]).squares));
check("사이에 말이 있으면 빅장 아님", !isBikjang(boardWith([[8, 4, "K"], [5, 4, "P"], [1, 4, "k"]]).squares));
{
  const r = play(boardWith([[8, 4, "K"], [5, 4, "P"], [1, 4, "k"]]), { from: at(5, 4), to: at(5, 3) });
  check("빅장을 만드는 수는 무승부", r && r.end && r.end.winner === null);
}
{
  const first = play(boardWith([[8, 4, "K"], [1, 3, "k"]]), { pass: true });
  const second = first && play(first.state, { pass: true });
  check("둘 다 연달아 한수쉼이면 무승부", first && !first.end && second && second.end && second.end.winner === null);
  check("장군 중에는 한수쉼을 못 해요", play(boardWith([[8, 4, "K"], [5, 4, "r"], [0, 3, "k"]]), { pass: true }) === null);
}
// 수 제한 점수 판정
{
  const s = { ...newState(), ply: MOVE_LIMIT - 1 };
  const r = play(s, { from: at(6, 0), to: at(5, 0) });
  const { cho, han } = scores(s.squares);
  check(`${MOVE_LIMIT}수가 지나면 점수로 판정(처음 판은 한이 덤 1.5로 앞서요)`, r && r.end && r.end.winner === 1 && cho === 72 && han === 73.5);
}

// 컴퓨터 계산 판의 수 생성 = 규칙 판의 수 생성
{
  let s = newState("EHHE", "HEHE");
  let same = true;
  for (let i = 0; i < 120 && same; i++) {
    const ruleList = [];
    for (let p = 0; p < POINTS; p++) if (sideOfPiece(s.squares[p]) === s.turn) for (const t of pseudoTargets(s.squares, p)) ruleList.push(`${p}-${t}`);
    ruleList.sort();
    if (JSON.stringify(ruleList) !== JSON.stringify(pseudoMoveList(s))) same = false;
    const m = pickMove(s, 2);
    const r = m && play(s, m);
    if (!r || r.end) break;
    s = r.state;
  }
  check("컴퓨터 계산 판의 수 생성이 규칙과 같아요(한 판 내내 비교)", same);
}
for (const level of [1, 4, 8]) {
  let s = newState("HEEH", "EHEH");
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
  check(`${level}단계끼리 둬도 잘못된 수가 없어요`, ok);
}
console.log(failed ? `\n${failed}개 실패` : "\n모두 통과");
process.exit(failed ? 1 : 0);
