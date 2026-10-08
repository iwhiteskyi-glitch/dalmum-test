// 미니게임 공통 정보: 게임마다 이름·주소·10단계 상대·두 가지 도전(먼저 두기/나중에 두기).
// 화면(components/games)과 공유 카드(lib/games/card.js)가 함께 써요. 새 게임을 만들면 여기에 추가하세요.

export const STAGE_COUNT = 10;

const LEVELS = ["아주 쉬움", "쉬움", "쉬움", "보통", "보통", "보통", "어려움", "어려움", "아주 어려움", "최강"];
const stagesOf = (names) => names.map((name, i) => ({ name, level: LEVELS[i] }));

/**
 * sides: [먼저 두는 쪽, 나중에 두는 쪽] — name은 화면에 쓰는 이름, dot은 표시 색(black/white/cho/han)
 * tracks.first: 내가 먼저 두는 도전(처음부터 열림) · tracks.second: 나중에 두는 도전(first를 다 깨면 열림)
 */
export const GAMES = {
  omok: {
    key: "omok",
    name: "오목",
    path: "/games/omok",
    sides: [
      { name: "흑", dot: "black" },
      { name: "백", dot: "white" },
    ],
    tracks: {
      first: { label: "흑돌 도전", short: "흑돌" },
      second: { label: "백돌 도전", short: "백돌" },
    },
    stages: stagesOf([
      "오목 처음 해 본 병아리",
      "동네 놀이터 꼬마",
      "쉬는 시간 오목 반장",
      "동아리 오목 회장",
      "PC방 오목 단골",
      "경로당 오목 왕",
      "동네 기원 사범",
      "오목 대회 준우승자",
      "은둔한 오목 고수",
      "오목의 신",
    ]),
    tip: "상대가 3을 만들면 바로 막는 게 요령이에요.",
  },
  othello: {
    key: "othello",
    name: "오델로",
    path: "/games/othello",
    sides: [
      { name: "흑", dot: "black" },
      { name: "백", dot: "white" },
    ],
    tracks: {
      first: { label: "흑돌 도전", short: "흑돌" },
      second: { label: "백돌 도전", short: "백돌" },
    },
    stages: stagesOf([
      "뒤집기 처음 해 본 햄스터",
      "동네 보드게임 카페 손님",
      "쉬는 시간 오델로 반장",
      "보드게임 동아리 회장",
      "모서리를 노리는 여우",
      "구석 수집가",
      "오델로 동호회 고수",
      "오델로 대회 준우승자",
      "은둔한 오델로 고수",
      "오델로의 신",
    ]),
    tip: "많이 뒤집는 것보다 모서리를 차지하는 게 더 중요해요.",
  },
  chess: {
    key: "chess",
    name: "체스",
    path: "/games/chess",
    sides: [
      { name: "백", dot: "white" },
      { name: "흑", dot: "black" },
    ],
    tracks: {
      first: { label: "백 도전", short: "백" },
      second: { label: "흑 도전", short: "흑" },
    },
    stages: stagesOf([
      "체스 처음 배운 병아리",
      "동네 체스 꼬마",
      "방과 후 체스 반장",
      "체스 동아리 회장",
      "공원 체스 할아버지",
      "오프닝 외우는 모범생",
      "클럽 토너먼트 단골",
      "체스 대회 준우승자",
      "은둔한 체스 고수",
      "체스의 신",
    ]),
    tip: "말을 움직이기 전에 그 칸을 상대가 잡을 수 있는지 한 번 더 살펴보세요.",
  },
  janggi: {
    key: "janggi",
    name: "장기",
    path: "/games/janggi",
    sides: [
      { name: "초", dot: "cho" },
      { name: "한", dot: "han" },
    ],
    tracks: {
      first: { label: "초 도전", short: "초" },
      second: { label: "한 도전", short: "한" },
    },
    stages: stagesOf([
      "장기 처음 배운 병아리",
      "동네 놀이터 꼬마",
      "쉬는 시간 장기 반장",
      "장기 동아리 회장",
      "공원 장기판 단골",
      "경로당 장기 왕",
      "동네 기원 사범",
      "장기 대회 준우승자",
      "은둔한 장기 고수",
      "장기의 신",
    ]),
    tip: "차와 포를 일찍 잃지 않게 지키면서, 상대 궁 쪽으로 차근차근 다가가 보세요.",
  },
};

/**
 * 진행 기록으로 정하는 등급(공유 카드·배지에 씀)
 *  - first 1~3단계: 동 · 4~6: 은 · 7~9: 금 · 10: 완주 · second 10단계까지: 전설
 */
export function tierOf(progress) {
  const a = progress.first || 0;
  const b = progress.second || 0;
  if (b >= STAGE_COUNT) return "legend";
  if (a >= STAGE_COUNT) return "master";
  if (a >= 7) return "gold";
  if (a >= 4) return "silver";
  if (a >= 1) return "bronze";
  return null;
}

const TIER_WORD = { bronze: "새싹", silver: "실력자", gold: "고수", master: "완주", legend: "전설" };
export const TIER_CAP = { bronze: "BRONZE", silver: "SILVER", gold: "GOLD", master: "MASTER", legend: "LEGEND" };
export const tierTitle = (game, tier) => `${game.name} ${TIER_WORD[tier]}`;
