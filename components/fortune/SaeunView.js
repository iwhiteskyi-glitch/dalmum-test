"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "./fortune.module.css";
import t from "./today.module.css";
import s from "./saeun.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import PERIOD_TEXTS from "@/lib/fortune/periodTexts.json";
import SAEUN from "@/lib/fortune/saeunTexts.json";
import EXTRAS from "@/lib/fortune/todayExtras.json";
import {
  saeunReading,
  currentSajuYear,
  koreaToday,
  STEMS,
  STEMS_HANJA,
  BRANCHES,
  BRANCHES_HANJA,
  ELEMENTS,
  ELEMENTS_HANJA,
  STEM_ELEMENT,
} from "@/lib/fortune/saju";
import { useBirth } from "@/lib/fortune/birthStore";
import { keepResult, restoreOnBack } from "@/lib/backRestore";
import { decodeSaeunLink } from "@/lib/fortune/resultLink";
import { eunNeun } from "@/lib/korean";
import BirthForm from "./BirthForm";
import { Stars, Matchup, shortDateLabel } from "./parts";

const PERIOD_GODS = TEXTS.tenGods.map((g, i) => ({ ...g, ...PERIOD_TEXTS.periodGods[i] }));
const PERIOD_RELATIONS = Object.fromEntries(PERIOD_TEXTS.periodRelations.map((r) => [r.key, r.text]));
const RELATIONS = Object.fromEntries(TEXTS.relations.map((r) => [r.key, r]));
const REL_WORDS = [
  "나와 같은 오행",
  "내가 낳는(생하는) 오행",
  "내가 이기는(극하는) 오행",
  "나를 이기는(극하는) 오행",
  "나를 낳는(생하는) 오행",
];
const AREAS = [
  ["love", "연애·관계"],
  ["work", "일·공부"],
  ["money", "금전"],
  ["health", "건강"],
];
// 한 해 점수에 들어가는 몫: 총운 별점 60% · 영역 별점 평균 25% · 열두 달 별점 평균 15%
const SCORE_WEIGHTS = { overall: 0.6, areas: 0.25, months: 0.15 };
// 달 점수: 그 달 총운 별점 75% · 영역 별점 평균 25%
const MONTH_WEIGHTS = { overall: 0.75, areas: 0.25 };

const clampStars = (n) => Math.min(5, Math.max(1, n));
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const areaAvgOf = (god) => avg(AREAS.map(([k]) => god.stars[k]));
const dayKey = (d) => d.year * 10000 + d.month * 100 + d.day;

function periodText(relationKey, period) {
  return PERIOD_RELATIONS[relationKey].replaceAll("{PERIOD}", period);
}

/** 한 해의 신년운세 한 묶음 — 별점·100점 점수·맞춤 풀이·열두 달 점수까지 */
function buildYear(saju, sajuYear) {
  const r = saeunReading(saju, sajuYear);
  const months = r.months.map((m) => {
    const god = PERIOD_GODS[m.tenGod];
    const stars = clampStars(god.stars.overall + RELATIONS[m.relation].adjust);
    const score = Math.round((MONTH_WEIGHTS.overall * stars + MONTH_WEIGHTS.areas * areaAvgOf(god)) * 20);
    return { ...m, god, stars, score, ...SAEUN.months[m.tenGod] };
  });
  const god = PERIOD_GODS[r.year.tenGod];
  const rel = RELATIONS[r.year.relation];
  const overall = clampStars(god.stars.overall + rel.adjust);
  const areaAvg = areaAvgOf(god);
  const monthAvg = avg(months.map((m) => m.stars));
  const score = Math.round(
    (SCORE_WEIGHTS.overall * overall + SCORE_WEIGHTS.areas * areaAvg + SCORE_WEIGHTS.months * monthAvg) * 20
  );
  // 점수가 같으면 이른 달을 골라 늘 같은 결과가 나오게 해요.
  const pick = (cmp) => [...months].sort((a, b) => cmp(a, b) || dayKey(a.start) - dayKey(b.start))[0];
  const bestMonth = pick((a, b) => b.score - a.score);
  const lowest = pick((a, b) => a.score - b.score);
  // 열두 달 점수가 모두 같으면 같은 달이 양쪽으로 뽑히니, 그때는 잘 풀리는 달만 보여 줍니다.
  const watchMonth = lowest.score === bestMonth.score ? null : lowest;
  // 3개씩 있는 음식·장소는 그해 간지 번호로 골라서 같은 해면 늘 같아요.
  const turn = r.year.pillar.index % 3;
  const lucky = EXTRAS.lucky[r.year.luckyElement];
  return {
    ...r.year,
    god,
    rel,
    overall,
    areaAvg,
    monthAvg,
    score,
    months,
    bestMonth,
    watchMonth,
    personal: SAEUN.personal[saju.dayMaster][r.year.tenGod],
    areas: SAEUN.areas[r.year.tenGod],
    doDont: SAEUN.doDont[r.year.tenGod],
    luckyTaste: lucky.taste,
    luckyFood: lucky.foods[turn],
    luckyPlace: lucky.places[turn],
  };
}

