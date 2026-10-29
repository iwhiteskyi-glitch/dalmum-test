"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "@/components/fortune/fortune.module.css";
import ds from "./dream.module.css";
import DreamArt from "./DreamArt";
import TEXTS from "@/lib/dream/symbols.json";
import { MAX_SELECT } from "@/lib/dream/select";
import { PAGE_IDS, dreamHref } from "@/lib/dream/pageIds";

const SYMBOL_BY_ID = Object.fromEntries(TEXTS.symbols.map((s) => [s.id, s]));

// 많이 찾는 꿈(검색창 아래 바로가기). 서치 콘솔에 꿈해몽 검색어가 쌓이면 그 순서로 바꿉니다.
const POPULAR_QUERIES = ["뱀 꿈", "이빨 빠지는 꿈", "똥 꿈", "돼지 꿈", "죽는 꿈", "전 애인 꿈", "돈 줍는 꿈", "임신 꿈"];
const EXAMPLE = "뱀이 나를 물었어"; // 휴대폰 검색창에서도 잘리지 않을 길이

// 최근 검색어 — 이 브라우저(localStorage)에만 두고 서버로는 보내지 않아요. 지우기 버튼으로 언제든 삭제.
const RECENT_KEY = "dream-recent-searches";
const RECENT_MAX = 5;

