/**
 * 결과를 주소의 "#" 뒤에 담아, 링크를 받은 사람이 아무것도 입력하지 않고 같은 결과를 바로
 * 보게 합니다. "#" 뒷부분은 서버로 전송되지 않아서 어디에도 기록되지 않아요.
 *
 * 담는 것은 풀이를 다시 계산하는 데 필요한 번호뿐입니다 — 날짜, 일주(태어난 날의 두 글자),
 * 오행 개수, 고른 영역. 생년월일과 성별은 담지 않습니다. 받는 쪽에서는 숫자 범위를 하나씩
 * 확인해서 조금이라도 어긋나면 무시하고 평소처럼 입력 화면을 보여 줍니다.
 */

const FORTUNE_KEY = "f1";
const GUNGHAP_KEY = "g1";
const AREA_KEYS = ["love", "friend", "work"];

const whole = (v, max) => {
  const n = /^\d{1,8}$/.test(v) ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 0 && n <= max ? n : null;
};

const pad = (n) => String(n).padStart(2, "0");
const sajuOf = (dayMaster, branch, elements) => ({
  dayMaster,
  pillars: { day: { branch } },
  ...(elements ? { elements } : {}),
});

/* ───────────── 오늘의 운세: 날짜 + 일주 ───────────── */

export function encodeFortuneLink(date, saju) {
  const d = `${date.year}${pad(date.month)}${pad(date.day)}`;
  return `#${FORTUNE_KEY}.${d}.${saju.dayMaster}.${saju.pillars.day.branch}`;
}

/** 반환: { date, saju } 또는 null */
export function decodeFortuneLink(hash) {
  const parts = String(hash || "").replace(/^#/, "").split(".");
  if (parts.length !== 4 || parts[0] !== FORTUNE_KEY) return null;
  const [, ymd, dm, db] = parts;
  if (!/^\d{8}$/.test(ymd)) return null;
  const year = whole(ymd.slice(0, 4), 2100);
  const month = whole(ymd.slice(4, 6), 12);
  const day = whole(ymd.slice(6, 8), 31);
  const dayMaster = whole(dm, 9);
  const dayBranch = whole(db, 11);
  if (year === null || year < 1900 || !month || !day) return null;
  if (dayMaster === null || dayBranch === null) return null;
  return { date: { year, month, day }, saju: sajuOf(dayMaster, dayBranch) };
}

/* ───────────── 궁합: 두 사람의 일주 + 오행 개수 + 고른 영역 ───────────── */

const elementsText = (elements) => elements.map((n) => Math.min(9, Math.max(0, n))).join("");

function elementsFrom(text) {
  if (!/^\d{5}$/.test(text)) return null;
  return [...text].map(Number);
}

export function encodeGunghapLink(me, partner, areas) {
  const mask = AREA_KEYS.reduce((m, key, i) => (areas[key] ? m + (1 << i) : m), 0);
  return [
    `#${GUNGHAP_KEY}`,
    me.dayMaster,
    me.pillars.day.branch,
    partner.dayMaster,
    partner.pillars.day.branch,
    elementsText(me.elements),
    elementsText(partner.elements),
    mask,
  ].join(".");
}

/** 반환: { me, partner, areas } 또는 null */
export function decodeGunghapLink(hash) {
  const parts = String(hash || "").replace(/^#/, "").split(".");
  if (parts.length !== 8 || parts[0] !== GUNGHAP_KEY) return null;
  const [, dmA, dbA, dmB, dbB, elA, elB, maskText] = parts;
  const nums = [whole(dmA, 9), whole(dbA, 11), whole(dmB, 9), whole(dbB, 11)];
  const elementsA = elementsFrom(elA);
  const elementsB = elementsFrom(elB);
  const mask = whole(maskText, 7);
  if (nums.some((n) => n === null) || !elementsA || !elementsB || !mask) return null;
  return {
    me: sajuOf(nums[0], nums[1], elementsA),
    partner: sajuOf(nums[2], nums[3], elementsB),
    areas: Object.fromEntries(AREA_KEYS.map((key, i) => [key, Boolean(mask & (1 << i))])),
  };
}
