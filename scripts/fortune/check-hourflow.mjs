// 시간대별 흐름(열두 시진) 검증.
//  1) 오서둔(일간 → 자시 천간) 전통 표와 맞는지
//  2) 이미 검증된 calcSaju()의 시주와 같은 결과가 나오는지 (시각 → 시진 대조)
//  3) 열두 칸이 두 시간씩 빈틈·겹침 없이 하루를 덮는지
// 실행: node scripts/fortune/check-hourflow.mjs
import { calcSaju, hourFlow, STEMS, BRANCHES, HOUR_SLOT_MINUTES } from "../../lib/fortune/saju.js";

let fail = 0;
function assert(cond, label) {
  if (!cond) {
    fail++;
    console.log(`✗ ${label}`);
  }
}

const me = calcSaju({ calendar: "solar", year: 1995, month: 7, day: 15, hour: 9, minute: 0 });
assert(me.ok, "기준 사주 계산 실패");

// 1) 오서둔: 甲己일 甲子시 · 乙庚일 丙子시 · 丙辛일 戊子시 · 丁壬일 庚子시 · 戊癸일 壬子시
console.log("1) 오서둔(일간 → 자시 천간) 대조");
const EXPECTED_ZI_STEM = { 갑: "갑", 기: "갑", 을: "병", 경: "병", 병: "무", 신: "무", 정: "경", 임: "경", 무: "임", 계: "임" };
const seen = new Set();
for (let d = 0; d < 60; d++) {
  const t = new Date(Date.UTC(2026, 0, 1 + d));
  const date = { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
  const slots = hourFlow(me, date);
  assert(slots.length === 12, "시진이 12개가 아님");
  // 자시 칸의 천간이 그날 일간에 맞는지 (일간은 calcSaju로 다시 구해 대조)
  const sameDay = calcSaju({ calendar: "solar", year: date.year, month: date.month, day: date.day, hour: 12, minute: 0 });
  assert(sameDay.ok, `${date.month}/${date.day} 사주 계산 실패`);
  const dayStem = STEMS[sameDay.dayMaster];
  seen.add(dayStem);
  assert(
    slots[0].pillar.ko[0] === EXPECTED_ZI_STEM[dayStem],
    `${date.month}/${date.day} ${dayStem}일의 자시 천간이 ${slots[0].pillar.ko[0]} (기대: ${EXPECTED_ZI_STEM[dayStem]})`
  );
}
assert(seen.size === 10, `일간 10가지를 모두 확인하지 못함 (${seen.size}가지)`);
console.log(`완료 (일간 ${seen.size}가지)`);

// 2) 시각 → 시진: calcSaju()가 계산한 시주와 같아야 함
console.log("2) calcSaju() 시주와 대조");
const ZI_START_MIN = 1410; // 자시 시작(시계 기준 23:30)
let compared = 0;
for (const day of [2, 7, 15, 23, 28]) {
  for (let minutes = 0; minutes < 1440; minutes += 10) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const born = calcSaju({ calendar: "solar", year: 2026, month: 10, day, hour, minute });
    assert(born.ok && born.pillars.hour, `${day}일 ${hour}:${minute} 사주 계산 실패`);
    if (!born.ok || !born.pillars.hour) continue;
    // 그 시각이 속한 시진과, 그 시진이 속한 사주의 하루(자시부터는 다음 날)
    const branch = Math.floor((((minutes - ZI_START_MIN) % 1440) + 1440) % 1440 / HOUR_SLOT_MINUTES);
    const sajuDay = minutes >= ZI_START_MIN ? day + 1 : day;
    const slot = hourFlow(me, { year: 2026, month: 10, day: sajuDay })[branch];
    assert(
      slot.pillar.ko === born.pillars.hour.ko,
      `10/${day} ${hour}:${String(minute).padStart(2, "0")} → 시진 ${slot.pillar.ko}, calcSaju ${born.pillars.hour.ko}`
    );
    assert(BRANCHES[slot.branch] === born.pillars.hour.ko[1], `지지 불일치 10/${day} ${hour}시`);
    compared++;
  }
}
console.log(`완료 (${compared}개 시각)`);

// 3) 열두 칸이 두 시간씩 하루를 덮는지 + 같은 조건이면 늘 같은 결과(결정론)
console.log("3) 시간 범위·결정론 확인");
const slots = hourFlow(me, { year: 2026, month: 10, day: 2 });
slots.forEach((s, i) => {
  assert(s.branch === i, `${i}번째 칸의 지지 번호가 ${s.branch}`);
  assert((s.endMin - s.startMin + 1440) % 1440 === HOUR_SLOT_MINUTES, `${BRANCHES[i]}시 길이가 두 시간이 아님`);
  const next = slots[(i + 1) % 12];
  assert(s.endMin === next.startMin, `${BRANCHES[i]}시와 다음 칸 사이가 이어지지 않음`);
});
assert(slots[0].startMin === ZI_START_MIN, "자시가 23:30에 시작하지 않음");
const again = hourFlow(me, { year: 2026, month: 10, day: 2 });
assert(JSON.stringify(slots) === JSON.stringify(again), "같은 입력인데 결과가 다름");
console.log("완료");

// 4) 십신·일지 관계가 내 사주를 기준으로 붙는지 (내 일간이 바뀌면 십신도 바뀌어야 함)
console.log("4) 십신이 내 일간 기준인지 확인");
const other = calcSaju({ calendar: "solar", year: 1988, month: 5, day: 9, hour: 9, minute: 0 });
const mineGods = hourFlow(me, { year: 2026, month: 10, day: 2 }).map((s) => s.tenGod);
const otherGods = hourFlow(other, { year: 2026, month: 10, day: 2 }).map((s) => s.tenGod);
assert(me.dayMaster !== other.dayMaster, "두 기준 사주의 일간이 같아 비교가 안 됨");
assert(JSON.stringify(mineGods) !== JSON.stringify(otherGods), "일간이 달라도 십신이 같게 나옴");
console.log("완료:", `내 일간 ${STEMS[me.dayMaster]} / 비교 일간 ${STEMS[other.dayMaster]}`);

if (fail) {
  console.log(`\n${fail}건 실패`);
  process.exit(1);
}
console.log("\n모두 통과");