function readRecent() {
  try {
    const v = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function writeRecent(list) {
  try {
    if (list.length) window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    else window.localStorage.removeItem(RECENT_KEY);
  } catch {
    /* 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)에서는 기억하지 않아요 */
  }
}

// 검색 엔진과 비슷한 말 사전(약 80KB)은 첫 화면에서 받지 않고, 검색창을 처음 누를 때 불러옵니다.
let enginePromise = null;
function loadEngine(titles) {
  enginePromise ??= Promise.all([import("@/lib/dream/search"), import("@/lib/dream/aliases.json")])
    .then(([m, aliases]) => m.createDreamSearch({ symbols: TEXTS.symbols, aliases: aliases.default, titles }))
    .catch((e) => {
      enginePromise = null;
      throw e;
    });
  return enginePromise;
}

/** 가장 비슷한 장면 — 1등이 뚜렷할 때만(여러 장면이 똑같이 맞으면 굳이 하나를 고르지 않음) */
function bestSituation(r) {
  const [a, b] = r.situations;
  if (!a || a.score < 0.5 || !PAGE_IDS.includes(r.id)) return null;
  if (b && a.score - b.score < 0.05) return null;
  return a;
}

/**
 * 꿈해몽 첫 화면의 밤하늘 히어로 + 문장 검색창 + 검색 결과.
 * query: 검색한 문장(부모가 들고 있어서 결과를 본 뒤 뒤로 가기로 와도 그대로 남아요)
 * onCombine(ids): 검색 결과에서 고른 꿈들을 한데 묶어 종합 해몽 보기
 */
export default function DreamSearch({ titles, query, onSearch, onCombine, showResults = true }) {
  const [text, setText] = useState(query);
  const [engine, setEngine] = useState(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  function warmUp() {
    if (engine) return;
    loadEngine(titles)
      .then((e) => {
        setEngine(e);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }

  // 뒤로 가기로 돌아와 검색어가 이미 있으면 바로 엔진을 불러 결과를 다시 보여 줍니다.
  useEffect(() => {
    setText(query);
    if (query) warmUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const results = useMemo(() => (engine && query ? engine.search(query) : null), [engine, query]);
  const typed = text.trim();
  const suggestions = useMemo(
    () => (engine && open && typed && typed !== query ? engine.suggest(typed, 6) : []),
    [engine, open, typed, query]
  );

  function submit(q) {
    const value = q.trim();
    if (!value) return;
    setText(value);
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur(); // 휴대폰 자판을 내려서 결과가 보이게
    warmUp();
    onSearch(value);
    const next = [value, ...recent.filter((x) => x !== value)].slice(0, RECENT_MAX);
    setRecent(next);
    writeRecent(next);
    requestAnimationFrame(() => {
      document.getElementById("dream-search-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function onKeyDown(e) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      submit(suggestions[active].text);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && suggestions.length > 0;

  return (
    <>
      <section className={ds.hero} id="dream-search">
        <span className={ds.heroMoon} aria-hidden="true" />
        <p className={ds.heroKicker}>꿈해몽 · 99가지 상징</p>
        <h1 className={ds.heroTitle}>지난밤 꿈, 무슨 뜻이었을까?</h1>
        <p className={ds.heroLead}>
          기억나는 꿈을 문장 그대로 적어 보세요. 가장 비슷한 꿈과 장면을 찾아 전통 해몽 방식으로 풀어
          드려요.
        </p>

        <form
          className={ds.searchForm}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
        >
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            className={ds.searchInput}
            placeholder={`예) ${EXAMPLE}`}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
              setActive(-1);
              warmUp();
            }}
            onFocus={() => {
              setOpen(true);
              warmUp();
            }}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-label="꿈 내용 검색"
            aria-autocomplete="list"
            aria-expanded={showList}
            aria-controls={listId}
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            maxLength={100}
          />
          <button type="submit" className={ds.searchBtn}>
            해몽 찾기
          </button>
          {showList && (
            <ul id={listId} role="listbox" className={ds.suggestList} aria-label="추천 검색어">
              {suggestions.map((s, i) => (
                <li
                  key={`${s.type}-${s.id}-${s.index ?? ""}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`${ds.suggestItem} ${i === active ? ds.suggestItemOn : ""}`}
                  // 누르는 순간 입력창의 blur로 목록이 닫히지 않도록 mousedown에서 막아요
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => submit(s.text)}
                >
                  <DreamArt id={s.id} small className={ds.suggestArt} />
                  <span className={ds.suggestText}>{s.text}</span>
                  <span className={ds.suggestType}>{s.type === "symbol" ? "꿈" : "장면"}</span>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className={ds.heroChips}>
          <span className={ds.heroChipsLabel}>많이 찾는 꿈</span>
          {POPULAR_QUERIES.map((q) => (
            <button key={q} type="button" className={ds.heroChip} onClick={() => submit(q)}>
              {q}
            </button>
          ))}
        </div>
        {recent.length > 0 && (
          <div className={ds.heroChips}>
            <span className={ds.heroChipsLabel}>최근 검색</span>
            {recent.map((q) => (
              <button key={q} type="button" className={`${ds.heroChip} ${ds.heroChipRecent}`} onClick={() => submit(q)}>
                {q}
              </button>
            ))}
            <button
              type="button"
              className={ds.heroChipClear}
              onClick={() => {
                setRecent([]);
                writeRecent([]);
              }}
            >
              지우기
            </button>
          </div>
        )}
        <p className={ds.heroNote}>
          적은 내용은 이 브라우저 안에서만 찾고, 서버로 보내지 않아요. 최근 검색어도 이 기기에만 남아요.
        </p>
      </section>

      {showResults && query && (
        <section id="dream-search-results" className={ds.results} aria-live="polite" aria-labelledby="dream-results-title">
          {failed ? (
            <p className={ds.resultsEmpty}>
              검색 준비 중에 문제가 생겼어요. 페이지를 새로 고치거나, 아래에서 장면을 직접 골라 주세요.
            </p>
          ) : !results ? (
            <p className={ds.resultsEmpty}>꿈을 찾고 있어요…</p>
          ) : (
            <SearchResults key={query} query={query} results={results} onCombine={onCombine} onSearch={submit} />
          )}
        </section>
      )}
    </>
  );
}

function SearchResults({ query, results, onCombine, onSearch }) {
  const found = results.results;
  // 상징 이름이 직접 나온 꿈은 처음부터 골라 둡니다(장면만 비슷한 꿈은 직접 고르게).
  const [picked, setPicked] = useState(() =>
    found.filter((r) => r.via === "symbol").slice(0, MAX_SELECT).map((r) => r.id)
  );

  useEffect(() => {
    track("dream_searched", { found: found.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_SELECT ? prev : [...prev, id]
    );
  }

  if (found.length === 0) {
    // 글자가 조금만 겹친 추천("어제 꾼 꿈" → 음식 꿈)은 엉뚱해 보여서 뺍니다(자모 자동 완성 추천은 0점이라 그대로 둠).
    const tips = results.suggestions
      .filter((s) => s.score === 0 || s.score >= 0.25)
      .map((s) => SYMBOL_BY_ID[s.id])
      .filter(Boolean);
    return (
      <>
        <h2 id="dream-results-title" className={ds.resultsTitle}>
          ‘{query}’에 딱 맞는 꿈을 찾지 못했어요
        </h2>
        <p className={ds.resultsLead}>
          꿈에 나온 것(뱀·이빨·돈처럼)이나 한 일(쫓기다·떨어지다처럼)을 넣어 다시 찾아보거나, 아래에서 장면을
          직접 골라 보세요.
        </p>
        {tips.length > 0 && (
          <>
            <p className={ds.resultsSub}>혹시 이런 꿈이었나요?</p>
            <div className={ds.tipGrid}>
              {tips.map((s) => (
                <button key={s.id} type="button" className={ds.tipCard} onClick={() => onSearch(s.label)}>
                  <DreamArt id={s.id} small className={ds.tipArt} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <h2 id="dream-results-title" className={ds.resultsTitle}>
        ‘{query}’ 꿈을 찾아봤어요
      </h2>
      <p className={ds.resultsLead}>
        {found.length > 1
          ? `비슷한 꿈 ${found.length}개를 찾았어요. 꿈에 함께 나온 것을 골라 한데 묶어 풀어 볼 수 있어요.`
          : "가장 비슷한 꿈을 찾았어요."}
      </p>

      <ol className={ds.resultList}>
        {found.map((r) => {
          const s = SYMBOL_BY_ID[r.id];
          const on = picked.includes(r.id);
          const scene = bestSituation(r);
          const hasPage = PAGE_IDS.includes(r.id);
          return (
            <li key={r.id} className={`${ds.resultCard} ${on ? ds.resultCardOn : ""}`}>
              <DreamArt id={r.id} small className={ds.resultArt} />
              <div className={ds.resultBody}>
                <div className={ds.resultHead}>
                  <h3 className={ds.resultName}>{s.label}</h3>
                  {!s.sensitive && (
                    <span className={`${ds.luckBadge} ${ds[`luck${s.luck}`]}`}>{TEXTS.luckLabels[s.luck]}</span>
                  )}
                </div>
                <p className={ds.resultKeyword}>{s.keyword}</p>
                <p className={ds.resultText}>{s.text}</p>
                {scene && (
                  <Link href={`${dreamHref(r.id)}#s${scene.index + 1}`} className={ds.sceneLink}>
                    <small>이 장면이 가장 비슷해요</small>
                    <span>{scene.title}</span>
                  </Link>
                )}
                <div className={ds.resultActions}>
                  <button
                    type="button"
                    aria-pressed={on}
                    className={`${ds.pickBtn} ${on ? ds.pickBtnOn : ""}`}
                    onClick={() => toggle(r.id)}
                  >
                    <span className={ds.pickCheck} aria-hidden="true">
                      {on ? "✓" : ""}
                    </span>
                    종합 해몽에 넣기
                  </button>
                  {hasPage && (
                    <Link href={dreamHref(r.id)} className={ds.resultMore}>
                      상황별 풀이 →
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className={`${styles.cta} ${ds.resultsCta}`}
        disabled={picked.length === 0}
        onClick={() => onCombine(found.map((r) => r.id).filter((id) => picked.includes(id)))}
      >
        {picked.length > 1
          ? `고른 꿈 ${picked.length}개 한데 묶어 해몽 보기`
          : picked.length === 1
            ? "이 꿈으로 해몽 보기"
            : "해몽에 넣을 꿈을 골라 주세요"}
      </button>
      <p className={ds.resultsHint}>
        ‘안 빠졌어’처럼 아니라는 말은 아직 구분하지 못해요. 결과가 어색하면 아래에서 장면을 직접 골라 보세요.
      </p>
    </>
  );
}
