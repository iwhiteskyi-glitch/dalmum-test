// 오델로 규칙 검증. 실행: node scripts/games/check-othello.mjs
import { newState, legalMoves, play, count } from "../../lib/games/othello/rules.js";
import { chooseMove } from "../../lib/games/othello/ai.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};
const s0 = newState();
check("처음 판: 흑 2개, 백 2개", JSON.stringify(count(s0.cells)) === JSON.stringify({ black: 2, white: 2 }));
check("처음에 흑이 둘 수 있는 곳은 d3·c4·f5·e6 네 곳", JSON.stringify(legalMoves(s0.cells, 0)) === JSON.stringify([19, 26, 37, 44]));
const r1 = play(s0, 19);
check("d3에 두면 d4가 흑으로 뒤집혀요", r1 && r1.state.cells[27] === 1 && r1.state.turn === 1);
check("둘 수 없는 칸은 거절", play(s0, 0) === null && play(s0, 27) === null);

// 패스: 백이 둘 곳이 없으면 흑이 한 번 더
{
  const cells = new Array(64).fill(0);
  cells[0] = 1; cells[1] = 2; // 흑 ● 백 ○ 빈칸 → 흑이 2에 두면 1이 뒤집힘
  cells[10] = 2; cells[18] = 0;
  cells[9] = 1; // 백 10을 흑이 사이에 끼울 수 있게
  const state = { cells, turn: 0, last: null, passed: null };
  const r = play(state, 2);
  const whiteMoves = r && legalMoves(r.state.cells, 1);
  check("백이 둘 곳이 없으면 쉬고 흑 차례가 이어져요", r && (whiteMoves.length ? r.state.turn === 1 : r.state.turn === 0 && r.state.passed === 1));
}
// 끝: 판이 꽉 차면 많은 쪽이 승리
{
  const cells = new Array(64).fill(1);
  cells[63] = 0; cells[62] = 2;
  const r = play({ cells, turn: 0, last: null, passed: null }, 63);
  check("둘 다 둘 곳이 없으면 끝나고 돌이 많은 쪽이 이겨요", r && r.end && r.end.winner === 0 && r.end.black === 64);
}
// 컴퓨터는 항상 둘 수 있는 칸만 골라요(단계마다 한 판씩 끝까지)
for (const level of [1, 3, 6, 10]) {
  let state = newState();
  let ok = true;
  for (let i = 0; i < 70; i++) {
    const m = chooseMove(state, level);
    if (m === null) break;
    const r = play(state, m);
    if (!r) { ok = false; break; }
    state = r.state;
    if (r.end) break;
  }
  check(`${level}단계 컴퓨터끼리 끝까지 둬도 잘못된 수가 없어요`, ok);
}
console.log(failed ? `\n${failed}개 실패` : "\n모두 통과");
process.exit(failed ? 1 : 0);
