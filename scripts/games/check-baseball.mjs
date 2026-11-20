// 숫자 야구 검증: 판정·후보 좁히기·컴퓨터 실력·대결 규칙·오늘의 숫자. 실행: node scripts/games/check-baseball.mjs
// 읽을거리(number-baseball-tips)에 쓴 숫자도 여기서 계산해 보여 줘요(씨앗 고정이라 다시 돌려도 같아요).
import { allNumbers, endlessSpec, isValidNumber, judge, LEVELS, possibleNumbers, randomNumber, starsFor } from "../../lib/games/baseball/baseball.js";
import { BOT_REMEMBER, botGuess, botGuessAt } from "../../lib/games/baseball/ai.js";
import { BOT, hideMine, MAX_VS_CALLS, ME, newVs, vsCall } from "../../lib/games/baseball/vs.js";
import { DAILY_SPECS, dailyNumber, dailySpec } from "../../lib/games/baseball/record.js";
import { seededRandom } from "../../lib/games/slide/slide.js";
import { levelOf } from "../../lib/games/daily.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ---------- 판정 ---------- */
check("123 vs 123 → 3S", eq(judge("123", "123"), { strike: 3, ball: 0 }));
check("123 vs 321 → 1S 2B", eq(judge("123", "321"), { strike: 1, ball: 2 }));
check("123 vs 456 → OUT", eq(judge("123", "456"), { strike: 0, ball: 0 }));
check("0123 vs 3210 → 0S 4B", eq(judge("0123", "3210"), { strike: 0, ball: 4 }));
check("맨 앞 0도 되고 같은 숫자 두 번은 안 됨", isValidNumber("012", 3) && !isValidNumber("112", 3) && !isValidNumber("12a", 3) && !isValidNumber("1234", 3));
check("가능한 숫자 3자리 720개·4자리 5040개", allNumbers(3).length === 720 && allNumbers(4).length === 5040);
{
  const r = seededRandom(1);
  let ok = true;
  for (let i = 0; i < 300; i++) for (const c of [3, 4]) ok &&= isValidNumber(randomNumber(c, r), c);
  check("무작위 숫자는 늘 규칙에 맞음", ok);
}
check("기록과 맞는 후보에 진짜 답이 늘 남음", (() => {
  const r = seededRandom(2);
  for (let g = 0; g < 50; g++) {
    const secret = randomNumber(4, r);
    const calls = [];
    for (let k = 0; k < 4; k++) {
      const guess = randomNumber(4, r);
      calls.push({ guess, judge: judge(secret, guess) });
    }
    if (!possibleNumbers(4, calls).includes(secret)) return false;
  }
  return true;
})());
check("★: 3자리 5번 안 ★3·7번 안 ★2, 4자리 6·8번", starsFor(5, 3) === 3 && starsFor(6, 3) === 2 && starsFor(8, 3) === 1 && starsFor(6, 4) === 3 && starsFor(8, 4) === 2 && starsFor(9, 4) === 1);
check("무한 도전: 4자리, 기회 12번에서 판마다 1번씩 줄어 7번까지", endlessSpec(1).chances === 12 && endlessSpec(6).chances === 7 && endlessSpec(30).chances === 7 && endlessSpec(1).count === 4);

/* ---------- 대결 규칙 ---------- */
{
  // 선을 정해 두고 규칙을 따져요
  const base = (first) => ({ ...newVs(1, seededRandom(4)), first, turn: first, secrets: { [ME]: "123", [BOT]: "456" } });
  let s = vsCall(base(ME), ME, "456");
  check("먼저 부른 쪽이 맞히면 상대에게 마지막 기회", s && !s.result && s.lastChance && s.turn === BOT);
  check("마지막 기회에 맞히면 무승부", vsCall(s, BOT, "123")?.result?.draw === true);
  check("마지막 기회에 못 맞히면 먼저 맞힌 쪽 승", vsCall(s, BOT, "124")?.result?.winner === ME);
  s = vsCall(base(BOT), BOT, "789");
  check("나중 쪽이 먼저 맞히면 바로 승", vsCall(s, ME, "456")?.result?.winner === ME);
  check("차례가 아니면 못 부름", vsCall(base(ME), BOT, "123") === null);
  check("숨기기 전에는 못 부름", vsCall({ ...base(ME), secrets: { [ME]: null, [BOT]: "456" } }, ME, "456") === null);
  check("이미 부른 숫자는 못 부름", vsCall(vsCall(vsCall(base(ME), ME, "789"), BOT, "789"), ME, "789") === null);
  check("숨기기는 한 번만, 모양이 맞아야", hideMine(newVs(1, seededRandom(5)), "112") === null && hideMine({ ...newVs(1, seededRandom(5)), secrets: { [ME]: "123", [BOT]: "456" } }, "321") === null);
  // 둘 다 20번 못 맞히면 승자 없이
  let t = base(ME);
  const pool = allNumbers(3).filter((n) => n !== "123" && n !== "456");
  for (let k = 0; k < MAX_VS_CALLS * 2; k++) t = vsCall(t, t.turn, pool[Math.floor(k / 2) + (t.turn === BOT ? 100 : 0)]);
  check("둘 다 20번씩 못 맞히면 승자 없음", t?.result?.none === true);
  check("6단계부터 4자리", newVs(5, seededRandom(1)).count === 3 && newVs(6, seededRandom(1)).count === 4 && newVs(0, seededRandom(1)).count === 4);
}

