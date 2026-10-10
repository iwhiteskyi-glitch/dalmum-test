"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./fortune.module.css";
import { koreaToday, STEMS, STEMS_HANJA, ELEMENTS, STEM_ELEMENT, ANIMALS } from "@/lib/fortune/saju";
import { buildTti, buildYearRows, sameDate, TTI_AREAS } from "@/lib/fortune/ttiView";
import { Stars, dateLabel } from "./parts";
import { eulReul } from "@/lib/korean";

const REL_WORDS = [
  "띠와 같은 오행",
  "띠가 낳는(생하는) 오행",
  "띠가 이기는(극하는) 오행",
  "띠를 이기는(극하는) 오행",
  "띠를 낳는(생하는) 오행",
];

const TWIN = { 1: 7, 7: 1, 4: 10, 10: 4 };

const REL_SENTENCE = {
  same: "내 띠와 같은 글자예요.",
  six: "내 띠와 육합(六合)을 이뤄요.",
  three: "내 띠와 삼합(三合)을 이뤄요.",
  clash: "내 띠와 충(沖)을 이뤄요.",
  none: "내 띠와는 이 풀이에서 살펴보는 합이나 충이 없어요.",
};

/**
 * 한 띠의 오늘 운세. 페이지는 서버에서 그날 날짜로 미리 그려 두고(검색엔진도 읽을 수 있게),
 * 방문한 순간 한국 날짜가 바뀌어 있으면 브라우저에서 다시 계산해요.
 */
