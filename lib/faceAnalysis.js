/**
 * 얼굴 분석 로직 (100% 브라우저 실행)
 * ------------------------------------------------------------------
 * - 업로드된 사진은 서버로 전송되지 않습니다. 이 파일의 모든 함수는
 *   사용자 브라우저 안에서만 동작하며, 결과값(숫자/짧은 텍스트)만 만들어 돌려줍니다.
 * - 부위별 수치는 "과학적으로 정밀한 값"이 아니라 재미 목적의 결과입니다.
 *
 * 사용 라이브러리: @vladmandic/face-api (face-api.js의 유지보수 포크, 무료 오픈소스)
 *   1) tiny_face_detector : 얼굴 위치 찾기 (가벼움)
 *   2) face_landmark_68   : 얼굴 특징점 68개 추출 (눈/코/입/윤곽 좌표)
 *   3) face_recognition    : 얼굴 특징 벡터(128차원) → 전체 닮음도 계산에 사용
 */

// face-api는 브라우저에서만 동작합니다. 서버 렌더링 시 불러오면 오류가 나므로
// 최초 호출 시점에 동적으로 import 합니다.
const MODEL_URL = "/models";
let faceapi = null;
let modelsPromise = null;

async function getFaceApi() {
  if (!faceapi) {
    faceapi = await import("@vladmandic/face-api");
  }
  return faceapi;
}

/** 모델 파일(약 7MB)을 한 번만 불러옵니다. 두 번째 호출부터는 즉시 반환됩니다. */
export function loadModels() {
  if (typeof window === "undefined") return Promise.resolve();
  if (!modelsPromise) {
    modelsPromise = (async () => {
      const api = await getFaceApi();
      await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        api.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    })().catch((err) => {
      modelsPromise = null; // 실패 시 다음 시도에서 다시 받도록
      throw err;
    });
  }
  return modelsPromise;
}

/**
 * 업로드한 파일(File)을 브라우저 안에서 캔버스로 변환합니다.
 * 폰 사진처럼 아주 큰 이미지는 가장 긴 변을 1024px로 줄여 분석 속도를 높입니다.
 */
export function fileToCanvas(file, maxSide = 1024) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했어요. 다른 사진으로 시도해 주세요."));
    };
    img.src = url;
  });
}

/** 캔버스에서 얼굴 1개 + 특징점 68개 + 특징 벡터를 뽑아냅니다. */
export async function detectFace(canvas) {
  const api = await getFaceApi();
  const detection = await api
    .detectSingleFace(
      canvas,
      new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection || null;
}

/* ------------------------------------------------------------------ *
 *  기하 유틸 (특징점 좌표 계산)
 * ------------------------------------------------------------------ */

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const mean = (pts) => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
});
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** 128차원 특징 벡터 사이의 유클리드 거리 (face-api의 euclideanDistance와 동일) */
function euclidean(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * 얼굴 크기/위치/기울기가 달라도 비교할 수 있도록 좌표를 정규화합니다.
 * - 두 눈 중심을 잇는 선을 수평으로 회전
 * - 두 눈 사이 거리를 1로 맞춰 크기 통일
 * - 두 눈의 중점을 원점(0,0)으로 이동
 */
function normalizeLandmarks(landmarks) {
  const pts = landmarks.positions.map((p) => ({ x: p.x, y: p.y }));
  const leftEye = mean(landmarks.getLeftEye());
  const rightEye = mean(landmarks.getRightEye());
  const center = mid(leftEye, rightEye);
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  const angle = Math.atan2(dy, dx);
  const eyeDist = Math.hypot(dx, dy) || 1;
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  return pts.map((p) => {
    const tx = p.x - center.x;
    const ty = p.y - center.y;
    return {
      x: (tx * cos - ty * sin) / eyeDist,
      y: (tx * sin + ty * cos) / eyeDist,
    };
  });
}

// face-api 68점 인덱스 묶음
const IDX = {
  jaw: range(0, 16),
  leftBrow: range(17, 21),
  rightBrow: range(22, 26),
  noseBridge: range(27, 30),
  noseBottom: range(31, 35),
  leftEye: range(36, 41),
  rightEye: range(42, 47),
  outerMouth: range(48, 59),
  innerMouth: range(60, 67),
};
function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}
const pick = (pts, idxs) => idxs.map((i) => pts[i]);