/* ---------- 컴퓨터 실력 (맞히는 데 걸리는 평균 횟수) ---------- */
function botAverage(level, games, seed) {
  const r = seededRandom(seed);
  const count = level <= 5 ? 3 : 4;
  let total = 0;
  for (let g = 0; g < games; g++) {
    const secret = randomNumber(count, r);
    const calls = [];
    for (;;) {
      const guess = botGuessAt(level, calls, r);
      const j = judge(secret, guess);
      calls.push({ guess, judge: j });
      if (j.strike === count) break;
    }
    total += calls.length;
  }
  return total / games;
}
const botAvgs = BOT_REMEMBER.map((_, i) => botAverage(i + 1, 400, 100 + i));
check(`컴퓨터는 단계가 오를수록 빨리 맞힘(자리 수 안에서): ${botAvgs.map((a) => a.toFixed(1)).join(" · ")}`,
  botAvgs.slice(0, 5).every((a, i, l) => i === 0 || a <= l[i - 1] + 0.3) && botAvgs.slice(5).every((a, i, l) => i === 0 || a <= l[i - 1] + 0.3));

/* ---------- 오늘의 숫자 ---------- */
{
  const day = (n) => new Date(Date.parse("2026-11-20T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
  let ok = 0;
  const seen = new Set();
  for (let n = 0; n < 200; n++) {
    const key = day(n);
    const spec = dailySpec(key);
    const a = dailyNumber(key);
    if (a === dailyNumber(key) && isValidNumber(a, spec.count) && spec === DAILY_SPECS[levelOf(key)]) ok++;
    seen.add(a);
  }
  check(`오늘의 숫자 200일: 다시 만들어도 같음·규칙에 맞음·요일 난이도 ${ok}/200`, ok === 200);
  check(`오늘의 숫자 200일 중 서로 다른 숫자 ${seen.size}개(4자리 5040가지라 가끔 겹칠 수 있어요)`, seen.size >= 190);
  check("보통 4자리 12번, 어려움 4자리 10번", DAILY_SPECS.medium.count === 4 && DAILY_SPECS.medium.chances === 12 && DAILY_SPECS.hard.chances === 10);
}

/* ---------- 읽을거리에 쓰는 숫자 ---------- */
console.log("\n[읽을거리 숫자]");
for (const count of [3, 4]) {
  // 첫 부르기 결과 나누기: 아무 숫자나 하나 불렀을 때 결과별로 답 후보가 몇 개 남는지
  const first = allNumbers(count)[0];
  const groups = new Map();
  for (const n of allNumbers(count)) {
    const j = judge(n, first);
    const k = j.strike === 0 && j.ball === 0 ? "OUT" : `${j.strike}S ${j.ball}B`;
    groups.set(k, (groups.get(k) || 0) + 1);
  }
  const total = allNumbers(count).length;
  console.log(`${count}자리 첫 부르기(${first}) 결과별 남는 후보: ` + [...groups.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}개(${((v / total) * 100).toFixed(1)}%)`).join(", "));
  // 힌트를 모두 따지는 사람(후보 중 아무거나 부르기)
  const r = seededRandom(count * 11);
  const dist = new Map();
  let sum = 0;
  const G = 2000;
  for (let g = 0; g < G; g++) {
    const secret = randomNumber(count, r);
    const calls = [];
    for (;;) {
      const guess = botGuess(count, calls, 1, r);
      const j = judge(secret, guess);
      calls.push({ guess, judge: j });
      if (j.strike === count) break;
    }
    sum += calls.length;
    dist.set(calls.length, (dist.get(calls.length) || 0) + 1);
  }
  const within = (n) => ([...dist.entries()].filter(([k]) => k <= n).reduce((a, [, v]) => a + v, 0) / G) * 100;
  console.log(`${count}자리 힌트를 다 따지면(후보 중 아무거나, ${G}판) 평균 ${(sum / G).toFixed(2)}번, 가장 많이 ${Math.max(...dist.keys())}번 · ` +
    `5번 안 ${within(5).toFixed(0)}% · 6번 안 ${within(6).toFixed(0)}% · 7번 안 ${within(7).toFixed(0)}% · 8번 안 ${within(8).toFixed(0)}%`);
}
console.log(`컴퓨터 평균 횟수(단계별 400판): ${botAvgs.map((a, i) => `${i + 1}단계 ${a.toFixed(1)}`).join(", ")}`);
console.log(`단계 기회: ${LEVELS.map((l, i) => `${i + 1}단계 ${l.count}자리 ${l.chances}번`).join(", ")}`);

console.log(failed ? `\n실패 ${failed}개` : "\n모두 통과");
process.exit(failed ? 1 : 0);