/** /fortune/saeun — 생년월일 입력 + 신년운세(세운 1년 + 열두 달 월운) */
export default function SaeunView() {
  const { saju } = useBirth();
  const thisYear = useMemo(() => currentSajuYear(), []);
  // 뒤로 가기로 돌아오면 고르던 연도를 그대로 보여 줍니다(탭 메모리에만 둠).
  const [sajuYear, setSajuYearState] = useState(() => restoreOnBack("saeun-year") ?? thisYear + 1);
  const setSajuYear = (y) => {
    setSajuYearState(y);
    keepResult("saeun-year", y);
  };
  const [shared, setShared] = useState(null);
  // 생년월일을 바꾸는 동안에는 예전 결과를 숨겨요(취소하면 다시 보여요).
  const [editing, setEditing] = useState(false);
  const resultRef = useRef(null);

  // 예전에 친구가 보낸 결과 링크로 들어오면, 생년월일을 넣지 않아도 그 결과부터 보여 줍니다
  // (공유 버튼은 없앴지만 이미 퍼진 링크는 열려요).
  useEffect(() => {
    const got = decodeSaeunLink(window.location.hash);
    if (!got) return;
    setShared(got);
    track("saeun_shared_link_opened");
  }, []);

  function onSubmitted(input, remember) {
    setShared(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    track("saeun_result_viewed", { calendar: input.calendar, time: input.hour == null ? "unknown" : "known", remember });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <>
      {shared && (
        <>
          <p className={styles.sharedNote}>
            친구가 보낸 <b>{shared.sajuYear}년 신년운세</b>예요. 아래에서 내 신년운세도 바로 볼 수 있어요.
          </p>
          <div className={styles.result}>
            <SaeunResult saju={shared.saju} thisYear={thisYear} sajuYear={shared.sajuYear} snapshot />
          </div>
          <p className={styles.sectionDivider}>내 신년운세 보기</p>
        </>
      )}
      <BirthForm
        submitLabel="신년운세 보기"
        onSubmitted={onSubmitted}
        timeHelp="신년운세는 태어난 날(일주)을 기준으로 봐서 시간과 상관없이 같아요. 시간은 '내 사주'와 '궁합' 풀이에 반영돼요."
        onEditingChange={setEditing}
      />
      <div ref={resultRef} className={styles.result} aria-live="polite">
        {saju && !editing && (
          <div className={t.zone}>
            <p className={t.zoneLabel}>내 신년운세 결과</p>
            <SaeunResult saju={saju} thisYear={thisYear} sajuYear={sajuYear} onPick={setSajuYear} />
          </div>
        )}
      </div>
    </>
  );
}

/** snapshot: 친구가 보낸 링크로 보는 결과 — 연도 전환과 '왜 이렇게 나왔을까'·오늘의 운세 안내는 숨깁니다. */
function SaeunResult({ saju, thisYear, sajuYear, onPick, snapshot = false }) {
  const year = useMemo(() => {
    try {
      return buildYear(saju, sajuYear);
    } catch {
      return null;
    }
  }, [saju, sajuYear]);
  // "지금" 표시는 화면을 연 순간의 한국 날짜로 정해요.
  const [today, setToday] = useState(null);
  useEffect(() => setToday(koreaToday()), []);

  if (!year) {
    return <p className={styles.note}>이 연도의 신년운세는 계산할 수 없어요.</p>;
  }

  const { god, months } = year;
  const me = TEXTS.ilgan[saju.dayMaster];
  const dm = saju.dayMaster;
  const myDayBranch = saju.pillars.day.branch;
  const godRel = REL_WORDS[Math.floor(year.tenGod / 2)];
  const samePolarity = dm % 2 === year.pillar.stem % 2;
  const yearStemEl = ELEMENTS[STEM_ELEMENT[year.pillar.stem]];
  // 오늘이 이 사주해 안이면, 오늘이 속한 달에 "지금" 표시를 붙여요.
  const nowIndex = today
    ? months.reduce((found, m, i) => (dayKey(m.start) <= dayKey(today) ? i : found), -1)
    : -1;
  const inThisYear = today != null && sajuYear === thisYear && nowIndex >= 0;
  const monthLabel = (m) =>
    m.start.year !== sajuYear ? `${m.start.year}년 ${shortDateLabel(m.start)}` : shortDateLabel(m.start);

  return (
    <>
      <section className={t.panel} aria-labelledby="saeun-title">
        {!snapshot && (
          <div className={`${t.tabs} ${s.yearTabs}`} role="group" aria-label="보는 해 고르기">
            {[
              [thisYear, "올해"],
              [thisYear + 1, "내년"],
              [thisYear + 2, "내후년"],
            ].map(([y, label]) => (
              <button
                key={y}
                type="button"
                className={`${t.tab} ${sajuYear === y ? t.tabOn : ""}`}
                aria-pressed={sajuYear === y}
                onClick={() => onPick(y)}
              >
                {label} <small>{y}</small>
              </button>
            ))}
          </div>
        )}
        <p className={t.date}>
          {sajuYear}년 {year.pillar.ko}({year.pillar.hanja})년 · {shortDateLabel(months[0].start)} 입춘부터
        </p>
        <Matchup dayMaster={dm} otherStem={year.pillar.stem} when={`${sajuYear}년`} unit="해" god={year.tenGod} />

        <div className={t.scoreRow}>
          <div
            className={t.ring}
            style={{ "--p": year.score }}
            role="img"
            aria-label={`${sajuYear}년 점수 100점 중 ${year.score}점`}
          >
            <span className={t.ringNum}>
              {year.score}
              <small>점</small>
            </span>
          </div>
          <div className={t.scoreSide}>
            <p className={t.god}>
              {god.god}({god.hanja})의 해 · {god.keyword}
            </p>
            <h2 id="saeun-title" className={t.title}>
              {god.yearTitle}
            </h2>
            <Stars n={year.overall} label={`${sajuYear}년 총운`} />
          </div>
        </div>

        <div className={t.personal}>
          <p className={t.personalLabel}>
            {me.stem}
            {me.element}({me.hanja}
            {ELEMENTS_HANJA[STEM_ELEMENT[dm]]}) · {me.alias}인 나에게
          </p>
          <p className={t.personalText}>{year.personal}</p>
        </div>

        <p className={t.overall}>{god.yearText}</p>
        <p className={t.rel}>
          <span className={t.relHead}>
            덧붙는 풀이 · 태어난 날 아랫글자(일지) {BRANCHES[myDayBranch]}({BRANCHES_HANJA[myDayBranch]}) ↔ 이 해
            아랫글자 {BRANCHES[year.pillar.branch]}({BRANCHES_HANJA[year.pillar.branch]})
          </span>
          <b>{year.rel.label}</b> {periodText(year.relation, "이 해")}
        </p>
      </section>

      <section className={`${t.card} ${t.cArea}`} aria-labelledby="saeun-area-title">
        <h2 id="saeun-area-title" className={t.cardTitle}>
          영역별 한 해 운
        </h2>
        <dl className={t.areas}>
          {AREAS.map(([k, label]) => (
            <div key={k} className={t.area}>
              <dt>
                <span>{label}</span>
                <Stars n={god.stars[k]} label={label} />
              </dt>
              <dd>{year.areas[k]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${t.card} ${s.cMonth}`} aria-labelledby="saeun-months-title">
        <h2 id="saeun-months-title" className={t.cardTitle}>
          열두 달 흐름
        </h2>
        <div className={s.picks}>
          {[
            ["잘 풀리는 달", year.bestMonth, s.pickBest],
            ["쉬어 가는 달", year.watchMonth, s.pickWatch],
          ]
            .filter(([, m]) => m)
            .map(([label, m, cls]) => (
              <div key={label} className={`${s.pick} ${cls}`}>
                <span className={s.pickLabel}>{label}</span>
                <strong className={s.pickDate}>
                  {monthLabel(m)}~ <small>{m.score}점</small>
                </strong>
                <p className={s.pickText}>
                  {m.god.god} · {m.god.monthNote}
                </p>
              </div>
            ))}
        </div>
        <p className={s.lead}>
          달마다 찾아오는 기운이 나에게 어떤 관계인지로 점수를 냈어요. 사주의 달은 1일이 아니라 절기가 바뀌는 날에
          시작해요. 달을 누르면 그 달 풀이를 볼 수 있어요.
        </p>
        <ol className={s.months}>
          {months.map((m, i) => {
            const crossesYear = m.start.year !== sajuYear;
            const isNow = inThisYear && i === nowIndex;
            const tag = m === year.bestMonth ? "잘 풀림" : m === year.watchMonth ? "쉬어 가기" : null;
            return (
              <li key={i} className={isNow ? s.now : undefined}>
                <details className={s.month}>
                  <summary>
                    <span className={s.mDate}>
                      {monthLabel(m)}~
                      {isNow && <em className={s.nowTag}>지금</em>}
                      {tag && <em className={m === year.bestMonth ? s.bestTag : s.watchTag}>{tag}</em>}
                      <small>
                        {m.pillar.ko}월 · {m.god.god}
                      </small>
                    </span>
                    {/* 점수는 대부분 55~95점이라, 40점을 바닥으로 잡아야 달마다 차이가 눈에 보여요. */}
                    <span className={s.mBar} aria-hidden="true">
                      <i style={{ width: `${Math.max(8, ((m.score - 40) / 60) * 100)}%` }} />
                    </span>
                    <span className={s.mScore}>
                      {m.score}
                      <small>점</small>
                    </span>
                  </summary>
                  <div className={s.mBody}>
                    <p className={s.mNote}>{m.god.monthNote}</p>
                    <p>{m.text}</p>
                    <p className={s.mTip}>
                      <b>이 달의 팁</b> {m.tip}
                    </p>
                    <p className={s.mWhy}>
                      {m.pillar.ko}({m.pillar.hanja})월은 {ELEMENTS[STEM_ELEMENT[m.pillar.stem]]}(
                      {ELEMENTS_HANJA[STEM_ELEMENT[m.pillar.stem]]}) 기운의 달이고, 내 일간과는{" "}
                      <b>
                        {m.god.god}({m.god.hanja})
                      </b>{" "}
                      관계예요. {periodText(m.relation, "이 달")}
                      {crossesYear &&
                        ` ${sajuYear}년 세운은 입춘(2월 초)부터 다음 해 입춘 전까지라서, 마지막 달인 이 달은 ${m.start.year}년 1월에 시작해요.`}
                    </p>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={`${t.card} ${t.cTodo}`} aria-labelledby="saeun-todo-title">
        <h2 id="saeun-todo-title" className={t.cardTitle}>
          이 해 이렇게 보내 보세요
        </h2>
        <div className={t.todo}>
          <div className={t.doBox}>
            <h3>하면 좋은 것</h3>
            <ul>
              {year.doDont.do.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className={t.dontBox}>
            <h3>피하면 좋은 것</h3>
            <ul>
              {year.doDont.dont.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={`${t.card} ${t.cLucky}`} aria-labelledby="saeun-lucky-title">
        <h2 id="saeun-lucky-title" className={t.cardTitle}>
          이 해의 행운
        </h2>
        <dl className={t.lucky}>
          <div>
            <dt>색</dt>
            <dd>
              <i className={`${styles.swatch} ${styles[`sw${year.luckyElement}`]}`} aria-hidden="true" />
              {year.luckyColor}
            </dd>
          </div>
          <div>
            <dt>숫자</dt>
            <dd>{year.luckyNumbers.join(", ")}</dd>
          </div>
          <div>
            <dt>방향</dt>
            <dd>{year.luckyDirection}</dd>
          </div>
          <div className={t.luckyWide}>
            <dt>음식 · {year.luckyTaste}</dt>
            <dd>{year.luckyFood}</dd>
          </div>
          <div className={t.luckyWide}>
            <dt>장소</dt>
            <dd>{year.luckyPlace}</dd>
          </div>
        </dl>
      </section>

      {!snapshot && (
        <>
          <details className={styles.why}>
            <summary>왜 이렇게 나왔을까?</summary>
            <p>
              내 일간(태어난 날의 천간, 사주에서 &lsquo;나&rsquo;를 뜻하는 글자)은{" "}
              <b>
                {STEMS[dm]}({STEMS_HANJA[dm]})
              </b>
              {ELEMENTS[STEM_ELEMENT[dm]]}이고, {sajuYear}년 세운(그해 전체의 간지)은{" "}
              <b>
                {year.pillar.ko}({year.pillar.hanja})
              </b>
              년이에요. 그해 천간 {STEMS[year.pillar.stem]}({STEMS_HANJA[year.pillar.stem]}){yearStemEl}
              {eunNeun(yearStemEl)} 나에게 {godRel}이고, 음양이 {samePolarity ? "같아서" : "달라서"}{" "}
              <b>{god.god}</b>에 해당해요. {god.meaning}
            </p>
            <p>
              &lsquo;나에게&rsquo; 풀이는 내 일간({me.alias})과 그해 천간을 자연의 모습에 빗대어, 둘이 한 해 동안
              만나는 장면으로 풀었어요. 일간 열 가지와 십신 열 가지마다 따로 쓴 문장이라, 같은 해라도 일간이 다르면
              다른 풀이가 나와요.
            </p>
            <p>
              내 일지(태어난 날의 지지) {BRANCHES[myDayBranch]}({BRANCHES_HANJA[myDayBranch]})와 그해 지지{" "}
              {BRANCHES[year.pillar.branch]}({BRANCHES_HANJA[year.pillar.branch]})의 관계는 <b>{year.rel.label}</b>
              이라서 총운 별점에{" "}
              {year.rel.adjust > 0 ? "하나를 더했어요" : year.rel.adjust < 0 ? "하나를 뺐어요" : "변화를 주지 않았어요"}.
            </p>
            <p>
              점수는 총운 별점({year.overall}개)을 60%, 영역 네 가지 별점 평균({year.areaAvg.toFixed(1)}개)을 25%,
              열두 달 별점 평균({year.monthAvg.toFixed(1)}개)을 15% 반영해 100점으로 바꾼 거예요. 달마다 점수는 그 달
              총운 별점 75%와 영역 별점 평균 25%로 냈어요.
            </p>
            <p>
              행운의 색·숫자·방향·맛은 그해 기운을 부드럽게 이어 주는 오행({ELEMENTS[year.luckyElement]}·
              {ELEMENTS_HANJA[year.luckyElement]})에 전통적으로 짝지어진 것들이에요. 음식과 장소는 그 성질에 어울리는
              것을 골랐어요.
            </p>
          </details>

          <Link href="/fortune" className={styles.nextCard}>
            <span>
              <small>매일 바뀌어요</small>
              <strong>오늘 나의 운세 보기</strong>
              <span>오늘 일진과 내 일간의 관계로 하루 흐름을 풀어 드려요</span>
            </span>
            <span className={styles.crossArrow} aria-hidden="true">
              →
            </span>
          </Link>
        </>
      )}
      <p className={styles.disclaimer}>
        사주의 전통적인 해석을 바탕으로 재미로 보는 한 해 흐름이에요. 중요한 결정은 운세보다 내 판단을 믿어 주세요.
      </p>
    </>
  );
}
