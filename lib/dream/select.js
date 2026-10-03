/**
 * 꿈해몽 상징 선택 로직 — 순수 함수만 모아 둡니다(화면 로직과 분리해서 테스트하기 쉽게).
 *
 * 상징 id 목록은 lib/dream/symbols.json의 symbols 배열과 "같은 36개"여야 합니다. 다른
 * 코너(classify.js)처럼 평범한 Node 회귀 스크립트에서도 그대로 돌릴 수 있도록 이 파일은
 * JSON을 직접 import하지 않고, id만 따로 적어 둡니다 — scripts/dream/check-symbols.mjs가
 * 이 목록과 symbols.json이 어긋나지 않는지 매번 검사합니다.
 */
export const SYMBOL_IDS = [
  "snake", "tiger", "dragon", "fish", "pig", "spider",
  "water", "fire", "rain", "snow", "rainbow", "lightning",
  "ancestor", "baby", "wedding", "stranger", "ex", "crowd",
  "teeth", "hair", "flying", "falling", "naked", "blood",
  "money", "gold", "car", "house", "shoes", "poop",
  "exam", "chased", "lost", "moving", "fight", "eating",
];

export const MIN_SELECT = 1;
export const MAX_SELECT = 6;

/** 선택한 상징이 전부 알려진 id이고, 중복 없이 1~6개 범위인지 확인합니다. */
export function isValidSelection(ids) {
  if (!Array.isArray(ids) || ids.length < MIN_SELECT || ids.length > MAX_SELECT) return false;
  const seen = new Set();
  for (const id of ids) {
    if (!SYMBOL_IDS.includes(id) || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

/**
 * 선택한 상징들의 길흉 태그(0 좋은 흐름 · 1 무난한 흐름 · 2 조심할 흐름)만 보고
 * "좋은 흐름이 있었는가" × "조심할 흐름이 있었는가" = 4가지 종합 버킷 중 하나를 고릅니다.
 * 상징이 몇 개든 어떤 조합이든 이 4가지 중 하나로만 안내해서, 선택 가능한 조합 수(수십만
 * 가지)만큼 문구를 새로 만들어내지 않습니다(관상 "종합 보기"와 같은 절충).
 */
export function synthesisBucket(luckValues) {
  const hasGood = luckValues.some((v) => v === 0);
  const hasCaution = luckValues.some((v) => v === 2);
  if (hasGood && hasCaution) return "mixed";
  if (hasGood) return "good";
  if (hasCaution) return "caution";
  return "neutral";
}