export default function TtiToday({ branch, initialDate }) {
  const [date, setDate] = useState(initialDate);
  useEffect(() => {
    const t = koreaToday();
    if (!sameDate(t, initialDate)) setDate(t);
  }, [initialDate]);

  const d = buildTti(branch, date);
  const rows = buildYearRows(branch, date);
  const me = d.info.bongiStem;
  const rel = (STEM_ELEMENT[d.pillar.stem] - STEM_ELEMENT[me] + 5) % 5;
  // 소·양띠(己), 용·개띠(戊)는 품은 천간이 같아서, 띠끼리의 관계까지 같은 날엔 풀이가 똑같아요.
  const twin = TWIN[branch];
  const sameAsTwin = twin != null && buildTti(twin, date).relation === d.relation;

  return (
    <>
      <section className={styles.todayCard} aria-labelledby="tti-title">
        <div className={styles.todayHead}>
          <p className={styles.todayDate}>
            {date.year}년 {dateLabel(date)} · 일진 {d.pillar.ko}({d.pillar.hanja})일
          </p>
          <p className={styles.todayGod}>
            {d.info.name} · {d.godName}의 날 · {d.god.keyword}
          </p>
          <h2 id="tti-title" className={styles.todayTitle}>
            {d.god.title}
          </h2>
          <div className={styles.overallStars}>
            <Stars n={d.overall} label="총운" />
          </div>
        </div>
        <div className={styles.todayBody}>
          <p className={styles.todayText}>{d.god.overall}</p>
          <p className={styles.relNote}>
            <strong>
              {d.rel.label} · {d.rel.title}
            </strong>
            {d.rel.text}
          </p>

          <dl className={styles.areas}>
            {TTI_AREAS.map(([k, label]) => (
              <div key={k} className={styles.area}>
                <dt>
                  {label} <Stars n={d.god.stars[k]} label={label} />
                </dt>
                <dd>{d.god[k]}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.lucky}>
            <div>
              <span>오늘의 한마디</span>
              <strong>{d.advice}</strong>
            </div>
            <div>
              <span>행운의 색</span>
              <strong>
                <i className={`${styles.swatch} ${styles[`sw${d.luckyElement}`]}`} aria-hidden="true" />
                {d.luckyColor}
              </strong>
            </div>
            <div>
              <span>행운의 숫자</span>
              <strong>{d.luckyNumbers.join(", ")}</strong>
            </div>
            <div>
              <span>행운의 방향</span>
              <strong>{d.luckyDirection}</strong>
            </div>
          </div>
          <p className={styles.disclaimer}>
            띠 하나로 보는 간단한 풀이라 같은 띠라면 모두 같은 결과가 나와요. 재미로 가볍게 봐 주세요.
          </p>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="tti-years">
        <h2 id="tti-years" className={styles.blockTitle}>
          {d.info.name} 년생별 한마디
        </h2>
        <p className={styles.blockLead}>
          같은 {d.info.name}라도 태어난 해의 천간(갑·을·병…)은 달라요. 그해 천간과 오늘 천간의 관계로 한마디씩
          골랐어요. 위 풀이는 띠 글자 기준, 이 한마디는 태어난 해 기준이라 흐름이 서로 다를 수 있어요.
        </p>
        <ul className={styles.monthList}>
          {rows.map((r) => (
            <li key={r.year} className={styles.monthRow}>
              <div style={{ padding: "12px" }}>
                <div className={styles.monthRowTop}>
                  <span className={styles.monthRowDate}>
                    {String(r.year).slice(2)}년생
                    <small>
                      {r.year}년 {r.pillar.ko}({r.pillar.hanja})
                    </small>
                  </span>
                  <span className={styles.small}>#{r.keyword}</span>
                </div>
                <p className={styles.monthRowDesc}>{r.advice}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          띠는 설날이 아니라 입춘(양력 2월 4일 무렵)에 바뀌어요. 1월이나 2월 초에 태어났다면 앞 해의 띠일 수 있으니{" "}
          <Link href="/reads/zodiac-ipchun">띠는 입춘에 바뀐다</Link> 글을 확인해 보세요.
        </p>
      </section>

      <details className={styles.why}>
        <summary>왜 이렇게 나왔을까?</summary>
        <p>
          {d.info.name}의 글자는 {d.info.ko}({d.info.hanja})이고, 이 글자가 품은 대표 천간(본기)은{" "}
          <b>
            {STEMS[me]}({STEMS_HANJA[me]})
          </b>
          , 오행으로는 <b>{ELEMENTS[STEM_ELEMENT[me]]}</b>에 속해요. 띠별 운세에서는 이 천간을 &lsquo;나&rsquo;로 봐요.
        </p>
        <p>
          오늘 일진 {d.pillar.ko}({d.pillar.hanja})의 천간은{" "}
          <b>
            {STEMS[d.pillar.stem]}({STEMS_HANJA[d.pillar.stem]})
          </b>
          , 오행으로는 <b>{ELEMENTS[STEM_ELEMENT[d.pillar.stem]]}</b>에 속해요. {REL_WORDS[rel]}이고 음양이 {me % 2 === d.pillar.stem % 2 ? "같아요" : "달라요"}. 그래서 오늘은{" "}
          <b>{d.godName}</b>의 날이에요.
        </p>
        <p>
          오늘 일지는 {d.todayAnimal}
          {eulReul(d.todayAnimal)} 뜻하는 글자라, {REL_SENTENCE[d.relation]}
          {d.rel.adjust > 0 ? " 그래서 총운 별점을 하나 올렸어요." : d.rel.adjust < 0 ? " 그래서 총운 별점을 하나 내렸어요." : ""}
        </p>
        {sameAsTwin && (
          <p>
            오늘은 {ANIMALS[twin]}띠와 풀이가 같아요. 두 띠의 글자가 같은 천간({STEMS[me]})을 품고 있고, 오늘 일지와의
            관계도 같기 때문이에요.
          </p>
        )}
        <p>
          띠 글자 속 대표 기운을 &lsquo;나&rsquo;로 삼아 오늘의 기운과 견준, 재미로 보는 간이 풀이예요. 사주에서
          &lsquo;나&rsquo;는 원래 태어난 날의 천간(일간)이라서, 생년월일로 보는 풀이와는 다를 수 있어요.
        </p>
        <p>
          생년월일을 넣으면 태어난 날의 글자(일간)로 나만의 풀이를 볼 수 있어요.{" "}
          <Link href="/fortune">오늘의 운세 보기</Link>
        </p>
      </details>
    </>
  );
}
