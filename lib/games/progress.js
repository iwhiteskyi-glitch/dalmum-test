"use client";

/**
 * 미니게임 진행 기록. 회원가입이나 서버 없이 이 브라우저에만 저장해요(다른 기기에서는 처음부터).
 * 저장이 막힌 환경(사생활 보호 창 등)에서도 게임은 그대로 되고, 기록만 남지 않아요.
 *  - 저장 모양: { black: 깬 단계 수, white: 깬 단계 수, last: { track, stage } }
 */
const KEY = (game) => `jmb-game-${game}-v1`;
const EMPTY = { black: 0, white: 0, last: null };

export function loadProgress(game) {
  try {
    const raw = window.localStorage.getItem(KEY(game));
    if (!raw) return { ...EMPTY };
    const v = JSON.parse(raw);
    const n = (x) => (Number.isInteger(x) && x >= 0 && x <= 99 ? x : 0);
    return { black: n(v.black), white: n(v.white), last: v.last && typeof v.last === "object" ? v.last : null };
  } catch {
    return { ...EMPTY };
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
