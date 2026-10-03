// 관상 카테고리 분류 로직 회귀 테스트 (순수 함수 categoriesFromFeatures만 테스트 —
// 얼굴 인식 자체는 브라우저 전용이라 이 스크립트에서는 다루지 않습니다).
import { categoriesFromFeatures, PART_CATEGORY_COUNT, PARTS } from "../../lib/gwansang/classify.js";

let fail = 0;
function check(label, actual, expected) {
  if (actual !== expected) {
    fail++;
    console.log(`[FAIL] ${label}: 예상 ${expected}, 실제 ${actual}`);
  }
}

// 각 부위를 기본값으로 둔 특징 벡터
const base = () => ({
  eye: { ratio: 0.34 },
  brow: { arch: 0.03 },
  nose: { ratio: 0.7 },
  mouth: { ratio: 0.35 },
  jaw: { taper: 0.7 },
  layout: { eyeSpacing: 0.29 },
});

// 1) 경계값 바로 안쪽/바깥쪽에서 기대한 카테고리가 나오는지
const cases = [
  ["eye", "ratio", 0.27, 0], ["eye", "ratio", 0.28, 1], ["eye", "ratio", 0.34, 1], ["eye", "ratio", 0.4, 1], ["eye", "ratio", 0.41, 2],
  ["brow", "arch", 0.06, 0], ["brow", "arch", 0.05, 2], ["brow", "arch", 0.01, 1], ["brow", "arch", 0.02, 2], ["brow", "arch", 0.03, 2],
  ["nose", "ratio", 0.86, 0], ["nose", "ratio", 0.85, 2], ["nose", "ratio", 0.61, 1], ["nose", "ratio", 0.62, 2], ["nose", "ratio", 0.7, 2],
  ["mouth", "ratio", 0.43, 0], ["mouth", "ratio", 0.42, 2], ["mouth", "ratio", 0.27, 1], ["mouth", "ratio", 0.28, 2], ["mouth", "ratio", 0.35, 2],
  ["jaw", "taper", 0.83, 0], ["jaw", "taper", 0.82, 1], ["jaw", "taper", 0.5, 1],
  ["layout", "eyeSpacing", 0.33, 0], ["layout", "eyeSpacing", 0.32, 2], ["layout", "eyeSpacing", 0.26, 1], ["layout", "eyeSpacing", 0.27, 2], ["layout", "eyeSpacing", 0.29, 2],
];
for (const [part, field, value, expected] of cases) {
  const f = base();
  f[part][field] = value;
  const got = categoriesFromFeatures(f)[part];
  check(`${part}.${field}=${value}`, got, expected);
}

// 2) 극단값(아주 작은 값 / 아주 큰 값)에서도 항상 유효한 카테고리 번호를 돌려주는지
const extremes = [-10, -1, 0, 1, 10, 1000];
for (const part of PARTS) {
  const field = { eye: "ratio", brow: "arch", nose: "ratio", mouth: "ratio", jaw: "taper", layout: "eyeSpacing" }[part];
  for (const v of extremes) {
    const f = base();
    f[part][field] = v;
    const got = categoriesFromFeatures(f)[part];
    const n = PART_CATEGORY_COUNT[part];
    if (!(Number.isInteger(got) && got >= 0 && got < n)) {
      fail++;
      console.log(`[FAIL] ${part}=${v} → 범위 밖 카테고리 ${got} (0~${n - 1}이어야 함)`);
    }
  }
}

// 3) PARTS와 PART_CATEGORY_COUNT의 부위 목록이 서로 같은지
const a = [...PARTS].sort().join(",");
const b = Object.keys(PART_CATEGORY_COUNT).sort().join(",");
check("PARTS와 PART_CATEGORY_COUNT 부위 목록 일치", a === b, true);

// 4) 결정론: 같은 입력이면 항상 같은 결과
const sample = base();
const r1 = JSON.stringify(categoriesFromFeatures(sample));
const r2 = JSON.stringify(categoriesFromFeatures(sample));
check("결정론(같은 입력 → 같은 결과)", r1 === r2, true);

console.log(fail === 0 ? `통과 (${cases.length + extremes.length * PARTS.length + 2}건 확인)` : `${fail}건 실패`);
if (fail > 0) process.exit(1);
