// 오목 10단계 상대. 단계 번호가 곧 컴퓨터 실력(lib/games/omok/ai.js LEVELS)이에요.
// 흑돌로 10단계를 다 깨면 같은 상대들과 백돌로 두는 2회차가 열립니다.

export const STAGES = [
  { name: "오목 처음 해 본 병아리", level: "아주 쉬움" },
  { name: "동네 놀이터 꼬마", level: "쉬움" },
  { name: "쉬는 시간 오목 반장", level: "쉬움" },
  { name: "동아리 오목 회장", level: "보통" },
  { name: "PC방 오목 단골", level: "보통" },
  { name: "경로당 오목 왕", level: "보통" },
  { name: "동네 기원 사범", level: "어려움" },
  { name: "오목 대회 준우승자", level: "어려움" },
  { name: "은둔한 오목 고수", level: "아주 어려움" },
  { name: "오목의 신", level: "최강" },
];

export const STAGE_COUNT = STAGES.length;

/** 두 가지 도전: 흑돌(먼저 둠) → 다 깨면 백돌(나중에 둠, 더 어려움) */
export const TRACKS = {
  black: { label: "흑돌 도전", short: "흑돌", stone: "흑", note: "내가 먼저 둬요" },
  white: { label: "백돌 도전", short: "백돌", stone: "백", note: "컴퓨터가 먼저 둬요 · 흑돌을 다 깨면 열려요" },
};

/**
 * 진행 기록으로 정하는 등급(공유 카드·완주 화면에 씀)
 *  - 흑돌 1~3단계: 동 · 4~6: 은 · 7~9: 금 · 10: 완주 · 백돌 10단계까지: 전설
 */
export function tierOf(progress) {
  const b = progress.black || 0;
  const w = progress.white || 0;
  if (w >= STAGE_COUNT) return "legend";
  if (b >= STAGE_COUNT) return "master";
  if (b >= 7) return "gold";
  if (b >= 4) return "silver";
  if (b >= 1) return "bronze";
  return null;
}

export const TIERS = {
  bronze: { title: "오목 새싹", cap: "BRONZE" },
  silver: { title: "오목 실력자", cap: "SILVER" },
  gold: { title: "오목 고수", cap: "GOLD" },
  master: { title: "오목 완주", cap: "MASTER" },
  legend: { title: "오목 전설", cap: "LEGEND" },
};
