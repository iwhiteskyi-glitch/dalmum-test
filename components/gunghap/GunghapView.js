"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import styles from "@/components/fortune/fortune.module.css";
import TEXTS from "@/lib/fortune/texts.json";
import GUNGHAP_TEXTS from "@/lib/fortune/gunghapTexts.json";
import { buildGunghapCard } from "@/lib/fortune/fortuneCard";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { encodeGunghapLink, decodeGunghapLink } from "@/lib/fortune/resultLink";
import { SITE } from "@/lib/site";
import { keepResult, restoreOnBack } from "@/lib/backRestore";
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

  function onSubmitted(meSaju, partnerSaju, gender, areas) {
    const reading = gunghapReading(meSaju, partnerSaju);
    const next = { me: meSaju, partner: partnerSaju, reading, gender, areas };
    setResult(next);
    keepResult("gunghap", next);
    // 내 결과를 보기 시작하면 친구 결과와 링크 흔적을 지웁니다.
    setShared(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
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
      {shared && (
        <>
          <p className={styles.sharedNote}>
            친구가 보낸 <b>궁합 결과</b>예요. 아래에서 나도 바로 볼 수 있어요.
          </p>
          <div className={styles.result}>
            <GunghapResult {...shared} snapshot />
          </div>
          <p className={styles.sectionDivider}>나도 궁합 보기</p>
        </>
      )}
      <GunghapForm onSubmitted={onSubmitted} />
      <div id="gunghap-result" className={styles.result} aria-live="polite">
        {result && <GunghapResult {...result} />}
      </div>
    </>
  );
}

/** snapshot: 친구가 보낸 링크로 보는 결과 — 공유 버튼 없이 결과만 보여 줍니다. */
function GunghapResult({ me, partner, reading, gender, areas, snapshot = false }) {
  const cat = CATEGORIES[reading.category];
  const score = gunghapScore(reading);
  const stars = Math.min(5, Math.max(1, Math.round(score / 20)));
  const godAtoB = TEXTS.tenGods[reading.godAtoB];
  const godBtoA = TEXTS.tenGods[reading.godBtoA];
  const dayText = DAY_RELATIONS[reading.dayRelation];
  const [hint, setHint] = useState("");
  const [card, setCard] = useState(null);

  const pairText = `${STEMS[me.dayMaster]}(${STEMS_HANJA[me.dayMaster]}) × ${STEMS[partner.dayMaster]}(${
    STEMS_HANJA[partner.dayMaster]
  })`;
  const shownAreas = AREAS.filter(([key]) => areas[key]);
  // 공유용 이미지 카드는 결과가 나오자마자 미리 그려 둡니다. 버튼을 누른 뒤에 그리면 기기가
  // "사용자가 누른 동작"으로 보지 않아 공유 창이 막히는 경우가 있어서예요. 카드에는 두 사람의
  // 일간과 풀이만 넣고, 생년월일·성별은 넣지 않아요.
  const cardKey = `${me.dayMaster}-${partner.dayMaster}-${reading.dayRelation}-${shownAreas.map(([k]) => k).join("")}`;
  useEffect(() => {
    if (snapshot) return;
    let cancelled = false;
    setCard(null);
    buildGunghapCard({
      pairText,
      title: cat.title,
      score,
      stars,
      summary: cat.summary,
      relations: [
        { label: `내가 보는 상대 · ${godAtoB.god}(${godAtoB.hanja})`, text: godAtoB.meaning },
        { label: `상대가 보는 나 · ${godBtoA.god}(${godBtoA.hanja})`, text: godBtoA.meaning },
        { label: "일지 관계", text: dayText },
      ],
      areas: shownAreas.map(([key, label]) => ({ label, text: cat[key] })),
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
  const url = `${SITE.url}/gunghap${encodeGunghapLink(me, partner, areas)}`;

  async function share() {
    const shortText = `우리 궁합은 "${cat.title}" (${score}점)\n${cat.summary}`;
    const fullText = [
      `우리 궁합은 "${cat.title}" (${score}점)이에요.`,
      cat.summary,
      `· 내가 보는 상대 (${godAtoB.god}·${godAtoB.hanja}) ${godAtoB.meaning}`,
      `· 상대가 보는 나 (${godBtoA.god}·${godBtoA.hanja}) ${godBtoA.meaning}`,
      `· 일지 관계 ${dayText}`,
      ...shownAreas.map(([key, label]) => `· ${label} ${cat[key]}`),
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
      <section className={styles.todayCard} aria-labelledby="gunghap-title">
        <div className={styles.todayHead}>
          <p className={styles.todayDate}>
            나{gender && `(${gender.me})`} {STEMS[me.dayMaster]}({STEMS_HANJA[me.dayMaster]}) × 상대
            {gender && `(${gender.partner})`} {STEMS[partner.dayMaster]}({STEMS_HANJA[partner.dayMaster]})
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
            사주의 전통적인 개념을 바탕으로 이 사이트가 만든 재미용 참고 점수예요. 관계의 좋고
            나쁨을 판정하는 결과가 아니니, 재미로만 봐 주세요.
          </p>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="area-title">
        <h2 id="area-title" className={styles.blockTitle}>
          영역별 궁합
        </h2>
        {shownAreas.map(([key, label]) => (
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
