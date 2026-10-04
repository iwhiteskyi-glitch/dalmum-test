"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "./fortune.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import PERIOD_TEXTS from "@/lib/fortune/periodTexts.json";
import { SITE } from "@/lib/site";
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
import { buildTodayCard } from "@/lib/fortune/fortuneCard";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { encodeFortuneLink, decodeFortuneLink } from "@/lib/fortune/resultLink";
import { eunNeun } from "@/lib/korean";
import BirthForm from "./BirthForm";
import { Stars, dateLabel, range, hourRangeLabel } from "./parts";

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

/** 열두 시진마다 십신·별점·한 줄 설명을 붙입니다. */
function buildHours(saju, date) {
  return hourFlow(saju, date).map((h) => {
    const god = TEXTS.tenGods[h.tenGod];
    const stars = Math.min(5, Math.max(1, god.stars.overall + RELATIONS[h.relation].adjust));
    return { ...h, god, stars, note: HOUR_NOTES[h.tenGod] };
  });
}

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
  const [shared, setShared] = useState(null);
  const resultRef = useRef(null);

  // "오늘"은 방문한 순간의 한국 날짜로 정합니다. 주소 끝에 친구가 보낸 결과가 담겨 있으면,
  // 생년월일을 넣지 않아도 그 결과부터 보여 줍니다.
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
      />
      <div ref={resultRef} className={styles.result} aria-live="polite">
        {saju && today && <TodayResult saju={saju} today={today} />}
      </div>
    </>
  );
}

