"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "./fortune.module.css";
import t from "./today.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import PERIOD_TEXTS from "@/lib/fortune/periodTexts.json";
import PERSONAL from "@/lib/fortune/personalTexts.json";
import EXTRAS from "@/lib/fortune/todayExtras.json";
import {
  dayReading,
  hourFlow,
  koreaToday,
  addDays,
  STEMS,
  STEMS_HANJA,
  BRANCHES,
  BRANCHES_HANJA,
  ELEMENTS,
  ELEMENTS_HANJA,
  STEM_ELEMENT,
} from "@/lib/fortune/saju";
import { useBirth } from "@/lib/fortune/birthStore";
import { decodeFortuneLink } from "@/lib/fortune/resultLink";
import { eunNeun } from "@/lib/korean";
import BirthForm from "./BirthForm";
import { Stars, Matchup, dateLabel, range, hourRangeLabel } from "./parts";

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
const RELATIONS = Object.fromEntries(TEXTS.relations.map((r) => [r.key, r]));
const HOUR_NOTES = PERIOD_TEXTS.periodGods.map((g) => g.hourNote);
const HOUR_FRAMES = Object.fromEntries(PERIOD_TEXTS.hourFrames.map((f) => [f.key, f]));
// 점수에 들어가는 몫: 총운 별점 60% · 영역 별점 평균 25% · 깨어 있는 시간대 별점 평균 15%
const SCORE_WEIGHTS = { overall: 0.6, areas: 0.25, hours: 0.15 };

/** 열두 시진마다 십신·별점·한 줄 설명을 붙입니다. */
function buildHours(saju, date) {
  return hourFlow(saju, date).map((h) => {
    const god = TEXTS.tenGods[h.tenGod];
    const stars = Math.min(5, Math.max(1, god.stars.overall + RELATIONS[h.relation].adjust));
    return { ...h, god, stars, note: HOUR_NOTES[h.tenGod] };
  });
}

/** 어느 날의 운세 한 묶음 — 별점·100점 점수·맞춤 풀이·할 일까지 */
function buildDay(saju, date) {
  const r = dayReading(saju, date);
  const god = TEXTS.tenGods[r.tenGod];
  const rel = RELATIONS[r.relation];
  const overall = Math.min(5, Math.max(1, god.stars.overall + rel.adjust));
  const hours = buildHours(saju, date);
  // 시간대 평균은 깨어 있는 시간(묘시 아침 5:30 ~ 해시 밤 11:30)만 봐요.
  const awake = hours.filter((h) => h.branch >= 3);
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const areaAvg = avg(AREAS.map(([k]) => god.stars[k]));
  const hourAvg = avg(awake.map((h) => h.stars));
  const score = Math.round(
    (SCORE_WEIGHTS.overall * overall + SCORE_WEIGHTS.areas * areaAvg + SCORE_WEIGHTS.hours * hourAvg) * 20
  );
  // 3개씩 있는 한마디·음식·장소는 일진 번호로 돌아가며 골라서 같은 날이면 늘 같아요.
  const turn = r.pillar.index % 3;
  const lucky = EXTRAS.lucky[r.luckyElement];
  return {
    ...r,
    god,
    rel,
    overall,
    hours,
    awake,
    score,
    areaAvg,
    hourAvg,
    advice: god.advice[turn],
    personal: PERSONAL.texts[saju.dayMaster][r.tenGod],
    doDont: EXTRAS.doDont[r.tenGod],
    luckyTaste: lucky.taste,
    luckyFood: lucky.foods[turn],
    luckyPlace: lucky.places[turn],
  };
}