/* ------------------------------------------------------------------ *
 *  부위별 특징 벡터 만들기 (정규화 좌표 기준)
 * ------------------------------------------------------------------ */

function eyeFeatures(n) {
  // 눈 6개 점 중 어떤 인덱스가 '눈꼬리/눈앞머리'인지는 모델마다 순서가 다를 수 있어
  // 인덱스를 가정하지 않고, x좌표가 가장 작은/큰 점을 두 눈구석으로 직접 찾습니다.
  const eyeShape = (e) => {
    let lo = e[0];
    let hi = e[0];
    for (const p of e) {
      if (p.x < lo.x) lo = p;
      if (p.x > hi.x) hi = p;
    }
    const rest = e.filter((p) => p !== lo && p !== hi);
    const ys = rest.map((p) => p.y);
    const w = dist(lo, hi) || 1e-6;
    const h = Math.max(...ys) - Math.min(...ys);
    const tilt = Math.atan2(hi.y - lo.y, hi.x - lo.x); // 눈꼬리~눈앞머리 선의 기울기
    return { w, ratio: h / w, tilt };
  };
  const a = eyeShape(pick(n, IDX.leftEye));
  const b = eyeShape(pick(n, IDX.rightEye));
  return {
    width: (a.w + b.w) / 2,
    ratio: (a.ratio + b.ratio) / 2,
    tilt: (a.tilt + b.tilt) / 2,
  };
}

function browFeatures(n) {
  const brow = (b, eye) => {
    const len = dist(b[0], b[b.length - 1]);
    const line = mid(b[0], b[b.length - 1]);
    const arch = line.y - b[Math.floor(b.length / 2)].y; // 중앙이 얼마나 위로 솟았나
    const gap = line.y - mean(eye).y; // 눈과의 세로 간격(음수: 눈보다 위)
    return { len, arch, gap };
  };
  const l = brow(pick(n, IDX.leftBrow), pick(n, IDX.leftEye));
  const r = brow(pick(n, IDX.rightBrow), pick(n, IDX.rightEye));
  return {
    length: (l.len + r.len) / 2,
    arch: (l.arch + r.arch) / 2,
    gap: (l.gap + r.gap) / 2,
  };
}

function noseFeatures(n) {
  const top = n[27];
  const tip = n[30];
  const alarL = n[31];
  const alarR = n[35];
  const length = dist(top, tip);
  const width = dist(alarL, alarR);
  return { length, width, ratio: width / (length || 1e-6) };
}

function mouthFeatures(n) {
  const left = n[48];
  const right = n[54];
  const topLip = n[51];
  const botLip = n[57];
  const width = dist(left, right);
  const height = dist(topLip, botLip);
  const upperThickness = dist(n[51], n[62]);
  const cornerTilt = Math.atan2(right.y - left.y, right.x - left.x);
  const smile = mid(left, right).y - topLip.y; // 입꼬리가 윗입술보다 아래면 양수
  return {
    width,
    height,
    ratio: height / (width || 1e-6),
    upperThickness,
    cornerTilt,
    smile,
  };
}

function jawFeatures(n) {
  const jaw = pick(n, IDX.jaw);
  const cheekWidth = dist(jaw[0], jaw[16]);
  const midWidth = dist(jaw[4], jaw[12]);
  const chin = jaw[8];
  const browY = mean([...pick(n, IDX.leftBrow), ...pick(n, IDX.rightBrow)]).y;
  const faceLength = chin.y - browY;
  const jawAngle = Math.atan2(chin.y - jaw[4].y, chin.x - jaw[4].x);
  return {
    widthRatio: cheekWidth / (faceLength || 1e-6),
    taper: midWidth / (cheekWidth || 1e-6), // 1에 가까울수록 각진 턱, 작을수록 갸름
    jawAngle,
  };
}

