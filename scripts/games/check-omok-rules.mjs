// 오목 규칙 검증: 비행기오락실 앱의 규칙 테스트(omok.test.ts)를 그대로 옮겨 왔어요.
// 실행: node scripts/games/check-omok-rules.mjs
import { SIZE, CELL_COUNT, gridOf, moveProblem, play, lastWinningLine, BLACK, WHITE } from "../../lib/games/omok/rules.js";

const at = (r, c) => r * SIZE + c;
let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};
/** 흑 돌들과 백 돌들로 판을 만든다(흑이 먼저, 번갈아). 백이 모자라면 판 구석에 채워요. */
function movesOf(black, white = []) {
  const filler = [at(14, 14), at(14, 12), at(14, 10), at(14, 8), at(14, 6), at(14, 4), at(14, 2), at(14, 0)];
  const w = [...white];
  while (w.length < black.length) w.push(filler.shift());
  const moves = [];
  black.forEach((b, i) => {
    moves.push(b);
    if (i < black.length - 1 || w.length > black.length - 1) moves.push(w[i]);
  });
  // 흑 차례가 되도록 마지막을 맞춘다
  return moves.length % 2 === 0 ? moves : [...moves, w[black.length - 1] ?? filler.shift()];
}

// 5목
{
  const m = movesOf([at(7, 3), at(7, 4), at(7, 5), at(7, 6)]);
  const r = play(m, at(7, 7));
  check("5목을 만들면 이긴다", r?.outcome === "win");
  const line = lastWinningLine(r.moves);
  check("이긴 줄의 칸을 알려준다", JSON.stringify([...line].sort((a, b) => a - b)) === JSON.stringify([at(7, 3), at(7, 4), at(7, 5), at(7, 6), at(7, 7)]));
}
{
  const m = movesOf([at(7, 2), at(7, 3), at(7, 4), at(7, 6), at(7, 7)]);
  check("장목(6목)도 이긴다", play(m, at(7, 5))?.outcome === "win");
}

// 쌍삼 금지
const cross = [at(7, 5), at(7, 6), at(5, 7), at(6, 7)];
check("열린 3을 두 개 만드는 수는 둘 수 없다", moveProblem(gridOf(movesOf(cross)), BLACK, at(7, 7)) === "doubleThree");
{
  const black = [at(12, 0), at(12, 2), at(12, 4), at(12, 6), at(12, 8)];
  const moves = [];
  black.forEach((b, i) => {
    moves.push(b);
    if (cross[i] !== undefined) moves.push(cross[i]);
  });
  check("백도 똑같이 쌍삼을 둘 수 없다", moveProblem(gridOf(moves), WHITE, at(7, 7)) === "doubleThree");
}
check("한쪽이 상대 돌로 막힌 3은 열린 3이 아니라서 둘 수 있다", moveProblem(gridOf(movesOf(cross, [at(7, 4)])), BLACK, at(7, 7)) === null);
check("판 끝에 붙은 3도 열린 3이 아니다", moveProblem(gridOf(movesOf([at(7, 0), at(7, 1), at(5, 2), at(6, 2)])), BLACK, at(7, 2)) === null);
check("띈 3(●●_●)도 열린 3으로 센다", moveProblem(gridOf(movesOf([at(7, 4), at(7, 5), at(5, 7), at(6, 7)])), BLACK, at(7, 7)) === "doubleThree");
check("4와 3을 함께 만드는 수(4·3)는 둘 수 있다", moveProblem(gridOf(movesOf([at(7, 4), at(7, 5), at(7, 6), at(5, 7), at(6, 7)])), BLACK, at(7, 7)) === null);
check("띈 4(●●●_●)와 3도 4·3이라서 둘 수 있다", moveProblem(gridOf(movesOf([at(7, 3), at(7, 4), at(7, 6), at(5, 7), at(6, 7)])), BLACK, at(7, 7)) === null);
check(
  "두자마자 5목이 되는 수는 쌍삼이어도 둘 수 있다",
  moveProblem(gridOf(movesOf([at(7, 3), at(7, 4), at(7, 5), at(7, 6), at(5, 7), at(6, 7), at(5, 5), at(6, 6)])), BLACK, at(7, 7)) === null
);

// 수 두기
{
  const g = gridOf([at(7, 7)]);
  check("이미 돌이 있으면 둘 수 없다", moveProblem(g, WHITE, at(7, 7)) === "occupied");
  check("판 밖이면 둘 수 없다", moveProblem(g, WHITE, CELL_COUNT) === "outside" && moveProblem(g, WHITE, -1) === "outside");
  check("둘 수 없는 수는 null", play([at(7, 7)], at(7, 7)) === null);
  check("평범한 수", JSON.stringify(play([at(7, 7)], at(7, 8))) === JSON.stringify({ moves: [at(7, 7), at(7, 8)], outcome: null }));
}

console.log(failed ? `\n${failed}개 실패` : "\n모두 통과");
process.exit(failed ? 1 : 0);
