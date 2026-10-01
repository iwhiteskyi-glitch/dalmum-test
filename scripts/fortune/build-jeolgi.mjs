/**
 * 절기(12절) 시각표 만들기 — lib/fortune/data/jeolgi.js 를 새로 만듭니다.
 *
 * 실행: node scripts/fortune/build-jeolgi.mjs
 *
 * 사주는 설날이 아니라 "절기"를 기준으로 해(입춘)와 달(소한·입춘·경칩 …)이 바뀝니다.
 * 절기 시각은 lunar-javascript(베이징 시간, UTC+8)로 계산하고, 서로 독립된 천문 계산
 * 라이브러리 astronomy-engine으로 한 번 더 계산해 두 값이 3분 넘게 차이 나면 멈춥니다.
 * 두 라이브러리는 개발용(devDependencies)이라 사이트에는 들어가지 않고, 결과 표만 들어갑니다.
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import * as Astronomy from "astronomy-engine";

const require = createRequire(import.meta.url);
const { Solar } = require("lunar-javascript");

const START = 1899;
const END = 2101;
// 양력 1월부터 순서대로: 소한, 입춘, 경칩, 청명, 입하, 망종, 소서, 입추, 백로, 한로, 입동, 대설
const NAMES = ["小寒", "立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪"];
const LONGITUDES = [285, 315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255];
const EPOCH = Date.UTC(START, 0, 1); // 표의 기준 시각(분 단위로 저장)
const MAX_DIFF_MIN = 3;

/** lunar-javascript가 주는 베이징 시간 → UTC 밀리초 */
function beijingToUtc(s) {
  return Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour() - 8, s.getMinute(), s.getSecond());
}

/** 그 해 각 절기의 UTC 시각(lunar-javascript). 음력 해 경계를 피하려고 여러 날짜에서 표를 모읍니다. */
function jieOfYear(year) {
  const found = {};
  for (const [m, d] of [[1, 15], [6, 15], [12, 15]]) {
    const table = Solar.fromYmd(year, m, d).getLunar().getJieQiTable();
    for (const name of NAMES) {
      const s = table[name];
      if (s && s.getYear() === year) found[name] = beijingToUtc(s);
    }
  }
  return NAMES.map((n) => {
    if (found[n] == null) throw new Error(`${year} ${n} 없음`);
    return found[n];
  });
}

let maxDiff = 0;
const values = [];
for (let y = START; y <= END; y++) {
  const times = jieOfYear(y);
  times.forEach((t, i) => {
    // 독립 계산: 태양 황경이 해당 각도가 되는 시각
    const from = new Date(Date.UTC(y, i, 1) - 10 * 86400000);
    const a = Astronomy.SearchSunLongitude(LONGITUDES[i], from, 40);
    const diff = Math.abs(a.date.getTime() - t) / 60000;
    maxDiff = Math.max(maxDiff, diff);
    if (diff > MAX_DIFF_MIN) throw new Error(`${y} ${NAMES[i]} 두 계산이 ${diff.toFixed(1)}분 차이`);
    values.push(Math.round((t - EPOCH) / 60000).toString(36));
  });
}

const out = `// 자동 생성 파일 — 직접 고치지 말고 scripts/fortune/build-jeolgi.mjs 를 다시 실행하세요.
// ${START}~${END}년 12절(소한·입춘·경칩·청명·입하·망종·소서·입추·백로·한로·입동·대설)의 시각.
// 값: ${START}-01-01 00:00 UTC부터 지난 분(36진수). 해마다 12개씩, 양력 1월(소한)부터 순서대로.
// 두 천문 계산(lunar-javascript, astronomy-engine)의 최대 차이: ${maxDiff.toFixed(2)}분
export const JEOLGI_START_YEAR = ${START};
export const JEOLGI_END_YEAR = ${END};
export const JEOLGI_EPOCH_MS = ${EPOCH};
export const JEOLGI = "${values.join(",")}";
`;
writeFileSync(new URL("../../lib/fortune/data/jeolgi.js", import.meta.url), out);
console.log(`완료: ${END - START + 1}년 × 12절, 두 계산 최대 차이 ${maxDiff.toFixed(2)}분, ${out.length}자`);
