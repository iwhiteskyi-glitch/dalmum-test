// 궁합 계산 검증. 외부 라이브러리에 "궁합 점수" 개념이 따로 없어서(이 사이트가 정한 자체
// 공식), 외부 대조 대신 내부 불변식(0~100 범위, 방향 간 상호보완 관계, 결정론적 재현성 등)을
// 전수 테스트합니다.
// 실행: node scripts/fortune/check-gunghap.mjs
import { calcSaju, gunghapReading, gunghapScore, TEN_GODS, GOD_CATEGORIES, STEMS } from "../../lib/fortune/saju.js";

let fail = 0;
function assert(cond, label) {
  if (!cond) {
    fail++;
    console.log(`✗ ${label}`);
  }
}

// 1) 점수는 항상 0~100
console.log("1) 점수 범위 전수 테스트");
for (let cat = 0; cat < 5; cat++) {
  for (const dr of ["same", "six", "three", "clash", "none"]) {
    for (const sp of [true, false]) {
      const s = gunghapScore({ category: cat, dayRelation: dr, samePolarity: sp });
      assert(s >= 0 && s <= 100, `범위 밖: cat=${cat} dr=${dr} sp=${sp} → ${s}`);
    }
  }
}
console.log("완료");

// 2) 두 방향(godAtoB·godBtoA)의 오행 관계는 항상 상호보완적이어야 함
//    rel=0(같음)↔0, 1(내가낳음)↔4(나를낳음), 2(내가이김)↔3(나를이김) 이 쌍을 이뤄야 함
console.log("2) 양방향 오행 관계 상호보완성 전수 테스트(10 일간 x 10 일간)");
const COMPLEMENT = { 0: 0, 1: 4, 2: 3, 3: 2, 4: 1 };
let checked = 0;
for (let sa = 0; sa < 10; sa++) {
  for (let sb = 0; sb < 10; sb++) {
    const a = { dayMaster: sa };
    const b = { dayMaster: sb };
    // tenGod을 직접 못 부르니 saju.js의 공개 함수로 우회 계산
    const { tenGod } = await import("../../lib/fortune/saju.js");
    const godAB = tenGod(sa, sb);
    const godBA = tenGod(sb, sa);
    const relAB = Math.floor(godAB / 2);
    const relBA = Math.floor(godBA / 2);
    assert(COMPLEMENT[relAB] === relBA, `상호보완 깨짐: stem ${sa}->${sb} relAB=${relAB} relBA=${relBA}`);
    checked++;
  }
}
console.log(`완료 (${checked}쌍 확인)`);

// 3) 같은 입력이면 항상 같은 결과(결정론적)
console.log("3) 결정론적 재현성 확인");
const p1 = calcSaju({ calendar: "solar", year: 1990, month: 5, day: 15, hour: 14, minute: 30 });
const p2 = calcSaju({ calendar: "solar", year: 1992, month: 11, day: 3 });
const r1 = gunghapReading(p1, p2);
const r2 = gunghapReading(p1, p2);
assert(JSON.stringify(r1) === JSON.stringify(r2), "같은 입력인데 결과가 다름");
assert(gunghapScore(r1) === gunghapScore(r2), "같은 입력인데 점수가 다름");
console.log("완료:", TEN_GODS[r1.godAtoB], "/", GOD_CATEGORIES[r1.category], "/ 점수", gunghapScore(r1));

// 4) 나와 나 자신의 궁합(같은 생년월일) — 당연히 일간이 같아 "비견" 관계, 음양 같음
console.log("4) 자기 자신과의 궁합(비견 관계 확인)");
const self = calcSaju({ calendar: "solar", year: 2000, month: 1, day: 1 });
const rs = gunghapReading(self, self);
assert(TEN_GODS[rs.godAtoB] === "비견", `자기 자신인데 비견이 아님: ${TEN_GODS[rs.godAtoB]}`);
assert(rs.samePolarity === true, "자기 자신인데 음양이 다르다고 나옴");
assert(rs.dayRelation === "same", `자기 자신인데 일지 관계가 same이 아님: ${rs.dayRelation}`);
console.log("완료:", TEN_GODS[rs.godAtoB], rs.dayRelation, "점수", gunghapScore(rs));

// 5) 예시 몇 쌍 눈으로 확인
console.log("5) 예시 쌍");
const examples = [
  [{ year: 1995, month: 8, day: 20 }, { year: 1996, month: 3, day: 14 }],
  [{ year: 1988, month: 12, day: 25 }, { year: 1990, month: 6, day: 1 }],
  [{ year: 2001, month: 2, day: 4 }, { year: 2001, month: 2, day: 5 }], // 거의 같은 날
];
for (const [x, y] of examples) {
  const sx = calcSaju({ calendar: "solar", ...x });
  const sy = calcSaju({ calendar: "solar", ...y });
  const r = gunghapReading(sx, sy);
  console.log(
    `  ${STEMS[sx.dayMaster]}일간 × ${STEMS[sy.dayMaster]}일간 → 내가본상대:${TEN_GODS[r.godAtoB]} 상대가본나:${TEN_GODS[r.godBtoA]} 일지:${r.dayRelation} 점수:${gunghapScore(r)}`
  );
}

if (fail === 0) console.log("\n모두 통과");
else {
  console.log(`\n${fail}건 불일치`);
  process.exit(1);
}
