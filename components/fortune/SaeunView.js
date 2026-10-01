"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "./fortune.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import PERIOD_TEXTS from "@/lib/fortune/periodTexts.json";
import {
  saeunReading,
  currentSajuYear,
  STEMS,
  STEMS_HANJA,
  ELEMENTS,
  ELEMENTS_HANJA,
  STEM_ELEMENT,
} from "@/lib/fortune/saju";
import { useBirth } from "@/lib/fortune/birthStore";
import BirthForm from "./BirthForm";
import { Stars, shortDateLabel } from "./parts";

const PERIOD_GODS = TEXTS.tenGods.map((g, i) => ({ ...g, ...PERIOD_TEXTS.periodGods[i] }));
const PERIOD_RELATIONS = Object.fromEntries(PERIOD_TEXTS.periodRelations.map((r) => [r.key, r.text]));
const RELATION_ADJUST = Object.fromEntries(TEXTS.relations.map((r) => [r.key, r.adjust]));

function periodText(relationKey, period) {
  return PERIOD_RELATIONS[relationKey].replaceAll("{PERIOD}", period);
}

/** /fortune/saeun — 생년월일 입력 + 신년운세(세운 1년 + 열두 달 월운) */
export default function SaeunView() {
  const { saju } = useBirth();
  const thisYear = useMemo(() => currentSajuYear(), []);
  const [sajuYear, setSajuYear] = useState(thisYear + 1);

  function onSubmitted(input, remember) {
    track("saeun_result_viewed", { calendar: input.calendar, time: input.hour == null ? "unknown" : "known", remember });
  }

  return (
    <>
      <BirthForm submitLabel="신년운세 보기" onSubmitted={onSubmitted} />
      {saju && (
        <SaeunResult saju={saju} thisYear={thisYear} sajuYear={sajuYear} onPick={setSajuYear} />
      )}
    </>
  );
}

function SaeunResult({ saju, thisYear, sajuYear, onPick }) {
  const reading = useMemo(() => {
    try {
      return saeunReading(saju, sajuYear);
    } catch {
      return null;
    }
  }, [saju, sajuYear]);

  if (!reading) {
    return <p className={styles.note}>이 연도의 신년운세는 계산할 수 없어요.</p>;
  }

  const god = PERIOD_GODS[reading.year.tenGod];
  const stars = Math.min(5, Math.max(1, god.stars.overall + RELATION_ADJUST[reading.year.relation]));
  const relText = periodText(reading.year.relation, "이 해");

  return (
    <>
      <div className={styles.segment} role="radiogroup" aria-label="연도 선택">
        {[
          [thisYear, "올해"],
          [thisYear + 1, "내년"],
          [thisYear + 2, "내후년"],
        ].map(([y, label]) => (
          <button
            key={y}
            type="button"
            className={`${styles.segmentItem} ${sajuYear === y ? styles.segmentOn : ""}`}
            aria-pressed={sajuYear === y}
            onClick={() => onPick(y)}
          >
            {label} ({y})
          </button>
        ))}
      </div>

      <section className={styles.todayCard} aria-labelledby="saeun-title">
        <div className={styles.todayHead}>
          <p className={styles.todayDate}>
            {sajuYear}년 세운 · {reading.year.pillar.ko}({reading.year.pillar.hanja})년
          </p>
          <p className={styles.todayGod}>
            {god.god}({god.hanja})의 해 · {god.keyword}
          </p>
          <h2 id="saeun-title" className={styles.todayTitle}>
            {god.yearTitle}
          </h2>
          <div className={styles.overallStars}>
            <Stars n={stars} label="연간 총운" />
          </div>
        </div>
        <div className={styles.todayBody}>
          <p className={styles.todayText}>{god.yearText}</p>
          <p className={styles.relNote}>{relText}</p>

          <div className={styles.lucky}>
            <div>
              <span>한 해의 한마디</span>
              <strong>{god.advice[0]}</strong>
            </div>
            <div>
              <span>이 해의 색</span>
              <strong>
                <i className={`${styles.swatch} ${styles[`sw${reading.year.luckyElement}`]}`} aria-hidden="true" />
                {reading.year.luckyColor}
              </strong>
            </div>
            <div>
              <span>이 해의 숫자</span>
              <strong>{reading.year.luckyNumbers.join(", ")}</strong>
            </div>
          </div>

          <p className={styles.disclaimer}>
            사주의 전통적인 해석을 바탕으로 재미로 보는 한 해 흐름이에요. 중요한 결정은 운세보다 내
            판단을 믿어 주세요.
          </p>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="months-title">
        <h2 id="months-title" className={styles.blockTitle}>
          열두 달 흐름
        </h2>
        <p className={styles.blockLead}>
          절기가 바뀌는 시각을 기준으로 한 해를 열두 달로 나눴어요. 달력 월(1일 시작)과는 시작일이
          며칠씩 다를 수 있어요.
        </p>
        <ol className={styles.monthList}>
          {reading.months.map((m, i) => {
            const mg = PERIOD_GODS[m.tenGod];
            const mStars = Math.min(5, Math.max(1, mg.stars.overall + RELATION_ADJUST[m.relation]));
            const relText = periodText(m.relation, "이 달");
            const crossesYear = m.start.year !== sajuYear;
            const dateText = crossesYear ? `${m.start.year}년 ${shortDateLabel(m.start)}` : shortDateLabel(m.start);
            return (
              <li key={i}>
                <details className={styles.monthRow}>
                  <summary>
                    <span className={styles.weekDate}>{dateText}~</span>
                    <span className={styles.weekPillar}>{m.pillar.ko}월</span>
                    <span className={styles.weekTitle}>
                      {mg.monthNote}
                      <small>
                        {mg.god}({mg.keyword})
                      </small>
                    </span>
                    <Stars n={mStars} label={`${dateText} 시작 달 총운`} />
                  </summary>
                  <div className={styles.monthRowBody}>
                    {crossesYear && (
                      <p className={styles.note} style={{ margin: "0 0 8px" }}>
                        {sajuYear}년 세운은 입춘(다음 해 2월 초)부터 그다음 해 소한(1월 초)까지라서,
                        마지막 달인 이 달은 {m.start.year}년에 속해요.
                      </p>
                    )}
                    <p>
                      {m.pillar.ko}({m.pillar.hanja})월은 {ELEMENTS[STEM_ELEMENT[m.pillar.stem]]}(
                      {ELEMENTS_HANJA[STEM_ELEMENT[m.pillar.stem]]}) 기운의 달이고, 내 일간과는{" "}
                      <b>
                        {mg.god}({mg.hanja})
                      </b>{" "}
                      관계예요. {mg.meaning}
                    </p>
                    <p>{relText}</p>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>

      <p className={styles.small} style={{ marginTop: 10 }}>
        내 일간({STEMS[saju.dayMaster]}
        {STEMS_HANJA[saju.dayMaster]})과 {sajuYear}년 세운·월운 천간의 오행·음양 관계(십신)로 흐름을
        풀었어요. 계산 기준은 <Link href="/fortune/saju">내 사주</Link> 페이지에서 볼 수 있어요.
      </p>

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
  );
}
