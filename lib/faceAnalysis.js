/**
 * 얼굴 분석 로직 (100% 브라우저 실행)
 * ------------------------------------------------------------------
 * - 업로드된 사진은 서버로 전송되지 않습니다. 이 파일의 모든 함수는
 *   사용자 브라우저 안에서만 동작하며, 결과값(숫자/짧은 텍스트)만 만들어 돌려줍니다.
 * - 부위별 수치는 "과학적으로 정밀한 값"이 아니라 재미 목적의 결과입니다.
 *
 * 사용 라이브러리: @vladmandic/face-api (face-api.js의 유지보수 포크, 무료 오픈소스)
 *   1) tiny_face_detector : 얼굴 위치 찾기 (가벼움, 항상 먼저 시도)
 *   2) face_landmark_68   : 얼굴 특징점 68개 추출 (눈/코/입/윤곽 좌표)
 *   3) face_recognition    : 얼굴 특징 벡터(128차원) → 전체 닮음도 계산에 사용
 *   4) ssd_mobilenetv1     : 1번이 못 찾았을 때만 불러오는 더 무겁고 정확한 예비 모델
 *                            (아기 사진·기울어진 얼굴·일부 가려진 얼굴 구제용)
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
 * 더 무겁지만 더 정확한 얼굴 탐지 모델(약 5.5MB)을 필요할 때만 불러옵니다.
 * 아기 사진, 살짝 돌아간 얼굴, 젖꼭지·안경 등으로 일부가 가려진 얼굴처럼
 * 빠른 모델(tiny_face_detector)이 놓치는 경우를 구제하기 위한 2차 시도용입니다.
 * 평소(빠른 모델로 바로 찾아지는 경우)에는 전혀 다운로드되지 않습니다.
 */
let ssdModelPromise = null;
function loadSsdModel() {
  if (!ssdModelPromise) {
    ssdModelPromise = (async () => {
      const api = await getFaceApi();
      await api.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    })().catch((err) => {
      ssdModelPromise = null;
      throw err;
    });
  }
  return ssdModelPromise;
}

/* ------------------------------------------------------------------ *
 *  업로드 사진 위치/확대 조정 (드래그 이동 + 확대)
 * ------------------------------------------------------------------ *
 * 전신 사진처럼 얼굴이 작게 나온 사진도 동그라미 안에 얼굴을 맞출 수 있도록,
 * 업로드 직후 사용자가 사진을 드래그해서 옮기고 슬라이더로 확대/축소할 수 있게
 * 합니다. "지금 화면에 보이는 사각형 영역"을 그대로 잘라 분석에 사용하므로,
 * 실제로 분석되는 부분과 화면에 보이는 부분이 항상 일치합니다.
 *
 * entry = { img, url, zoom, sx, sy }
 *  - img: 로드된 원본 이미지(HTMLImageElement)
 *  - zoom: 1(기본, 화면을 꽉 채우는 최소 배율) ~ 4(최대 확대)
 *  - sx, sy: 원본 이미지 좌표계에서, 지금 보이는 정사각형 영역의 좌상단 좌표
 */

/** 원본 이미지에서 정사각형으로 꽉 채울 수 있는 최대 한 변의 길이 (zoom=1 기준) */
function baseCropSide(img) {
  return Math.min(img.naturalWidth, img.naturalHeight);
}

/** 현재 zoom에서, 원본 이미지 좌표계 기준 보이는 정사각형 한 변의 길이 */
export function cropWindowSize(entry) {
  return baseCropSide(entry.img) / entry.zoom;
}

/** 이 크기보다 긴 변을 가진 사진은 미리 줄여서 메모리를 아낍니다.
 *  (요즘 휴대폰 사진은 4000px가 넘는 경우가 많은데, 원본 그대로 들고 있으면
 *  사진 2장 + 분석 모델이 한꺼번에 메모리를 많이 차지해서 모바일 브라우저가
 *  메모리 부족으로 페이지를 새로고침하는 원인이 될 수 있습니다. 분석에는
 *  1600px면 충분히 정밀합니다.) */
const MAX_SOURCE_DIM = 1600;

