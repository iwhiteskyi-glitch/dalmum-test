"use client";

/**
 * 컴퓨터와 여러 판을 겨루는 카드 게임(원카드·도둑잡기)의 기록과 고른 설정. 이 브라우저에만 저장해요(서버 저장 없음).
 *  - setup: 마지막으로 고른 설정(컴퓨터 수 · 게임마다 다른 설정: 원카드 우승 승수 · 도둑잡기 시작 점수 · 숫자 타일 승수와 첫 등록)
 *  - rounds·roundWins: 끝까지 한 판 수와 이긴 판 수(도둑잡기는 도둑이 안 된 판)
 *  - matches·champions: 끝까지 한 경기 수와 우승한 경기 수(도둑잡기는 꼴찌가 안 된 경기)
 */
export const BOT_COUNTS = [1, 2, 3];
const count = (v) => (Number.isInteger(v) && v > 0 && v < 1e7 ? v : 0);

/** key: 저장 이름 · options: { 설정 이름: 고를 수 있는 값들 } · defaultSetup: { bots, ...설정 } */
export function makeMatchRecord(key, options, defaultSetup) {
  const empty = { setup: defaultSetup, rounds: 0, roundWins: 0, matches: 0, champions: 0 };
  const read = () => {
    try {
      const v = JSON.parse(window.localStorage.getItem(key) || "{}");
      return v && typeof v === "object" ? v : {};
    } catch {
      return {};
    }
  };
  const write = (value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 저장이 안 되는 환경이면 기록만 남지 않아요 */
    }
  };
  /** 저장된 기록(망가진 값은 버려요) */
  const loadRecord = () => {
    const raw = read();
    const s = raw.setup && typeof raw.setup === "object" ? raw.setup : {};
    const keys = Object.keys(options);
    const ok = BOT_COUNTS.includes(s.bots) && keys.every((k) => options[k].includes(s[k]));
    const setup = ok ? { bots: s.bots, ...Object.fromEntries(keys.map((k) => [k, s[k]])) } : defaultSetup;
    const rounds = count(raw.rounds);
    const matches = count(raw.matches);
    return { setup, rounds, roundWins: Math.min(rounds, count(raw.roundWins)), matches, champions: Math.min(matches, count(raw.champions)) };
  };
  const update = (change) => {
    const next = change(loadRecord());
    write(next);
    return next;
  };
  return {
    EMPTY_RECORD: empty,
    loadRecord,
    saveSetup: (setup) => update((r) => ({ ...r, setup })),
    /** 한 판이 끝났을 때 */
    addRound: (won) => update((r) => ({ ...r, rounds: r.rounds + 1, roundWins: r.roundWins + (won ? 1 : 0) })),
    /** 경기(우승자가 나올 때까지)가 끝났을 때 */
    addMatch: (champion) => update((r) => ({ ...r, matches: r.matches + 1, champions: r.champions + (champion ? 1 : 0) })),
  };
}
