// 비행기오락실 앱 src/games/baseball/baseball.ts를 그대로 옮겼어요(tsc로 JS로 바꿈). 규칙·단계를 고치면 앱과 달라지니 조심해요.
// 숫자 야구 규칙: 0~9 중 서로 다른 숫자 3·4개를 숨기고(맨 앞 0도 됨), 부른 숫자마다
// 스트라이크(숫자·자리 모두 맞음)·볼(숫자는 있는데 자리가 다름)을 알려 준다. 모두 스트라이크면 맞힘.
// 숫자는 글자로 다룬다 (예: '307'). 계산만 하는 부분이라 화면·연결과 상관없다.
export const DIGIT_COUNTS = [3, 4];
/** 숨기거나 부를 수 있는 숫자인지: 정한 자리 수, 0~9만, 같은 숫자 두 번 없음 */
export function isValidNumber(text, count) {
  return text.length === count && /^[0-9]+$/.test(text) && new Set(text).size === count;
}
/** 숨긴 숫자에 대해 부른 숫자의 결과 */
export function judge(secret, guess) {
  let strike = 0;
  let ball = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) strike++;
    else if (secret.includes(guess[i])) ball++;
  }
  return { strike, ball };
}
/** 맞혔는지 (모두 스트라이크) */
export const isHomeRun = (j, count) => j.strike === count;
/** 하나도 없음 */
export const isOut = (j) => j.strike === 0 && j.ball === 0;
/** 무작위 숫자 (서로 다른 숫자, 맨 앞 0도 됨) */
export function randomNumber(count, random = Math.random) {
  const digits = "0123456789".split("");
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, count).join("");
}
const ALL = {};
/** 가능한 숫자 전부 (3자리 720개, 4자리 5040개). 한 번 만들어 두고 같이 쓴다 */
export function allNumbers(count) {
  const cached = ALL[count];
  if (cached) return cached;
  const out = [];
  const walk = (prefix) => {
    if (prefix.length === count) {
      out.push(prefix);
      return;
    }
    for (let d = 0; d <= 9; d++) if (!prefix.includes(String(d))) walk(prefix + d);
  };
  walk("");
  ALL[count] = out;
  return out;
}
/** 지금까지의 기록과 앞뒤가 맞는 숫자들 (답이 될 수 있는 것) */
export function possibleNumbers(count, calls) {
  return allNumbers(count).filter((n) =>
    calls.every((c) => {
      const j = judge(n, c.guess);
      return j.strike === c.judge.strike && j.ball === c.judge.ball;
    }),
  );
}
/** 10단계: 3자리 기회 13번부터 4자리 9번까지 (사람 평균은 3자리 6번쯤, 4자리 7~8번쯤). 2026-11-20 어린 사람을 생각해 단계마다 1번씩 늘림 */
export const LEVELS = [
  { count: 3, chances: 13 },
  { count: 3, chances: 11 },
  { count: 3, chances: 10 },
  { count: 3, chances: 9 },
  { count: 3, chances: 8 },
  { count: 4, chances: 15 },
  { count: 4, chances: 13 },
  { count: 4, chances: 11 },
  { count: 4, chances: 10 },
  { count: 4, chances: 9 },
];
/** 무한 도전 (10단계를 깬 뒤): 4자리, 기회 12번에서 판마다 1번씩 줄어 7번까지. round는 1부터 */
export const endlessSpec = (round) => ({ count: 4, chances: Math.max(7, 13 - round) });
/**
 * ★ 경계 (부른 횟수, 맞힌 부르기도 센다): 자리 수마다 같고 단계와 상관없다.
 * 높은 단계는 기회가 적어 실패하기 쉬운 것으로 어려워진다. 힌트를 다 쓰는 사람이
 * 3자리는 5번 안에 60%, 4자리는 6번 안에 87% (컴퓨터로 2,000판씩 잼, 2026-11-15)
 */
export const STAR_LINES = { 3: [5, 7], 4: [6, 8] };
/** 맞히는 데 쓴 횟수로 ★ 1~3개 */
export function starsFor(used, count) {
  const [three, two] = STAR_LINES[count];
  return used <= three ? 3 : used <= two ? 2 : 1;
}
