"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import ds from "./dream.module.css";
import DreamArt from "./DreamArt";
import { useDreamEngine } from "./DreamSearch";
import TEXTS from "@/lib/dream/symbols.json";
import { MAX_SELECT, synthesisBucket } from "@/lib/dream/select";
import { PAGE_IDS, dreamHref } from "@/lib/dream/pageIds";

const SYMBOL_BY_ID = Object.fromEntries(TEXTS.symbols.map((s) => [s.id, s]));
const SIMILAR_MAX = 6;

// 상세 페이지 글(약 300KB)은 첫 화면에서 받지 않고, 검색 결과를 볼 때 한 번만 불러옵니다.
let pagesPromise = null;
let pagesReady = null;
function loadPages() {
  pagesPromise ??= import("@/lib/dream/pages.json")
    .then((m) => (pagesReady = m.default))
    .catch((e) => {
      pagesPromise = null;
      throw e;
    });
  return pagesPromise;
}

/** 가장 비슷한 장면 — 1등이 뚜렷할 때만(여러 장면이 똑같이 맞으면 굳이 하나를 고르지 않음) */
function bestSituation(r) {
  const [a, b] = r.situations;
  if (!a || a.score < 0.5 || !PAGE_IDS.includes(r.id)) return null;
  if (b && a.score - b.score < 0.05) return null;
  return a;
}

/**
 * 문장 검색 결과 화면.
 *  - 남색 판: 가장 비슷한 꿈 하나를 크게(적어 준 꿈과 가장 비슷한 장면이 메인·짧은 풀이·전통 해몽·요즘 식으로) + 꿈에 상징이 여럿 나왔으면 묶어 본 종합 흐름
 *  - 흰 바탕: 비슷한 꿈(누르면 그 꿈이 결과로 바뀜) + 장면 직접 고르기
 * bar: 판 맨 위에 붙일 검색 막대(처음으로 + 작은 검색창)
 * onSearch(q): 다른 꿈으로 다시 찾기 / onPickScenes(): 첫 화면의 장면 고르기로
 */
