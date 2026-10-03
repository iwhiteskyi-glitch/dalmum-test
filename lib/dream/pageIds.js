/**
 * 상세 페이지(/dream/[id])가 있는 상징 id 목록.
 *
 * 선택 화면(브라우저)에서 "자세히 보기" 링크를 보여줄지 정할 때 쓰는데, 상세 페이지 본문
 * (pages.json)을 통째로 브라우저에 보내지 않으려고 id만 따로 적어 둡니다.
 * pages.json에 페이지를 추가하면 여기에도 추가 — scripts/dream/check-symbols.mjs가 둘이
 * 어긋나지 않는지 검사합니다.
 */
export const PAGE_IDS = [
  "snake", "teeth", "death",
  "tiger", "dragon", "fish", "pig", "spider",
  "water", "fire", "rain", "snow", "rainbow", "lightning",
  "ancestor", "baby", "wedding", "stranger", "ex", "crowd",
  "cat", "dog", "rat", "cow", "horse", "bird", "bug", "shark",
  "turtle", "butterfly", "bear", "rabbit", "monkey",
  "sea", "mountain", "star", "flower", "fruit", "tree", "flood", "earthquake",
  "storm", "fog", "cloud",
  "pregnant", "ghost", "celebrity", "divorce", "proposal", "affair", "romance", "birth",
  "ring", "wallet", "phone", "key", "clothes",
  "acne", "nails", "crying",
  "corpse", "funeral", "school", "toilet", "elevator", "stairs",
];

export const dreamHref = (id) => `/dream/${id}`;

/** 선택 화면을 그 상징이 골라진 채로 여는 주소 */
export const dreamPickHref = (id) => `/dream#pick.${id}`;
