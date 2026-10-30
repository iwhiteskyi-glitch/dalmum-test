"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import styles from "@/components/fortune/fortune.module.css";
import t from "@/components/fortune/today.module.css";
import g from "./gunghap.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import GUNGHAP_TEXTS from "@/lib/fortune/gunghapTexts.json";
import { buildGunghapCard } from "@/lib/fortune/fortuneCard";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { encodeGunghapLink, decodeGunghapLink } from "@/lib/fortune/resultLink";
import { SITE } from "@/lib/site";
import { keepResult, restoreOnBack } from "@/lib/backRestore";
import {
  gunghapReading,
  gunghapScoreParts,
  ELEMENTS,
  ELEMENTS_HANJA,
  BRANCHES,
  BRANCHES_HANJA,
  ANIMALS,
} from "@/lib/fortune/saju";
import { Stars, GOD_PLAIN, stemLabel } from "@/components/fortune/parts";
import GunghapForm, { RELATION_LABELS } from "./GunghapForm";

const CATEGORIES = GUNGHAP_TEXTS.categories;
const AREAS = RELATION_LABELS.filter(([key]) => key !== "all");
const AREA_TITLES = {
  all: "사이별 궁합",
  love: "연인·썸으로 본 궁합",
  friend: "친구로 본 궁합",
  family: "가족으로 본 궁합",
  work: "일로 만난 사이로 본 궁합",
};

// 상대 쪽에서 본 나 — GOD_PLAIN("나를 다스리는 기운" 등)을 상대 기준으로 바꾼 말
const GOD_PLAIN_PARTNER = ["상대와 같은 기운", "상대가 낳는 기운", "상대가 다스리는 기운", "상대를 다스리는 기운", "상대를 낳는 기운"];

// 일지(태어난 날의 아랫글자) 관계 이름과 쉬운 설명
const DAY_LABELS = {
  same: ["같은 글자", "두 사람의 아랫글자가 똑같아요"],
  six: ["육합(六合)", "서로 끌어당겨 짝을 이루는 두 글자예요"],
  three: ["반합(半合)", "같은 기운으로 모이는 세 글자 가운데 두 글자예요. 둘만 만나도 그 기운이 반쯤 생긴다고 봐요"],
  clash: ["충(沖)", "열두 글자 둘레에서 정반대 자리에 마주 선 두 글자예요"],
  none: ["무난", "특별히 끌어당기지도 부딪히지도 않는 두 글자예요"],
};

// 점수 줄마다 최고점(막대 길이 기준)
const SCORE_MAX = { element: 22, polarity: 10, day: 15, fill: 6 };

/** 오행 두 개 사이의 관계: 0 같음 1 A가B를생함 2 A가B를극함 3 B가A를극함 4 B가A를생함 */
function elementRel(elA, elB) {
  return (elB - elA + 5) % 5;
}

const elName = (i) => `${ELEMENTS[i]}(${ELEMENTS_HANJA[i]})`;

function compareText(topA, topB) {
  if (topA === topB) {
    return `두 사람 모두 ${elName(topA)} 기운이 가장 많아요. 비슷한 성향이 많아서 통하는 부분이 클 거예요.`;
  }
  const rel = elementRel(topA, topB);
  if (rel === 1) return `내게 가장 많은 ${elName(topA)} 기운이 상대에게 가장 많은 ${elName(topB)} 기운을 북돋아 주는 조합이에요.`;
  if (rel === 4) return `상대에게 가장 많은 ${elName(topB)} 기운이 내게 가장 많은 ${elName(topA)} 기운을 북돋아 주는 조합이에요.`;
  return `내게 가장 많은 ${elName(topA)} 기운과 상대에게 가장 많은 ${elName(topB)} 기운은 서로 다스리는 사이라, 속도를 맞춰 가는 과정이 필요해요.`;
}

