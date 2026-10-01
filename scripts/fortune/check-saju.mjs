/**
 * 사주 계산 엔진 대조 테스트 — lib/fortune/saju.js 를 독립된 라이브러리 결과와 비교합니다.
 * 실행: node scripts/fortune/check-saju.mjs
 *
 *  1) 일주: 1900~2050년 모든 날짜를 korean-lunar-calendar(천문연 기준)의 일진과 비교
 *  2) 연주·월주: 무작위 출생 시각 2만 개를 lunar-javascript 팔자(베이징 시간으로 환산)와 비교
 *  3) 일주·시주: 같은 시각을 지역 시간으로 보정해 lunar-javascript(자시에 날 바뀜)와 비교
 *  4) 음력→양력: 음력 날짜 1만 개를 lunar-javascript의 중국 음력과 비교(차이 나는 날은 목록만 출력)
 *  5) 손으로 확인한 기준 사례
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Solar, Lunar } = require("lunar-javascript");
const KoreanLunarCalendar = require("korean-lunar-calendar");
const S = await import("../../lib/fortune/saju.js");

let fail = 0;
const bad = (msg) => { fail++; if (fail <= 30) console.log("✗", msg); };

// 1) 일주 전체 비교
let n1 = 0;
for (let t = Date.UTC(1900, 1, 1); t <= Date.UTC(2050, 11, 31); t += 86400000) {
  const d = new Date(t);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  const cal = new KoreanLunarCalendar();
  cal.setSolarDate(y, m, day);
  const ref = cal.getChineseGapja().day.replace("日", "");
  const mine = S.dayPillar(y, m, day).hanja;
  if (ref !== mine) bad(`일주 ${y}-${m}-${day}: 기준 ${ref}, 계산 ${mine}`);
  n1++;
}
console.log(`1) 일주 ${n1}일 비교 완료`);

// 무작위(재현 가능)
let seed = 20261001;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// 2·3) 연·월·일·시주
const N = 20000;
for (let i = 0; i < N; i++) {
  // 일부는 절기 시각 ±3시간 근처를 일부러 고름
  let y = 1900 + Math.floor(rnd() * 151), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28);
  let h = Math.floor(rnd() * 24), mi = Math.floor(rnd() * 60);
  if (i % 3 === 0) {
    const jq = Solar.fromYmd(y, m, 15).getLunar().getPrevJie(true).getSolar(); // 베이징 시간
    const kst = new Date(Date.UTC(jq.getYear(), jq.getMonth() - 1, jq.getDay(), jq.getHour() + 1, jq.getMinute()) + (rnd() * 360 - 180) * 60000);
    y = kst.getUTCFullYear(); m = kst.getUTCMonth() + 1; d = kst.getUTCDate(); h = kst.getUTCHours(); mi = kst.getUTCMinutes();
  }
  if (y < 1900 || y > 2050) continue;
  const r = S.calcSaju({ calendar: "solar", year: y, month: m, day: d, hour: h, minute: mi });
  if (!r.ok) { bad(`계산 실패 ${y}-${m}-${d} ${h}:${mi} ${r.error}`); continue; }
  const utc = S.koreaLocalToUtc(y, m, d, h, mi);
  const bj = new Date(utc + 8 * 3600000);
  const ec = Solar.fromYmdHms(bj.getUTCFullYear(), bj.getUTCMonth() + 1, bj.getUTCDate(), bj.getUTCHours(), bj.getUTCMinutes(), bj.getUTCSeconds()).getLunar().getEightChar();
  // 절기 시각 1분 이내는 두 계산의 반올림 차이일 수 있어 건너뜀
  const jq = Solar.fromYmdHms(bj.getUTCFullYear(), bj.getUTCMonth() + 1, bj.getUTCDate(), bj.getUTCHours(), bj.getUTCMinutes(), 0).getLunar();
  const near = [jq.getPrevJie(false), jq.getNextJie(false)].some((j) => {
    const s = j.getSolar();
    return Math.abs(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour() - 8, s.getMinute(), s.getSecond()) - utc) < 2 * 60000;
  });
  if (!near) {
    if (ec.getYear() !== r.pillars.year.hanja) bad(`연주 ${y}-${m}-${d} ${h}:${mi}: 기준 ${ec.getYear()}, 계산 ${r.pillars.year.hanja}`);
    if (ec.getMonth() !== r.pillars.month.hanja) bad(`월주 ${y}-${m}-${d} ${h}:${mi}: 기준 ${ec.getMonth()}, 계산 ${r.pillars.month.hanja}`);
  }
  const L = r.local;
  const ec2 = Solar.fromYmdHms(L.year, L.month, L.day, L.hour, L.minute, 0).getLunar().getEightChar();
  ec2.setSect(1);
  if (ec2.getDay() !== r.pillars.day.hanja) bad(`일주(시간 보정) ${y}-${m}-${d} ${h}:${mi} → ${L.hour}:${L.minute}: 기준 ${ec2.getDay()}, 계산 ${r.pillars.day.hanja}`);
  if (ec2.getTime() !== r.pillars.hour.hanja) bad(`시주 ${y}-${m}-${d} ${h}:${mi} → ${L.hour}:${L.minute}: 기준 ${ec2.getTime()}, 계산 ${r.pillars.hour.hanja}`);
}
console.log(`2·3) 출생 시각 ${N}개 비교 완료`);

// 4) 음력 → 양력 (한국·중국 음력이 다른 날이 있어 목록으로만 확인)
const diffs = new Set();
for (let i = 0; i < 10000; i++) {
  const y = 1900 + Math.floor(rnd() * 150), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 29);
  const mine = S.lunarToSolar(y, m, d, false);
  if (!mine) { bad(`음력 변환 실패 ${y}-${m}-${d}`); continue; }
  const s = Lunar.fromYmd(y, m, d).getSolar();
  if (s.getYear() !== mine.year || s.getMonth() !== mine.month || s.getDay() !== mine.day) diffs.add(`${y}-${m}`);
}
console.log(`4) 음력 1만 개 중 중국 음력과 다른 달: ${diffs.size}개 ${[...diffs].sort((a,b)=>parseInt(a)-parseInt(b)).join(" ")}`);

// 5) 기준 사례
const cases = [
  // [설명, 입력, 기대 팔자(연 월 일 시)]
  ["2024 입춘 17:27 직전", { year: 2024, month: 2, day: 4, hour: 17, minute: 20 }, "癸卯 乙丑 戊戌 庚申"], // 보정 16:50 = 신시
  ["2024 입춘 17:27 직후", { year: 2024, month: 2, day: 4, hour: 17, minute: 35 }, "甲辰 丙寅 戊戌 辛酉"],
  ["2000-01-01 정오", { year: 2000, month: 1, day: 1, hour: 12, minute: 0 }, "己卯 丙子 戊午 戊午"],
  ["자시 경계: 23:20은 아직 해시", { year: 2000, month: 1, day: 1, hour: 23, minute: 20 }, "己卯 丙子 戊午 癸亥"],
  ["자시 경계: 23:40은 다음 날 자시", { year: 2000, month: 1, day: 1, hour: 23, minute: 40 }, "己卯 丙子 己未 甲子"],
  ["1988 서머타임 기간 (10시 → 실제 9시)", { year: 1988, month: 7, day: 1, hour: 10, minute: 0 }, null],
];
for (const [label, inp, expect] of cases) {
  const r = S.calcSaju({ calendar: "solar", ...inp });
  const got = [r.pillars.year, r.pillars.month, r.pillars.day, r.pillars.hour].map((p) => p.hanja).join(" ");
  console.log(`5) ${label}: ${got}${r.local ? ` (보정 ${r.local.hour}:${String(r.local.minute).padStart(2, "0")})` : ""}`);
  if (expect && got !== expect) bad(`${label}: 기대 ${expect}, 계산 ${got}`);
}
// 시계가 바뀐 날: 두 번 있던 시각은 앞쪽, 없던 시각은 바뀌기 전 기준
for (const [label, args, kind, off] of [
  ["1987-10-11 02:30 (두 번 있던 시각 → 서머타임 쪽)", [1987, 10, 11, 2, 30], "repeated", 600],
  ["1987-10-11 01:30 (서머타임)", [1987, 10, 11, 1, 30], "normal", 600],
  ["1987-10-11 03:30 (표준시)", [1987, 10, 11, 3, 30], "normal", 540],
  ["1987-05-10 02:30 (없던 시각)", [1987, 5, 10, 2, 30], "skipped", 540],
  ["1954-03-20 23:40 (+8:30 전환, 두 번 있던 시각)", [1954, 3, 20, 23, 40], "repeated", 540],
  ["1961-08-10 00:10 (+9 전환, 없던 시각)", [1961, 8, 10, 0, 10], "skipped", 510],
  ["1908-04-01 00:00 (+8:30 시작)", [1908, 4, 1, 0, 0], "skipped", 508],
  ["1908-04-01 00:05 (+8:30)", [1908, 4, 1, 0, 5], "normal", 510],
]) {
  const r = S.resolveKoreaLocal(...args);
  const got = (Date.UTC(args[0], args[1] - 1, args[2], args[3], args[4]) - r.utc) / 60000; // 계산에 쓴 시계 차이
  console.log(`5) ${label}: ${r.kind}, UTC+${got}분`);
  if (r.kind !== kind || got !== off) bad(`${label}: 기대 ${kind} ${off}`);
}
if (S.calcSaju({ calendar: "solar", year: 2000, month: 1, day: 1, hour: "abc" }).ok) bad("숫자가 아닌 시간 입력이 통과됨");
console.log("5) 음력 2050-12-01:", S.calcSaju({ calendar: "lunar", year: 2050, month: 12, day: 1 }).error);

const noTime = S.calcSaju({ calendar: "solar", year: 2024, month: 2, day: 4 });
console.log("5) 2024-02-04 시간 모름:", noTime.notes);
const lunarCase = S.calcSaju({ calendar: "lunar", year: 2017, month: 5, day: 1, leap: true });
console.log("5) 음력 2017 윤5월 1일 →", lunarCase.solar, "(README 예시: 2017-06-24)");
const badLeap = S.calcSaju({ calendar: "lunar", year: 2018, month: 5, day: 1, leap: true });
console.log("5) 2018 윤5월(없음):", badLeap.error);

console.log(fail ? `\n실패 ${fail}건` : "\n모두 통과");
process.exit(fail ? 1 : 0);
