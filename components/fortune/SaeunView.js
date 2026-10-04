"use client";

import { useEffect, useMemo, useState } from "react";
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
import { keepResult, restoreOnBack } from "@/lib/backRestore";
import { buildSaeunCard } from "@/lib/fortune/fortuneCard";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { encodeSaeunLink, decodeSaeunLink } from "@/lib/fortune/resultLink";
import { SITE } from "@/lib/site";
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
  // 뒤로 가기로 돌아오면 고르던 연도를 그대로 보여 줍니다(탭 메모리에만 둠).
  const [sajuYear, setSajuYearState] = useState(() => restoreOnBack("saeun-year") ?? thisYear + 1);
  const setSajuYear = (y) => {
    setSajuYearState(y);
    keepResult("saeun-year", y);
  };
  const [shared, setShared] = useState(null);

  // 주소 끝에 친구가 보낸 결과가 담겨 있으면, 생년월일을 넣지 않아도 그 결과부터 보여 줍니다.
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
  }

  return (
    <>
      {shared && (
        <>
          <p className={styles.sharedNote}>
            친구가 보낸 <b>{shared.sajuYear}년 신년운세</b>예요. 아래에서 내 신년운세도 바로 볼 수 있어요.
          </p>
          <SaeunResult saju={shared.saju} thisYear={thisYear} sajuYear={shared.sajuYear} snapshot />
          <p className={styles.sectionDivider}>내 신년운세 보기</p>
        </>
      )}
      <BirthForm submitLabel="신년운세 보기" onSubmitted={onSubmitted} />
      {saju && <SaeunResult saju={saju} thisYear={thisYear} sajuYear={sajuYear} onPick={setSajuYear} />}
    </>
  );
}

/** snapshot: 친구가 보낸 링크로 보는 결과 — 연도 버튼과 공유 버튼 없이 결과만 보여 줍니다. */
function SaeunResult({ saju, thisYear, sajuYear, onPick, snapshot = false }) {
  const [hint, setHint] = useState("");
  const [card, setCard] = useState(null);
  const reading = useMemo(() => {
    try {
      return saeunReading(saju, sajuYear);
    } catch {
      return null;
    }
  }, [saju, sajuYear]);

  // 결과가 바뀔 때마다 공유용 이미지 카드를 미리 그려 둡니다(버튼을 누른 뒤에 그리면 기기가
  // "사용자가 누른 동작"으로 보지 않아 공유 창이 막히는 경우가 있어서예요).
  const cardKey = `${saju.dayMaster}-${saju.pillars.day.branch}-${sajuYear}`;
  useEffect(() => {
    if (snapshot || !reading) return;
    let cancelled = false;
    setCard(null);
    const g = PERIOD_GODS[reading.year.tenGod];
    buildSaeunCard({
      yearText: `${sajuYear}년 ${reading.year.pillar.ko}(${reading.year.pillar.hanja})년`,
      godLine: `${g.god}(${g.hanja})의 해 · ${g.keyword}`,
      title: g.yearTitle,
      stars: Math.min(5, Math.max(1, g.stars.overall + RELATION_ADJUST[reading.year.relation])),
      summary: g.yearText,
      advice: g.advice[0],
      luckyElement: reading.year.luckyElement,
      luckyColor: reading.year.luckyColor,
      luckyNumbers: reading.year.luckyNumbers.join(", "),
      luckyDirection: reading.year.luckyDirection,
      months: reading.months.map((m) => {
        const mg = PERIOD_GODS[m.tenGod];
        return {
          date: m.start.year !== sajuYear ? `${m.start.year}년 ${shortDateLabel(m.start)}` : shortDateLabel(m.start),
          god: mg.god,
          stars: Math.min(5, Math.max(1, mg.stars.overall + RELATION_ADJUST[m.relation])),
        };
      }),
    })
      .then((img) => !cancelled && setCard(img))
      .catch(() => {
        /* 카드를 못 그리면 글로만 공유해요 */
      });
    return () => {
      cancelled = true;
    };
    // reading은 saju와 sajuYear가 같으면 내용도 같습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, snapshot]);

  // 링크에 결과를 담아서, 받은 사람이 생년월일을 넣지 않아도 같은 결과를 보게 합니다.
  const url = `${SITE.url}/fortune/saeun${encodeSaeunLink(sajuYear, saju)}`;

  async function share() {
    const g = reading ? PERIOD_GODS[reading.year.tenGod] : null;
    if (!g) return;
    const shortText = `${sajuYear}년 나의 신년운세는 "${g.yearTitle}" · ${g.god}(${g.keyword})`;
    const fullText = [
      `${sajuYear}년 나의 신년운세는 "${g.yearTitle}" (${g.god}·${g.keyword})`,
      g.yearText,
      `· 한 해의 한마디 ${g.advice[0]}`,
      `· 이 해의 색 ${reading.year.luckyColor} · 숫자 ${reading.year.luckyNumbers.join(", ")} · 방향 ${reading.year.luckyDirection}`,
      "— 재미로봄 신년운세",
    ].join("\n");
    setHint("");
    try {
      const r = await shareResult({
        blob: card?.blob,
        fileName: "jaemirobom-saeun.png",
        title: `재미로봄 ${sajuYear}년 신년운세`,
        shortText,
        fullText,
        url,
      });
      track("saeun_shared", { mode: r.mode });
      if (r.mode === "files") {
        setHint(
          r.linkCopied
            ? "링크도 복사해 뒀어요. 사진만 전달됐으면 대화창에 붙여넣어 주세요."
            : "사진만 전달됐으면 아래 '링크 복사'를 눌러 주소도 함께 보내 주세요."
        );
      } else if (r.mode === "copied") {
        setHint("공유 글과 링크를 복사했어요. 붙여넣어 보내 주세요.");
      }
    } catch (e) {
      if (e.name !== "AbortError") setHint("공유하지 못했어요. 아래 '링크 복사'를 이용해 주세요.");
    }
  }

  async function copyLink() {
    setHint((await copyText(url)) ? "링크를 복사했어요." : "링크를 복사하지 못했어요.");
  }

  if (!reading) {
    return <p className={styles.note}>이 연도의 신년운세는 계산할 수 없어요.</p>;
  }

  const god = PERIOD_GODS[reading.year.tenGod];
  const stars = Math.min(5, Math.max(1, god.stars.overall + RELATION_ADJUST[reading.year.relation]));
  const relText = periodText(reading.year.relation, "이 해");

  return (
    <>
      {!snapshot && (
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
      )}

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
            <div>
              <span>이 해의 방향</span>
              <strong>{reading.year.luckyDirection}</strong>
            </div>
          </div>

          {!snapshot && (
            <>
              <div className={styles.shareRow}>
                <button type="button" className={styles.cta} onClick={share}>
                  친구에게 알려주기
                </button>
                <button type="button" className={styles.ghostSm} onClick={copyLink}>
                  링크 복사
                </button>
              </div>
              {hint && <p className={styles.shareHint}>{hint}</p>}
            </>
          )}
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
                    <div className={styles.monthRowTop}>
                      <span className={styles.monthRowDate}>
                        {dateText}~<small>{m.pillar.ko}월</small>
                      </span>
                      <Stars n={mStars} label={`${dateText} 시작 달 총운`} />
                    </div>
                    <p className={styles.monthRowDesc}>
                      <b>
                        {mg.god}({mg.keyword})
                      </b>{" "}
                      {mg.monthNote}
                    </p>
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
