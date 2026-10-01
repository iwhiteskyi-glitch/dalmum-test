"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import styles from "@/components/fortune/fortune.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import GUNGHAP_TEXTS from "@/lib/fortune/gunghapTexts.json";
import {
  gunghapReading,
  gunghapScore,
  STEMS,
  STEMS_HANJA,
  ELEMENTS,
  ELEMENTS_HANJA,
  STEM_ELEMENT,
} from "@/lib/fortune/saju";
import { Stars } from "@/components/fortune/parts";
import GunghapForm from "./GunghapForm";

const CATEGORIES = GUNGHAP_TEXTS.categories;
const DAY_RELATIONS = Object.fromEntries(GUNGHAP_TEXTS.dayRelations.map((r) => [r.key, r.text]));
const AREAS = [
  ["love", "연애"],
  ["friend", "우정"],
  ["work", "업무"],
];

/** 오행 두 개 사이의 관계: 0 같음 1 A가B를생함 2 A가B를극함 3 B가A를극함 4 B가A를생함 */
function elementRel(elA, elB) {
  return (elB - elA + 5) % 5;
}

function compareText(topA, topB) {
  const nameA = `${ELEMENTS[topA]}(${ELEMENTS_HANJA[topA]})`;
  const nameB = `${ELEMENTS[topB]}(${ELEMENTS_HANJA[topB]})`;
  if (topA === topB) {
    return `두 사람 모두 ${nameA} 기운이 가장 두드러져요. 비슷한 성향이 많아서 통하는 부분이 클 거예요.`;
  }
  const rel = elementRel(topA, topB);
  if (rel === 1) return `당신의 ${nameA} 기운이 상대의 ${nameB} 기운을 북돋아 주는 조합이에요. 당신이 상대를 챙겨주는 쪽에 가까워요.`;
  if (rel === 4) return `상대의 ${nameB} 기운이 당신의 ${nameA} 기운을 북돋아 주는 조합이에요. 상대가 당신을 채워주는 쪽에 가까워요.`;
  if (rel === 2) return `당신의 ${nameA} 기운과 상대의 ${nameB} 기운은 서로 다른 속도로 부딪히는 사이예요. 맞춰가는 과정이 필요해요.`;
  return `상대의 ${nameB} 기운과 당신의 ${nameA} 기운은 서로 다른 속도로 부딪히는 사이예요. 맞춰가는 과정이 필요해요.`;
}

export default function GunghapView() {
  const [result, setResult] = useState(null);

  function onSubmitted(meSaju, partnerSaju, gender, areas) {
    const reading = gunghapReading(meSaju, partnerSaju);
    setResult({ me: meSaju, partner: partnerSaju, reading, gender, areas });
    track("gunghap_result_viewed", {
      meTime: meSaju.input.hour == null ? "unknown" : "known",
      partnerTime: partnerSaju.input.hour == null ? "unknown" : "known",
      sameGender: gender.me === gender.partner,
      areas: Object.entries(areas).filter(([, v]) => v).map(([k]) => k).join(","),
    });
    requestAnimationFrame(() => document.getElementById("gunghap-result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <>
      <GunghapForm onSubmitted={onSubmitted} />
      <div id="gunghap-result" className={styles.result} aria-live="polite">
        {result && <GunghapResult {...result} />}
      </div>
    </>
  );
}

function GunghapResult({ me, partner, reading, gender, areas }) {
  const cat = CATEGORIES[reading.category];
  const score = gunghapScore(reading);
  const stars = Math.min(5, Math.max(1, Math.round(score / 20)));
  const godAtoB = TEXTS.tenGods[reading.godAtoB];
  const godBtoA = TEXTS.tenGods[reading.godBtoA];
  const dayText = DAY_RELATIONS[reading.dayRelation];

  return (
    <>
      <section className={styles.todayCard} aria-labelledby="gunghap-title">
        <div className={styles.todayHead}>
          <p className={styles.todayDate}>
            나({gender.me}) {STEMS[me.dayMaster]}({STEMS_HANJA[me.dayMaster]}) × 상대({gender.partner}){" "}
            {STEMS[partner.dayMaster]}({STEMS_HANJA[partner.dayMaster]})
          </p>
          <h2 id="gunghap-title" className={styles.todayTitle}>
            {cat.title}
          </h2>
          <div className={styles.scoreBig}>
            <strong>
              {score}
              <small>점</small>
            </strong>
            <Stars n={stars} label="종합 궁합" />
          </div>
        </div>
        <div className={styles.todayBody}>
          <p className={styles.todayText}>{cat.summary}</p>
          <p className={styles.relNote}>
            <strong>내가 보는 상대 · {godAtoB.god}({godAtoB.hanja})</strong>
            {godAtoB.meaning}
          </p>
          <p className={styles.relNote}>
            <strong>상대가 보는 나 · {godBtoA.god}({godBtoA.hanja})</strong>
            {godBtoA.meaning}
          </p>
          <p className={styles.relNote}>
            <strong>일지 관계</strong>
            {dayText}
          </p>
          <p className={styles.disclaimer}>
            사주의 전통적인 개념을 바탕으로 이 사이트가 만든 재미용 참고 점수예요. 관계의 좋고
            나쁨을 판정하는 결과가 아니니, 재미로만 봐 주세요.
          </p>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="area-title">
        <h2 id="area-title" className={styles.blockTitle}>
          영역별 궁합
        </h2>
        {AREAS.filter(([key]) => areas[key]).map(([key, label]) => (
          <div key={key} className={styles.areaBlock}>
            <span className={styles.areaLabel}>{label}</span>
            <p className={styles.areaText}>{cat[key]}</p>
          </div>
        ))}
      </section>

      <section className={styles.block} aria-labelledby="compare-title">
        <h2 id="compare-title" className={styles.blockTitle}>
          서로 다른 점 · 비슷한 점
        </h2>
        <p className={styles.blockLead}>{compareText(reading.topElementA, reading.topElementB)}</p>
        <div style={{ marginTop: 14 }}>
          {ELEMENTS.map((el, i) => {
            const total = Math.max(...reading.elementsA, ...reading.elementsB, 1);
            return (
              <div key={el} className={styles.compareEl}>
                <p className={styles.compareElName}>
                  {el}({ELEMENTS_HANJA[i]})
                </p>
                <div className={styles.compareElRow}>
                  <span className={styles.compareElWho}>나</span>
                  <span className={styles.compareElBar}>
                    <span
                      className={`${styles.compareElFill} ${styles[`sw${i}`]}`}
                      style={{ width: `${(reading.elementsA[i] / total) * 100}%` }}
                    />
                  </span>
                  <span className={styles.compareElCount}>{reading.elementsA[i]}</span>
                </div>
                <div className={styles.compareElRow}>
                  <span className={styles.compareElWho}>상대</span>
                  <span className={styles.compareElBar}>
                    <span
                      className={`${styles.compareElFill} ${styles[`sw${i}`]}`}
                      style={{ width: `${(reading.elementsB[i] / total) * 100}%` }}
                    />
                  </span>
                  <span className={styles.compareElCount}>{reading.elementsB[i]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
