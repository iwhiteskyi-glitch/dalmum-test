"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "./fortune.module.css";
import t from "./today.module.css";
import j from "./saju.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import SAJU from "@/lib/fortune/sajuTexts.json";
import EXTRAS from "@/lib/fortune/todayExtras.json";
import {
  sajuProfile,
  STEMS,
  STEMS_HANJA,
  BRANCHES,
  BRANCHES_HANJA,
  ELEMENTS,
  ELEMENTS_HANJA,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  BRANCH_MAIN_STEM,
  SEASONS,
  ELEMENT_COLORS,
  ELEMENT_NUMBERS,
  ELEMENT_DIRECTIONS,
  tenGod,
} from "@/lib/fortune/saju";
import { useBirth } from "@/lib/fortune/birthStore";
import { decodeSajuLink } from "@/lib/fortune/resultLink";
import BirthForm from "./BirthForm";
import { Char, birthLabel } from "./parts";
import { ilganHref } from "@/lib/fortune/ilganSlugs";
import { eunNeun, hasBatchim } from "@/lib/korean";

const AREAS = [
  ["love", "연애·관계"],
  ["work", "일·적성"],
  ["money", "돈 쓰는 습관"],
  ["rhythm", "생활 리듬"],
];
// 십신 묶음이 이만큼 있으면 '많은 편', 하나도 없으면 '없는 편' 풀이를 보여 줘요.
const MANY_GROUP = 3;
// 글자 수는 5~8개뿐이라 우리말로 읽어요.
const COUNT_WORDS = { 5: "다섯", 6: "여섯", 7: "일곱", 8: "여덟" };
const elName = (i) => `${ELEMENTS[i]}(${ELEMENTS_HANJA[i]})`;

