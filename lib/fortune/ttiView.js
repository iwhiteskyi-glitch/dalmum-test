// 띠별 운세 화면에 쓰는 풀이 묶음(계산 결과 + 문장). 서버와 브라우저 양쪽에서 같은 결과가 나와요.
import TEXTS from "./texts.json";
import TTI_TEXTS from "./ttiTexts.json";
import { ANIMALS, TEN_GODS } from "./saju.js";
import { ttiInfo, ttiReading, ttiYearRows } from "./tti.js";

const RELATIONS = Object.fromEntries(TTI_TEXTS.relations.map((r) => [r.key, r]));

export const TTI_AREAS = [
  ["love", "연애·관계"],
  ["work", "일·공부"],
  ["money", "금전"],
  ["health", "건강"],
];

/** 한 띠의 어느 날 풀이 */
export function buildTti(branch, date) {
  const r = ttiReading(branch, date);
  const god = TTI_TEXTS.gods[r.tenGod];
  const rel = RELATIONS[r.relation];
  const overall = Math.min(5, Math.max(1, god.stars.overall + rel.adjust));
  return {
    ...r,
    info: ttiInfo(branch),
    intro: TTI_TEXTS.animals[branch].intro,
    god,
    godName: TEN_GODS[r.tenGod],
    rel,
    overall,
    todayAnimal: ANIMALS[r.pillar.branch],
    advice: god.advice[r.pillar.index % 3],
  };
}

/** 년생별 한마디: 해 천간 기준 십신의 키워드와 조언 한 줄(기존 오늘의 운세 문장) */
export function buildYearRows(branch, date) {
  return ttiYearRows(branch, date).map((row) => {
    const g = TEXTS.tenGods[row.tenGod];
    // 60년 차이 나는 해(1960·2020 경자)도 한마디가 겹치지 않게 갑자 바퀴 수를 더해요
    const turn = Math.floor((row.year - 4) / 60);
    return { ...row, godName: g.god, keyword: g.keyword, advice: g.advice[(row.pillar.index + turn + date.day) % 3] };
  });
}

export function sameDate(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}
