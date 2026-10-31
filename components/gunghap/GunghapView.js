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
  STEM_ELEMENT,
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

// 일지(태어난 날의 아랫글자) 관계 이름과, 사주를 처음 보는 사람도 그림이 그려지는 설명
const DAY_LABELS = {
  same: ["같은 글자", "두 사람의 아랫글자가 똑같아서 생활 리듬이 닮았다고 봐요"],
  six: ["육합(六合)", "열두 글자 가운데 서로 짝이 되어 끌어당기는 두 글자예요(이런 짝이 여섯 쌍 있어요)"],
  three: [
    "반합(半合)",
    "열두 글자는 세 글자씩 네 무리로 모여 한 가지 기운을 이뤄요. 두 사람은 같은 무리의 두 글자라 같은 방향을 본다고 봐요",
  ],
  clash: ["충(沖)", "열두 글자를 시계처럼 둥글게 놓았을 때 정반대에 있는 두 글자라, 성향이 반대라고 봐요"],
  none: ["무난", "특별히 끌어당기지도 부딪히지도 않는 두 글자예요"],
};
// 점수 카드에 쓰는 짧은 말
const DAY_SHORT = {
  same: "아랫글자가 같은 글자예요",
  six: "서로 끌어당기는 짝이에요(육합)",
  three: "같은 무리로 모이는 두 글자예요(반합)",
  clash: "정반대 자리의 두 글자예요(충)",
  none: "특별히 얽히지 않는 두 글자예요",
};
// 아랫글자 열두 개가 뜻하는 계절 속 자연의 모습
const BRANCH_PLAIN = [
  "한겨울의 깊은 물",
  "겨울 끝의 언 땅",
  "이른 봄의 나무",
  "봄꽃 핀 나무",
  "늦봄의 촉촉한 흙",
  "초여름의 불",
  "한여름의 불",
  "늦여름의 마른 흙",
  "초가을의 단단한 쇠",
  "가을의 반짝이는 쇠붙이",
  "늦가을의 단단한 흙",
  "초겨울의 넓은 물",
];

// 오행을 처음 보는 사람도 알 수 있게: [자연물, 어떤 기운, 사람으로 치면]
const EL_PLAIN = [
  ["나무", "자라고 뻗어 가는 기운", "새로 시작하고 키우는 힘"],
  ["불", "뜨겁고 밝게 퍼지는 기운", "열정과 표현력"],
  ["흙", "받쳐 주고 모으는 기운", "믿음직함과 꾸준함"],
  ["쇠", "단단하고 맺고 끊는 기운", "결단력과 원칙"],
  ["물", "흐르고 스며드는 기운", "깊은 생각과 유연함"],
];
// i가 i+1을 낳는 모습(상생), i가 i+2를 다스리는 모습(상극)
const EL_GEN = ["나무가 불을 피우듯", "불이 타고 남은 재가 흙이 되듯", "흙 속에서 쇠가 나오듯", "차가운 쇠에 물방울이 맺히듯", "물이 나무를 키우듯"];
const EL_CTRL = ["나무뿌리가 흙을 파고들듯", "흙이 물길을 막듯", "물이 불을 끄듯", "불이 쇠를 녹이듯", "쇠가 나무를 베듯"];
const elWord = (i) => `${EL_PLAIN[i][0]}(${ELEMENTS[i]})`;

// 점수 줄마다 최고점(막대 길이 기준)
const SCORE_MAX = { element: 22, polarity: 10, day: 15, fill: 6 };

/** 오행 두 개 사이의 관계: 0 같음 1 A가B를생함 2 A가B를극함 3 B가A를극함 4 B가A를생함 */
function elementRel(elA, elB) {
  return (elB - elA + 5) % 5;
}

function compareText(topA, topB) {
  if (topA === topB) {
    return `두 사람 모두 ${elWord(topA)}, 곧 ${EL_PLAIN[topA][1]}이 가장 많아요. 둘 다 ${EL_PLAIN[topA][2]}이 두드러진 편이라 통하는 부분이 클 거예요.`;
  }
  const lead = `나에게는 ${elWord(topA)} 기운이, 상대에게는 ${elWord(topB)} 기운이 가장 많아요.`;
  const rel = elementRel(topA, topB);
  if (rel === 1) return `${lead} ${EL_GEN[topA]} 내 쪽 기운이 상대 기운을 북돋아 주는 조합이에요.`;
  if (rel === 4) return `${lead} ${EL_GEN[topB]} 상대 쪽 기운이 내 기운을 북돋아 주는 조합이에요.`;
  if (rel === 2) return `${lead} ${EL_CTRL[topA]} 내 쪽 기운이 상대 기운을 누르는 사이라, 속도를 맞춰 가는 과정이 필요해요.`;
  return `${lead} ${EL_CTRL[topB]} 상대 쪽 기운이 내 기운을 누르는 사이라, 속도를 맞춰 가는 과정이 필요해요.`;
}

