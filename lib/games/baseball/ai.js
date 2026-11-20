// 비행기오락실 앱 src/games/baseball/ai.ts를 그대로 옮겼어요(tsc로 JS로 바꿈).
// 숫자 야구 컴퓨터: 지금까지 부른 기록(결과 포함)을 보고 다음에 부를 숫자를 고른다.
// 사람처럼 실력을 나눈다: 컴퓨터는 지난 힌트와 앞뒤가 맞는 숫자 중 아무거나 부르는데,
// 약한 컴퓨터일수록 지난 힌트를 자주 "잊는다" (힌트마다 remember 확률로만 따진다). 그래서 앞뒤가 안 맞는 숫자도 부른다.
// 가장 센 컴퓨터도 힌트를 가끔 놓친다 (어린 사람도 이길 수 있게, 4자리 평균 6.3번). 모든 힌트를 따지면 5.4번.
// 방금 받은 힌트는 누구나 기억한다. 이미 부른 숫자는 다시 부르지 않는다.
// 반칙은 없다: 상대가 숨긴 숫자는 받지 않고, 기록만 본다.
import { allNumbers, judge } from "./baseball.js";
/**
 * 단계(1~10)별로 지난 힌트 하나를 기억하고 따질 확률. 1~5단계는 3자리, 6~10단계는 4자리로 쓴다
 * (자리 수가 바뀌는 6단계에서 다시 쉬워진다). 맞히는 데 걸리는 평균 횟수 (컴퓨터로 잼, ai.test.ts가 지킨다):
 *  3자리: 11.1 · 9.9 · 8.5 · 7.6 · 6.9   4자리: 10.5 · 9.8 · 9.0 · 7.4 · 6.3
 * 사람은 3자리 6~7번, 4자리 7~8번쯤 걸린다. 처음보다 단계마다 한 번쯤 여유를 줬다 (2026-11-16)
 */
export const BOT_REMEMBER = [0.08, 0.16, 0.22, 0.28, 0.4, 0.15, 0.21, 0.29, 0.42, 0.62];
/** 이만큼 부른 뒤에는 약한 컴퓨터도 모든 힌트를 따진다 (끝없이 헤매지 않게) */
const FOCUS_AFTER = 14;
const fits = (n, c) => {
  const j = judge(n, c.guess);
  return j.strike === c.judge.strike && j.ball === c.judge.ball;
};
/** 컴퓨터가 다음에 부를 숫자. remember: 지난 힌트 하나를 따질 확률 (0~1) */
export function botGuess(count, calls, remember, random) {
  const called = new Set(calls.map((c) => c.guess));
  const all = allNumbers(count);
  // 따질 힌트: 방금 것은 늘, 지난 것은 기억할 확률로 (많이 부른 뒤에는 모두)
  const focus = calls.length >= FOCUS_AFTER;
  const used = calls.filter((_, i) => focus || i === calls.length - 1 || random() < remember);
  let candidates = all.filter((n) => !called.has(n) && used.every((c) => fits(n, c)));
  // 진짜 답이 늘 후보에 있어서 빌 일은 없지만, 혹시 비면 안 부른 숫자 아무거나
  if (candidates.length === 0) candidates = all.filter((n) => !called.has(n));
  return candidates[Math.floor(random() * candidates.length)];
}
/** 단계(1~10)의 자리 수 */
export const botCount = (level) => (level <= 5 ? 3 : 4);
/** 단계(1~10)의 컴퓨터가 다음에 부를 숫자 */
export const botGuessAt = (level, calls, random) => botGuess(botCount(level), calls, BOT_REMEMBER[level - 1], random);
