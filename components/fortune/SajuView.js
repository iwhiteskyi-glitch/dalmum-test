"use client";

import { useRef } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "./fortune.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import {
  STEMS,
  STEMS_HANJA,
  BRANCHES,
  BRANCHES_HANJA,
  ELEMENTS,
  ELEMENTS_HANJA,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
} from "@/lib/fortune/saju";
import { useBirth } from "@/lib/fortune/birthStore";
import BirthForm from "./BirthForm";
import { Char, birthLabel } from "./parts";

/** /fortune/saju — 생년월일 입력 + 내 사주 팔자 표·오행 분포·일간 풀이 */
export default function SajuView() {
  const { saju } = useBirth();
  const resultRef = useRef(null);

  function onSubmitted(input, remember) {
    track("saju_result_viewed", { calendar: input.calendar, time: input.hour == null ? "unknown" : "known", remember });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <>
      <BirthForm submitLabel="내 사주 보기" onSubmitted={onSubmitted} />
      <div ref={resultRef} className={styles.result} aria-live="polite">
        {saju && <SajuResult saju={saju} />}
      </div>
    </>
  );
}

function SajuResult({ saju }) {
  const me = TEXTS.ilgan[saju.dayMaster];
  const pillarCols = [
    ["시주", saju.pillars.hour, "태어난 시간"],
    ["일주", saju.pillars.day, "태어난 날 · 나"],
    ["월주", saju.pillars.month, "태어난 달"],
    ["연주", saju.pillars.year, "태어난 해"],
  ];
  const maxEl = Math.max(...saju.elements);
  const total = saju.elements.reduce((a, b) => a + b, 0);
  const l = saju.lunar;
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <>
      <section className={styles.block} aria-labelledby="saju-title">
        <h2 id="saju-title" className={styles.blockTitle}>
          내 사주 팔자
        </h2>
        <p className={styles.blockLead}>
          {birthLabel(saju)} · {saju.animal}띠
        </p>
        <div className={styles.pillars}>
          {pillarCols.map(([name, p, sub]) => (
            <div key={name} className={`${styles.pillar} ${name === "일주" ? styles.pillarMe : ""}`}>
              <span className={styles.pillarName}>
                {name}
                <small>{sub}</small>
              </span>
              {p ? (
                <>
                  <Char hanja={STEMS_HANJA[p.stem]} ko={STEMS[p.stem]} element={STEM_ELEMENT[p.stem]} />
                  <Char hanja={BRANCHES_HANJA[p.branch]} ko={BRANCHES[p.branch]} element={BRANCH_ELEMENT[p.branch]} />
                </>
              ) : (
                <span className={styles.pillarEmpty}>시간을 알면 볼 수 있어요</span>
              )}
            </div>
          ))}
        </div>
        <p className={styles.pillarRead}>
          {[saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.hour]
            .filter(Boolean)
            .map((p) => `${p.ko}(${p.hanja})`)
            .join(" · ")}
        </p>
        <ul className={styles.calcInfo}>
          {saju.input.calendar === "solar" && l && (
            <li>
              음력으로는 {l.year}년 {l.leap ? "윤" : ""}
              {l.month}월 {l.day}일이에요.
            </li>
          )}
          {saju.local && (
            <li>
              계산에 쓴 시간은 {saju.local.hour}시 {pad(saju.local.minute)}분이에요.{" "}
              {saju.local.correction
                ? `그때 시계 시각에서 ${Math.abs(saju.local.correction)}분을 ${saju.local.correction < 0 ? "빼" : "더해"} 동경 127.5도 지역 시간으로 맞췄어요.`
                : "그 시절 표준시가 동경 127.5도 기준이라 따로 보정하지 않았어요."}
            </li>
          )}
          <li>띠와 연주는 설날이 아니라 입춘, 월주는 그달의 절기가 시작되는 시각을 기준으로 정했어요.</li>
        </ul>
        {saju.notes.map((n) => (
          <p key={n} className={styles.note}>
            {n}
          </p>
        ))}

        <h3 className={styles.subTitle}>오행 분포</h3>
        <ul className={styles.elements}>
          {ELEMENTS.map((el, i) => {
            const t = TEXTS.elements[i];
            const c = saju.elements[i];
            const comment = c === 0 ? t.few : c === maxEl && c >= 3 ? t.many : null;
            return (
              <li key={el}>
                <span className={styles.elName}>
                  {el}({ELEMENTS_HANJA[i]})
                </span>
                <span className={styles.elBar}>
                  <span className={`${styles.elFill} ${styles[`sw${i}`]}`} style={{ width: `${(c / total) * 100}%` }} />
                </span>
                <span className={styles.elCount}>{c}</span>
                {comment && <span className={styles.elComment}>{comment}</span>}
              </li>
            );
          })}
        </ul>
        <p className={styles.small}>
          여덟 글자(시간을 모르면 여섯 글자)가 각각 어떤 오행인지 센 숫자예요. 많고 적음은 성향을 보는 재미로만 봐
          주세요.
        </p>
      </section>

      <section className={styles.block} aria-labelledby="me-title">
        <p className={styles.blockKicker}>나를 나타내는 글자(일간)</p>
        <h2 id="me-title" className={styles.blockTitle}>
          {me.stem}({me.hanja}){me.element} — {me.alias}
        </h2>
        <ul className={styles.keywords}>
          {me.keywords.map((k) => (
            <li key={k}>#{k}</li>
          ))}
        </ul>
        <p className={styles.para}>{me.summary}</p>
        <div className={styles.twoCol}>
          <div>
            <h3>이런 점이 빛나요</h3>
            <ul>
              {me.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>이런 점은 살펴봐요</h3>
            <ul>
              {me.cautions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className={styles.tip}>{me.tip}</p>
        <p className={styles.disclaimer}>
          사주의 전통적인 해석을 바탕으로 재미로 보는 풀이예요. 사람의 성격과 앞날은 여덟 글자보다 훨씬 다양해요.
        </p>
      </section>

      <Link href="/fortune" className={styles.nextCard}>
        <span>
          <small>매일 바뀌어요</small>
          <strong>오늘 나의 운세 보기</strong>
          <span>
            오늘 일진과 내 일간({me.stem}
            {me.element})의 관계로 하루 흐름을 풀어 드려요
          </span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>
    </>
  );
}