/** 오행 보완 풀이: 서로에게 없는 오행을 상대가 넉넉히(두 개 이상) 가지고 있는지 */
function fillText(reading) {
  const { lackA = [], lackB = [], fillA = null, fillB = null } = reading;
  if (!lackA.length && !lackB.length) {
    return "두 사람 모두 다섯 가지 기운을 고루 가지고 있어서, 서로 채워 줘야 할 빈자리가 크지 않아요.";
  }
  const side = (lack, fill, who, other) => {
    if (!lack.length) return `${who}는 다섯 가지 기운을 고루 가지고 있어요.`;
    if (fill !== null) return `${who}에게 없는 ${elWord(fill)} 기운을 ${other === "나" ? "내가" : "상대가"} 넉넉히 가지고 있어요.`;
    return `${who}에게 없는 ${lack.map(elWord).join("·")} 기운은 ${other}에게도 많지 않아요.`;
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

/** 점수 항목별 줄: [이름, 우리 둘은 어땠는지, 다른 경우엔 몇 점인지, 점수, 최고점] */
function scoreRows(reading, parts, me, partner) {
  const cat = reading.category;
  const a = STEM_ELEMENT[me.dayMaster];
  const b = STEM_ELEMENT[partner.dayMaster];
  const element =
    cat === 0
      ? `둘 다 ${elWord(a)} 기운이라 같은 편이에요`
      : cat === 1
        ? `${EL_GEN[a]} 내 ${elWord(a)} 기운이 상대의 ${elWord(b)} 기운을 낳아 줘요`
        : cat === 4
          ? `${EL_GEN[b]} 상대의 ${elWord(b)} 기운이 내 ${elWord(a)} 기운을 낳아 줘요`
          : cat === 2
            ? `${EL_CTRL[a]} 내 ${elWord(a)} 기운이 상대의 ${elWord(b)} 기운을 다스려요`
            : `${EL_CTRL[b]} 상대의 ${elWord(b)} 기운이 내 ${elWord(a)} 기운을 다스려요`;
  const polarity = reading.samePolarity
    ? me.dayMaster % 2 === 0
      ? "둘 다 양(陽) — 밝고 힘차게 나서는 쪽이에요"
      : "둘 다 음(陰) — 차분하고 부드럽게 받는 쪽이에요"
    : "한 사람은 양(나서는 쪽), 한 사람은 음(받는 쪽)이라 짝이 맞아요";
  const filled = ((reading.fillA ?? null) !== null) + ((reading.fillB ?? null) !== null);
  return [
    ["두 사람을 나타내는 글자의 기운", element, "같은 편 +8 · 낳아 주는 사이 +22 · 다스리는 사이 +7", parts.element, SCORE_MAX.element],
    ["음과 양", polarity, "서로 다르면 +10 · 같으면 +4", parts.polarity, SCORE_MAX.polarity],
    [
      "태어난 날 아랫글자끼리",
      DAY_SHORT[reading.dayRelation],
      "끌어당기는 짝·같은 무리 +15 · 같은 글자 +4 · 그 밖 +2 · 정반대 −12",
      parts.day,
      SCORE_MAX.day,
    ],
    [
      "서로 없는 기운 채워 주기",
      filled === 2 ? "서로의 빈 기운을 채워 줘요" : filled === 1 ? "한쪽이 다른 쪽의 빈 기운을 채워 줘요" : "서로 빈 기운을 채워 주지는 못해요",
      "한 사람에게 없는 기운을 상대가 두 개 이상 가졌으면 +3씩",
      parts.fill,
      SCORE_MAX.fill,
    ],
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
    // 메신저에서 한눈에 읽히도록 묶음마다 [제목]을 달고 빈 줄로 나눠요.
    const head = `우리 궁합 ${score}점\n"${cat.title}"`;
    const shortText = `${head}\n\n[${pair.name}]\n${pair.text}`;
    const fullText = [
      head,
      `[${pair.name}]\n${pair.text}`,
      ...mainAreas.map(([key]) => `[${AREA_TITLES[key]}]\n${areas[key][reading.godAtoB]}`),
      `[잘 맞는 점]\n${points.good.map((t) => `- ${t}`).join("\n")}`,
      `[조심할 점]\n${points.care.map((t) => `- ${t}`).join("\n")}`,
      `[아랫글자(일지) 궁합 · ${dayName}]\n${reading.dayRelation === "none" ? `${dayPlain}. ` : ""}${dayText}`,
      "— 재미로봄 궁합",
    ].join("\n\n");
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
        <p className={t.cardLead}>
          기본 {parts.base}점에서 시작해 네 가지를 더하고 빼요. 줄마다 우리 둘은 어땠는지, 다른 경우엔 몇 점인지 적었어요.
        </p>
        <ul className={g.scoreList}>
          {rows.map(([name, what, rule, value, max]) => (
            <li key={name}>
              <span className={g.scoreName}>
                {name}
                <span className={g.scoreWhat}>{what}</span>
                <small>{rule}</small>
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
          {parts.base} {rows.map(([, , , v]) => (v < 0 ? `− ${-v}` : `+ ${v}`)).join(" ")} = <b>{parts.sum}점</b>
          {parts.sum > 100 && " → 최고점인 100점으로 맞췄어요"}
        </p>
        <details className={t.more}>
          <summary>오행·음양이 뭐예요?</summary>
          <p className={g.small}>
            사주에서는 세상 모든 것을 나무(목)·불(화)·흙(토)·쇠(금)·물(수) 다섯 가지 기운, 곧 오행으로 나눠요. 서로 낳아
            주는 순서(상생)는 나무→불→흙→쇠→물→나무예요. 나무가 불을 피우고, 타고 남은 재가 흙이 되고, 흙 속에서 쇠가 나오고,
            차가운 쇠에 물방울이 맺히고, 물이 나무를 키운다고 봐요. 다스리는 순서(상극)는 나무→흙→물→불→쇠→나무예요. 뿌리가
            흙을 파고들고, 흙이 물길을 막고, 물이 불을 끄고, 불이 쇠를 녹이고, 쇠가 나무를 벤다고 봐요.
          </p>
          <p className={g.small}>
            음양은 밝고 힘차게 나서는 쪽(양: 갑·병·무·경·임)과 차분하고 부드럽게 받는 쪽(음: 을·정·기·신·계)이에요. 서로
            다르면 짝처럼 맞물린다고 봐서 점수를 더 줘요. 이 점수는 전통 개념을 바탕으로 이 사이트가 정한 계산식이라, 관계의
            좋고 나쁨을 판정하지 않아요.
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
              <dt className={otherAreas.length ? g.srOnly : undefined}>
                <span className={`${g.tag} ${g[`tag_${key}`]}`}>{label}</span>
              </dt>
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
                  <dt>
                    <span className={`${g.tag} ${g[`tag_${key}`]}`}>{label}</span>
                  </dt>
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
          태어난 날은 윗글자(일간)와 아랫글자(일지) 두 글자로 적어요. 윗글자가 그 사람 자신이라면, 아랫글자는 생활 방식과
          가까운 사람을 대하는 방식을 나타낸다고 봐요. 아랫글자는 열두 가지가 있고, 저마다 계절 속 자연의 모습을 뜻해요.
        </p>
        <div className={g.dayRow}>
          <span className={g.dayChip}>
            <small>나</small>
            {BRANCHES[branchA]}({BRANCHES_HANJA[branchA]})
            <em>{BRANCH_PLAIN[branchA]}</em>
          </span>
          <span className={g.dayOp} aria-hidden="true">
            ↔
          </span>
          <span className={g.dayChip}>
            <small>상대</small>
            {BRANCHES[branchB]}({BRANCHES_HANJA[branchB]})
            <em>{BRANCH_PLAIN[branchB]}</em>
          </span>
        </div>
        <p className={g.dayName}>
          <b>{dayName}</b>
          {dayPlain}
        </p>
        <p className={g.para}>{dayText}</p>
      </section>

      <section className={`${t.card} ${g.cElement}`} aria-labelledby="gunghap-el-title">
        <h2 id="gunghap-el-title" className={t.cardTitle}>
          서로 다른 점 · 비슷한 점
        </h2>
        <p className={t.cardLead}>
          태어난 해·달·날(·시간)의 글자를 다섯 가지 기운(오행)으로 나눠 세어 견줬어요. 많은 기운일수록 그 성향이 두드러진다고
          봐요.
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
                  {el}({ELEMENTS_HANJA[i]}) · {EL_PLAIN[i][0]}
                  <span className={g.elPlain}>
                    {EL_PLAIN[i][1]} — {EL_PLAIN[i][2]}
                  </span>
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