/** snapshot: 친구가 보낸 링크로 보는 결과 — 결과 카드만 보여 주고 공유·내 사주 안내는 숨깁니다. */
function TodayResult({ saju, today, snapshot = false }) {
  const [hint, setHint] = useState("");
  const [card, setCard] = useState(null);
  // 오늘/내일 전환. 아래 일주일 흐름은 전환과 관계없이 늘 오늘부터 보여 줍니다.
  const [tomorrow, setTomorrow] = useState(false);
  const date = tomorrow ? addDays(today, 1) : today;
  const dayLabel = tomorrow ? "내일" : "오늘";
  // 풀이 문장은 "오늘"을 기준으로 쓰여 있어요. 내일을 볼 때는 말만 바꿔서 보여 줍니다
  // (오늘은→내일은, 오늘의→내일의처럼 그대로 이어져요).
  const asDay = (text) => (tomorrow ? text.replaceAll("오늘", "내일") : text);
  const day = buildDay(saju, date);
  const hours = buildHours(saju, date);
  // 추천 시간은 깨어 있는 시간대(묘시 아침 5:30 ~ 해시 밤 11:30) 안에서 골라요. 새벽 2시가
  // "숨 고르는 시간"으로 나오면 쓸모가 없으니까요. 별점이 같을 때는 사람들이 주로 움직이는
  // 시간(사시~술시, 오전 9:30~밤 9:30)을 먼저, 그다음엔 이른 시간을 골라 늘 같은 결과가
  // 나오게 합니다.
  const awake = hours.filter((h) => h.branch >= 3);
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

  // 결과가 바뀔 때마다 공유용 이미지 카드를 미리 그려 둡니다. 공유 버튼을 누른 뒤에 그리면
  // 기기에서 "사용자가 누른 동작"으로 보지 않아 공유 창이 막히는 경우가 있어서예요.
  const cardKey = `${saju.dayMaster}-${saju.pillars.day.branch}-${date.year}-${date.month}-${date.day}`;
  useEffect(() => {
    if (snapshot) return;
    let cancelled = false;
    setCard(null);
    buildTodayCard({
      dayLabel,
      dateText: `${date.year}년 ${dateLabel(date)} · ${day.pillar.ko}(${day.pillar.hanja})일`,
      godLine: `${day.god.god}(${day.god.hanja})의 날 · ${day.god.keyword}`,
      title: day.god.title,
      stars: day.overall,
      summary: asDay(day.god.overall),
      advice: asDay(day.advice),
      areas: AREAS.map(([k, label]) => ({ label, stars: day.god.stars[k], text: asDay(day.god[k]) })),
      luckyElement: day.luckyElement,
      luckyColor: day.luckyColor,
      luckyNumbers: day.luckyNumbers.join(", "),
      luckyDirection: day.luckyDirection,
      hours: hourPicks.map(([key, h]) => ({
        label: HOUR_FRAMES[key].label,
        time: hourRangeLabel(h.startMin, h.endMin),
        sub: `${BRANCHES[h.branch]}시 · ${h.god.god}`,
      })),
    })
      .then((img) => !cancelled && setCard(img))
      .catch(() => {
        /* 카드를 못 그리면 글로만 공유해요 */
      });
    return () => {
      cancelled = true;
    };
    // day·week는 saju와 today가 같으면 내용도 같습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, snapshot]);

  // 링크에 결과를 담아서, 받은 사람이 생년월일을 넣지 않아도 같은 결과를 보게 합니다.
  const url = `${SITE.url}/fortune${encodeFortuneLink(date, saju)}`;

  async function share() {
    const shortText = `${dayLabel} 나의 운세는 "${day.god.title}" · ${day.god.god}(${day.god.keyword})\n${asDay(day.advice)}`;
    const fullText = [
      `${dayLabel} 나의 운세는 "${day.god.title}" (${day.god.god}·${day.god.keyword})`,
      asDay(day.god.overall),
      `· ${dayLabel}의 한마디 ${asDay(day.advice)}`,
      `· 행운의 색 ${day.luckyColor} · 숫자 ${day.luckyNumbers.join(", ")} · 방향 ${day.luckyDirection}`,
      `— 재미로봄 ${dayLabel}의 운세`,
    ].join("\n");
    setHint("");
    try {
      const r = await shareResult({
        blob: card?.blob,
        fileName: "jaemirobom-today-fortune.png",
        title: `재미로봄 ${dayLabel}의 운세`,
        shortText,
        fullText,
        url,
      });
      track("fortune_shared", { mode: r.mode });
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

  return (
    <>
      {!snapshot && (
        <div className={styles.dayTabs} role="group" aria-label="보는 날 고르기">
          {[
            ["오늘", false],
            ["내일", true],
          ].map(([label, value]) => (
            <button
              key={label}
              type="button"
              className={`${styles.dayTab} ${tomorrow === value ? styles.dayTabOn : ""}`}
              aria-pressed={tomorrow === value}
              onClick={() => {
                setTomorrow(value);
                setHint("");
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <section className={styles.todayCard} aria-labelledby="today-title">
        <div className={styles.todayHead}>
          <p className={styles.todayDate}>
            {date.year}년 {dateLabel(date)} · {dayLabel}의 일진 {day.pillar.ko}({day.pillar.hanja})일
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
          <p className={styles.todayText}>{asDay(day.god.overall)}</p>
          <p className={styles.relNote}>
            <strong>
              {day.rel.label} · {day.rel.title}
            </strong>
            {asDay(day.rel.text)}
          </p>

          <dl className={styles.areas}>
            {AREAS.map(([k, label]) => (
              <div key={k} className={styles.area}>
                <dt>
                  {label} <Stars n={day.god.stars[k]} label={label} />
                </dt>
                <dd>{asDay(day.god[k])}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.lucky}>
            <div>
              <span>{dayLabel}의 한마디</span>
              <strong>{asDay(day.advice)}</strong>
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
            <div>
              <span>행운의 방향</span>
              <strong>{day.luckyDirection}</strong>
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
            사주의 전통적인 해석을 바탕으로 재미로 보는 풀이예요. 중요한 결정은 운세보다 내 판단을 믿어 주세요.
          </p>
        </div>
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
            {ELEMENTS[STEM_ELEMENT[dm]]}이고, {dayLabel}의 일진은{" "}
            <b>
              {day.pillar.ko}({day.pillar.hanja})
            </b>
            일이에요. {dayLabel}의 천간 {STEMS[day.pillar.stem]}({STEMS_HANJA[day.pillar.stem]})
            {ELEMENTS[STEM_ELEMENT[day.pillar.stem]]}
            {eunNeun(ELEMENTS[STEM_ELEMENT[day.pillar.stem]])} 나에게 {godRel}이고, 음양이 {samePolarity ? "같아서" : "달라서"}{" "}
            <b>{day.god.god}</b>에 해당해요. {day.god.meaning}
          </p>
          <p>
            또 내 일지(태어난 날의 지지) {BRANCHES[myDayBranch]}({BRANCHES_HANJA[myDayBranch]})와 {dayLabel} 일지{" "}
            {BRANCHES[day.pillar.branch]}({BRANCHES_HANJA[day.pillar.branch]})의 관계는 <b>{day.rel.label}</b>이라서 총운
            별점에{" "}
            {day.rel.adjust > 0 ? "하나를 더했어요" : day.rel.adjust < 0 ? "하나를 뺐어요" : "변화를 주지 않았어요"}.
          </p>
          <p>
            행운의 색·숫자·방향은 {dayLabel} 기운을 부드럽게 이어 주는 오행(
            {ELEMENTS[day.luckyElement]}·{ELEMENTS_HANJA[day.luckyElement]})에 해당하는 전통적인 색과
            숫자, 방위예요. 오행마다 방위가 정해져 있는데(목 동·화 남·토 중앙·금 서·수 북), 토가
            나오는 날은 멀리 가기보다 가까운 곳이 어울리는 날로 봐요.
          </p>
        </details>

        <section className={styles.block} aria-labelledby="hour-title">
          <h2 id="hour-title" className={styles.blockTitle}>
            {dayLabel} 시간대별 흐름
          </h2>
          <p className={styles.blockLead}>
            사주에서 하루는 두 시간씩 열두 칸(십이시)으로 나뉘어요. 그날 일간으로 열두 시간의 천간을
            정하고, 그 천간이 내 일간과 어떤 십신 관계인지에 내 일지와 시지의 관계까지 더해 별점을
            냈어요. 그래서 십신 이름이 같아도 별점이 다를 수 있어요. 태어난 시간을 몰라도 볼 수 있어요.
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
            시각은 동경 127.5도 기준 30분 보정을 반영해 한국 시계 시각으로 적었어요. 그래서 자시가 밤
            11:30에 시작해요. 맨 윗줄 자시는 하루가 시작되는 시간이라 시계로는 전날 밤 11:30부터고,
            위에서 고른 두 시간은 깨어 있는 시간대(아침 5:30~밤 11:30) 안에서 골랐어요.
          </p>
        </section>

        <section className={styles.block} aria-labelledby="week-title">
          <h2 id="week-title" className={styles.blockTitle}>
            앞으로 일주일 흐름
          </h2>
          <ol className={styles.week}>
            {week.map((w, i) => (
              <li key={i} className={i === 0 ? styles.weekToday : undefined}>
                <div className={styles.weekTop}>
                  <span className={styles.weekDate}>
                    {i === 0 ? "오늘" : dateLabel(w.date)}
                    <small>{w.pillar.ko}일</small>
                  </span>
                  <Stars n={w.overall} label={`${dateLabel(w.date)} 총운`} />
                </div>
                <p className={styles.weekDesc}>
                  <b>{w.god.title}</b> {w.god.god}({w.god.keyword})
                </p>
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
      )}
    </>
  );
}