function downscaleIfNeeded(img, maxDim = MAX_SOURCE_DIM) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (Math.max(w, h) <= maxDim) return img;
  const scale = maxDim / Math.max(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  // 이후 코드는 img.naturalWidth/naturalHeight로 크기를 읽으므로 캔버스에도
  // 같은 이름으로 크기를 달아둡니다 (캔버스엔 원래 이 속성이 없음).
  canvas.naturalWidth = canvas.width;
  canvas.naturalHeight = canvas.height;
  return canvas;
}

/** 업로드한 파일을 불러와 가운데를 기본값으로 잡은 crop 상태를 만듭니다. */
export function loadCropEntry(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const source = downscaleIfNeeded(img);
      const win = baseCropSide(source);
      resolve({
        img: source,
        url,
        zoom: 1,
        sx: (source.naturalWidth - win) / 2,
        sy: (source.naturalHeight - win) / 2,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했어요. 다른 사진으로 시도해 주세요."));
    };
    img.src = url;
  });
}

/** entry에서 만든 objectURL을 해제합니다 (사진 교체/삭제/페이지 이탈 시 호출). */
export function releaseCropEntry(entry) {
  if (entry?.url) URL.revokeObjectURL(entry.url);
}

/**
 * 화면에서 dxScreen/dyScreen(px)만큼 드래그했을 때의 새 crop 상태.
 * displaySize는 실제 화면에 그려지는 정사각형 한 변의 CSS px 크기입니다.
 */
export function panCropEntry(entry, dxScreen, dyScreen, displaySize) {
  const win = cropWindowSize(entry);
  const k = win / (displaySize || 1); // 화면 1px = 원본 이미지 k px
  const maxX = Math.max(0, entry.img.naturalWidth - win);
  const maxY = Math.max(0, entry.img.naturalHeight - win);
  return {
    ...entry,
    sx: clamp(entry.sx - dxScreen * k, 0, maxX),
    sy: clamp(entry.sy - dyScreen * k, 0, maxY),
  };
}

/** 확대 배율을 바꿉니다. 보고 있던 영역의 중심은 그대로 유지합니다. */
export function zoomCropEntry(entry, nextZoom) {
  const zoom = clamp(nextZoom, 1, 4);
  const oldWin = cropWindowSize(entry);
  const cx = entry.sx + oldWin / 2;
  const cy = entry.sy + oldWin / 2;
  const newWin = baseCropSide(entry.img) / zoom;
  const maxX = Math.max(0, entry.img.naturalWidth - newWin);
  const maxY = Math.max(0, entry.img.naturalHeight - newWin);
  return {
    ...entry,
    zoom,
    sx: clamp(cx - newWin / 2, 0, maxX),
    sy: clamp(cy - newWin / 2, 0, maxY),
  };
}

/** 지금 보이는 crop 영역을 캔버스(ctx)에 그립니다. 미리보기와 최종 캡처가 항상 동일한 함수를 씁니다. */
export function drawCropInto(ctx, entry, size) {
  const win = cropWindowSize(entry);
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(entry.img, entry.sx, entry.sy, win, win, 0, 0, size, size);
}

/** 지금 보이는 crop 영역을 정사각형 캔버스로 캡처합니다. (분석에 실제로 사용되는 이미지) */
export function renderCrop(entry, outSize = 640) {
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  drawCropInto(canvas.getContext("2d"), entry, outSize);
  return canvas;
}

/**
 * 사진을 올리자마자 얼굴 위치(들)만 빠르게 찾습니다. (특징점·특징벡터는 계산하지
 * 않아 훨씬 가볍습니다) 원본 이미지 좌표계 기준 사각형 목록을 반환합니다.
 */
export async function detectFaceBoxes(img) {
  const api = await getFaceApi();
  let detections = await api.detectAllFaces(
    img,
    new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
  );
  if (detections.length === 0) {
    // 빠른 모델이 하나도 못 찾으면, 더 정확한 모델로 한 번 더 시도합니다.
    await loadSsdModel();
    detections = await api.detectAllFaces(img, new api.SsdMobilenetv1Options({ minConfidence: 0.4 }));
  }
  return detections
    .map((d) => ({ x: d.box.x, y: d.box.y, width: d.box.width, height: d.box.height }))
    .sort((a, b) => b.width * b.height - a.width * a.height); // 큰 얼굴부터
}

