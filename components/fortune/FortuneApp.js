"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import styles from "./fortune.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import {
  calcSaju,
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
  BRANCH_ELEMENT,
  MIN_YEAR,
  MAX_YEAR,
} from "@/lib/fortune/saju";

// 생년월일은 서버로 보내지 않고 이 화면 안에서만 계산합니다.
// "이 기기에 기억하기"를 직접 켠 경우에만 이 브라우저(localStorage)에 남기고, 언제든 지울 수 있어요.
const STORE_KEY = "jaemirobom.fortune.birth";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
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

const EMPTY = {
  calendar: "solar",
  year: "1995",
  month: "",
  day: "",
  leap: false,
  hour: "",
  minute: "0",
};

function range(a, b) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeStore(v) {
  try {
    if (v) window.localStorage.setItem(STORE_KEY, JSON.stringify(v));
    else window.localStorage.removeItem(STORE_KEY);
  } catch {
    /* 사생활 보호 모드 등에서는 저장이 안 될 수 있어요. 그래도 화면은 그대로 동작합니다. */
  }
}

/** 오늘(또는 지정한 날)의 운세 한 묶음 */
function buildDay(saju, date) {
  const r = dayReading(saju, date);
  const god = TEXTS.tenGods[r.tenGod];
  const rel = RELATIONS[r.relation];
  const overall = Math.min(5, Math.max(1, god.stars.overall + rel.adjust));
  return { ...r, god, rel, overall, advice: god.advice[r.pillar.index % god.advice.length] };
}

