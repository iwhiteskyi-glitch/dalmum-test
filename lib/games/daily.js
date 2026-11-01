/**
 * 오늘의 문제: 날짜마다 정해진 문제를 내요. 같은 날 들어온 사람은 모두 같은 문제를 풀어요(한국 시간 기준).
 *  - 요일마다 난이도가 달라요: 월·화 쉬움 · 수·목·금 보통 · 토·일 어려움
 *  - 문제는 public/games/puzzles/<게임>.json 에 난이도별로 섞어 담겨 있고(scripts/games/puzzles/build-daily.mjs),
 *    날짜를 순서대로 세어 같은 난이도의 다음 문제를 꺼내요. 다 쓰면 처음부터 다시 돌아요.
 *  - 푼 기록은 이 브라우저에만 저장해요(서버 저장 없음).
 */

/** 문제를 세기 시작한 날. 이 날부터 "지난 문제"를 볼 수 있어요. */
export const PUZZLE_EPOCH = "2026-10-01";

export const LEVELS = {
  easy: { label: "쉬움", tone: "easy" },
  medium: { label: "보통", tone: "medium" },
  hard: { label: "어려움", tone: "hard" },
};
// 일 월 화 수 목 금 토
const WEEK = ["hard", "easy", "easy", "medium", "medium", "medium", "hard"];
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export const PUZZLE_GAMES = {
  omok: {
    key: "omok",
    name: "오목",
    path: "/games/puzzle/omok",
    gamePath: "/games/omok",
    goal: (p) => `4를 연달아 만들어 ${p.n}수 안에 5목을 만들어 보세요`,
  },
  janggi: {
    key: "janggi",
    name: "장기",
    path: "/games/puzzle/janggi",
    gamePath: "/games/janggi",
    goal: (p) => (p.n === 1 ? "단 한 수로 외통을 만들어 보세요" : `장군을 계속 불러 ${p.n}수 안에 외통을 만들어 보세요`),
  },
  chess: {
    key: "chess",
    name: "체스",
    path: "/games/puzzle/chess",
    gamePath: "/games/chess",
    goal: (p) => (p.n === 1 ? "단 한 수로 체크메이트를 만들어 보세요" : `${p.n}수 안에 체크메이트를 만들어 보세요`),
  },
};
export const PUZZLE_ORDER = ["omok", "janggi", "chess"];

/* ---------- 날짜 ---------- */

const DAY = 86400000;
const KST = 9 * 3600000;
const dayNumber = (key) => Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY);
const keyOf = (n) => new Date(n * DAY).toISOString().slice(0, 10);

/** 한국 시간 오늘 날짜("2026-10-09") */
export function todayKey(now = Date.now()) {
  return keyOf(Math.floor((now + KST) / DAY));
}
export function addDays(key, d) {
  return keyOf(dayNumber(key) + d);
}
export function isValidKey(key) {
  return typeof key === "string" && /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(Date.parse(`${key}T00:00:00Z`)) && keyOf(dayNumber(key)) === key;
}
export function levelOf(key) {
  return WEEK[new Date(dayNumber(key) * DAY).getUTCDay()];
}
/** "10월 9일 (목)" */
export function dateLabel(key) {
  const d = new Date(dayNumber(key) * DAY);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAY[d.getUTCDay()]})`;
}

/** 이 날짜의 문제 번호(같은 난이도 목록 안에서) — 처음 날부터 같은 난이도였던 날을 세요 */
function indexOf(key) {
  const level = levelOf(key);
  const start = dayNumber(PUZZLE_EPOCH);
  const end = dayNumber(key);
  let count = 0;
  for (let n = start; n < end; n++) if (WEEK[new Date(n * DAY).getUTCDay()] === level) count++;
  return count;
}

/** set: <게임>.json 내용({ easy:[…], medium:[…], hard:[…] }) → 이 날의 문제 */
export function puzzleFor(set, key) {
  const level = levelOf(key);
  const list = set[level];
  const i = indexOf(key);
  return { level, number: dayNumber(key) - dayNumber(PUZZLE_EPOCH) + 1, ...list[i % list.length] };
}

const cache = {};
/** 문제 묶음 불러오기(게임마다 한 번만) */
export function loadPuzzleSet(game) {
  cache[game] ||= fetch(`/games/puzzles/${game}.json`).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  });
  cache[game].catch(() => delete cache[game]);
  return cache[game];
}

/* ---------- 푼 기록(이 브라우저에만) ---------- */

const KEY = "jmb-puzzle-v1";
function readAll() {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/** { [날짜]: { tries, hint } } — 푼 날만 들어 있어요 */
export function loadSolved(game) {
  const v = readAll()[game];
  return v && typeof v === "object" ? v : {};
}

export function saveSolved(game, key, record) {
  try {
    const all = readAll();
    const mine = all[game] && typeof all[game] === "object" ? all[game] : {};
    if (mine[key]) return; // 처음 푼 기록만 남겨요
    mine[key] = record;
    all[game] = mine;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* 저장이 안 되는 환경이면 기록만 남지 않아요 */
  }
}

/** 오늘(또는 어제)까지 며칠 연속으로 풀었는지 */
export function streakOf(solved, today) {
  let day = solved[today] ? today : addDays(today, -1);
  let n = 0;
  while (solved[day]) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}
