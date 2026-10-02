// 결과 공유 링크(주소 "#" 뒤에 담는 결과) 검증. 링크를 받은 사람이 보는 결과가 보낸 사람이
// 본 결과와 같아야 하고, 형식이 조금이라도 어긋난 링크는 반드시 무시해야 합니다.
// 실행: node scripts/fortune/check-resultlink.mjs
import {
  encodeFortuneLink,
  decodeFortuneLink,
  encodeGunghapLink,
  decodeGunghapLink,
} from "../../lib/fortune/resultLink.js";
import { calcSaju, dayReading, gunghapReading, gunghapScore } from "../../lib/fortune/saju.js";

let fail = 0;
function assert(cond, label) {
  if (!cond) {
    fail++;
    console.log(`✗ ${label}`);
  }
}

// 1) 오늘의 운세: 날짜 × 일주를 전수로 돌려 왕복이 그대로인지, 풀이가 같은지 확인
console.log("1) 운세 링크 왕복 전수 테스트");
const dates = [
  { year: 1900, month: 1, day: 1 },
  { year: 2026, month: 10, day: 2 },
  { year: 2026, month: 2, day: 4 },
  { year: 2050, month: 12, day: 31 },
];
for (const date of dates) {
  for (let dm = 0; dm < 10; dm++) {
    for (let db = 0; db < 12; db++) {
      const saju = { dayMaster: dm, pillars: { day: { branch: db } } };
      const got = decodeFortuneLink(encodeFortuneLink(date, saju));
      assert(got !== null, `복원 실패 ${JSON.stringify(date)} ${dm}/${db}`);
      if (!got) continue;
      assert(
        got.date.year === date.year && got.date.month === date.month && got.date.day === date.day,
        `날짜 불일치 ${JSON.stringify(date)}`
      );
      const before = dayReading(saju, date);
      const after = dayReading(got.saju, got.date);
      assert(
        before.tenGod === after.tenGod &&
          before.relation === after.relation &&
          before.luckyElement === after.luckyElement &&
          before.pillar.index === after.pillar.index,
        `풀이 불일치 ${JSON.stringify(date)} ${dm}/${db}`
      );
    }
  }
}
console.log("완료 (480가지)");

// 2) 궁합: 실제 생년월일로 계산한 결과와, 링크를 거친 결과가 같아야 함
console.log("2) 궁합 링크 왕복 테스트");
const pairs = [
  [
    { calendar: "solar", year: 1995, month: 7, day: 15, hour: 9, minute: 0 },
    { calendar: "solar", year: 1997, month: 3, day: 22, hour: null, minute: null },
  ],
  [
    { calendar: "solar", year: 1980, month: 1, day: 1, hour: 23, minute: 40 },
    { calendar: "lunar", year: 2001, month: 5, day: 5, hour: 12, minute: 0 },
  ],
];
const areaSets = [
  { love: true, friend: true, work: true },
  { love: false, friend: true, work: false },
  { love: true, friend: false, work: true },
];
for (const [inA, inB] of pairs) {
  const a = calcSaju(inA);
  const b = calcSaju(inB);
  assert(a.ok && b.ok, "사주 계산 실패");
  for (const areas of areaSets) {
    const got = decodeGunghapLink(encodeGunghapLink(a, b, areas));
    assert(got !== null, "궁합 링크 복원 실패");
    if (!got) continue;
    const before = gunghapReading(a, b);
    const after = gunghapReading(got.me, got.partner);
    assert(JSON.stringify(before) === JSON.stringify(after), "궁합 풀이 불일치");
    assert(gunghapScore(before) === gunghapScore(after), "궁합 점수 불일치");
    assert(JSON.stringify(got.areas) === JSON.stringify(areas), "고른 영역 불일치");
  }
}
console.log("완료");

// 3) 어긋난 링크는 전부 무시(null)
console.log("3) 잘못된 링크 거르기");
const badFortune = [
  "",
  "#",
  "#f1",
  "#f1.20261002.3",
  "#f1.20261002.3.7.9",
  "#f1.2026102.3.7",
  "#f1.20261002.10.7", // 일간 범위 초과
  "#f1.20261002.3.12", // 일지 범위 초과
  "#f1.20261302.3.7", // 13월
  "#f1.20261032.3.7", // 32일
  "#f1.18991231.3.7", // 1900년 전
  "#f1.20261002.-1.7",
  "#f1.20261002.x.7",
  "#g1.3.7.9.11.11202.11103.7", // 다른 코너 링크
  "#card=abc",
];
for (const h of badFortune) assert(decodeFortuneLink(h) === null, `운세: 걸러야 함 → ${h}`);

const badGunghap = [
  "",
  "#g1",
  "#g1.3.7.9.11.11202.11103", // 영역 빠짐
  "#g1.3.7.9.11.11202.11103.7.1", // 칸 많음
  "#g1.10.7.9.11.11202.11103.7", // 일간 범위 초과
  "#g1.3.12.9.11.11202.11103.7", // 일지 범위 초과
  "#g1.3.7.9.11.1120.11103.7", // 오행 4자리
  "#g1.3.7.9.11.112021.11103.7", // 오행 6자리
  "#g1.3.7.9.11.1120a.11103.7", // 숫자 아님
  "#g1.3.7.9.11.11202.11103.0", // 아무 영역도 안 고름
  "#g1.3.7.9.11.11202.11103.8", // 영역 범위 초과
  "#f1.20261002.3.7", // 다른 코너 링크
];
for (const h of badGunghap) assert(decodeGunghapLink(h) === null, `궁합: 걸러야 함 → ${h}`);
console.log("완료");

// 4) 링크에 생년월일이 그대로 들어가지 않는지(연도 네 자리가 안 보이는지) 확인
console.log("4) 링크에 생년월일 비노출 확인");
const a0 = calcSaju({ calendar: "solar", year: 1995, month: 7, day: 15, hour: 9, minute: 0 });
const b0 = calcSaju({ calendar: "solar", year: 1997, month: 3, day: 22, hour: null, minute: null });
const gLink = encodeGunghapLink(a0, b0, { love: true, friend: true, work: true });
assert(!gLink.includes("1995") && !gLink.includes("1997"), `궁합 링크에 생년이 보임: ${gLink}`);
console.log("완료:", gLink);

if (fail) {
  console.log(`\n${fail}건 실패`);
  process.exit(1);
}
console.log("\n모두 통과");