/** 오행 보완 풀이: 서로에게 없는 오행을 상대가 넉넉히(두 개 이상) 가지고 있는지 */
function fillText(reading) {
  const { lackA = [], lackB = [], fillA = null, fillB = null } = reading;
  if (!lackA.length && !lackB.length) {
    return "두 사람 모두 다섯 가지 기운을 고루 가지고 있어서, 서로 채워 줘야 할 빈자리가 크지 않아요.";
  }
  const side = (lack, fill, who, other) => {
    if (!lack.length) return `${who}는 다섯 가지 기운을 고루 가지고 있어요.`;
    if (fill !== null) return `${who}에게 없는 ${elName(fill)} 기운을 ${other === "나" ? "내가" : "상대가"} 넉넉히 가지고 있어요.`;
    return `${who}에게 없는 ${lack.map(elName).join("·")} 기운은 ${other}에게도 많지 않아요.`;
  };
  const filled = (fillA !== null) + (fillB !== null);
  const close =
    filled === 2
      ? "서로의 빈자리를 채워 주는 조합이에요."
      : filled === 1
        ? "한쪽이 다른 쪽의 빈자리를 채워 주는 사이예요."
        : "비어 있는 기운은 두 사람이 함께 다른 데서 채워 가면 돼요.";
  return [side(lackA, fillA, "나", "상대"), side(lackB, fillB, "상대", "나"), close].join(" ");
}

/** 점수 항목별 줄: [이름, 무엇이었는지, 점수, 최고점] */
function scoreRows(reading, parts, me, partner) {
  const cat = reading.category;
  const element =
    cat === 0
      ? "같은 오행"
      : cat === 1
        ? "내 오행이 상대 오행을 낳아 줌(상생)"
        : cat === 4
          ? "상대 오행이 내 오행을 낳아 줌(상생)"
          : cat === 2
            ? "내 오행이 상대 오행을 다스림(상극)"
            : "상대 오행이 내 오행을 다스림(상극)";
  const polarity = reading.samePolarity
    ? `둘 다 ${me.dayMaster % 2 === 0 ? "양(陽)" : "음(陰)"}`
    : "한 사람은 양(陽), 한 사람은 음(陰)";
  const filled = ((reading.fillA ?? null) !== null) + ((reading.fillB ?? null) !== null);
  return [
    ["윗글자(일간)의 오행 관계", element, parts.element, SCORE_MAX.element],
    ["음양", polarity, parts.polarity, SCORE_MAX.polarity],
    ["아랫글자(일지) 관계", DAY_LABELS[reading.dayRelation][0], parts.day, SCORE_MAX.day],
    ["서로 채워 주는 기운", filled === 2 ? "서로 채워 줌" : filled === 1 ? "한쪽이 채워 줌" : "해당 없음", parts.fill, SCORE_MAX.fill],
  ];
}

