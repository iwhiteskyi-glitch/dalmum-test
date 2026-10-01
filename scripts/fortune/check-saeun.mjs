// 세운(신년운세)·월운 계산 검증. lunar-javascript의 EightChar(날짜 하나를 "태어난 날"처럼
// 넣어 그 순간의 연주·월주를 구하는 방식)와 대조합니다.
// 실행: node scripts/fortune/check-saeun.mjs
import { saeunYear, saeunMonths, currentSajuYear, pillar } from "../../lib/fortune/saju.js";
import pkg from "lunar-javascript";
const { Lunar } = pkg;

const ko = "갑을병정무기경신임계";
const koB = "자축인묘진사오미신유술해";
function hanjaToKo(hanjaGanzhi) {
  const stemsHanja = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const branchesHanja = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const s = stemsHanja.indexOf(hanjaGanzhi[0]);
  const b = branchesHanja.indexOf(hanjaGanzhi[1]);
  return ko[s] + koB[b];
}

let fail = 0;
function assertEq(label, a, b) {
  if (a !== b) {
    fail++;
    console.log(`✗ ${label}: 우리=${a} 대조=${b}`);
  }
}

// 1) 여러 사주해의 세운 간지를 lunar-javascript와 대조 (그해 한여름 날짜로 조회)
console.log("1) 세운(연주) 대조");
for (let y = 1900; y <= 2100; y += 7) {
  const ours = saeunYear(y);
  const ref = Lunar.fromDate(new Date(y, 6, 15)).getEightChar().getYear(); // 7월 15일, 입춘~소한 사이라 안전
  assertEq(`${y}년 세운`, ours.ko, hanjaToKo(ref));
}
console.log("완료");

// 2) 2026~2029년, 각 사주해의 열두 달 월운을 lunar-javascript와 전부 대조
//    (각 달 시작일 다음 날 정오로 조회해 경계 오차를 피함)
console.log("2) 월운(12개월) 대조");
for (const sajuYear of [1899, 1950, 2000, 2026, 2027, 2028, 2050, 2100]) {
  const months = saeunMonths(sajuYear);
  if (months.length !== 12) {
    fail++;
    console.log(`✗ ${sajuYear}년 월운 개수 ${months.length} (12여야 함)`);
  }
  months.forEach((m, i) => {
    // 절기 경계 당일은 시·분에 따라 아직 전달일 수 있어 피하고, 그 달 한가운데(+15일) 정오로 확인
    const mid = new Date(Date.UTC(m.start.year, m.start.month - 1, m.start.day));
    mid.setUTCDate(mid.getUTCDate() + 15);
    mid.setUTCHours(3, 0, 0, 0); // UTC 3시 = KST 정오
    const ref = Lunar.fromDate(mid).getEightChar().getMonth();
    assertEq(
      `${sajuYear}년 ${i + 1}번째 달(${m.start.year}-${m.start.month}-${m.start.day} 시작) 월주`,
      m.pillar.ko,
      hanjaToKo(ref)
    );
  });
  // 시간순 정렬 확인
  for (let i = 1; i < months.length; i++) {
    const a = months[i - 1].start;
    const b = months[i].start;
    const ta = Date.UTC(a.year, a.month - 1, a.day);
    const tb = Date.UTC(b.year, b.month - 1, b.day);
    if (!(tb > ta)) {
      fail++;
      console.log(`✗ ${sajuYear}년 ${i}→${i + 1}번째 달이 시간순이 아님`);
    }
  }
  // 모든 지지가 정확히 한 번씩(인묘진사오미신유술해자축 순서) 나오는지
  const branches = months.map((m) => m.pillar.branch);
  const expected = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];
  assertEq(`${sajuYear}년 월운 지지 순서`, JSON.stringify(branches), JSON.stringify(expected));
}
console.log("완료");

// 3) currentSajuYear 기본 동작 확인 (올해 기준)
console.log("3) currentSajuYear 확인");
const now = currentSajuYear();
console.log(`   지금 사주해: ${now}년 (${saeunYear(now).ko}년)`);
// 입춘 전후 경계 확인: 2027-02-03(입춘 전)과 2027-02-04(입춘 후, 실제 2027 입춘은 2/4 새벽)은
// check-saju.mjs에서 이미 연주 전환으로 검증했으므로 여기서는 생략.

if (fail === 0) console.log("\n모두 통과");
else {
  console.log(`\n${fail}건 불일치`);
  process.exit(1);
}
