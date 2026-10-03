/**
 * 사진 한 장의 얼굴 특징을 관상 문구 카테고리로 분류합니다.
 *
 * 수치 계산 자체는 닮았네(lib/faceAnalysis.js)의 검증된 함수(singleFaceFeatures)를
 * 그대로 쓰고, 구간 경계값도 닮았네 결과 화면의 설명 문구(describe())와 똑같이
 * 맞췄습니다. 그래서 같은 사진을 두 코너에 올려도 "큰 눈"/"작은 눈" 같은 설명이
 * 서로 어긋나지 않습니다. 이 파일은 그 경계값으로 카테고리 번호만 고르고, 실제
 * 문구는 lib/gwansang/texts.json에서 가져옵니다.
 */
// 상대 경로로 불러와야 plain Node 회귀 스크립트(scripts/gwansang/*.mjs)에서도
// 그대로 import할 수 있습니다("@/" 별칭은 Next.js 안에서만 풀립니다).
import { singleFaceFeatures } from "../faceAnalysis.js";

/**
 * 이미 계산된 특징 벡터 묶음({ eye, brow, nose, mouth, jaw, layout })에서
 * 카테고리 번호만 고르는 순수 함수. 얼굴 인식 없이도 돌릴 수 있어서, 경계값
 * 로직만 따로 회귀 테스트할 때 씁니다(scripts/gwansang/check-classify.mjs).
 * 번호는 texts.json의 parts.<part>.categories 배열 순서와 반드시 같아야 합니다.
 */
export function categoriesFromFeatures(f) {
  return {
    // 눈매: 가늘고 시크한 편(0) · 부드러운 편(1) · 동그랗고 또렷한 편(2)
    eye: f.eye.ratio < 0.28 ? 0 : f.eye.ratio > 0.4 ? 2 : 1,
    // 눈썹 모양: 아치형(0) · 일자형(1) · 완만한 곡선형(2)
    brow: f.brow.arch > 0.05 ? 0 : f.brow.arch < 0.02 ? 1 : 2,
    // 코(콧볼 너비): 넓은 편(0) · 곧고 또렷한 편(1) · 적당한 편(2)
    nose: f.nose.ratio > 0.85 ? 0 : f.nose.ratio < 0.62 ? 1 : 2,
    // 입술 두께: 도톰한 편(0) · 얇은 편(1) · 보통 두께(2)
    mouth: f.mouth.ratio > 0.42 ? 0 : f.mouth.ratio < 0.28 ? 1 : 2,
    // 턱선: 각진 편(0) · 부드러운 편(1) — 이 부위만 2종류입니다.
    jaw: f.jaw.taper > 0.82 ? 0 : 1,
    // 이목구비 배치(미간): 넓은 편(0) · 오밀조밀한 편(1) · 균형 잡힌 편(2)
    layout: f.layout.eyeSpacing > 0.32 ? 0 : f.layout.eyeSpacing < 0.27 ? 1 : 2,
  };
}

/** 부위별로 카테고리 번호(0부터) 하나씩 고릅니다. 사진 분석 결과(detection)를
 *  바로 넣으면 됩니다 — 브라우저(얼굴 인식이 되는 환경)에서만 동작합니다. */
export function classifyFace(detection) {
  return categoriesFromFeatures(singleFaceFeatures(detection));
}

/** 부위 순서 고정 — 화면·카드·공유 링크가 전부 이 순서를 따릅니다. */
export const PARTS = ["eye", "brow", "nose", "mouth", "jaw", "layout"];

/** 부위별 카테고리 개수(결과 링크 범위 검증에 씀) */
export const PART_CATEGORY_COUNT = { eye: 3, brow: 3, nose: 3, mouth: 3, jaw: 2, layout: 3 };