export default function GunghapView() {
  // 결과 아래 링크로 다른 페이지에 갔다가 뒤로 오면 보던 결과를 다시 보여 줍니다(탭 메모리에만 둠).
  const [result, setResult] = useState(() => restoreOnBack("gunghap"));
  const [shared, setShared] = useState(null);

  // 주소 끝에 친구가 보낸 결과가 담겨 있으면, 생년월일을 넣지 않아도 그 결과부터 보여 줍니다.
  useEffect(() => {
    const got = decodeGunghapLink(window.location.hash);
    if (!got) return;
    setShared({ ...got, reading: gunghapReading(got.me, got.partner) });
    track("gunghap_shared_link_opened");
  }, []);

  function onSubmitted(meSaju, partnerSaju, relation) {
    const reading = gunghapReading(meSaju, partnerSaju);
    const next = { me: meSaju, partner: partnerSaju, reading, relation };
    setResult(next);
    keepResult("gunghap", next);
    // 내 결과를 보기 시작하면 친구 결과와 링크 흔적을 지웁니다.
    setShared(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    track("gunghap_result_viewed", {
      meTime: meSaju.input.hour == null ? "unknown" : "known",
      partnerTime: partnerSaju.input.hour == null ? "unknown" : "known",
      relation,
    });
    requestAnimationFrame(() => document.getElementById("gunghap-result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <>
      {shared && (
        <>
          <p className={styles.sharedNote}>
            친구가 보낸 <b>궁합 결과</b>예요. 아래에서 나도 바로 볼 수 있어요.
          </p>
          <div className={styles.result}>
            <div className={t.zone}>
              <p className={t.zoneLabel}>친구가 보낸 궁합 결과</p>
              <GunghapResult {...shared} snapshot />
            </div>
          </div>
          <p className={styles.sectionDivider}>나도 궁합 보기</p>
        </>
      )}
      <GunghapForm onSubmitted={onSubmitted} />
      <div id="gunghap-result" className={styles.result} aria-live="polite">
        {result?.reading && (
          <div className={t.zone}>
            <p className={t.zoneLabel}>우리 궁합 결과</p>
            <GunghapResult {...result} relation={result.relation || "all"} />
          </div>
        )}
      </div>
    </>
  );
}

/** snapshot: 친구가 보낸 링크로 보는 결과 — 공유 버튼과 시간 안내(링크에 없는 정보) 없이 결과만 보여 줍니다. */
function GunghapResult({ me, partner, reading, relation, snapshot = false }) {
  const cat = CATEGORIES[reading.category];
  const parts = gunghapScoreParts(reading);
  const score = parts.score;
  const stars = Math.min(5, Math.max(1, Math.round(score / 20)));
  const godAtoB = TEXTS.tenGods[reading.godAtoB];
  const godBtoA = TEXTS.tenGods[reading.godBtoA];
  const pair = GUNGHAP_TEXTS.pairs[me.dayMaster][partner.dayMaster];
  const points = GUNGHAP_TEXTS.points[reading.godAtoB];
  const areas = GUNGHAP_TEXTS.areas;
  const branchA = me.pillars.day.branch;
  const branchB = partner.pillars.day.branch;
  const dayKey = `${Math.min(branchA, branchB)}-${Math.max(branchA, branchB)}`;
  const dayText = GUNGHAP_TEXTS.dayPairs[dayKey] || GUNGHAP_TEXTS.dayNone;
  const [dayName, dayPlain] = DAY_LABELS[reading.dayRelation];
  const fill = fillText(reading);
  const rows = scoreRows(reading, parts, me, partner);
  // 태어난 시간을 모르면 여섯 글자로만 세요(친구가 보낸 링크에는 이 정보가 없어서 안내하지 않아요).
  const timeMissing = !snapshot && (me.input?.hour == null || partner.input?.hour == null);
  const mainAreas = relation === "all" ? AREAS : AREAS.filter(([key]) => key === relation);
  const otherAreas = relation === "all" ? [] : AREAS.filter(([key]) => key !== relation);
  const branchLabel = (b) => `${BRANCHES[b]}(${BRANCHES_HANJA[b]}) · ${ANIMALS[b]}`;

  const [hint, setHint] = useState("");
  const [card, setCard] = useState(null);
  const pairText = `나 ${stemLabel(me.dayMaster)} × 상대 ${stemLabel(partner.dayMaster)}`;
  // 공유용 이미지 카드는 결과가 나오자마자 미리 그려 둡니다. 버튼을 누른 뒤에 그리면 기기가
  // "사용자가 누른 동작"으로 보지 않아 공유 창이 막히는 경우가 있어서예요. 카드에는 두 사람의
  // 일간과 풀이만 넣고, 생년월일은 넣지 않아요.
  const cardKey = `${me.dayMaster}-${partner.dayMaster}-${dayKey}-${score}-${relation}`;
  useEffect(() => {
    if (snapshot) return;
    let cancelled = false;
    setCard(null);
    buildGunghapCard({
      pairText,
      title: cat.title,
      score,
      stars,
      summary: `${pair.name} — ${pair.text}`,
      relations: [
        { label: "잘 맞는 점", text: points.good.join(" · ") },
        { label: "조심할 점", text: points.care.join(" · ") },
        { label: `아랫글자(일지) · ${dayName}`, text: dayText },
      ],
      areas: mainAreas.map(([key, label]) => ({ label, text: areas[key][reading.godAtoB] })),
    })
      .then((img) => !cancelled && setCard(img))
      .catch(() => {
        /* 카드를 못 그리면 글로만 공유해요 */
      });
    return () => {
      cancelled = true;
    };
    // 나머지 값은 모두 cardKey에서 정해집니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, snapshot]);

  // 링크에 결과를 담아서, 받은 사람이 생년월일을 넣지 않아도 같은 결과를 보게 합니다.
  const url = `${SITE.url}/gunghap${encodeGunghapLink(me, partner, relation)}`;

  async function share() {
    const shortText = `우리 궁합은 "${cat.title}" (${score}점)\n${pair.name} — ${pair.text}`;
    const fullText = [
      `우리 궁합은 "${cat.title}" (${score}점)이에요.`,
      `${pair.name} — ${pair.text}`,
      ...mainAreas.map(([key, label]) => `· ${label} ${areas[key][reading.godAtoB]}`),
      `· 잘 맞는 점 ${points.good.join(" / ")}`,
      `· 조심할 점 ${points.care.join(" / ")}`,
      `· 아랫글자(일지) ${dayName} ${dayText}`,
      "— 재미로봄 궁합",
    ].join("\n");
    setHint("");
    try {
      const r = await shareResult({
        blob: card?.blob,
        fileName: "jaemirobom-gunghap.png",
        title: "재미로봄 궁합",
        shortText,
        fullText,
        url,
      });
      track("gunghap_shared", { mode: r.mode });
      if (r.mode === "files") {
        setHint(
          r.linkCopied
            ? "링크도 복사해 뒀어요. 사진만 전달됐으면 대화창에 붙여넣어 주세요."
            : "사진만 전달됐으면 '링크 복사' 버튼을 눌러 주소도 함께 보내 주세요."
        );
      } else if (r.mode === "copied") {
        setHint("공유 글과 링크를 복사했어요. 붙여넣어 보내 주세요.");
      }
    } catch (e) {
      if (e.name !== "AbortError") setHint("공유하지 못했어요. '링크 복사' 버튼을 이용해 주세요.");
    }
  }

  async function copyLink() {
    setHint((await copyText(url)) ? "링크를 복사했어요." : "링크를 복사하지 못했어요.");
  }

  return (
    <>
      <section className={`${t.panel} ${g.panel}`} aria-labelledby="gunghap-title">
        <p className={t.date}>두 사람이 태어난 날의 윗글자(일간)로 본 궁합</p>
        <div className={t.match}>
          <div className={t.matchRow}>
            <span className={t.matchChip}>
              <small>태어난 날의 나</small>
              {stemLabel(me.dayMaster)}
            </span>
            <span className={t.matchOp} aria-hidden="true">
              ×
            </span>
            <span className={t.matchChip}>
              <small>태어난 날의 상대</small>
              {stemLabel(partner.dayMaster)}
            </span>
          </div>
          <p className={t.matchResult}>
            상대는 나에게 <b>{GOD_PLAIN[Math.floor(reading.godAtoB / 2)]}</b>({godAtoB.god}), 나는 상대에게{" "}
            <b>{GOD_PLAIN_PARTNER[Math.floor(reading.godBtoA / 2)]}</b>({godBtoA.god})이에요. 태어난 날의 윗글자는
            그 사람 자신을 나타내는 글자라, 풀이는 이 관계로 정해져요.
          </p>
        </div>

        <div className={t.scoreRow}>
          <div className={t.ring} style={{ "--p": score }} role="img" aria-label={`궁합 점수 100점 중 ${score}점`}>
            <span className={t.ringNum}>
              {score}
              <small>점</small>
            </span>
          </div>
          <div className={t.scoreSide}>
            <p className={t.god}>
              내가 보는 상대 · {godAtoB.god}({godAtoB.hanja})
            </p>
            <h2 id="gunghap-title" className={t.title}>
              {cat.title}
            </h2>
            <Stars n={stars} label="종합 궁합" />
          </div>
        </div>

        <div className={t.personal}>
          <p className={t.personalLabel}>{pair.name}</p>
          <p className={t.personalText}>{pair.text}</p>
        </div>
        <p className={t.overall}>{cat.summary}</p>
      </section>

      <section className={`${t.card} ${g.cScore}`} aria-labelledby="gunghap-score-title">
        <h2 id="gunghap-score-title" className={t.cardTitle}>
          점수는 이렇게 나왔어요
        </h2>
        <p className={t.cardLead}>기본 {parts.base}점에서 시작해 네 가지를 더하고 빼요.</p>
        <ul className={g.scoreList}>
          {rows.map(([name, what, value, max]) => (
            <li key={name}>
              <span className={g.scoreName}>
                {name}
                <small>{what}</small>
              </span>
              <span className={g.scoreBar} aria-hidden="true">
                <i
                  className={value < 0 ? g.scoreMinus : undefined}
                  style={{ width: `${Math.min(100, (Math.abs(value) / max) * 100)}%` }}
                />
              </span>
              <b className={value < 0 ? g.minus : undefined}>{value < 0 ? value : `+${value}`}</b>
            </li>
          ))}
        </ul>
        <p className={g.scoreSum}>
          {parts.base} {rows.map(([, , v]) => (v < 0 ? `− ${-v}` : `+ ${v}`)).join(" ")} = <b>{parts.sum}점</b>
          {parts.sum > 100 && " → 최고점인 100점으로 맞췄어요"}
        </p>
        <details className={t.more}>
          <summary>음양·상생·상극이 뭐예요?</summary>
          <p className={g.small}>
            갑·병·무·경·임은 양(陽), 을·정·기·신·계는 음(陰)이에요. 음양이 서로 다르면 짝처럼 맞물린다고 봐서 점수를 더 줘요.
            상생은 한쪽 오행이 다른 쪽을 낳아 주는 사이(나무→불→흙→쇠→물→나무), 상극은 한쪽이 다른 쪽을 다스리는
            사이(나무→흙→물→불→쇠→나무)예요. 이 점수는 전통 개념을 바탕으로 이 사이트가 정한 계산식이라, 관계의 좋고 나쁨을
            판정하지 않아요.
          </p>
        </details>
      </section>

      <section className={`${t.card} ${g.cArea}`} aria-labelledby="gunghap-area-title">
        <h2 id="gunghap-area-title" className={t.cardTitle}>
          {AREA_TITLES[relation]}
        </h2>
        <dl className={t.areas}>
          {mainAreas.map(([key, label]) => (
            <div key={key} className={t.area}>
              {/* 하나만 골랐으면 카드 제목이 이미 그 사이라서 이름을 다시 쓰지 않아요 */}
              <dt className={otherAreas.length ? g.srOnly : undefined}>{label}</dt>
              <dd>{areas[key][reading.godAtoB]}</dd>
            </div>
          ))}
        </dl>
        {otherAreas.length > 0 && (
          <details className={t.more}>
            <summary>다른 사이로 보면</summary>
            <dl className={t.areas}>
              {otherAreas.map(([key, label]) => (
                <div key={key} className={t.area}>
                  <dt>{label}</dt>
                  <dd>{areas[key][reading.godAtoB]}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </section>

      <section className={`${t.card} ${g.cPoints}`} aria-labelledby="gunghap-points-title">
        <h2 id="gunghap-points-title" className={t.cardTitle}>
          잘 맞는 점 · 조심할 점
        </h2>
        <div className={`${t.todo} ${g.todo}`}>
          <div className={t.doBox}>
            <h3>잘 맞는 점</h3>
            <ul>
              {points.good.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className={`${t.dontBox} ${g.care}`}>
            <h3>조심할 점</h3>
            <ul>
              {points.care.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <h3 className={g.subTitle}>함께 하면 좋은 것</h3>
        <ul className={g.chips}>
          {points.together.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className={`${t.card} ${g.cDay}`} aria-labelledby="gunghap-day-title">
        <h2 id="gunghap-day-title" className={t.cardTitle}>
          태어난 날 아랫글자(일지) 궁합
        </h2>
        <p className={t.cardLead}>
          태어난 날은 윗글자(일간)와 아랫글자(일지) 두 글자로 적어요. 윗글자가 그 사람 자신이라면, 아랫글자는 그 사람이 머무는
          자리와 생활 방식을 나타낸다고 봐요.
        </p>
        <div className={g.dayRow}>
          <span className={g.dayChip}>
            <small>나</small>
            {branchLabel(branchA)}
          </span>
          <span className={g.dayOp} aria-hidden="true">
            ↔
          </span>
          <span className={g.dayChip}>
            <small>상대</small>
            {branchLabel(branchB)}
          </span>
        </div>
        <p className={g.dayName}>
          <b>{dayName}</b> · {dayPlain}
        </p>
        <p className={g.para}>{dayText}</p>
      </section>

      <section className={`${t.card} ${g.cElement}`} aria-labelledby="gunghap-el-title">
        <h2 id="gunghap-el-title" className={t.cardTitle}>
          서로 다른 점 · 비슷한 점
        </h2>
        <p className={t.cardLead}>
          태어난 해·달·날(·시간)의 글자를 목·화·토·금·수 다섯 가지 기운(오행)으로 나눠 세어 견줬어요.
        </p>
        <p className={g.para}>{compareText(reading.topElementA, reading.topElementB)}</p>
        <div className={g.fillBox}>
          <p className={g.fillLabel}>
            서로 채워 주는 기운{parts.fill ? ` · +${parts.fill}점` : ""}
          </p>
          <p className={g.small}>{fill}</p>
        </div>
        {timeMissing && (
          <p className={g.small}>
            태어난 시간을 모르는 사람은 여섯 글자로 셌어요. 시간을 넣으면 여덟 글자로 세어서 오행 비교와 &lsquo;서로 채워 주는
            기운&rsquo;, 점수가 그만큼 달라질 수 있어요.
          </p>
        )}
        <div style={{ marginTop: 14 }}>
          {ELEMENTS.map((el, i) => {
            const total = Math.max(...reading.elementsA, ...reading.elementsB, 1);
            return (
              <div key={el} className={styles.compareEl}>
                <p className={styles.compareElName}>
                  {el}({ELEMENTS_HANJA[i]})
                </p>
                {[
                  ["나", reading.elementsA[i]],
                  ["상대", reading.elementsB[i]],
                ].map(([who, n]) => (
                  <div key={who} className={styles.compareElRow}>
                    <span className={styles.compareElWho}>{who}</span>
                    <span className={styles.compareElBar}>
                      <span className={`${styles.compareElFill} ${styles[`sw${i}`]}`} style={{ width: `${(n / total) * 100}%` }} />
                    </span>
                    <span className={styles.compareElCount}>{n}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {!snapshot && (
        <section className={`${t.card} ${g.cShare}`} aria-labelledby="gunghap-share-title">
          <h2 id="gunghap-share-title" className={t.cardTitle}>
            결과 보내기
          </h2>
          <p className={t.cardLead}>
            상대에게 결과를 보내 보세요. 링크에는 생년월일이 들어가지 않고, 받은 사람은 입력 없이 같은 결과를 봐요.
          </p>
          <div className={styles.shareRow}>
            <button type="button" className={styles.cta} onClick={share}>
              친구에게 알려주기
            </button>
            <button type="button" className={styles.ghostSm} onClick={copyLink}>
              링크 복사
            </button>
          </div>
          {hint && <p className={styles.shareHint}>{hint}</p>}
        </section>
      )}

      <p className={g.disclaimer}>
        사주의 전통적인 개념을 바탕으로 이 사이트가 만든 재미용 풀이와 점수예요. 관계의 좋고 나쁨을 판정하는 결과가 아니니,
        재미로만 봐 주세요.
      </p>
    </>
  );
}
