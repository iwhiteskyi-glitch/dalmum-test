"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import ds from "./dream.module.css";
import DreamArt from "./DreamArt";
import TEXTS from "@/lib/dream/symbols.json";

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

function rememberSearch(q) {
  writeRecent([q, ...readRecent().filter((x) => x !== q)].slice(0, RECENT_MAX));
}

// 검색 엔진과 비슷한 말 사전(약 80KB)은 첫 화면에서 받지 않고, 검색창을 처음 누를 때 불러옵니다.
let enginePromise = null;
let engineReady = null; // 한 번 만든 엔진은 화면이 바뀌어도 그대로 씀
function loadEngine(titles) {
  enginePromise ??= Promise.all([import("@/lib/dream/search"), import("@/lib/dream/aliases.json")])
    .then(([m, aliases]) => {
      engineReady = m.createDreamSearch({ symbols: TEXTS.symbols, aliases: aliases.default, titles });
      return engineReady;
    })
    .catch((e) => {
      enginePromise = null;
      throw e;
    });
  return enginePromise;
}

/** 검색 엔진 — warmUp()을 부르면 불러오기 시작하고, 다 되면 engine이 채워져요. */
export function useDreamEngine(titles) {
  const [engine, setEngine] = useState(engineReady);
  const [failed, setFailed] = useState(false);
  const warmUp = useCallback(() => {
    if (engineReady) {
      setEngine(engineReady);
      return;
    }
    loadEngine(titles)
      .then((e) => {
        setEngine(e);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [titles]);
  return { engine, failed, warmUp };
}

/** 검색창 + 자동 완성. 첫 화면(큰 검색창)과 결과 화면 맨 위(작은 검색창)에서 함께 씁니다. */
function SearchBox({ titles, initialText = "", onSubmit, compact = false }) {
  const { engine, warmUp } = useDreamEngine(titles);
  const [text, setText] = useState(initialText);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const listId = useId();

  // 결과 화면에서 비슷한 꿈을 눌러 검색어가 바뀌면 검색창 글자도 맞춰요
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const typed = text.trim();
  const suggestions = useMemo(
    () => (engine && open && typed && typed !== initialText ? engine.suggest(typed, 6) : []),
    [engine, open, typed, initialText]
  );

  function submit(q) {
    const value = q.trim();
    if (!value) return;
    setText(value);
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur(); // 휴대폰 자판을 내려서 결과가 보이게
    rememberSearch(value);
    onSubmit(value);
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
    <form
      className={`${ds.searchForm} ${compact ? ds.searchFormCompact : ""}`}
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
        placeholder={compact ? "다른 꿈도 적어 보세요" : `예) ${EXAMPLE}`}
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
        {compact ? "찾기" : "해몽 찾기"}
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
  );
}

/** 꿈해몽 첫 화면의 밤하늘 히어로 — 큰 검색창 + 많이 찾는 꿈 + 최근 검색 */
export default function DreamHero({ titles, onSearch }) {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  function go(q) {
    rememberSearch(q);
    onSearch(q);
  }

  return (
    <section className={ds.hero} id="dream-search">
      <span className={ds.heroMoon} aria-hidden="true" />
      <p className={ds.heroKicker}>꿈해몽 · 99가지 상징</p>
      <h1 className={ds.heroTitle}>지난밤 꿈, 무슨 뜻이었을까?</h1>
      <p className={ds.heroLead}>
        기억나는 꿈을 문장 그대로 적어 보세요. 가장 비슷한 꿈과 장면을 찾아 전통 해몽 방식으로 풀어
        드려요.
      </p>

      <SearchBox titles={titles} onSubmit={onSearch} />

      <div className={ds.heroChips}>
        <span className={ds.heroChipsLabel}>많이 찾는 꿈</span>
        {POPULAR_QUERIES.map((q) => (
          <button key={q} type="button" className={ds.heroChip} onClick={() => go(q)}>
            {q}
          </button>
        ))}
      </div>
      {recent.length > 0 && (
        <div className={ds.heroChips}>
          <span className={ds.heroChipsLabel}>최근 검색</span>
          {recent.map((q) => (
            <button key={q} type="button" className={`${ds.heroChip} ${ds.heroChipRecent}`} onClick={() => go(q)}>
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
  );
}

/** 결과 화면 맨 위 — 처음으로 돌아가기 + 작은 검색창(바로 다른 꿈을 찾게) */
export function DreamSearchBar({ titles, query = "", onSearch, onBack, backLabel = "처음으로" }) {
  return (
    <div className={ds.answerBar}>
      <button type="button" className={ds.answerBack} onClick={onBack}>
        <span aria-hidden="true">←</span> {backLabel}
      </button>
      <SearchBox titles={titles} initialText={query} onSubmit={onSearch} compact />
    </div>
  );
}
