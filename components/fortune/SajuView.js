"use client";

import { useEffect, useRef, useState } from "react";
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
  tenGod,
} from "@/lib/fortune/saju";
import { useBirth } from "@/lib/fortune/birthStore";
import { buildSajuCard } from "@/lib/fortune/fortuneCard";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { encodeSajuLink, decodeSajuLink } from "@/lib/fortune/resultLink";
import { SITE } from "@/lib/site";
import BirthForm from "./BirthForm";
import { Char, birthLabel } from "./parts";
import { ilganHref } from "@/lib/fortune/ilganSlugs";
import { eunNeun } from "@/lib/korean";

/** /fortune/saju — 생년월일 입력 + 내 사주 팔자 표·오행 분포·일간 풀이 */
export default function SajuView() {
  const { saju } = useBirth();
  const [shared, setShared] = useState(null);
  const resultRef = useRef(null);

  // 주소 끝에 친구가 보낸 팔자가 담겨 있으면, 생년월일을 넣지 않아도 그 결과부터 보여 줍니다.
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
        timeHelp="시간을 넣으면 넷째 기둥(시주)과 '태어난 시간으로 보는 나' 풀이가 더해지고, 오행도 여덟 글자로 세요."
      />
      <div ref={resultRef} className={styles.result} aria-live="polite">
        {saju && <SajuResult saju={saju} />}
      </div>
    </>
  );
}

/** 일간 소개 페이지(더 자세히 알아보기)에서 공유에 담을 글 — 소제목은 그 페이지와 같게 씁니다. */
function detailSections(page, name) {
  if (!page) return null;
  return [
    { title: `${name}${eunNeun(name)} 어떤 글자일까`, text: page.symbol },
    { title: "성격과 기질", text: page.personality },
    { title: "사람 사이에서는", text: page.relationships },
    { title: "일과 공부에서는", text: page.workStudy },
    { title: "오행으로 보는 균형", text: page.balance },
  ];
}

/**
 * snapshot: 친구가 보낸 링크로 보는 결과 — 생년월일·음력·보정 안내(링크에 담지 않는 정보)와
 * 공유 버튼을 빼고, 팔자와 풀이만 보여 줍니다.
 */