/** /fortune — 생년월일 입력 + 오늘의 운세 + 앞으로 일주일 흐름 */
export default function TodayFortune() {
  const { saju } = useBirth();
  const [today, setToday] = useState(null);
  const [shared, setShared] = useState(null);
  // 생년월일을 바꾸는 동안에는 예전 결과를 숨겨요(취소하면 다시 보여요).
  const [editing, setEditing] = useState(false);
  const resultRef = useRef(null);

  // "오늘"은 방문한 순간의 한국 날짜로 정합니다. 예전에 친구가 보낸 결과 링크로 들어오면,
  // 생년월일을 넣지 않아도 그 결과부터 보여 줍니다(공유 버튼은 없앴지만 이미 퍼진 링크는 열려요).
  useEffect(() => {
    setToday(koreaToday());
    const got = decodeFortuneLink(window.location.hash);
    if (got) {
      setShared(got);
      track("fortune_shared_link_opened");
    }
  }, []);

  function onSubmitted(input, remember) {
    setToday(koreaToday());
    // 내 결과를 보기 시작하면 친구 결과와 링크 흔적을 지웁니다.
    setShared(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    track("fortune_result_viewed", {
      calendar: input.calendar,
      time: input.hour == null ? "unknown" : "known",
      remember,
    });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <>
      {shared && (
        <>
          <p className={styles.sharedNote}>
            친구가 보낸 <b>{dateLabel(shared.date)} 운세</b>예요. 아래에서 내 운세도 바로 볼 수 있어요.
          </p>
          <div className={styles.result}>
            <TodayResult saju={shared.saju} today={shared.date} snapshot />
          </div>
          <p className={styles.sectionDivider}>내 운세 보기</p>
        </>
      )}
      <BirthForm
        submitLabel="오늘의 운세 보기"
        onSubmitted={onSubmitted}
        timeHelp="오늘의 운세는 태어난 날(일주)을 기준으로 봐서 시간과 상관없이 같아요. 시간은 '내 사주'와 '궁합' 풀이에 반영돼요."
        onEditingChange={setEditing}
      />
      <div ref={resultRef} className={styles.result} aria-live="polite">
        {saju && today && !editing && (
          <div className={t.zone}>
            <p className={t.zoneLabel}>내 운세 결과</p>
            <TodayResult saju={saju} today={today} />
          </div>
        )}
      </div>
    </>
  );
}

/** snapshot: 친구가 보낸 링크로 보는 결과 — 오늘/내일 전환과 시간대·일주일·내 사주 안내는 숨깁니다. */
function TodayResult({ saju, today, snapshot = false }) {
  // 오늘/내일 전환. 아래 일주일 흐름은 전환과 관계없이 늘 오늘부터 보여 줍니다.
  const [tomorrow, setTomorrow] = useState(false);
  const date = tomorrow ? addDays(today, 1) : today;
  const dayLabel = tomorrow ? "내일" : "오늘";
  // 풀이 문장은 "오늘"을 기준으로 쓰여 있어요. 내일을 볼 때는 말만 바꿔서 보여 줍니다
  // (오늘은→내일은, 오늘의→내일의처럼 그대로 이어져요).
  const asDay = (text) => (tomorrow ? text.replaceAll("오늘", "내일") : text);
  const day = buildDay(saju, date);
  const { hours, awake } = day;
  // 추천 시간은 깨어 있는 시간대 안에서 골라요. 새벽 2시가 "숨 고르는 시간"으로 나오면 쓸모가
  // 없으니까요. 별점이 같을 때는 사람들이 주로 움직이는 시간(사시~술시, 오전 9:30~밤 9:30)을
  // 먼저, 그다음엔 이른 시간을 골라 늘 같은 결과가 나오게 합니다.
  const isPrime = (h) => (h.branch >= 5 && h.branch <= 10 ? 1 : 0);
  const pick = (byStars) => [...awake].sort((a, b) => byStars(a, b) || isPrime(b) - isPrime(a) || a.branch - b.branch)[0];
  const bestHour = pick((a, b) => b.stars - a.stars);
  const lowest = pick((a, b) => a.stars - b.stars);
  // 깨어 있는 아홉 칸의 별점이 모두 같으면 같은 칸이 양쪽으로 뽑히니, 그때는 한 칸만 보여 줍니다.
  const watchHour = lowest === bestHour ? null : lowest;
  const hourPicks = [
    ["best", bestHour],
    ["watch", watchHour],
  ].filter(([, h]) => h);
  const week = range(0, 6).map((i) => {
    const d = addDays(today, i);
    return { date: d, ...buildDay(saju, d) };
  });
  const me = TEXTS.ilgan[saju.dayMaster];
  const dm = saju.dayMaster;
  const myDayBranch = saju.pillars.day.branch;
  const godRel = REL_WORDS[Math.floor(day.tenGod / 2)];
  const samePolarity = dm % 2 === day.pillar.stem % 2;

  return (
    <>
      <section className={t.panel} aria-labelledby="today-title">
        {!snapshot && (
          <div className={t.tabs} role="group" aria-label="보는 날 고르기">
            {[
              ["오늘", false],
              ["내일", true],
            ].map(([label, value]) => (
              <button
                key={label}
                type="button"
                className={`${t.tab} ${tomorrow === value ? t.tabOn : ""}`}
                aria-pressed={tomorrow === value}
                onClick={() => setTomorrow(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <p className={t.date}>
          {date.year}년 {dateLabel(date)} · {day.pillar.ko}({day.pillar.hanja})일
        </p>
        <Matchup dayMaster={dm} otherStem={day.pillar.stem} when={dayLabel} unit="날" god={day.tenGod} />

        <div className={t.scoreRow}>
          <div className={t.ring} style={{ "--p": day.score }} role="img" aria-label={`${dayLabel}의 점수 100점 중 ${day.score}점`}>
            <span className={t.ringNum}>
              {day.score}
              <small>점</small>
            </span>
          </div>
          <div className={t.scoreSide}>
            <p className={t.god}>
              {day.god.god}({day.god.hanja})의 날 · {day.god.keyword}
            </p>
            <h2 id="today-title" className={t.title}>
              {day.god.title}
            </h2>
            <Stars n={day.overall} label={`${dayLabel}의 총운`} />
          </div>
        </div>

        <div className={t.personal}>
          <p className={t.personalLabel}>
            {me.stem}
            {me.element}({me.hanja}
            {ELEMENTS_HANJA[STEM_ELEMENT[dm]]}) · {me.alias}인 나에게
          </p>
          <p className={t.personalText}>{asDay(day.personal)}</p>
        </div>

        <p className={t.overall}>{asDay(day.god.overall)}</p>
        <p className={t.rel}>
          <span className={t.relHead}>
            덧붙는 풀이 · 태어난 날 아랫글자(일지) {BRANCHES[myDayBranch]}({BRANCHES_HANJA[myDayBranch]}) ↔ {dayLabel}{" "}
            아랫글자 {BRANCHES[day.pillar.branch]}({BRANCHES_HANJA[day.pillar.branch]})
          </span>
          <b>
            {day.rel.label} · {day.rel.title}
          </b>{" "}
          {asDay(day.rel.text)}
        </p>
      </section>

      <section className={`${t.card} ${t.cArea}`} aria-labelledby="area-title">
        <h2 id="area-title" className={t.cardTitle}>
          영역별 운
        </h2>
        <dl className={t.areas}>
          {AREAS.map(([k, label]) => (
            <div key={k} className={t.area}>
              <dt>
                <span>{label}</span>
                <Stars n={day.god.stars[k]} label={label} />
              </dt>
              <dd>{asDay(day.god[k])}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${t.card} ${t.cTodo}`} aria-labelledby="todo-title">
        <h2 id="todo-title" className={t.cardTitle}>
          {dayLabel} 이렇게 보내 보세요
        </h2>
        <p className={t.advice}>{asDay(day.advice)}</p>
        <div className={t.todo}>
          <div className={t.doBox}>
            <h3>하면 좋은 것</h3>
            <ul>
              {day.doDont.do.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className={t.dontBox}>
            <h3>피하면 좋은 것</h3>
            <ul>
              {day.doDont.dont.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={`${t.card} ${t.cLucky}`} aria-labelledby="lucky-title">
        <h2 id="lucky-title" className={t.cardTitle}>
          {dayLabel}의 행운
        </h2>
        <dl className={t.lucky}>
          <div>
            <dt>색</dt>
            <dd>
              <i className={`${styles.swatch} ${styles[`sw${day.luckyElement}`]}`} aria-hidden="true" />
              {day.luckyColor}
            </dd>
          </div>
          <div>
            <dt>숫자</dt>
            <dd>{day.luckyNumbers.join(", ")}</dd>
          </div>
          <div>
            <dt>방향</dt>
            <dd>{day.luckyDirection}</dd>
          </div>
          <div className={t.luckyWide}>
            <dt>음식 · {day.luckyTaste}</dt>
            <dd>{day.luckyFood}</dd>
          </div>
          <div className={t.luckyWide}>
            <dt>장소</dt>
            <dd>{day.luckyPlace}</dd>
          </div>
        </dl>
      </section>

      {!snapshot && (
        <>
          <section className={`${t.card} ${t.cHour}`} aria-labelledby="hour-title">
            <h2 id="hour-title" className={t.cardTitle}>
              {dayLabel} 시간대별 흐름
            </h2>
            <p className={t.cardLead}>
              사주에서는 하루를 두 시간씩 열두 칸으로 나눠요. 칸마다 찾아오는 기운이 나에게 어떤 관계인지로 잘 맞는
              시간과 쉬어 가는 시간을 골랐어요.
            </p>
            <div className={styles.hourPicks}>
              {hourPicks.map(([key, h]) => (
                <div key={key} className={`${styles.hourPick} ${key === "best" ? styles.hourPickBest : ""}`}>
                  <span className={styles.hourPickLabel}>{HOUR_FRAMES[key].label}</span>
                  <strong className={styles.hourPickTime}>
                    {hourRangeLabel(h.startMin, h.endMin)}
                    <small>
                      {BRANCHES[h.branch]}시({BRANCHES_HANJA[h.branch]}) · {h.god.god}
                    </small>
                  </strong>
                  <p className={styles.hourPickText}>
                    {h.note} {HOUR_FRAMES[key].text}
                  </p>
                </div>
              ))}
            </div>
            <details className={t.more}>
              <summary>열두 시간 모두 보기</summary>
              <ol className={styles.hourList}>
                {hours.map((h) => (
                  <li
                    key={h.branch}
                    className={h === bestHour ? styles.hourBest : h === watchHour ? styles.hourWatch : undefined}
                  >
                    <span className={styles.hourTime}>
                      {hourRangeLabel(h.startMin, h.endMin)}
                      <small>{BRANCHES[h.branch]}시</small>
                    </span>
                    <span className={styles.hourGod}>{h.god.god}</span>
                    <Stars n={h.stars} label={`${BRANCHES[h.branch]}시 흐름`} />
                  </li>
                ))}
              </ol>
              <p className={styles.note}>
                사주에서 하루는 두 시간씩 열두 칸(십이시)으로 나뉘어요. 그날 일간으로 열두 시간의 천간을 정하고, 그
                천간이 내 일간과 어떤 십신 관계인지에 내 일지와 시지의 관계까지 더해 별점을 냈어요. 시각은 동경
                127.5도 기준 30분 보정을 반영해 한국 시계 시각으로 적었어요. 그래서 자시가 밤 11:30에 시작하고, 맨
                윗줄 자시는 시계로는 전날 밤 11:30부터예요. 위에서 고른 두 시간은 깨어 있는 시간대(아침 5:30~밤
                11:30) 안에서 골랐어요.
              </p>
            </details>
          </section>

          <section className={`${t.card} ${t.cWeek}`} aria-labelledby="week-title">
            <h2 id="week-title" className={t.cardTitle}>
              앞으로 일주일
            </h2>
            <ol className={t.week}>
              {week.map((w, i) => (
                <li key={i} className={i === 0 ? t.weekToday : undefined}>
                  <span className={t.weekDate}>
                    {i === 0 ? "오늘" : dateLabel(w.date)}
                    <small>
                      {w.god.title} · {w.god.god}
                    </small>
                  </span>
                  {/* 점수는 대부분 50~90점이라, 40점을 바닥으로 잡아야 날마다 차이가 눈에 보여요. */}
                  <span className={t.weekBar} aria-hidden="true">
                    <i style={{ width: `${Math.max(8, ((w.score - 40) / 60) * 100)}%` }} />
                  </span>
                  <span className={t.weekScore}>
                    {w.score}
                    <small>점</small>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <details className={styles.why}>
            <summary>왜 이렇게 나왔을까?</summary>
            <p>
              내 일간(태어난 날의 천간, 사주에서 &lsquo;나&rsquo;를 뜻하는 글자)은{" "}
              <b>
                {STEMS[dm]}({STEMS_HANJA[dm]})
              </b>
              {ELEMENTS[STEM_ELEMENT[dm]]}이고, {dayLabel}의 일진은{" "}
              <b>
                {day.pillar.ko}({day.pillar.hanja})
              </b>
              일이에요. {dayLabel}의 천간 {STEMS[day.pillar.stem]}({STEMS_HANJA[day.pillar.stem]})
              {ELEMENTS[STEM_ELEMENT[day.pillar.stem]]}
              {eunNeun(ELEMENTS[STEM_ELEMENT[day.pillar.stem]])} 나에게 {godRel}이고, 음양이{" "}
              {samePolarity ? "같아서" : "달라서"} <b>{day.god.god}</b>에 해당해요. {day.god.meaning}
            </p>
            <p>
              &lsquo;나에게&rsquo; 풀이는 내 일간({me.alias})과 {dayLabel} 천간을 자연의 모습에 빗대어, 둘이 만나는
              장면으로 풀었어요. 일간 열 가지와 십신 열 가지마다 따로 쓴 문장이라, 같은 날이라도 일간이 다르면 다른
              풀이가 나와요.
            </p>
            <p>
              내 일지(태어난 날의 지지) {BRANCHES[myDayBranch]}({BRANCHES_HANJA[myDayBranch]})와 {dayLabel} 일지{" "}
              {BRANCHES[day.pillar.branch]}({BRANCHES_HANJA[day.pillar.branch]})의 관계는 <b>{day.rel.label}</b>이라서
              총운 별점에{" "}
              {day.rel.adjust > 0 ? "하나를 더했어요" : day.rel.adjust < 0 ? "하나를 뺐어요" : "변화를 주지 않았어요"}.
            </p>
            <p>
              점수는 총운 별점({day.overall}개)을 60%, 영역 네 가지 별점 평균({day.areaAvg.toFixed(1)}개)을 25%, 깨어
              있는 시간대 아홉 칸의 별점 평균({day.hourAvg.toFixed(1)}개)을 15% 반영해 100점으로 바꾼 거예요. 그래서
              같은 십신이 돌아오는 날이라도 시간대 흐름에 따라 점수가 조금씩 달라요.
            </p>
            <p>
              행운의 색·숫자·방향·맛은 {dayLabel} 기운을 부드럽게 이어 주는 오행({ELEMENTS[day.luckyElement]}·
              {ELEMENTS_HANJA[day.luckyElement]})에 전통적으로 짝지어진 것들이에요. 오행마다 방위(목 동·화 남·토
              중앙·금 서·수 북)와 맛(목 신맛·화 쓴맛·토 단맛·금 매운맛·수 짠맛)이 정해져 있고, 음식과 장소는 그
              성질에 어울리는 것을 골라 날마다 돌아가며 보여 드려요.
            </p>
          </details>

          <Link href="/fortune/saju" className={styles.nextCard}>
            <span>
              <small>내 사주 팔자 자세히 보기</small>
              <strong>
                나는 {me.stem}({me.hanja}){me.element} — {me.alias}
              </strong>
              <span>여덟 글자 표, 내 일주 풀이, 오행·십신 분포를 볼 수 있어요</span>
            </span>
            <span className={styles.crossArrow} aria-hidden="true">
              →
            </span>
          </Link>
        </>
      )}
      <p className={styles.disclaimer}>
        사주의 전통적인 해석을 바탕으로 재미로 보는 풀이예요. 중요한 결정은 운세보다 내 판단을 믿어 주세요.
      </p>
    </>
  );
}
