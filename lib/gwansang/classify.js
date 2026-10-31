/**
 * 사진 한 장의 얼굴 특징을 관상 문구 칸으로 나눕니다.
 *
 * 수치 계산 자체는 닮았네(lib/faceAnalysis.js)의 함수(singleFaceFeatures)를 그대로 쓰고,
 * 경계값은 닮았네 결과 화면의 짧은 설명(describe())과 같은 lib/faceBins.js를 씁니다.
 * 그래서 같은 사진을 두 코너에 올려도 "아치형 눈썹" 같은 설명이 서로 어긋나지 않습니다.
 *
 * 부위마다 잰 값 두 개를 봅니다(DIMS). 칸 번호는 값이 작은 쪽부터 0·1·2 — 화면의 세 칸
 * 막대도 이 순서 그대로 왼쪽부터 그립니다. 실제 문구는 lib/gwansang/texts.json의
 * parts.<부위>.combos["첫째-둘째"]에서 가져옵니다.
 */
// 상대 경로로 불러와야 plain Node 회귀 스크립트(scripts/gwansang/*.mjs)에서도
// 그대로 import할 수 있습니다("@/" 별칭은 Next.js 안에서만 풀립니다).
import { singleFaceFeatures } from "../faceAnalysis.js";
import { CUTS, bin3, bin2 } from "../faceBins.js";

/** 부위 순서 고정 — 화면·카드·공유 링크가 전부 이 순서를 따릅니다. */
export const PARTS = ["eye", "brow", "nose", "mouth", "jaw", "layout"];

/**
 * 부위마다 [첫째 값, 둘째 값]의 칸 개수. 첫째 값은 예전(#w1) 관상이 보던 값이에요.
 * 턱만 첫째가 턱선(2칸), 둘째가 얼굴형(3칸)이고, 입은 둘째 값 입꼬리가 2칸이에요.
 */
export const DIM_COUNT = {
  eye: [3, 3], // 눈매 모양 · 눈꼬리
  brow: [3, 3], // 눈썹 모양 · 눈과의 간격
  nose: [3, 3], // 콧볼 너비 · 코 길이
  mouth: [3, 2], // 입술 두께 · 입꼬리
  jaw: [2, 3], // 턱선 · 얼굴형
  layout: [3, 3], // 미간 · 인중
};

/**
 * 이미 계산된 특징 벡터 묶음({ eye, brow, nose, mouth, jaw, layout })에서 칸 번호만 고르는
 * 순수 함수. 얼굴 인식 없이도 돌릴 수 있어서, 경계값 로직만 따로 회귀 테스트할 때 씁니다
 * (scripts/gwansang/check-classify.mjs).
 */
export function categoriesFromFeatures(f) {
  return {
    eye: [bin3(f.eye.ratio, CUTS.eyeShape), bin3(f.eye.lift, CUTS.eyeLift)],
    brow: [bin3(f.brow.arch, CUTS.browArch), bin3(f.brow.gap, CUTS.browGap)],
    nose: [bin3(f.nose.ratio, CUTS.noseWidth), bin3(f.nose.length, CUTS.noseLength)],
    mouth: [bin3(f.mouth.ratio, CUTS.lipThickness), bin2(f.mouth.cornerLift, CUTS.mouthCorner)],
    jaw: [bin2(f.jaw.taper, CUTS.jawTaper), bin3(f.jaw.widthRatio, CUTS.faceShape)],
    layout: [bin3(f.layout.eyeSpacing, CUTS.eyeSpacing), bin3(f.layout.noseMouth, CUTS.philtrum)],
  };
}

/** 사진 분석 결과(detection)를 바로 넣으면 됩니다 — 브라우저(얼굴 인식이 되는 환경)에서만 동작합니다. */
export function classifyFace(detection) {
  return categoriesFromFeatures(singleFaceFeatures(detection));
}

/** 종합 보기 열쇠: 얼굴형(0~2)-턱선(0~1)-미간(0~2) → 18가지. */
export function synthesisKey(c) {
  return `${c.jaw[1]}-${c.jaw[0]}-${c.layout[0]}`;
}
