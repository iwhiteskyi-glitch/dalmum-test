// 틀린 그림 찾기 검증: 자료 50장·판 고르기·누른 곳 판정·오늘의 그림. 실행: node scripts/games/check-spot.mjs
// 읽을거리(spot-the-difference-tips)에 쓴 숫자(그림마다 바꿀 수 있는 곳 수·크기·지우기 비율)도 여기서 계산해요.
import { readFileSync } from "node:fs";
import { dailyPick, judgeTap, lockMs, nextPicture, PICTURE_COUNT, pickSpots, rememberPicture, SPOT_COUNT, spotDataUrl, stageLevel, stageSeconds } from "../../lib/games/spot/spot.js";
import { dailyBoard } from "../../lib/games/slide/slide.js";
import { seededRandom } from "../../lib/games/slide/slide.js";

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "통과" : "실패"}  ${name}`);
  if (!ok) failed++;
};
const random = seededRandom(5);
const data = Array.from({ length: PICTURE_COUNT }, (_, i) => JSON.parse(readFileSync(new URL(`../../public${spotDataUrl(i)}`, import.meta.url), "utf8")));

/* ---------- 규칙 ---------- */
check("제한 시간: 1판 60초 → 10판 30초 → 그 뒤로 30초", stageSeconds(1) === 60 && stageSeconds(10) === 30 && stageSeconds(25) === 30 && stageSeconds(5) < stageSeconds(4));
check("난이도: 5판까지 보통, 6판부터 어려움", stageLevel(5) === "m" && stageLevel(6) === "h");
check("잘못 누르면 1·2·3초 잠금, 그 뒤로 3초", lockMs(1) === 1000 && lockMs(2) === 2000 && lockMs(3) === 3000 && lockMs(7) === 3000);

/* ---------- 자료 50장으로 판 만들기 ---------- */
{
  let ok = true;
  let hitOk = true;
  let tries = 0;
  for (const pic of data) {
    for (const level of ["m", "h"]) {
      for (let k = 0; k < 40; k++) {
        const spots = pickSpots(pic[level], random);
        tries++;
        if (spots.length !== SPOT_COUNT) ok = false;
        // 가운데를 누르면 그 곳으로 판정, 이미 찾은 곳은 again
        spots.forEach((s, i) => {
          if (judgeTap(spots, [], s.x, s.y) !== i) hitOk = false;
          if (judgeTap(spots, [i], s.x, s.y) !== "again") hitOk = false;
        });
      }
    }
  }
  check(`그림 50장 × 보통·어려움 × 40번(${tries}판): 늘 다른 곳 5곳`, ok);
  check("다른 곳 가운데를 누르면 그 곳, 이미 찾은 곳은 다시 쳐도 틀림 아님", hitOk);
  const far = judgeTap(pickSpots(data[0].m, random), [], -500, -500);
  check("그림 밖 먼 곳은 틀림", far === "miss");
}

/* ---------- 그림 돌리기 ---------- */
{
  let seen = [];
  let ok = true;
  for (let lap = 0; lap < 4; lap++) {
    const shown = new Set();
    for (let i = 0; i < PICTURE_COUNT; i++) {
      const p = nextPicture(seen, PICTURE_COUNT, random);
      if (shown.has(p)) ok = false;
      shown.add(p);
      seen = rememberPicture(seen, p, PICTURE_COUNT);
    }
  }
  check("50장이 한 바퀴 다 나오기 전에는 같은 그림이 안 나옴 (4바퀴)", ok);
}

/* ---------- 오늘의 그림 ---------- */
{
  const a = dailyPick("2026-11-15");
  const b = dailyPick("2026-11-15");
  const sa = pickSpots(data[a.picture].h, seededRandom(a.seed));
  const sb = pickSpots(data[b.picture].h, seededRandom(b.seed));
  check("같은 날은 같은 그림·같은 다른 곳", a.picture === b.picture && JSON.stringify(sa) === JSON.stringify(sb));
  let key = "2026-11-15";
  const pics = new Set();
  let clash = 0;
  for (let i = 0; i < 1000; i++) {
    const d = dailyPick(key);
    if (i < PICTURE_COUNT) pics.add(d.picture);
    if (d.picture === dailyBoard(key).picture) clash++;
    key = new Date(Date.parse(`${key}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  }
  check(`그림 ${PICTURE_COUNT}장이 ${PICTURE_COUNT}일 동안 겹치지 않음`, pics.size === PICTURE_COUNT);
  check("1000일 동안 슬라이드 퍼즐 오늘의 판과 같은 그림인 날 없음", clash === 0);
}

/* ---------- 읽을거리에 쓴 숫자 ---------- */
{
  const stat = (level) => {
    const counts = data.map((p) => p[level].length);
    const all = data.flatMap((p) => p[level]);
    // 바뀌는 모양의 넓이(다각형 넓이 합, 그림 전체는 900×900 = 810,000)
    const areaOf = (poly) => {
      let a = 0;
      for (let i = 0; i < poly.length; i += 2) {
        const j = (i + 2) % poly.length;
        a += poly[i] * poly[j + 1] - poly[j] * poly[i + 1];
      }
      return Math.abs(a) / 2;
    };
    const areas = all.map((s) => s.p.reduce((sum, poly) => sum + areaOf(poly), 0)).sort((x, y) => x - y);
    const removes = all.filter((s) => s.r).length;
    return {
      perPicture: `${Math.min(...counts)}~${Math.max(...counts)}곳 (평균 ${(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1)})`,
      total: all.length,
      area: `넓이 중앙값 ${Math.round(areas[Math.floor(areas.length / 2)])} (그림의 ${((areas[Math.floor(areas.length / 2)] / 810000) * 100).toFixed(2)}%, 가운데 절반 ${Math.round(areas[Math.floor(areas.length / 4)])}~${Math.round(areas[Math.floor((areas.length * 3) / 4)])})`,
      removes: `지우기 ${removes}곳 (${((removes / all.length) * 100).toFixed(1)}%)`,
    };
  };
  console.log("\n      그림 900×900 기준");
  for (const [level, name] of [["m", "보통"], ["h", "어려움"]]) {
    const s = stat(level);
    console.log(`      ${name}: 그림마다 ${s.perPicture} · 모두 ${s.total}곳 · ${s.area} · ${s.removes}`);
  }
  console.log(`      제한 시간: ${Array.from({ length: 10 }, (_, i) => stageSeconds(i + 1)).join("·")}초`);
}

if (failed) {
  console.log(`\n실패 ${failed}개`);
  process.exit(1);
}
console.log("\n모두 통과");