function SajuResult({ saju, snapshot = false }) {
  const [hint, setHint] = useState("");
  const [card, setCard] = useState(null);
  const [detail, setDetail] = useState(null);
  const me = TEXTS.ilgan[saju.dayMaster];
  const ilganName = `${me.stem}${me.element}`;
  // 시주 풀이: 시주 천간이 내 일간과 어떤 관계(십신)인지로 고릅니다. 시간을 모르면 없어요.
  const hourGod = saju.pillars.hour ? tenGod(saju.dayMaster, saju.pillars.hour.stem) : null;
  const hourText = hourGod == null ? null : TEXTS.hour.gods[hourGod];
  const hourGodName = hourGod == null ? null : `${TEXTS.tenGods[hourGod].god}(${TEXTS.tenGods[hourGod].hanja})`;
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

  // 결과가 바뀔 때마다 공유용 이미지 카드를 미리 그려 둡니다(버튼을 누른 뒤에 그리면 기기가
  // "사용자가 누른 동작"으로 보지 않아 공유 창이 막히는 경우가 있어서예요).
  const cardKey = [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.hour]
    .map((x) => (x ? x.index : "x"))
    .join("-");
  useEffect(() => {
    if (snapshot) return;
    let cancelled = false;
    setCard(null);
    setDetail(null);
    const char = (n, kind) =>
      n == null
        ? null
        : kind === "stem"
          ? { hanja: STEMS_HANJA[n], ko: STEMS[n], el: STEM_ELEMENT[n] }
          : { hanja: BRANCHES_HANJA[n], ko: BRANCHES[n], el: BRANCH_ELEMENT[n] };
    (async () => {
      // '더 자세히 알아보기' 페이지의 글도 공유에 담습니다. 열 가지 일간 글이 모두 들어 있는
      // 파일이라, 결과를 볼 때만 따로 내려받도록 떼어 뒀어요(없으면 그냥 빼고 만들어요).
      let page = null;
      try {
        page = (await import("@/lib/fortune/ilganPages.json")).default.pages[saju.dayMaster];
      } catch {
        /* 못 받아도 기본 풀이로 공유해요 */
      }
      if (cancelled) return;
      setDetail(page || null);
      const img = await buildSajuCard({
        ilganLine: `${me.stem}(${me.hanja})${me.element} 일간`,
        alias: me.alias,
        keywords: me.keywords.map((k) => `#${k}`).join("  "),
        // 화면의 표와 같은 순서(시주·일주·월주·연주)로 그립니다.
        pillars: [
          ["시주", saju.pillars.hour],
          ["일주", saju.pillars.day],
          ["월주", saju.pillars.month],
          ["연주", saju.pillars.year],
        ].map(([name, p]) => ({
          name,
          me: name === "일주",
          stem: char(p?.stem, "stem"),
          branch: char(p?.branch, "branch"),
        })),
        elements: ELEMENTS.map((el, i) => ({ name: `${el}(${ELEMENTS_HANJA[i]})`, count: saju.elements[i] })),
        summary: me.summary,
        strengths: me.strengths,
        cautions: me.cautions,
        hour: hourText && { label: `태어난 시간으로 보는 나 · 시주 ${hourGodName}`, title: hourText.title, text: hourText.text },
        detailTitle: `${ilganName} 일간 더 알아보기`,
        intro: page?.intro,
        detail: detailSections(page, ilganName),
      });
      if (!cancelled) setCard(img);
    })().catch(() => {
      /* 카드를 못 그리면 글로만 공유해요 */
    });
    return () => {
      cancelled = true;
    };
    // 팔자가 같으면 풀이도 같습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, snapshot]);

  // 링크에 팔자를 담아서, 받은 사람이 생년월일을 넣지 않아도 같은 결과를 보게 합니다.
  const url = `${SITE.url}/fortune/saju${encodeSajuLink(saju)}`;

  async function share() {
    const eight = [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.hour]
      .filter(Boolean)
      .map((x) => `${x.ko}(${x.hanja})`)
      .join(" · ");
    const shortText = `내 일간은 ${me.stem}(${me.hanja})${me.element} — ${me.alias}`;
    const sections = detailSections(detail, ilganName);
    const fullText = [
      `내 일간은 ${me.stem}(${me.hanja})${me.element} — ${me.alias}`,
      `· 여덟 글자 ${eight}`,
      `· 오행 ${ELEMENTS.map((el, i) => `${el} ${saju.elements[i]}`).join(" · ")}`,
      me.summary,
      `[이런 점이 빛나요] ${me.strengths.join(" / ")}`,
      `[이런 점은 살펴봐요] ${me.cautions.join(" / ")}`,
      ...(hourText ? [`
[태어난 시간으로 보는 나 · 시주 ${hourGodName}]
${hourText.title}
${hourText.text}`] : []),
      // 더 자세히 알아보기 페이지의 글까지 이어 붙입니다.
      ...(sections || []).map((s) => `\n[${s.title}]\n${s.text}`),
      "\n— 재미로봄 내 사주 팔자",
    ].join("\n");
    setHint("");
    try {
      const r = await shareResult({
        blob: card?.blob,
        fileName: "jaemirobom-saju.png",
        title: "재미로봄 내 사주 팔자",
        shortText,
        fullText,
        url,
      });
      track("saju_shared", { mode: r.mode });
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
      <section className={styles.block} aria-labelledby="saju-title">
        <h2 id="saju-title" className={styles.blockTitle}>
          내 사주 팔자
        </h2>
        {!snapshot && (
          <p className={styles.blockLead}>
            {birthLabel(saju)} · {saju.animal}띠
          </p>
        )}
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
        {!snapshot && (
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
        )}
        {!snapshot &&
          saju.notes.map((n) => (
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

      {(hourText || !snapshot) && (
        <section className={styles.block} aria-labelledby="hour-title">
          <p className={styles.blockKicker}>태어난 시간으로 보는 나{hourGodName && ` · 시주 ${hourGodName}`}</p>
          {hourText ? (
            <>
              <h2 id="hour-title" className={styles.blockTitle}>
                {hourText.title}
              </h2>
              <p className={styles.para}>{hourText.text}</p>
              <p className={styles.small}>{TEXTS.hour.intro}</p>
            </>
          ) : (
            <>
              <h2 id="hour-title" className={styles.blockTitle}>
                시간을 넣으면 풀이가 더해져요
              </h2>
              <p className={styles.para}>
                태어난 시간을 모르면 시주(넷째 기둥)를 비워 두고 여섯 글자로만 봐요. 위의 &lsquo;바꾸기&rsquo;를
                눌러 시간을 넣으면 시주가 채워지고, 속마음과 나이가 들수록 드러나는 모습을 보는
                &lsquo;태어난 시간 풀이&rsquo;가 여기에 더해져요. 오행도 여덟 글자로 다시 세요.
              </p>
            </>
          )}
        </section>
      )}

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
        <p className={styles.moreLink}>
          <Link href={ilganHref(saju.dayMaster)}>
            {me.stem}
            {me.element} 일간 더 자세히 알아보기 →
          </Link>
        </p>
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
            <p className={styles.small}>
              공유하면 여덟 글자와 일간 풀이가 담긴 사진·링크가 전해져요. &lsquo;더 자세히 알아보기&rsquo;의
              글도 사진에 함께 들어가요. 생년월일은 직접 담지 않지만,
              팔자는 태어난 날과 시간으로 정해지는 글자라서 받는 사람이 짐작할 수도 있어요.
            </p>
          </>
        )}
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