function layoutFeatures(n) {
  const browY = mean([...pick(n, IDX.leftBrow), ...pick(n, IDX.rightBrow)]).y;
  const eyeY = mean([...pick(n, IDX.leftEye), ...pick(n, IDX.rightEye)]).y;
  const noseY = n[30].y;
  const mouthY = mid(n[51], n[57]).y;
  const chinY = n[8].y;
  const span = chinY - browY || 1e-6;
  const innerEyeGap = dist(n[39], n[42]);
  const faceWidth = dist(n[0], n[16]) || 1e-6;
  return {
    browEye: (eyeY - browY) / span,
    eyeNose: (noseY - eyeY) / span,
    noseMouth: (mouthY - noseY) / span,
    mouthChin: (chinY - mouthY) / span,
    eyeSpacing: innerEyeGap / faceWidth,
  };
}

/* ------------------------------------------------------------------ *
 *  두 특징 벡터 비교 → 0~1 유사도
 * ------------------------------------------------------------------ */

/** 값 하나의 상대 차이를 유사도(0~1)로. scale은 "이 정도 차이면 꽤 다르다"의 기준. */
function simOf(a, b, scale) {
  const diff = Math.abs(a - b) / scale;
  return clamp(1 - diff, 0, 1);
}

function combine(sims) {
  return sims.reduce((s, v) => s + v, 0) / sims.length;
}

/* ------------------------------------------------------------------ *
 *  짧은 특징 설명 텍스트 (재미용)
 * ------------------------------------------------------------------ */

/** 값이 어느 구간에 속하는지에 따라 labels[0|1|2] 중 하나를 고릅니다. */
function bin3(value, lo, hi, labels) {
  if (value < lo) return labels[0];
  if (value > hi) return labels[2];
  return labels[1];
}

function describe(part, f) {
  switch (part) {
    case "eye": {
      const size = bin3(f.width, 0.32, 0.44, ["작은 눈", "보통 크기의 눈", "큰 눈"]);
      const shape = bin3(f.ratio, 0.28, 0.4, [
        "가늘고 시크한 눈매",
        "부드러운 눈매",
        "동그랗고 또렷한 눈매",
      ]);
      const tilt = f.tilt > 0.06 ? "눈꼬리가 살짝 올라간 편" : f.tilt < -0.06 ? "눈꼬리가 살짝 처진 편" : "눈꼬리가 일자에 가까운 편";
      return `${size} · ${shape} · ${tilt}`;
    }
    case "brow": {
      const length = bin3(f.length, 0.55, 0.78, ["짧은 편", "적당한 길이", "긴 편"]);
      const shape = f.arch > 0.05 ? "아치형 눈썹" : f.arch < 0.02 ? "일자형 눈썹" : "완만한 곡선형 눈썹";
      // gap은 항상 음수(눈썹이 눈보다 위)이므로, 0에 가까울수록 눈에 가깝고
      // 음수로 클수록(더 작을수록) 눈과 멀리 떨어져 있다는 뜻입니다.
      const pos = f.gap < -0.28 ? "눈과 간격이 있는 편" : f.gap > -0.16 ? "눈에 가까운 편" : "눈과의 간격이 보통";
      return `${length} · ${shape} · ${pos}`;
    }
    case "nose": {
      const length = bin3(f.length, 0.45, 0.62, ["짧은 코", "보통 길이의 코", "긴 코"]);
      const width = f.ratio > 0.85 ? "콧볼이 넓은 편" : f.ratio < 0.62 ? "오똑하고 갸름한 콧대" : "적당한 콧볼 너비";
      return `${length} · ${width}`;
    }
    case "mouth": {
      const w = f.width > 1.05 ? "큰 입" : f.width < 0.8 ? "작은 입" : "적당한 크기의 입";
      const lip = f.ratio > 0.42 ? "도톰한 입술" : f.ratio < 0.28 ? "얇은 입술" : "보통 두께의 입술";
      const corner = f.smile > 0.16 ? "입꼬리가 또렷한 편" : "입매가 차분한 편";
      return `${w} · ${lip} · ${corner}`;
    }
    case "jaw": {
      const shape = f.widthRatio > 0.92 ? "둥근 얼굴형" : f.widthRatio < 0.78 ? "갸름한 얼굴형" : "계란형 얼굴형";
      const angle = f.taper > 0.82 ? "각진 턱선" : "부드러운 턱선";
      return `${shape} · ${angle}`;
    }
    case "layout": {
      const spacing = f.eyeSpacing > 0.32 ? "미간(눈 사이)이 넓은 편" : f.eyeSpacing < 0.27 ? "이목구비가 오밀조밀한 편" : "미간 간격이 균형 잡힌 편";
      const philtrum = bin3(f.noseMouth, 0.2, 0.3, [
        "인중이 짧은 편",
        "인중 비율이 보통",
        "인중이 긴 편",
      ]);
      return `${spacing} · ${philtrum}`;
    }
    default:
      return "";
  }
}

