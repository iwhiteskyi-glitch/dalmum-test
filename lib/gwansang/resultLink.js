/**
 * 관상 결과를 주소의 "#" 뒤에 담아, 링크를 받은 사람이 사진을 다시 올리지 않아도 같은
 * 결과를 바로 보게 합니다. "#" 뒷부분은 서버로 전송되지 않아서 어디에도 기록되지 않습니다.
 *
 * 담는 것은 부위별 칸 번호뿐입니다 — 눈·눈썹·코·입·턱·이목구비 배치마다 두 자리 숫자
 * (예: #w2.12.01.20.10.02.11). **원본 사진도, 얼굴 특징점 좌표도 담지 않습니다.** 좌표는
 * 사진보다 더 원본에 가까운 정보라서(이론적으로 얼굴을 재구성하는 데 쓰일 수 있음), 분류가
 * 끝난 뒤의 칸 번호만 남기고 나머지는 전부 버립니다. 이 숫자들만으로는 원래 사진을 되돌릴
 * 수 없습니다.
 *
 * 예전 링크(#w1.여섯 자리)도 계속 열립니다. 그때는 부위마다 값 하나만 봤어서, 둘째 값은
 * 가운데 칸으로 채웁니다(V1_FILL).
 *
 * 받는 쪽에서는 각 자리가 그 칸 개수 범위 안에 있는지 하나씩 확인해서, 조금이라도
 * 어긋나면 무시하고 평소처럼 사진 업로드 화면을 보여 줍니다.
 */
import { PARTS, DIM_COUNT } from "./classify.js";

const KEY = "w2";
const V1_KEY = "w1";

/** 예전(#w1) 카테고리 번호 → 지금 칸 번호(값이 작은 쪽부터). 예전엔 부위마다 순서가 달랐어요. */
const V1_TO_POS = {
  eye: [0, 1, 2], // 가는 · 부드러운 · 동그란
  brow: [2, 0, 1], // 아치형 · 일자형 · 완만한 곡선형
  nose: [2, 0, 1], // 콧볼 넓은 · 콧대 곧은 · 적당한
  mouth: [2, 0, 1], // 도톰한 · 얇은 · 보통
  jaw: [1, 0], // 각진 · 부드러운
  layout: [2, 0, 1], // 넓은 미간 · 오밀조밀 · 균형
};
/** 예전 링크에 없는 둘째 값 — 가운데 칸(입꼬리는 두 칸이라 '차분'). */
const V1_FILL = { eye: 1, brow: 1, nose: 1, mouth: 0, jaw: 1, layout: 1 };

const inRange = (n, count) => Number.isInteger(n) && n >= 0 && n < count;

/** 분류 결과({ eye: [a, b], ... })를 짧은 링크로 바꿉니다. */
export function encodeGwansangLink(categories) {
  return `#${KEY}.${PARTS.map((part) => categories[part].join("")).join(".")}`;
}

/** 링크를 분류 결과로 되돌립니다. 형식이 조금이라도 어긋나면 null(= 무시하고 보통 화면). */
export function decodeGwansangLink(hash) {
  if (!hash) return null;
  if (hash.startsWith(`#${KEY}.`)) {
    const parts = hash.slice(KEY.length + 2).split(".");
    if (parts.length !== PARTS.length) return null;
    const categories = {};
    for (let i = 0; i < PARTS.length; i++) {
      const part = PARTS[i];
      if (!/^\d\d$/.test(parts[i])) return null;
      const pair = [Number(parts[i][0]), Number(parts[i][1])];
      if (!pair.every((n, d) => inRange(n, DIM_COUNT[part][d]))) return null;
      categories[part] = pair;
    }
    return categories;
  }
  if (hash.startsWith(`#${V1_KEY}.`)) {
    const parts = hash.slice(V1_KEY.length + 2).split(".");
    if (parts.length !== PARTS.length) return null;
    const categories = {};
    for (let i = 0; i < PARTS.length; i++) {
      const part = PARTS[i];
      const map = V1_TO_POS[part];
      if (!/^\d$/.test(parts[i]) || !inRange(Number(parts[i]), map.length)) return null;
      categories[part] = [map[Number(parts[i])], V1_FILL[part]];
    }
    return categories;
  }
  return null;
}
