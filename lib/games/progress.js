"use client";

/**
 * 미니게임 진행 기록. 회원가입이나 서버 없이 이 브라우저에만 저장해요(다른 기기에서는 처음부터).
 * 저장이 막힌 환경(사생활 보호 창 등)에서도 게임은 그대로 되고, 기록만 남지 않아요.
 *  - 저장 모양: { first: 먼저 두는 도전에서 깬 단계 수, second: 나중에 두는 도전에서 깬 단계 수, last: { track, stage },
 *               stars: { first: [무르기 없이 이긴 단계 번호…], second: […] }, best: 무한 연승 최고 기록 }
 *  - stars·best는 2026-11에 더했어요. 예전 기록에는 없으니 빈 값으로 읽어요.
 */
const KEY = (game) => `jmb-game-${game}-v1`;
const EMPTY = { first: 0, second: 0, last: null, stars: { first: [], second: [] }, best: 0 };

const stageList = (x) =>
  Array.isArray(x) ? [...new Set(x.filter((n) => Number.isInteger(n) && n >= 1 && n <= 10))].sort((a, b) => a - b) : [];

export function loadProgress(game) {
  try {
    const raw = window.localStorage.getItem(KEY(game));
    if (!raw) return { ...EMPTY, stars: { first: [], second: [] } };
    const v = JSON.parse(raw);
    const n = (x) => (Number.isInteger(x) && x >= 0 && x <= 99 ? x : 0);
    const first = n(v.first);
    const second = n(v.second);
    return {
      first,
      second,
      last: v.last && typeof v.last === "object" ? v.last : null,
      // 깬 단계보다 높은 ★은 버려요(기록이 꼬였을 때)
      stars: {
        first: stageList(v.stars?.first).filter((s) => s <= first),
        second: stageList(v.stars?.second).filter((s) => s <= second),
      },
      best: Number.isInteger(v.best) && v.best > 0 && v.best < 100000 ? v.best : 0,
    };
  } catch {
    return { ...EMPTY, stars: { first: [], second: [] } };
  }
}

export function saveProgress(game, progress) {
  try {
    window.localStorage.setItem(KEY(game), JSON.stringify(progress));
  } catch {
    /* 저장이 안 되는 환경이면 이번 방문 동안만 기억해요 */
  }
}

export function resetProgress(game) {
  try {
    window.localStorage.removeItem(KEY(game));
  } catch {
    /* 무시 */
  }
}