/* ------------------------------------------------------------------ *
 *  부위 이미지 크롭 (원본 캔버스 → 작은 미리보기 dataURL)
 * ------------------------------------------------------------------ */

/**
 * 결과 카드의 미리보기는 정사각형(aspect-ratio:1)으로 표시되므로, 잘라내는
 * 단계에서부터 정사각형으로 만들어야 실제 화면에서 부위가 잘리지 않고 보입니다.
 * (예전에는 눈썹처럼 가로로 얇고 긴 영역을 그대로 잘라, 화면에 정사각형으로
 * 욱여넣는 과정에서 좌우가 잘려나가 살색 배경만 보이는 문제가 있었습니다.)
 */
function cropRegion(canvas, points, padRatio = 0.6) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = maxX - minX || 10;
  const h = maxY - minY || 10;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // 더 긴 변 기준으로 여백을 더해 정사각형 한 변의 길이를 정합니다.
  let side = Math.max(w, h) * (1 + padRatio);
  side = Math.min(side, canvas.width, canvas.height); // 원본보다 커지지 않게

  let sx = clamp(cx - side / 2, 0, canvas.width - side);
  let sy = clamp(cy - side / 2, 0, canvas.height - side);

  const out = document.createElement("canvas");
  const size = 200;
  out.width = size;
  out.height = size;
  out.getContext("2d").drawImage(canvas, sx, sy, side, side, 0, 0, size, size);
  return out.toDataURL("image/jpeg", 0.85);
}

/* ------------------------------------------------------------------ *
 *  메인: 두 얼굴 분석 결과 조립
 * ------------------------------------------------------------------ */

// raw 유사도를 보기 좋은 % 밴드로 매핑 (재미용 톤)
// 서로 다른 사람: 부위별 대략 45~70 / 닮은꼴: 70~92 / 동일인 다른 사진: 85~97
function toPercent(raw, lo = 35, hi = 96, from = 0.4, to = 0.95) {
  const t = clamp((raw - from) / (to - from), 0, 1);
  return Math.round(lo + t * (hi - lo));
}

const PART_META = [
  { key: "eye", name: "눈" },
  { key: "brow", name: "눈썹" },
  { key: "nose", name: "코" },
  { key: "mouth", name: "입" },
  { key: "jaw", name: "얼굴형(윤곽)" },
  { key: "layout", name: "이목구비 배치 비율" },
];

/**
 * @param {{canvas: HTMLCanvasElement, detection: object}} me
 * @param {{canvas: HTMLCanvasElement, detection: object}} target
 * @param {string} targetLabel 결과 카드에 쓸 대상 이름 (예: "대상")
 */
