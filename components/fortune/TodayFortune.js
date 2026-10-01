"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "./fortune.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import {
  dayReading,
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
import BirthForm from "./BirthForm";
import { Stars, dateLabel, range } from "./parts";

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

/** 어느 날의 운세 한 묶음 */
function buildDay(saju, date) {
  const r = dayReading(saju, date);
  const god = TEXTS.tenGods[r.tenGod];
  const rel = RELATIONS[r.relation];
  const overall = Math.min(5, Math.max(1, god.stars.overall + rel.adjust));
  return { ...r, god, rel, overall, advice: god.advice[r.pillar.index % god.advice.length] };
}

/** /fortune — 생년월일 입력 + 오늘의 운세 + 앞으로 일주일 흐름 */
export default function TodayFortune() {
  const { saju } = useBirth();
  const [today, setToday] = useState(null);
  const resultRef = useRef(null);

  // "오늘"은 방문한 순간의 한국 날짜로 정합니다.
  useEffect(() => setToday(koreaToday()), []);

  function onSubmitted(input, remember) {
    setToday(koreaToday());
    track("fortune_result_viewed", {
      calendar: input.calendar,
      time: input.hour == null ? "unknown" : "known",
      remember,
    });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <>
      <BirthForm submitLabel="오늘의 운세 보기" onSubmitted={onSubmitted} />
      <div ref={resultRef} className={styles.result} aria-live="polite">
        {saju && today && <TodayResult saju={saju} today={today} />}
      </div>
    </>
  );
}

function TodayResult({ saju, today }) {
  const [copied, setCopied] = useState(false);
  const day = buildDay(saju, today);
  const week = range(0, 6).map((i) => {
    const date = addDays(today, i);
    return { date, ...buildDay(saju, date) };
  });
  const me = TEXTS.ilgan[saju.dayMaster];
  const dm = saju.dayMaster;
  const myDayBranch = saju.pillars.day.branch;
  const godRel = REL_WORDS[Math.floor(day.tenGod / 2)];
  const samePolarity = dm % 2 === day.pillar.stem % 2;

  async function share() {
    const text = `오늘 나의 운세는 "${day.god.title}" — 재미로봄 오늘의 운세`;
    const url = `${window.location.origin}/fortune`;
    track("fortune_shared");
    try {
      if (navigator.share) {
        await navigator.share({ title: "재미로봄 오늘의 운세", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 공유 창을 닫은 경우 등 */
    }
  }

  return (
    <>
      <section className={styles.todayCard} aria-labelledby="today-title">
        <div className={styles.todayHead}>
          <p className={styles.todayDate}>
            {today.year}년 {dateLabel(today)} · 오늘의 일진 {day.pillar.ko}({day.pillar.hanja})일
          </p>
          <p className={styles.todayGod}>
            {day.god.god}({day.god.hanja})의 날 · {day.god.keyword}
          </p>
          <h2 id="today-title" className={styles.todayTitle}>
            {day.god.title}
          </h2>
          <div className={styles.overallStars}>
            <Stars n={day.overall} label="총운" />
          </div>
        </div>
        <div className={styles.todayBody}>
          <p className={styles.todayText}>{day.god.overall}</p>
          <p className={styles.relNote}>
            <strong>
              {day.rel.label} · {day.rel.title}
            </strong>
            {day.rel.text}
          </p>

          <dl className={styles.areas}>
            {AREAS.map(([k, label]) => (
              <div key={k} className={styles.area}>
                <dt>
                  {label} <Stars n={day.god.stars[k]} label={label} />
                </dt>
                <dd>{day.god[k]}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.lucky}>
            <div>
              <span>오늘의 한마디</span>
              <strong>{day.advice}</strong>
            </div>
            <div>
              <span>행운의 색</span>
              <strong>
                <i className={`${styles.swatch} ${styles[`sw${day.luckyElement}`]}`} aria-hidden="true" />
                {day.luckyColor}
              </strong>
            </div>
            <div>
              <span>행운의 숫자</span>
              <strong>{day.luckyNumbers.join(", ")}</strong>
            </div>
          </div>

          <div className={styles.shareRow}>
            <button type="button" className={styles.cta} onClick={share}>
              {copied ? "링크를 복사했어요" : "친구에게 알려주기"}
            </button>
          </div>
          <p className={styles.disclaimer}>
            사주의 전통적인 해석을 바탕으로 재미로 보는 풀이예요. 중요한 결정은 운세보다 내 판단을 믿어 주세요.
          </p>
        </div>
      </section>

      <details className={styles.why}>
        <summary>왜 이렇게 나왔을까?</summary>
        <p>
          내 일간(태어난 날의 천간, 사주에서 &lsquo;나&rsquo;를 뜻하는 글자)은{" "}
          <b>
            {STEMS[dm]}({STEMS_HANJA[dm]})
          </b>
          {ELEMENTS[STEM_ELEMENT[dm]]}이고, 오늘의 일진은{" "}
          <b>
            {day.pillar.ko}({day.pillar.hanja})
          </b>
          일이에요. 오늘의 천간 {STEMS[day.pillar.stem]}({STEMS_HANJA[day.pillar.stem]})
          {ELEMENTS[STEM_ELEMENT[day.pillar.stem]]}은 나에게 {godRel}이고, 음양이 {samePolarity ? "같아서" : "달라서"}{" "}
          <b>{day.god.god}</b>에 해당해요. {day.god.meaning}
        </p>
        <p>
          또 내 일지(태어난 날의 지지) {BRANCHES[myDayBranch]}({BRANCHES_HANJA[myDayBranch]})와 오늘 일지{" "}
          {BRANCHES[day.pillar.branch]}({BRANCHES_HANJA[day.pillar.branch]})의 관계는 <b>{day.rel.label}</b>이라서 총운
          별점에{" "}
          {day.rel.adjust > 0 ? "하나를 더했어요" : day.rel.adjust < 0 ? "하나를 뺐어요" : "변화를 주지 않았어요"}.
        </p>
        <p>
          행운의 색과 숫자는 오늘 기운을 부드럽게 이어 주는 오행({ELEMENTS[day.luckyElement]}·
          {ELEMENTS_HANJA[day.luckyElement]})에 해당하는 전통적인 색과 숫자예요.
        </p>
      </details>

      <section className={styles.block} aria-labelledby="week-title">
        <h2 id="week-title" className={styles.blockTitle}>
          앞으로 일주일 흐름
        </h2>
        <ol className={styles.week}>
          {week.map((w, i) => (
            <li key={i} className={i === 0 ? styles.weekToday : undefined}>
              <span className={styles.weekDate}>{i === 0 ? "오늘" : dateLabel(w.date)}</span>
              <span className={styles.weekPillar}>{w.pillar.ko}일</span>
              <span className={styles.weekTitle}>
                {w.god.title}
                <small>{w.god.god}</small>
              </span>
              <Stars n={w.overall} label={`${dateLabel(w.date)} 총운`} />
            </li>
          ))}
        </ol>
      </section>

      <Link href="/fortune/saju" className={styles.nextCard}>
        <span>
          <small>내 사주 팔자 자세히 보기</small>
          <strong>
            나는 {me.stem}({me.hanja}){me.element} — {me.alias}
          </strong>
          <span>여덟 글자 표, 오행 분포, 성격 풀이를 볼 수 있어요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>
    </>
  );
}
