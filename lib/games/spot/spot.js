/**
 * 틀린 그림 찾기 규칙(비행기오락실 앱 src/games/spot/spot.ts를 그대로 옮겼어요. 순수한 계산만 있어요).
 *  - 그림마다 바꿀 수 있는 곳 자료(public/games/spot/spot-NN.json, 보통 "m"·어려움 "h")에서 한 판의 틀린 곳 5곳을 골라요
 *  - 누른 곳을 판정하고, 연승 단계마다 난이도와 제한 시간을 정해요
 *  - 좌표는 모두 그림 기준 0~900이에요(화면 크기와 상관없어요)
 *  - 그림은 슬라이드 퍼즐과 같은 50장(public/games/slide)을 써요
 */
/** 그림 한 변의 크기 (자료의 좌표 기준) */
export const PICTURE_SIZE = 900;
/** 한 판의 틀린 곳 수 */
export const SPOT_COUNT = 5;
/** 그중 지우기 수 (나머지는 색 바꾸기) */
export const REMOVE_COUNT = 2;
/** 판마다 틀려도 되는 횟수 (이만큼 틀리면 끝) */
export const MAX_WRONG = 5;
/** 더 어려워지지 않는 판 (시간이 가장 짧아진다) */
export const HARDEST_STAGE = 10;
const LONGEST_SECONDS = 60;
const SHORTEST_SECONDS = 30;
/** 여기까지는 보통, 다음 판부터 어려움 */
const LAST_MEDIUM_STAGE = 5;
/** 틀린 곳끼리 떨어질 거리: 넓게 시도하다가 안 되면 좁힌다 */
const SPOT_GAPS = [120, 80, 40];
/** 정답 범위: 바뀐 모양 둘레 여유 / 작은 곳도 가운데서 이만큼은 맞는다 (손가락 크기) */
const HIT_MARGIN = 40;
const MIN_HIT = 85;
/** 한 바퀴를 새로 시작할 때 지난 바퀴의 끝에서 이만큼은 뒤로 미룬다 (바로 또 나오지 않게) */
const RECENT_PICTURES = 25;
function shuffled(items, random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
/** 한 판의 틀린 곳 고르기: 지우기를 먼저 정해진 수만큼, 나머지는 색 바꾸기로 서로 떨어지게 */
export function pickSpots(raw, random) {
  const removes = shuffled(
    raw.filter((spot) => spot.r),
    random,
  );
  const colors = shuffled(
    raw.filter((spot) => !spot.r),
    random,
  );
  let chosen = [];
  for (const gap of SPOT_GAPS) {
    chosen = [];
    const fill = (spots, until) => {
      for (const spot of spots) {
        if (chosen.length >= until) return;
        const apart = chosen.every((other) => Math.hypot(spot.x - other.x, spot.y - other.y) > gap);
        const newGroup = spot.g === undefined || chosen.every((other) => other.g !== spot.g);
        if (apart && newGroup) chosen.push(spot);
      }
    };
    fill(removes, REMOVE_COUNT);
    fill(colors, SPOT_COUNT);
    if (chosen.length === SPOT_COUNT) break;
  }
  return chosen.map((spot) => ({
    x: spot.x,
    y: spot.y,
    radius: spot.s,
    polygons: spot.p,
    color: spot.c[Math.floor(random() * spot.c.length)],
    remove: !!spot.r,
    side: random() < 0.5 ? "top" : "bottom",
  }));
}
/** 다각형을 그림 경로 글자로 (구멍은 짝수-홀수 규칙으로 뚫린다) */
export function spotPath(polygons) {
  return polygons
    .map((poly) => {
      const points = [];
      for (let i = 0; i < poly.length; i += 2) points.push(`${poly[i]} ${poly[i + 1]}`);
      return `M${points.join("L")}Z`;
    })
    .join("");
}
/** 점이 다각형 안에 있는지 */
function insidePolygon(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [poly[i], poly[i + 1], poly[j], poly[j + 1]];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** 점에서 다각형 변까지 가장 가까운 거리 */
function polygonDistance(poly, x, y) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const [ax, ay, bx, by] = [poly[j], poly[j + 1], poly[i], poly[i + 1]];
    const length = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / length));
    best = Math.min(best, Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))));
  }
  return best;
}
/** 누른 곳이 이 틀린 곳에서 얼마나 먼지. 정답 범위 밖이면 null */
function hitDistance(spot, x, y) {
  const center = Math.hypot(x - spot.x, y - spot.y);
  if (center <= MIN_HIT) return center;
  for (const poly of spot.polygons) {
    if (insidePolygon(poly, x, y) || polygonDistance(poly, x, y) <= HIT_MARGIN) return center;
  }
  return null;
}
/** 누른 곳 판정: 범위가 겹치면 가운데가 가까운 쪽. 이미 찾은 곳을 또 누르면 틀린 걸로 치지 않는다 */
export function judgeTap(spots, found, x, y) {
  let best = null;
  spots.forEach((spot, index) => {
    const distance = hitDistance(spot, x, y);
    if (distance !== null && (!best || distance < best.distance)) best = { index, distance };
  });
  if (!best) return "miss";
  const { index } = best;
  return found.includes(index) ? "again" : index;
}
/** 틀리고 못 누르는 시간: 연달아 틀릴수록 1초, 2초, 3초 (맞히면 처음부터) */
export const lockMs = (wrongInARow) => Math.min(3, Math.max(1, wrongInARow)) * 1000;
/** 일시정지 뒤: 멈춘 시간만큼 시각들을 뒤로 민다 (0은 아직 안 쓴 시각이라 그대로) */
export function shiftClock(stage, ms) {
  const shift = (time) => (time === 0 ? 0 : time + ms);
  return {
    ...stage,
    deadline: shift(stage.deadline),
    lockUntil: shift(stage.lockUntil),
    hintUntil: shift(stage.hintUntil),
  };
}
/** 연승 단계의 난이도 */
export const stageLevel = (stage) => (stage <= LAST_MEDIUM_STAGE ? "m" : "h");
/** 연승 단계의 제한 시간(초): 판마다 줄다가 가장 어려운 판에서 멈춘다 */
export function stageSeconds(stage) {
  const step = (LONGEST_SECONDS - SHORTEST_SECONDS) / (HARDEST_STAGE - 1);
  return Math.max(SHORTEST_SECONDS, Math.round(LONGEST_SECONDS - (stage - 1) * step));
}
/** 다음 그림: 본 그림 기록(seen)에서 이번 바퀴에 아직 안 나온 그림을 무작위로. 모든 그림이 한 번씩 나오면 새 바퀴 */
export function nextPicture(seen, count, random) {
  const start = Math.floor(seen.length / count) * count;
  const shown = seen.slice(start);
  const lastLap = seen.slice(Math.max(0, start - Math.min(RECENT_PICTURES, count - 1)), start);
  const left = Array.from({ length: count }, (_, i) => i).filter((i) => !shown.includes(i));
  const later = left.filter((i) => !lastLap.includes(i));
  const choices = later.length > 0 ? later : left;
  return choices[Math.floor(random() * choices.length)];
}
/** 본 그림 기록에 더하기: 두 바퀴가 차면 오래된 한 바퀴를 버린다 */
export function rememberPicture(seen, picture, count) {
  const next = [...seen, picture];
  return next.length >= count * 2 ? next.slice(count) : next;
}

/* ---------- 사이트에서 더한 것: 자료 주소 · 오늘의 그림 ---------- */

export const PICTURE_COUNT = 50;
export const spotDataUrl = (i) => `/games/spot/spot-${String(i + 1).padStart(2, "0")}.json`;
export const spotPictureUrl = (i) => `/games/slide/slide-${String(i + 1).padStart(2, "0")}.jpg`;

/** 날짜("2026-11-15") → 오늘의 그림 번호와 틀린 곳을 고를 씨앗. 슬라이드 퍼즐 오늘의 판과 겹치지 않게 그림 순서를 달리해요 */
export function dailyPick(key) {
  const n = Math.floor(Date.parse(`${key}T00:00:00Z`) / 86400000);
  return { picture: (n * 23 + 11) % PICTURE_COUNT, seed: n * 40503 + 7 }; // 23: 50과 서로소
}
