/**
 * 관상 결과를 주소의 "#" 뒤에 담아, 링크를 받은 사람이 사진을 다시 올리지 않아도 같은
 * 결과를 바로 보게 합니다. "#" 뒷부분은 서버로 전송되지 않아서 어디에도 기록되지 않습니다.
 *
 * 담는 것은 부위별 카테고리 번호뿐입니다 — 눈매·눈썹·코·입·턱선·이목구비 배치, 여섯 자리
 * 숫자. **원본 사진도, 얼굴 특징점 좌표도 담지 않습니다.** 좌표는 사진보다 더 원본에 가까운
 * 정보라서(이론적으로 얼굴을 재구성하는 데 쓰일 수 있음), 분류가 끝난 뒤의 카테고리 번호만
 * 남기고 나머지는 전부 버립니다. 이 숫자들만으로는 원래 사진을 되돌릴 수 없습니다.
 *
 * 받는 쪽에서는 각 자리가 그 부위의 카테고리 개수 범위 안에 있는지 하나씩 확인해서,
 * 조금이라도 어긋나면 무시하고 평소처럼 사진 업로드 화면을 보여 줍니다.
 */
import { PARTS, PART_CATEGORY_COUNT } from "./classify.js";

const GWANSANG_KEY = "w1";

const digit = (v, max) => {
  const n = /^\d{1,2}$/.test(v) ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 0 && n <= max ? n : null;
};

/** 분류 결과({ eye, brow, nose, mouth, jaw, layout })를 짧은 링크로 바꿉니다. */
export function encodeGwansangLink(categories) {
  const digits = PARTS.map((part) => categories[part]).join(".");
  return `#${GWANSANG_KEY}.${digits}`;
}

/** 링크를 분류 결과로 되돌립니다. 형식이 조금이라도 어긋나면 null(= 무시하고 보통 화면). */
export function decodeGwansangLink(hash) {
  if (!hash || !hash.startsWith(`#${GWANSANG_KEY}.`)) return null;
  const parts = hash.slice(GWANSANG_KEY.length + 2).split(".");
  if (parts.length !== PARTS.length) return null;

  const categories = {};
  for (let i = 0; i < PARTS.length; i++) {
    const part = PARTS[i];
    const max = PART_CATEGORY_COUNT[part] - 1;
    const n = digit(parts[i], max);
    if (n === null) return null;
    categories[part] = n;
  }
  return categories;
}
