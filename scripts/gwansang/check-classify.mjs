// 관상 칸 나누기 회귀 테스트 (순수 함수 categoriesFromFeatures만 테스트 —
// 얼굴 인식 자체는 브라우저 전용이라 이 스크립트에서는 다루지 않습니다).
// 경계값은 lib/faceBins.js 한곳에서 오므로, 닮은꼴 describe()와 같은 칸을 고르는지도 봅니다.
import { categoriesFromFeatures, DIM_COUNT, PARTS, synthesisKey } from "../../lib/gwansang/classify.js";
import { CUTS } from "../../lib/faceBins.js";

let fail = 0;
let count = 0;
function check(label, actual, expected) {
  count++;
  if (actual !== expected) {
    fail++;
    console.log(`[FAIL] ${label}: 예상 ${expected}, 실제 ${actual}`);
  }
}

// 각 값이 가운데 칸에 오는 기본 특징 벡터
const mid = ([lo, hi]) => (lo + hi) / 2;
const base = () => ({
  eye: { ratio: mid(CUTS.eyeShape), lift: mid(CUTS.eyeLift) },
  brow: { arch: mid(CUTS.browArch), gap: mid(CUTS.browGap) },
  nose: { ratio: mid(CUTS.noseWidth), length: mid(CUTS.noseLength) },
  mouth: { ratio: mid(CUTS.lipThickness), cornerLift: CUTS.mouthCorner - 0.01 },
  jaw: { taper: CUTS.jawTaper - 0.01, widthRatio: mid(CUTS.faceShape) },
  layout: { eyeSpacing: mid(CUTS.eyeSpacing), noseMouth: mid(CUTS.philtrum) },
});

// [부위, 몇째 값, 특징 이름, 경계값]
const DIMS = [
  ["eye", 0, "ratio", CUTS.eyeShape], ["eye", 1, "lift", CUTS.eyeLift],
  ["brow", 0, "arch", CUTS.browArch], ["brow", 1, "gap", CUTS.browGap],
  ["nose", 0, "ratio", CUTS.noseWidth], ["nose", 1, "length", CUTS.noseLength],
  ["mouth", 0, "ratio", CUTS.lipThickness], ["mouth", 1, "cornerLift", CUTS.mouthCorner],
  ["jaw", 0, "taper", CUTS.jawTaper], ["jaw", 1, "widthRatio", CUTS.faceShape],
  ["layout", 0, "eyeSpacing", CUTS.eyeSpacing], ["layout", 1, "noseMouth", CUTS.philtrum],
];

// 1) 경계값 바로 안쪽/바깥쪽에서 기대한 칸이 나오는지 (경계값과 같으면 가운데 칸)
for (const [part, d, field, cut] of DIMS) {
  const at = (v) => {
    const f = base();
    f[part][field] = v;
    return categoriesFromFeatures(f)[part][d];
  };
  if (Array.isArray(cut)) {
    const [lo, hi] = cut;
    check(`${part}.${field} 낮은 경계 아래`, at(lo - 0.001), 0);
    check(`${part}.${field} 낮은 경계`, at(lo), 1);
    check(`${part}.${field} 높은 경계`, at(hi), 1);
    check(`${part}.${field} 높은 경계 위`, at(hi + 0.001), 2);
  } else {
    check(`${part}.${field} 경계`, at(cut), 0);
    check(`${part}.${field} 경계 위`, at(cut + 0.001), 1);
  }
  // 2) 극단값에서도 항상 범위 안
  for (const v of [-10, -1, 0, 1, 10, 1000]) {
    const got = at(v);
    count++;
    if (!(Number.isInteger(got) && got >= 0 && got < DIM_COUNT[part][d])) {
      fail++;
      console.log(`[FAIL] ${part}.${field}=${v} → 범위 밖 칸 ${got}`);
    }
  }
}

// 3) 부위 목록·칸 개수가 서로 맞는지, 둘째 값까지 빠짐없이 다루는지
check("PARTS와 DIM_COUNT 부위 목록 일치", [...PARTS].sort().join(",") === Object.keys(DIM_COUNT).sort().join(","), true);
check("DIMS가 부위마다 두 값씩", DIMS.length, PARTS.length * 2);
check("조합 수 합계(9+9+9+6+6+9=48)", PARTS.reduce((s, p) => s + DIM_COUNT[p][0] * DIM_COUNT[p][1], 0), 48);

// 4) 종합 열쇠: 얼굴형-턱선-미간 18가지
const keys = new Set();
for (let shape = 0; shape < 3; shape++)
  for (let taper = 0; taper < 2; taper++)
    for (let sp = 0; sp < 3; sp++) {
      const c = categoriesFromFeatures(base());
      c.jaw = [taper, shape];
      c.layout = [sp, 1];
      keys.add(synthesisKey(c));
    }
check("종합 열쇠 18가지", keys.size, 18);

// 5) 결정론
check("결정론(같은 입력 → 같은 결과)", JSON.stringify(categoriesFromFeatures(base())), JSON.stringify(categoriesFromFeatures(base())));

console.log(fail === 0 ? `통과 (${count}건 확인)` : `${fail}건 실패`);
if (fail > 0) process.exit(1);