/** /fortune/saju — 생년월일 입력 + 내 사주 팔자·일주·계절·오행·십신 풀이 */
export default function SajuView() {
  const { saju } = useBirth();
  const [shared, setShared] = useState(null);
  // 생년월일을 바꾸는 동안에는 예전 결과를 숨겨요(취소하면 다시 보여요).
  const [editing, setEditing] = useState(false);
  const resultRef = useRef(null);

  // 예전에 친구가 보낸 팔자 링크로 들어오면, 생년월일을 넣지 않아도 그 결과부터 보여 줍니다
  // (공유 버튼은 없앴지만 이미 퍼진 링크는 열려요).
  useEffect(() => {
    const got = decodeSajuLink(window.location.hash);
    if (!got) return;
    setShared(got.saju);
    track("saju_shared_link_opened");
  }, []);

  function onSubmitted(input, remember) {
    setShared(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    track("saju_result_viewed", { calendar: input.calendar, time: input.hour == null ? "unknown" : "known", remember });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <>
      {shared && (
        <>
          <p className={styles.sharedNote}>
            친구가 보낸 <b>사주 팔자</b>예요. 아래에서 내 사주도 바로 볼 수 있어요.
          </p>
          <div className={styles.result}>
            <SajuResult saju={shared} snapshot />
          </div>
          <p className={styles.sectionDivider}>내 사주 보기</p>
        </>
      )}
      <BirthForm
        submitLabel="내 사주 보기"
        onSubmitted={onSubmitted}
        timeHelp="시간을 넣으면 넷째 기둥(시주)과 '태어난 시간으로 보는 나' 풀이가 더해지고, 오행·십신도 여덟 글자로 세요."
        onEditingChange={setEditing}
      />
      <div ref={resultRef} className={styles.result} aria-live="polite">
        {saju && !editing && (
          <div className={t.zone}>
            <p className={t.zoneLabel}>내 사주 결과</p>
            <SajuResult saju={saju} />
          </div>
        )}
      </div>
    </>
  );
}

/**
 * snapshot: 친구가 보낸 링크로 보는 결과 — 생년월일·음력·보정 안내(링크에 담지 않는 정보)와
 * '왜 이렇게 나왔을까'·오늘의 운세 안내는 빼고, 팔자와 풀이만 보여 줍니다.
 */
function SajuResult({ saju, snapshot = false }) {
  const p = useMemo(() => sajuProfile(saju), [saju]);
  const dm = saju.dayMaster;
  const me = TEXTS.ilgan[dm];
  const myEl = STEM_ELEMENT[dm];
  const ilju = SAJU.ilju[p.iljuIndex];
  const day = saju.pillars.day;
  const monthBranch = saju.pillars.month.branch;
  const season = SEASONS[p.season];
  const godName = (g) => TEXTS.tenGods[g].god;
  // 시주 풀이: 시주 천간이 내 일간과 어떤 관계(십신)인지로 고릅니다. 시간을 모르면 없어요.
  const hourGod = saju.pillars.hour ? tenGod(dm, saju.pillars.hour.stem) : null;
  const hourText = hourGod == null ? null : TEXTS.hour.gods[hourGod];
  const hourGodName = hourGod == null ? null : `${godName(hourGod)}(${TEXTS.tenGods[hourGod].hanja})`;
  const pillarCols = [
    ["hour", "시주", saju.pillars.hour, "태어난 시간"],
    ["day", "일주", day, "태어난 날"],
    ["month", "월주", saju.pillars.month, "태어난 달"],
    ["year", "연주", saju.pillars.year, "태어난 해"],
  ];
  // 팔자 표 글자 밑에 붙이는 십신 이름
  const godAt = (pos, kind) => p.chars.find((c) => c.pos === pos && c.kind === kind)?.god;
  const maxEl = Math.max(...saju.elements);
  const total = saju.elements.reduce((a, b) => a + b, 0);
  const charCount = p.chars.length;
  const maxGroup = Math.max(...p.groups);
  const fill = p.fillElement;
  const fillCount = saju.elements[fill];
  // 음식·장소는 세 가지 중 일주 번호로 골라서 같은 사람이면 늘 같아요.
  const turn = p.iljuIndex % 3;
  const lucky = EXTRAS.lucky[fill];
  const notable = p.groups.flatMap((n, i) =>
    n >= MANY_GROUP ? [[i, "many"]] : n === 0 ? [[i, "none"]] : []
  );
  const l = saju.lunar;
  const pad = (n) => String(n).padStart(2, "0");
  const dayBranchName = `${BRANCHES[day.branch]}(${BRANCHES_HANJA[day.branch]})`;

  return (
    <>
      <section className={t.panel} aria-labelledby="saju-title">
        <p className={t.date}>{snapshot ? "친구가 보낸 사주 팔자" : `${birthLabel(saju)} · ${saju.animal}띠`}</p>
        <div className={j.head}>
          <div className={j.seal} aria-hidden="true">
            <span>{STEMS_HANJA[day.stem]}</span>
            <span>{BRANCHES_HANJA[day.branch]}</span>
          </div>
          <div className={j.headSide}>
            <p className={t.god}>
              태어난 날의 두 글자 · {me.alias}
            </p>
            <h2 id="saju-title" className={t.title}>
              {ilju.name}({ilju.hanja})일주
            </h2>
            <p className={j.headSub}>{ilju.title}</p>
          </div>
        </div>
        <ul className={j.chips}>
          {me.keywords.map((k) => (
            <li key={k}>#{k}</li>
          ))}
        </ul>

        <div className={t.personal}>
          <p className={t.personalLabel}>
            {me.stem}
            {me.element}({me.hanja}
            {ELEMENTS_HANJA[myEl]}) · {ilju.name}({ilju.hanja})일주인 나는
          </p>
          <p className={t.personalText}>{ilju.text}</p>
        </div>

        <dl className={j.glance}>
          <div>
            <dt>가장 많은 오행</dt>
            <dd>
              {p.mostElements.map(elName).join(" · ")} <small>{maxEl}개</small>
            </dd>
          </div>
          <div>
            <dt>채우면 좋은 오행</dt>
            <dd>
              {elName(fill)} <small>{fillCount}개</small>
            </dd>
          </div>
          <div>
            <dt>가장 많은 십신</dt>
            <dd>
              {p.topGroups.map((g) => SAJU.godGroups[g].name).join(" · ")} <small>{maxGroup}개</small>
            </dd>
          </div>
          <div>
            <dt>태어난 계절</dt>
            <dd>
              {season} <small>{BRANCHES[monthBranch]}월</small>
            </dd>
          </div>
        </dl>
      </section>

      <section className={`${t.card} ${j.cPillars}`} aria-labelledby="saju-pillars-title">
        <h2 id="saju-pillars-title" className={t.cardTitle}>
          내 사주 팔자
        </h2>
        <div className={styles.pillars}>
          {pillarCols.map(([pos, name, pl, sub]) => (
            <div key={name} className={`${styles.pillar} ${pos === "day" ? styles.pillarMe : ""}`}>
              <span className={styles.pillarName}>
                {name}
                <small>{sub}</small>
              </span>
              {pl ? (
                <>
                  <Char hanja={STEMS_HANJA[pl.stem]} ko={STEMS[pl.stem]} element={STEM_ELEMENT[pl.stem]} />
                  <span className={j.godTag}>{pos === "day" ? "나" : godName(godAt(pos, "stem"))}</span>
                  <Char hanja={BRANCHES_HANJA[pl.branch]} ko={BRANCHES[pl.branch]} element={BRANCH_ELEMENT[pl.branch]} />
                  <span className={j.godTag}>{godName(godAt(pos, "branch"))}</span>
                </>
              ) : (
                <span className={styles.pillarEmpty}>시간을 알면 볼 수 있어요</span>
              )}
            </div>
          ))}
        </div>
        <p className={styles.pillarRead}>
          {[saju.pillars.year, saju.pillars.month, day, saju.pillars.hour]
            .filter(Boolean)
            .map((x) => `${x.ko}(${x.hanja})`)
            .join(" · ")}
        </p>
        <details className={j.legend}>
          <summary>글자 아래 작은 이름 뜻 보기</summary>
          <p className={j.small}>
            작은 이름은 십신이에요. 그 글자가 나(일주의 윗글자)에게 어떤 관계인지 열 가지로 나눈 이름인데, 다섯
            묶음으로 보면 쉬워요. 한 묶음 안에서는 나와 음양이 같으면 앞 이름, 다르면 뒤 이름이에요.
          </p>
          <dl className={j.godDefs}>
            {SAJU.godGroups.map((g, i) => (
              <div key={g.name}>
                <dt>
                  <span>
                    {g.name}({g.hanja})
                    <em>
                      {godName(i * 2)} · {godName(i * 2 + 1)}
                    </em>
                  </span>
                  <small>내 팔자에 {p.groups[i]}개</small>
                </dt>
                <dd>{g.desc}</dd>
              </div>
            ))}
          </dl>
        </details>
        {!snapshot &&
          saju.notes.map((n) => (
            <p key={n} className={styles.note}>
              {n}
            </p>
          ))}
        {!snapshot && (
          <details className={t.more}>
            <summary>계산에 쓴 날짜·시간 보기</summary>
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
          </details>
        )}
      </section>

      <section className={`${t.card} ${t.cArea}`} aria-labelledby="saju-me-title">
        <p className={j.kicker}>나를 나타내는 글자(일간)</p>
        <h2 id="saju-me-title" className={t.cardTitle}>
          {me.stem}({me.hanja}){me.element} — {me.alias}
        </h2>
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
        <p className={styles.moreLink}>
          <Link href={ilganHref(dm)}>
            {me.stem}
            {me.element} 일간 더 자세히 알아보기 →
          </Link>
        </p>
      </section>

      <section className={`${t.card} ${j.cSeason}`} aria-labelledby="saju-season-title">
        <p className={j.kicker}>
          태어난 계절 · {BRANCHES[monthBranch]}({BRANCHES_HANJA[monthBranch]})월
        </p>
        <h2 id="saju-season-title" className={t.cardTitle}>
          {season}에 태어난 {me.alias}
        </h2>
        <p className={styles.para}>{SAJU.season[dm][p.season]}</p>
      </section>

      <section className={`${t.card} ${j.cElement}`} aria-labelledby="saju-el-title">
        <h2 id="saju-el-title" className={t.cardTitle}>
          오행 분포
        </h2>
        <ul className={styles.elements}>
          {ELEMENTS.map((el, i) => {
            const te = TEXTS.elements[i];
            const c = saju.elements[i];
            const comment = c === 0 ? te.few : c === maxEl && c >= 3 ? te.many : null;
            return (
              <li key={el}>
                <span className={styles.elName}>{elName(i)}</span>
                <span className={styles.elBar}>
                  <span className={`${styles.elFill} ${styles[`sw${i}`]}`} style={{ width: `${(c / total) * 100}%` }} />
                </span>
                <span className={styles.elCount}>{c}</span>
                {comment && <span className={styles.elComment}>{comment}</span>}
              </li>
            );
          })}
        </ul>
        <div className={j.fill}>
          <h3>
            채우면 좋은 기운 · {elName(fill)}
          </h3>
          <p>{SAJU.fill[fill]}</p>
          <dl className={t.lucky}>
            <div>
              <dt>색</dt>
              <dd>
                <i className={`${styles.swatch} ${styles[`sw${fill}`]}`} aria-hidden="true" />
                {ELEMENT_COLORS[fill]}
              </dd>
            </div>
            <div>
              <dt>숫자</dt>
              <dd>{ELEMENT_NUMBERS[fill].join(", ")}</dd>
            </div>
            <div>
              <dt>방향</dt>
              <dd>{ELEMENT_DIRECTIONS[fill]}</dd>
            </div>
            <div className={t.luckyWide}>
              <dt>음식 · {lucky.taste}</dt>
              <dd>{lucky.foods[turn]}</dd>
            </div>
            <div className={t.luckyWide}>
              <dt>장소</dt>
              <dd>{lucky.places[turn]}</dd>
            </div>
          </dl>
        </div>
        <p className={j.small}>
          {COUNT_WORDS[total]} 글자가 각각 어떤 오행인지 센 숫자예요. 많고 적음은 성향을 보는 재미로만 봐 주세요.
        </p>
      </section>

      <section className={`${t.card} ${j.cGods}`} aria-labelledby="saju-gods-title">
        <h2 id="saju-gods-title" className={t.cardTitle}>
          십신 분포
        </h2>
        <p className={j.lead}>
          나(일간)를 뺀 {COUNT_WORDS[charCount]} 글자가 나에게 어떤 관계인지 다섯 묶음으로 나눠 셌어요.
        </p>
        <ul className={j.gods}>
          {SAJU.godGroups.map((g, i) => (
            <li key={g.name}>
              <span className={j.godName}>
                {g.name}
                <small>{g.sub}</small>
              </span>
              <span className={j.godBar} aria-hidden="true">
                <i style={{ width: `${(p.groups[i] / charCount) * 100}%` }} />
              </span>
              <span className={j.godCount}>{p.groups[i]}</span>
            </li>
          ))}
        </ul>
        <div className={j.notes}>
          {notable.length > 0 ? (
            notable.map(([i, kind]) => (
              <p key={i}>{SAJU.godGroups[i][kind]}</p>
            ))
          ) : (
            <p>{SAJU.godBalanced}</p>
          )}
        </div>
        <p className={j.small}>묶음마다 뜻은 위 팔자 표의 &lsquo;글자 아래 작은 이름 뜻 보기&rsquo;에 있어요.</p>
      </section>

      <section className={`${t.card} ${j.cAreas}`} aria-labelledby="saju-area-title">
        <h2 id="saju-area-title" className={t.cardTitle}>
          영역별 성향
        </h2>
        <dl className={t.areas}>
          {AREAS.map(([k, label]) => (
            <div key={k} className={t.area}>
              <dt>
                <span>{label}</span>
              </dt>
              <dd>{SAJU.areas[dm][k]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {(hourText || !snapshot) && (
        <section className={`${t.card} ${t.cHour}`} aria-labelledby="hour-title">
          <p className={j.kicker}>태어난 시간으로 보는 나{hourGodName && ` · 시주 ${hourGodName}`}</p>
          {hourText ? (
            <>
              <h2 id="hour-title" className={t.cardTitle}>
                {hourText.title}
              </h2>
              <p className={styles.para}>{hourText.text}</p>
              <p className={j.small}>{TEXTS.hour.intro}</p>
            </>
          ) : (
            <>
              <h2 id="hour-title" className={t.cardTitle}>
                시간을 넣으면 풀이가 더해져요
              </h2>
              <p className={styles.para}>
                태어난 시간을 모르면 시주(넷째 기둥)를 비워 두고 여섯 글자로만 봐요. 위의 &lsquo;생년월일
                바꾸기&rsquo;를 눌러 시간을 넣으면 시주가 채워지고, 속마음과 나이가 들수록 드러나는 모습을 보는
                &lsquo;태어난 시간 풀이&rsquo;가 여기에 더해져요. 오행과 십신도 여덟 글자로 다시 세요.
              </p>
            </>
          )}
        </section>
      )}

      {!snapshot && (
        <>
          <details className={styles.why}>
            <summary>왜 이렇게 나왔을까?</summary>
            <p>
              태어난 날의 두 글자(일주)는{" "}
              <b>
                {day.ko}({day.hanja})
              </b>
              예요. 위 글자 {STEMS[dm]}({STEMS_HANJA[dm]})는 사주에서 &lsquo;나&rsquo;를 뜻하는 일간이고, 아래 글자{" "}
              {dayBranchName}
              {eunNeun(BRANCHES[day.branch])} 내 발밑을 받치는 자리(일지)예요. 일지의 대표 천간{" "}
              {STEMS[BRANCH_MAIN_STEM[day.branch]]}({STEMS_HANJA[BRANCH_MAIN_STEM[day.branch]]})
              {eunNeun(STEMS[BRANCH_MAIN_STEM[day.branch]])} 나에게 <b>{godName(p.dayBranchGod)}</b>
              {hasBatchim(godName(p.dayBranchGod)) ? "이라서" : "라서"}, 일주
              풀이는 그 관계를 자연의 장면에 빗대어 풀었어요. 60가지 일주마다 따로 쓴 문장이에요.
            </p>
            <p>
              태어난 계절은 태어난 달의 지지(월지) {BRANCHES[monthBranch]}({BRANCHES_HANJA[monthBranch]})로 봤어요.
              인·묘·진월은 봄, 사·오·미월은 여름, 신·유·술월은 가을, 해·자·축월은 겨울이에요. 사주의 달은 1일이
              아니라 절기가 바뀌는 날에 시작해서, 달력의 달과 조금 다를 수 있어요.
            </p>
            <p>
              십신 분포는 일간을 뺀 {COUNT_WORDS[charCount]} 글자를 셌어요. 천간은 그 글자 그대로, 지지는 그 안의 대표 천간(본기)으로
              나와의 관계를 봤어요. 한 묶음이 {MANY_GROUP}개 이상이면 많은 편, 하나도 없으면 없는 편 풀이를 보여 드려요.
            </p>
            <p>
              채우면 좋은 오행은 여덟 글자(시간을 모르면 여섯 글자) 중 가장 적은 오행이에요. 가장 적은 오행이
              여럿이면 나를 낳는 오행, 나와 같은 오행, 내가 낳는 오행 순서로 골랐어요. 색·숫자·방향·맛은 그
              오행에 전통적으로 짝지어진 것이고, 음식과 장소는 그 성질에 어울리는 것을 골랐어요. 사주 전문가가
              말하는 &lsquo;용신&rsquo;처럼 팔자 전체의 힘을 따져 고른 것은 아니에요.
            </p>
            <p>영역별 성향은 일간 열 가지마다 따로 쓴 풀이예요.</p>
          </details>

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
      )}
      <p className={styles.disclaimer}>
        사주의 전통적인 해석을 바탕으로 재미로 보는 풀이예요. 사람의 성격과 앞날은 여덟 글자보다 훨씬 다양해요.
      </p>
    </>
  );
}