export function analyzePair(me, target, targetLabel = "대상") {
  const nMe = normalizeLandmarks(me.detection.landmarks);
  const nTg = normalizeLandmarks(target.detection.landmarks);
  const rawMe = me.detection.landmarks.positions;
  const rawTg = target.detection.landmarks.positions;

  const feat = {
    eye: [eyeFeatures(nMe), eyeFeatures(nTg)],
    brow: [browFeatures(nMe), browFeatures(nTg)],
    nose: [noseFeatures(nMe), noseFeatures(nTg)],
    mouth: [mouthFeatures(nMe), mouthFeatures(nTg)],
    jaw: [jawFeatures(nMe), jawFeatures(nTg)],
    layout: [layoutFeatures(nMe), layoutFeatures(nTg)],
  };

  const simCalc = {
    eye: ([a, b]) =>
      combine([
        simOf(a.width, b.width, 0.2),
        simOf(a.ratio, b.ratio, 0.17),
        simOf(a.tilt, b.tilt, 0.28),
      ]),
    brow: ([a, b]) =>
      combine([
        simOf(a.length, b.length, 0.28),
        simOf(a.arch, b.arch, 0.07),
        simOf(a.gap, b.gap, 0.17),
      ]),
    nose: ([a, b]) =>
      combine([
        simOf(a.length, b.length, 0.24),
        simOf(a.width, b.width, 0.24),
        simOf(a.ratio, b.ratio, 0.28),
      ]),
    mouth: ([a, b]) =>
      combine([
        simOf(a.width, b.width, 0.24),
        simOf(a.ratio, b.ratio, 0.22),
        simOf(a.upperThickness, b.upperThickness, 0.11),
        simOf(a.cornerTilt, b.cornerTilt, 0.24),
      ]),
    jaw: ([a, b]) =>
      combine([
        simOf(a.widthRatio, b.widthRatio, 0.24),
        simOf(a.taper, b.taper, 0.17),
        simOf(a.jawAngle, b.jawAngle, 0.4),
      ]),
    layout: ([a, b]) =>
      combine([
        simOf(a.browEye, b.browEye, 0.1),
        simOf(a.eyeNose, b.eyeNose, 0.11),
        simOf(a.noseMouth, b.noseMouth, 0.1),
        simOf(a.mouthChin, b.mouthChin, 0.13),
        simOf(a.eyeSpacing, b.eyeSpacing, 0.08),
      ]),
  };

  const cropIdx = {
    eye: [...IDX.leftEye, ...IDX.rightEye],
    brow: [...IDX.leftBrow, ...IDX.rightBrow],
    nose: [...IDX.noseBridge, ...IDX.noseBottom],
    mouth: [...IDX.outerMouth],
    jaw: [...IDX.jaw],
    layout: range(0, 67),
  };
  // 부위별로 필요한 여백 비율. 눈썹처럼 가늘고 넓은 영역일수록 여백을 넉넉히 둬야
  // 정사각형으로 잘랐을 때 실제 눈썹이 잘리지 않고 중앙에 보입니다.
  const cropPad = { eye: 0.3, brow: 0.3, nose: 0.35, mouth: 0.3, jaw: 0.15, layout: 0.08 };

  const parts = PART_META.map(({ key, name }) => {
    const raw = simCalc[key](feat[key]);
    const score = toPercent(raw);
    return {
      key,
      name,
      score,
      raw,
      meDesc: describe(key, feat[key][0]),
      targetDesc: describe(key, feat[key][1]),
      meCrop: cropRegion(me.canvas, pick(rawMe, cropIdx[key]), cropPad[key]),
      targetCrop: cropRegion(target.canvas, pick(rawTg, cropIdx[key]), cropPad[key]),
      placeholderMe: `내 ${name.replace(/\(.*\)/, "")}`.trim(),
      placeholderTarget: `${targetLabel} ${name.replace(/\(.*\)/, "")}`.trim(),
    };
  });

  // 전체 닮음도: 특징 벡터 거리(0.2~0.9)를 유사도로 + 부위 평균을 blend
  const descDist = euclidean(
    me.detection.descriptor,
    target.detection.descriptor
  );
  const descSim = clamp((0.92 - descDist) / 0.72, 0, 1);
  const partAvg = combine(parts.map((p) => p.raw));
  // 전체 = 얼굴 특징벡터 유사도 + 부위 평균을 섞되, 결과가 부위 점수와 크게
  // 어긋나 보이지 않도록 부위 쪽에 더 무게를 둡니다.
  const overallRaw = 0.45 * descSim + 0.55 * partAvg;
  const overall = clamp(toPercent(overallRaw, 30, 95, 0.28, 0.9), 12, 98);

  // 성별 조합을 가리지 않도록 가족 호칭(남매/자매 등) 대신 중립적인 표현을 사용합니다.
  let comment = "음... 그래도 재밌었죠?";
  if (overall >= 85) comment = "이 정도면 쌍둥이 아니야?";
  else if (overall >= 70) comment = "이 정도면 완전 판박이 ㅋㅋ";
  else if (overall >= 50) comment = "살짝 닮은 듯?";

  const best = parts.reduce((a, b) => (b.score > a.score ? b : a), parts[0]);
  parts.forEach((p) => (p.isBest = p.key === best.key));

  return { overall, comment, parts, bestKey: best.key };
}