/** 얼굴 사각형(box) 주변을 작게 잘라 "이 사람 맞나요?" 선택용 썸네일을 만듭니다. */
export function faceThumbnail(img, box, outSize = 64, pad = 0.6) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const base = Math.min(img.naturalWidth, img.naturalHeight);
  const side = Math.min(Math.max(box.width, box.height) * (1 + pad), base);
  const sx = clamp(cx - side / 2, 0, img.naturalWidth - side);
  const sy = clamp(cy - side / 2, 0, img.naturalHeight - side);
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** 얼굴 사각형(box)을 기준으로, 그 얼굴이 원 안에 적당히 들어오는 crop 상태를 만듭니다. */
export function cropEntryForFace(entry, box, margin = 2.2) {
  const img = entry.img;
  const base = baseCropSide(img);
  const desired = Math.max(box.width, box.height) * margin;
  const zoom = clamp(base / (desired || 1), 1, 4);
  const win = base / zoom;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const maxX = Math.max(0, img.naturalWidth - win);
  const maxY = Math.max(0, img.naturalHeight - win);
  return {
    ...entry,
    zoom,
    sx: clamp(cx - win / 2, 0, maxX),
    sy: clamp(cy - win / 2, 0, maxY),
  };
}

/** 캔버스에서 얼굴 1개 + 특징점 68개 + 특징 벡터를 뽑아냅니다. */
export async function detectFace(canvas) {
  const api = await getFaceApi();
  let detection = await api
    .detectSingleFace(
      canvas,
      new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) {
    // 아기 사진, 살짝 돌아간 얼굴, 일부가 가려진 얼굴 등 빠른 모델이 놓친 경우를
    // 위해 더 정확한 모델로 한 번 더 시도한 뒤에야 "찾지 못함"으로 처리합니다.
    await loadSsdModel();
    detection = await api
      .detectSingleFace(canvas, new api.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
  }
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
/** 설명(예: "보통 크기의 눈 · 부드러운 눈매 · 눈꼬리가 일자에 가까운 편")을
 *  구절 단위로 나눕니다 — 결과 화면·공유 이미지에서 한 줄씩 보여줄 때 씁니다. */
export function splitClauses(text) {
  return (text || "").split(" · ").filter(Boolean);
}

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

/** describe()의 영문판. 임계값(bin3에 넘기는 lo/hi, 부등호 기준)은 한국어 버전과
 *  완전히 동일하게 유지하고, 라벨 문구만 영어로 옮깁니다. (영문 버전 결과 화면
 *  전용 — 한국어 버전 동작에는 영향 없음) */
function describeEn(part, f) {
  switch (part) {
    case "eye": {
      const size = bin3(f.width, 0.32, 0.44, ["small eyes", "average-sized eyes", "big eyes"]);
      const shape = bin3(f.ratio, 0.28, 0.4, [
        "narrow, sharp eyes",
        "soft, gentle eyes",
        "round, clear eyes",
      ]);
      const tilt =
        f.tilt > 0.06
          ? "slightly upturned outer corners"
          : f.tilt < -0.06
          ? "slightly downturned outer corners"
          : "fairly straight outer corners";
      return `${size} · ${shape} · ${tilt}`;
    }
    case "brow": {
      const length = bin3(f.length, 0.55, 0.78, ["on the short side", "a moderate length", "on the long side"]);
      const shape =
        f.arch > 0.05 ? "arched eyebrows" : f.arch < 0.02 ? "straight eyebrows" : "gently curved eyebrows";
      const pos =
        f.gap < -0.28
          ? "set a bit apart from the eyes"
          : f.gap > -0.16
          ? "sitting close to the eyes"
          : "an average distance from the eyes";
      return `${length} · ${shape} · ${pos}`;
    }
    case "nose": {
      const length = bin3(f.length, 0.45, 0.62, ["a short nose", "an average-length nose", "a long nose"]);
      const width = f.ratio > 0.85 ? "wider nostrils" : f.ratio < 0.62 ? "a slim, well-defined bridge" : "average nostril width";
      return `${length} · ${width}`;
    }
    case "mouth": {
      const w = f.width > 1.05 ? "a wide mouth" : f.width < 0.8 ? "a small mouth" : "an average-sized mouth";
      const lip = f.ratio > 0.42 ? "full lips" : f.ratio < 0.28 ? "thin lips" : "average-thickness lips";
      const corner = f.smile > 0.16 ? "a distinct upturned mouth corner" : "a calm, neutral mouth";
      return `${w} · ${lip} · ${corner}`;
    }
    case "jaw": {
      const shape =
        f.widthRatio > 0.92 ? "a round face shape" : f.widthRatio < 0.78 ? "a slim, oval face shape" : "an egg-shaped face";
      const angle = f.taper > 0.82 ? "an angular jawline" : "a soft jawline";
      return `${shape} · ${angle}`;
    }
    case "layout": {
      const spacing =
        f.eyeSpacing > 0.32
          ? "wide-set eyes"
          : f.eyeSpacing < 0.27
          ? "closely-set features"
          : "well-balanced eye spacing";
      const philtrum = bin3(f.noseMouth, 0.2, 0.3, [
        "a short philtrum",
        "an average philtrum length",
        "a long philtrum",
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

// 전체 닮음도에 따른 코멘트. 50% 미만은 문구 하나로 묶고, 50% 이상은 5%p
// 단위로 점점 강한 표현을 씁니다. 성별 조합을 가리지 않도록 "남매/자매" 같은
// 가족 호칭 대신 중립적인 표현을 쓰고, 이모티콘(ㅋㅋ)은 넣지 않습니다.
const COMMENT_BANDS = [
  [50, "살짝 닮은 듯?"],
  [55, "은근히 닮았는데?"],
  [60, "닮은 구석이 꽤 보이는데?"],
  [65, "이 정도면 닮았다고 할 만해"],
  [70, "보면 볼수록 닮았어"],
  [75, "이 정도면 친척이라 해도 믿겠어"],
  [80, "이 정도면 쌍둥이 아니야?"],
  [85, "완전 판박이"],
  [90, "완전 똑같이 생겼어"],
  [95, "구별이 안 될 정도야"],
];

function commentFor(overall) {
  if (overall < 50) return "음... 그래도 재밌었죠?";
  let picked = COMMENT_BANDS[0][1];
  for (const [min, text] of COMMENT_BANDS) {
    if (overall >= min) picked = text;
  }
  return picked;
}

// commentFor()의 영문판. 구간(%) 기준은 동일하게 유지하고 문구만 옮깁니다.
const COMMENT_BANDS_EN = [
  [50, "A little alike, maybe?"],
  [55, "Kind of alike, actually"],
  [60, "There's a fair bit of resemblance"],
  [65, "This counts as looking alike"],
  [70, "The more you look, the more alike you seem"],
  [75, "At this point, I'd believe you're related"],
  [80, "Aren't you basically twins?"],
  [85, "Total spitting image"],
  [90, "You look exactly the same"],
  [95, "Practically indistinguishable"],
];

function commentForEn(overall) {
  if (overall < 50) return "Hmm... still fun though, right?";
  let picked = COMMENT_BANDS_EN[0][1];
  for (const [min, text] of COMMENT_BANDS_EN) {
    if (overall >= min) picked = text;
  }
  return picked;
}

const PART_META = [
  { key: "eye", name: "눈" },
  { key: "brow", name: "눈썹" },
  { key: "nose", name: "코" },
  { key: "mouth", name: "입" },
  { key: "jaw", name: "얼굴형(윤곽)" },
  { key: "layout", name: "이목구비 배치 비율" },
];

const PART_META_EN = [
  { key: "eye", name: "Eyes" },
  { key: "brow", name: "Eyebrows" },
  { key: "nose", name: "Nose" },
  { key: "mouth", name: "Mouth" },
  { key: "jaw", name: "Face shape" },
  { key: "layout", name: "Feature layout" },
];

/**
 * @param {{canvas: HTMLCanvasElement, detection: object}} me
 * @param {{canvas: HTMLCanvasElement, detection: object}} target
 * @param {string} targetLabel 결과 카드에 쓸 대상 이름 (예: "대상")
 * @param {"ko"|"en"} locale 부위 이름·설명 문구·총평 문구 언어. 기본값 "ko"라
 *   기존 한국어 버전 호출부(targetLabel까지만 넘기는 곳)는 동작이 그대로입니다.
 *   영문(/en) 페이지에서만 "en"을 넘겨서 씁니다.
 */
export function analyzePair(me, target, targetLabel = "대상", locale = "ko") {
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
    // width(눈 하나의 너비 ÷ 두 눈 사이 거리)는 실제로 재보면 사람마다 거의 다
    // 0.37~0.39에 몰려있어 변별력이 없고(오히려 동일인 사진끼리의 차이가 타인과의
    // 차이보다 큰 경우도 있었음), 유사도를 항상 0.95 이상으로 밀어올려 눈 점수가
    // 실제 차이와 무관하게 높게 나오는 주된 원인이었습니다. 설명 문구("보통 크기의
    // 눈")에는 계속 쓰지만, 점수 계산에서는 제외합니다.
    // tilt도 실제 값의 크기(0.003~0.02 수준)에 비해 허용범위(0.2)가 지나치게 커서
    // 항상 0.95~1에 가깝게 나왔던 것을 실제 크기에 맞게 좁혔습니다.
    eye: ([a, b]) =>
      combine([
        simOf(a.ratio, b.ratio, 0.12),
        simOf(a.tilt, b.tilt, 0.02),
      ]),
    // arch(눈썹 중앙이 얼마나 솟았는지)는 실측해보니 같은 사람의 두 사진 사이
    // 차이가 서로 다른 사람 간 차이보다 큰 경우도 있을 만큼 잡음이 심해 변별력이
    // 없었습니다. 점수 계산에서는 빼고("아치형 눈썹" 같은 설명 문구에는 계속 사용),
    // 실제로 변별력 있던 length·gap의 허용범위를 실측값 크기에 맞게 좁혔습니다.
    brow: ([a, b]) =>
      combine([
        simOf(a.length, b.length, 0.05),
        simOf(a.gap, b.gap, 0.045),
      ]),
    nose: ([a, b]) =>
      combine([
        simOf(a.length, b.length, 0.24),
        simOf(a.width, b.width, 0.24),
        simOf(a.ratio, b.ratio, 0.28),
      ]),
    // upperThickness·cornerTilt는 실측 결과 사람 간 차이가 항상 아주 작아서
    // (0.001~0.06 수준을 0.11~0.24 허용범위로 나누니 거의 항상 0.7~1에 가까운
    // 값만 나옴) 실제로는 거의 항상 "높은 점수"만 보태는 역할이었습니다. 진짜
    // 변별력 있는 width·ratio만으로 계산합니다.
    mouth: ([a, b]) =>
      combine([
        simOf(a.width, b.width, 0.24),
        simOf(a.ratio, b.ratio, 0.22),
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

  const isEn = locale === "en";
  const partMeta = isEn ? PART_META_EN : PART_META;
  const describeFn = isEn ? describeEn : describe;
  const myLabel = isEn ? "My" : "내";

  const parts = partMeta.map(({ key, name }) => {
    const raw = simCalc[key](feat[key]);
    const score = toPercent(raw);
    const cleanName = name.replace(/\(.*\)/, "").trim();
    return {
      key,
      name,
      score,
      raw,
      meDesc: describeFn(key, feat[key][0]),
      targetDesc: describeFn(key, feat[key][1]),
      meCrop: cropRegion(me.canvas, pick(rawMe, cropIdx[key]), cropPad[key]),
      targetCrop: cropRegion(target.canvas, pick(rawTg, cropIdx[key]), cropPad[key]),
      placeholderMe: `${myLabel} ${cleanName}`,
      placeholderTarget: `${targetLabel} ${cleanName}`,
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
  const overall = clamp(toPercent(overallRaw, 30, 99, 0.28, 0.9), 12, 99);

  const comment = isEn ? commentForEn(overall) : commentFor(overall);

  // 동점이 있으면 항상 배열 앞쪽(눈)이 이기지 않도록, 최고 점수인 부위들 중
  // 하나를 무작위로 골라 "가장 닮은 부위"로 표시합니다.
  const maxScore = Math.max(...parts.map((p) => p.score));
  const topParts = parts.filter((p) => p.score === maxScore);
  const best = topParts[Math.floor(Math.random() * topParts.length)];
  parts.forEach((p) => (p.isBest = p.key === best.key));

  return { overall, comment, parts, bestKey: best.key };
}