function Stars({ n, label }) {
  return (
    <span className={styles.stars} role="img" aria-label={`${label} 별 5개 중 ${n}개`}>
      {"★".repeat(n)}
      <span className={styles.starsOff}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

function Char({ hanja, ko, element }) {
  return (
    <span className={`${styles.char} ${styles[`el${element}`]}`}>
      <span className={styles.charHanja}>{hanja}</span>
      <span className={styles.charKo}>
        {ko} · {ELEMENTS[element]}
      </span>
    </span>
  );
}

function dateLabel(d) {
  const w = new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
  return `${d.month}월 ${d.day}일 (${WEEKDAYS[w]})`;
}

export default function FortuneApp() {
  const [form, setForm] = useState(EMPTY);
  const [remember, setRemember] = useState(false);
  const [remembered, setRemembered] = useState(false);
  const [error, setError] = useState("");
  const [saju, setSaju] = useState(null);
  const [today, setToday] = useState(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);

  // 기억해 둔 생년월일이 있으면 바로 오늘의 운세를 보여 줍니다.
  useEffect(() => {
    const saved = readStore();
    if (!saved) return;
    const r = calcSaju(saved);
    if (!r.ok) {
      writeStore(null);
      return;
    }
    setForm({
      ...EMPTY,
      ...saved,
      year: String(saved.year),
      month: String(saved.month),
      day: String(saved.day),
      hour: saved.hour == null ? "" : String(saved.hour),
      minute: String(saved.minute ?? 0),
    });
    setRemember(true);
    setRemembered(true);
    setToday(koreaToday());
    setSaju(r);
  }, []);

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  function submit(e) {
    e.preventDefault();
    if (!form.month || !form.day) {
      setError("태어난 달과 날을 골라 주세요.");
      return;
    }
    const input = {
      calendar: form.calendar,
      year: Number(form.year),
      month: Number(form.month),
      day: Number(form.day),
      leap: form.calendar === "lunar" && form.leap,
      hour: form.hour === "" ? null : Number(form.hour),
      minute: form.hour === "" ? null : Number(form.minute),
    };
    const r = calcSaju(input);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (remember) {
      writeStore(input);
      setRemembered(true);
    } else if (remembered) {
      writeStore(null);
      setRemembered(false);
    }
    setToday(koreaToday());
    setSaju(r);
    track("fortune_result_viewed", {
      calendar: input.calendar,
      time: input.hour == null ? "unknown" : "known",
      remember,
    });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function forget() {
    writeStore(null);
    setRemembered(false);
    setRemember(false);
  }

  function reset() {
    setSaju(null);
    requestAnimationFrame(() =>
      document.getElementById("fortune-form")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  async function share(day) {
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

  const daysInMonth = form.calendar === "lunar" ? 30 : 31;

  return (
    <>
      <form id="fortune-form" className={styles.form} onSubmit={submit} noValidate>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>생년월일</legend>
          <div className={styles.segment} role="radiogroup" aria-label="양력·음력 선택">
            {[
              ["solar", "양력"],
              ["lunar", "음력"],
            ].map(([v, label]) => (
              <label key={v} className={`${styles.segmentItem} ${form.calendar === v ? styles.segmentOn : ""}`}>
                <input
                  type="radio"
                  name="calendar"
                  value={v}
                  checked={form.calendar === v}
                  onChange={set("calendar")}
                />
                {label}
              </label>
            ))}
          </div>
          <div className={styles.row3}>
            <label className={styles.selectWrap}>
              <span className={styles.srOnly}>태어난 해</span>
              <select className={styles.select} value={form.year} onChange={set("year")}>
                {range(MIN_YEAR, MAX_YEAR)
                  .reverse()
                  .map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
              </select>
            </label>
            <label className={styles.selectWrap}>
              <span className={styles.srOnly}>태어난 달</span>
              <select className={styles.select} value={form.month} onChange={set("month")}>
                <option value="">월</option>
                {range(1, 12).map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.selectWrap}>
              <span className={styles.srOnly}>태어난 날</span>
              <select className={styles.select} value={form.day} onChange={set("day")}>
                <option value="">일</option>
                {range(1, daysInMonth).map((d) => (
                  <option key={d} value={d}>
                    {d}일
                  </option>
                ))}
              </select>
            </label>
          </div>
          {form.calendar === "lunar" && (
            <label className={styles.check}>
              <input type="checkbox" checked={form.leap} onChange={set("leap")} />
              윤달이에요
            </label>
          )}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            태어난 시간 <span className={styles.optional}>(모르면 그대로 두세요)</span>
          </legend>
          <div className={styles.row2}>
            <label className={styles.selectWrap}>
              <span className={styles.srOnly}>태어난 시</span>
              <select className={styles.select} value={form.hour} onChange={set("hour")}>
                <option value="">시간 모름</option>
                {range(0, 23).map((h) => (
                  <option key={h} value={h}>
                    {h < 12 ? "오전" : "오후"} {h % 12 === 0 ? 12 : h % 12}시 ({h}시)
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.selectWrap}>
              <span className={styles.srOnly}>태어난 분</span>
              <select
                className={styles.select}
                value={form.minute}
                onChange={set("minute")}
                disabled={form.hour === ""}
              >
                {range(0, 59).map((m) => (
                  <option key={m} value={m}>
                    {m}분
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <label className={styles.check}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>
            이 기기에 기억하기
            <small className={styles.checkHelp}>
              다음에 오면 바로 오늘의 운세를 보여 드려요. 이 브라우저에만 저장되고 서버로는 보내지 않아요.
            </small>
          </span>
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.cta}>
          오늘의 운세 보기
        </button>
        <p className={styles.formNote}>입력한 생년월일은 서버로 보내지 않고 이 화면 안에서만 계산해요.</p>
      </form>

      {saju && today && (
        <Result
          saju={saju}
          today={today}
          resultRef={resultRef}
          onShare={share}
          copied={copied}
          remembered={remembered}
          onForget={forget}
          onReset={reset}
        />
      )}
    </>
  );
}

function Result({ saju, today, resultRef, onShare, copied, remembered, onForget, onReset }) {
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
  const pillarCols = [
    ["시주", saju.pillars.hour, "태어난 시간"],
    ["일주", saju.pillars.day, "태어난 날 · 나"],
    ["월주", saju.pillars.month, "태어난 달"],
    ["연주", saju.pillars.year, "태어난 해"],
  ];
  const maxEl = Math.max(...saju.elements);
  const total = saju.elements.reduce((a, b) => a + b, 0);
  const birth = saju.input;

  return (
    <div ref={resultRef} className={styles.result} aria-live="polite">
      {/* ── 오늘의 운세 ── */}
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
            <button type="button" className={styles.cta} onClick={() => onShare(day)}>
              {copied ? "링크를 복사했어요" : "친구에게 알려주기"}
            </button>
          </div>
          <p className={styles.disclaimer}>
            사주의 전통적인 해석을 바탕으로 재미로 보는 풀이예요. 중요한 결정은 운세보다 내 판단을 믿어 주세요.
          </p>
        </div>
      </section>

      {/* ── 왜 이렇게 나왔을까 ── */}
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

      {/* ── 이번 주 흐름 ── */}
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

      {/* ── 내 사주 ── */}
      <section className={styles.block} aria-labelledby="saju-title">
        <h2 id="saju-title" className={styles.blockTitle}>
          내 사주 팔자
        </h2>
        <p className={styles.blockLead}>
          {birth.calendar === "lunar"
            ? `음력 ${birth.leap ? "윤" : ""}${birth.month}월 ${birth.day}일(양력 ${saju.solar.year}.${saju.solar.month}.${saju.solar.day})`
            : `양력 ${saju.solar.year}년 ${saju.solar.month}월 ${saju.solar.day}일`}
          {birth.hour != null ? ` ${birth.hour}시 ${birth.minute}분` : " · 시간 모름"} · {saju.animal}띠
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

        <h3 className={styles.subTitle}>
          나를 나타내는 글자: {me.stem}({me.hanja}){me.element} — {me.alias}
        </h3>
        <ul className={styles.keywords}>
          {me.keywords.map((k) => (
            <li key={k}>#{k}</li>
          ))}
        </ul>
        <p className={styles.para}>{me.summary}</p>
        <div className={styles.twoCol}>
          <div>
            <h4>이런 점이 빛나요</h4>
            <ul>
              {me.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>이런 점은 살펴봐요</h4>
            <ul>
              {me.cautions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className={styles.tip}>{me.tip}</p>
      </section>

      <div className={styles.resultFoot}>
        {remembered ? (
          <p>
            이 기기에 생년월일을 기억하고 있어요.{" "}
            <button type="button" className={styles.textBtn} onClick={onForget}>
              기억 지우기
            </button>
          </p>
        ) : null}
        <button type="button" className={styles.ghost} onClick={onReset}>
          다른 생년월일로 보기
        </button>
      </div>
    </div>
  );
}