export default function DreamSearchResult({ bar, titles, query, onSearch, onPickScenes }) {
  const { engine, failed: engineFailed, warmUp } = useDreamEngine(titles);
  const [pages, setPages] = useState(pagesReady);
  const [pagesFailed, setPagesFailed] = useState(false);

  useEffect(() => {
    warmUp();
    if (!pagesReady) loadPages().then(setPages, () => setPagesFailed(true));
  }, [warmUp]);

  const results = engine ? engine.search(query) : null;

  useEffect(() => {
    if (results) track("dream_searched", { found: results.results.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, query]);

  if (engineFailed || pagesFailed) {
    return (
      <AnswerPanel bar={bar}>
        <p className={ds.answerLead}>
          검색 준비 중에 문제가 생겼어요. 페이지를 새로 고치거나, 처음 화면에서 장면을 직접 골라 주세요.
        </p>
      </AnswerPanel>
    );
  }
  if (!results || !pages) {
    return (
      <AnswerPanel bar={bar}>
        <p className={ds.answerLead}>꿈을 찾고 있어요…</p>
      </AnswerPanel>
    );
  }

  const found = results.results;
  if (found.length === 0) {
    // 글자가 조금만 겹친 추천("어제 꾼 꿈" → 음식 꿈)은 엉뚱해 보여서 뺍니다(자모 자동 완성 추천은 0점이라 그대로 둠).
    const tips = results.suggestions.filter((s) => s.score === 0 || s.score >= 0.25).map((s) => s.id);
    return (
      <>
        <AnswerPanel bar={bar}>
          <p className={ds.answerKicker}>꿈해몽 결과</p>
          <h1 className={ds.answerTitle}>‘{query}’에 딱 맞는 꿈을 찾지 못했어요</h1>
          <p className={ds.answerLead}>
            꿈에 나온 것(뱀·이빨·돈처럼)이나 한 일(쫓기다·떨어지다처럼)을 넣어 다시 찾아보세요.
          </p>
        </AnswerPanel>
        <Similar title="혹시 이런 꿈이었나요?" ids={tips} onSearch={onSearch} onPickScenes={onPickScenes} />
      </>
    );
  }

  const main = found[0];
  const s = SYMBOL_BY_ID[main.id];
  const page = pages[main.id];
  const scene = bestSituation(main);
  const sceneText = scene && page?.situations[scene.index]?.text;
  // 꿈에 상징 이름이 여럿 직접 나왔으면("뱀이 집에 들어왔어") 한데 묶어 본 종합 흐름도 보여 줘요
  const named = found.filter((r) => r.via === "symbol").map((r) => r.id).slice(0, MAX_SELECT);
  const combo = named.length >= 2 ? named : null;
  const synthesis = combo && TEXTS.synthesis[synthesisBucket(combo.map((id) => SYMBOL_BY_ID[id].luck))];
  const similar = [...found.slice(1).map((r) => r.id), ...(page?.related || [])];

  return (
    <>
      <AnswerPanel bar={bar}>
        <p className={ds.answerKicker}>‘{query}’ 꿈해몽</p>
        <div className={ds.mainHead}>
          <DreamArt id={s.id} alt="" className={ds.mainArt} eager />
          <div className={ds.mainNames}>
            <h1 className={ds.mainName}>{page?.searchName ? `${page.searchName} 해몽` : s.label}</h1>
            <p className={ds.mainKeyword}>{s.keyword}</p>
            {!s.sensitive && <span className={`${ds.luckBadge} ${ds[`luck${s.luck}`]}`}>{TEXTS.luckLabels[s.luck]}</span>}
          </div>
        </div>

        {/* 가까운 분을 떠나보낸 사람이 가장 먼저 보도록 맨 위에 둡니다(상세 페이지와 같은 원칙) */}
        {page?.care && <p className={ds.answerCare}>{page.care}</p>}

        {/* 적어 준 꿈과 가장 비슷한 장면이 있으면 그게 이 결과의 메인 — 맨 앞에 크게 */}
        {sceneText ? (
          <>
            <div className={ds.sceneMain}>
              <p className={ds.sceneMainLabel}>적어 주신 꿈과 가장 비슷한 장면</p>
              <h2 className={ds.sceneMainTitle}>{scene.title}</h2>
              <p className={ds.sceneMainText}>{sceneText}</p>
            </div>
            <h2 className={ds.answerSub}>{page.searchName} 전반으로 보면</h2>
            <p className={ds.answerText}>{s.text}</p>
          </>
        ) : (
          <p className={ds.mainLead}>{s.text}</p>
        )}

        {page && (
          <>
            <h2 className={ds.answerSub}>전통 해몽에서는</h2>
            <p className={ds.answerText}>{page.meaning}</p>
            <h2 className={ds.answerSub}>요즘 식으로 보면</h2>
            <p className={ds.answerText}>{page.modern}</p>
            {page.helpline && <p className={ds.answerCare}>{page.helpline}</p>}
            <Situations key={`${query}-${main.id}`} id={main.id} page={page} highlight={scene?.index} />
          </>
        )}

        {synthesis && (
          <div className={ds.comboBox}>
            <p className={ds.sceneBoxLabel}>꿈에 함께 나온 것까지 묶어 보면</p>
            <p className={ds.comboChips}>
              {combo.map((id) => (
                <span key={id}>{SYMBOL_BY_ID[id].label}</span>
              ))}
            </p>
            <h2 className={ds.sceneBoxTitle}>{synthesis.title}</h2>
            <p className={ds.answerText}>{synthesis.text}</p>
          </div>
        )}

        <p className={ds.answerNote}>{TEXTS.disclaimer}</p>
      </AnswerPanel>

      <Similar title="비슷한 꿈도 살펴보세요" ids={similar} exclude={main.id} onSearch={onSearch} onPickScenes={onPickScenes} />
    </>
  );
}

/** 남색 결과 판 — 맨 위 검색 막대(bar)부터 결과까지 한 판에 담아 어디까지가 결과인지 보이게 해요 */
export function AnswerPanel({ bar, children }) {
  return (
    <section className={ds.answer} aria-label="꿈해몽 결과">
      <span className={ds.answerStars} aria-hidden="true" />
      {bar}
      <div className={ds.answerBody}>{children}</div>
    </section>
  );
}

/** 상황별 풀이 — 다른 페이지로 넘어가지 않고 결과 판 안에서 아래로 펼쳐요 */
function Situations({ id, page, highlight }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  const listId = useId();

  function close() {
    setOpen(false);
    // 긴 목록 맨 아래에서 접으면 화면이 휙 올라가지 않게 펼치기 버튼 자리로 돌아가요
    requestAnimationFrame(() => toggleRef.current?.scrollIntoView({ block: "center" }));
  }

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={ds.answerBtn}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? `${page.searchName} 풀이 접기` : `${page.searchName} 풀이 ${page.situations.length}가지 모두 보기`}
        <span className={`${ds.answerBtnIcon} ${open ? ds.answerBtnIconOpen : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div id={listId}>
          <ol className={ds.sitList}>
            {page.situations.map((it, i) => (
              <li key={it.title} className={`${ds.sitItem} ${i === highlight ? ds.sitItemOn : ""}`}>
                <span className={ds.sitNum} aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  {i === highlight && <p className={ds.sceneBoxLabel}>적어 주신 꿈과 가장 비슷한 장면</p>}
                  <h3 className={ds.sitTitle}>{it.title}</h3>
                  <p className={ds.answerText}>{it.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={ds.sitFoot}>
            <button type="button" className={ds.answerCopy} onClick={close}>
              접기 ▴
            </button>
            <Link href={dreamHref(id)} className={ds.sitPageLink}>
              {page.searchName} 해몽 페이지 따로 보기 →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

/** 흰 바탕의 비슷한 꿈 목록 — 누르면 그 꿈이 결과로 바뀌어요 */
function Similar({ title, ids, exclude, onSearch, onPickScenes }) {
  const list = [...new Set(ids)].filter((id) => id !== exclude && SYMBOL_BY_ID[id]).slice(0, SIMILAR_MAX);
  return (
    <section className={ds.similar} aria-labelledby="dream-similar-title">
      {list.length > 0 && (
        <>
          <h2 id="dream-similar-title" className={ds.sectionHead}>
            {title}
          </h2>
          <ul className={ds.similarList}>
            {list.map((id) => {
              const s = SYMBOL_BY_ID[id];
              return (
                <li key={id}>
                  <button type="button" className={ds.similarCard} onClick={() => onSearch(s.label)}>
                    <DreamArt id={id} small className={ds.similarArt} />
                    <span className={ds.similarText}>
                      <strong>{s.label}</strong>
                      <span>{s.keyword}</span>
                    </span>
                    <span className={ds.similarArrow} aria-hidden="true">
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className={ds.similarFoot}>
        찾던 꿈이 아닌가요?{" "}
        <button type="button" className={ds.textLink} onClick={onPickScenes}>
          꿈에 나온 장면을 직접 골라 보기
        </button>
        <br />
        <small>‘안 빠졌어’처럼 아니라는 말은 아직 구분하지 못해요.</small>
      </p>
    </section>
  );
}
