"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "@/components/fortune/fortune.module.css";
import ds from "./dream.module.css";
import ScrollHint from "@/components/ScrollHint";
import DreamSearch from "./DreamSearch";
import DreamArt from "./DreamArt";
import TEXTS from "@/lib/dream/symbols.json";
import { MIN_SELECT, MAX_SELECT, synthesisBucket } from "@/lib/dream/select";
import { buildDreamCard } from "@/lib/dream/card";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { encodeDreamLink, decodeDreamLink } from "@/lib/dream/resultLink";
import { PAGE_IDS, dreamHref } from "@/lib/dream/pageIds";
import { SITE } from "@/lib/site";
import { keepResult, dropResult, restoreOnBack } from "@/lib/backRestore";

const SYMBOL_BY_ID = Object.fromEntries(TEXTS.symbols.map((s) => [s.id, s]));

/** 고른 상징 id 배열을 전체 해석 정보로 바꿉니다. */
function resolveSymbols(ids) {
  return ids.map((id) => SYMBOL_BY_ID[id]).filter(Boolean);
}

/** 고른 상징들의 길흉 태그만 보고 4가지 종합 흐름 중 하나를 고릅니다(새 조합 생성 없음). */
function resolveSynthesis(ids) {
  const symbols = resolveSymbols(ids);
  if (symbols.length === 0) return null;
  const bucket = synthesisBucket(symbols.map((s) => s.luck));
  return { bucket, ...TEXTS.synthesis[bucket] };
}

// 첫 화면의 "많이 찾는 꿈" 그림 카드(상세 페이지가 있는 꿈만).
const POPULAR_IDS = ["snake", "teeth", "pig", "dragon", "death", "ex", "fire", "tiger"];

export default function DreamView({ titles }) {
  // 결과 안의 링크(상세 페이지 등)로 갔다가 뒤로 오면, 처음 화면 대신 보던 검색·결과를 다시 보여 줍니다.
  const [back] = useState(() => restoreOnBack("dream"));
  const [shared, setShared] = useState(null);
  const [query, setQuery] = useState(back?.query ?? "");
  const [done, setDone] = useState(back?.ids ?? null); // 결과 화면에 고정해 둔 ids(선택을 계속 바꿔도 안 흔들리게)
  const [doneFrom, setDoneFrom] = useState(back?.tab ? "select" : "search"); // 결과를 연 곳(돌아갈 자리)
  // 장면 칸에서 고른 것 — "다른 꿈으로 다시 보기"로 돌아왔을 때 처음부터 다시 고르지 않게 남겨 둡니다.
  const [picked, setPicked] = useState(back?.tab ? back.ids : []);
  const closeTo = useRef(null); // 결과를 닫은 뒤 옮겨 갈 자리(버튼으로 닫을 때 정함)

  useEffect(() => {
    const got = decodeDreamLink(window.location.hash);
    if (!got) return;
    setShared(got);
    track("dream_shared_link_opened");
  }, []);

  function clearShared() {
    setShared(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }

  function search(q) {
    clearShared();
    setQuery(q);
    setDone(null);
    keepResult("dream", { query: q });
    // 결과를 보다가 위 검색창으로 새로 찾으면, 결과용으로 쌓아 둔 뒤로 가기 기록은 이제 필요 없어요
    if (window.history.state?.dreamResult) window.history.replaceState(null, "", window.location.pathname);
  }

  function showResult(ids, from, tab) {
    clearShared();
    setDone(ids);
    setDoneFrom(from);
    if (from === "select") setPicked(ids);
    keepResult("dream", { ids, query, tab });
    // 휴대폰·브라우저의 뒤로 가기로 결과를 닫고 검색 결과(또는 장면 칸)로 돌아오게 기록을 하나 쌓아 둡니다(주소는 그대로)
    window.history.pushState({ dreamResult: true }, "", window.location.pathname);
    track("dream_analyzed", { count: ids.length, from });
    track("dream_result_viewed");
    requestAnimationFrame(() => {
      document.getElementById("dream-result-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /** 결과를 닫고 to(없으면 결과를 연 자리: 검색 결과 또는 장면 칸)로 옮겨 갑니다. */
  function closeResult(to) {
    const target = to ?? (doneFrom === "search" && query ? "dream-search-results" : "dream-select");
    setDone(null);
    if (query) keepResult("dream", { query });
    else dropResult("dream");
    requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (target === "dream-search") {
        const input = document.querySelector("#dream-search input");
        input?.focus({ preventScroll: true });
        input?.select();
      }
    });
  }

  // 결과를 보는 중에 뒤로 가기를 누르면 페이지를 떠나지 않고 결과만 닫아요.
  useEffect(() => {
    if (!done) return;
    const onPop = () => {
      if (window.history.state?.dreamResult) return;
      closeResult(closeTo.current);
      closeTo.current = null;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, doneFrom, query]);

  /** 결과 화면의 돌아가기 버튼 — 쌓아 둔 기록이 있으면 뒤로 가기와 똑같이 닫습니다. */
  function reset(to) {
    if (window.history.state?.dreamResult) {
      closeTo.current = to ?? null;
      window.history.back();
    } else {
      closeResult(to);
    }
  }

  const backLabel = doneFrom === "search" && query ? "검색 결과로" : "장면 다시 고르기";

  return (
    <>
      <DreamSearch
        titles={titles}
        query={query}
        onSearch={search}
        onCombine={(ids) => showResult(ids, "search")}
        showResults={!done}
      />

      {shared && (
        <>
          <p className={styles.sharedNote}>
            친구가 보낸 <b>꿈해몽</b> 결과예요. 위 검색창이나 아래 장면 고르기로 내 꿈도 바로 풀어볼 수 있어요.
          </p>
          <div className={styles.result}>
            <DreamResult ids={shared} snapshot />
          </div>
        </>
      )}

      {done ? (
        <div id="dream-result-top" className={styles.result}>
          <div className={ds.resultNav}>
            <button type="button" className={ds.resultNavBack} onClick={() => reset()}>
              <span aria-hidden="true">←</span> {backLabel}
            </button>
            <button type="button" className={ds.resultNavNew} onClick={() => reset("dream-search")}>
              새 꿈 검색
            </button>
          </div>
          <DreamResult ids={done} />
          <p style={{ textAlign: "center", marginTop: 24 }}>
            <button type="button" className={styles.ghostSm} onClick={() => reset()}>
              다른 꿈으로 다시 보기
            </button>
          </p>
        </div>
      ) : (
        <>
          <PopularDreams />
          <SelectFlow
            initialTab={back?.tab}
            initialSelected={picked}
            onView={(ids, tab) => showResult(ids, "select", tab)}
          />
        </>
      )}
    </>
  );
}

/** 많이 찾는 꿈 — 그림 카드로 상세 페이지 바로가기 */
function PopularDreams() {
  return (
    <section className={ds.popular} aria-labelledby="dream-popular-title">
      <h2 id="dream-popular-title" className={ds.sectionHead}>
        많이 찾는 꿈
      </h2>
      <ul className={ds.popularGrid}>
        {POPULAR_IDS.map((id) => {
          const s = SYMBOL_BY_ID[id];
          return (
            <li key={id}>
              <Link href={dreamHref(id)} className={ds.popularCard}>
                <DreamArt id={id} className={ds.popularArt} />
                <span className={ds.popularCaption}>
                  <strong>{s.label}</strong>
                  <span>{s.keyword}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 장면 고르기(카테고리 탭 + 그림 칸) → 종합 해몽. */
function SelectFlow({ initialTab, initialSelected, onView }) {
  const [tab, setTab] = useState(initialTab ?? TEXTS.categories[0].id);
  const [selected, setSelected] = useState(initialSelected);
  const [hint, setHint] = useState("");

  const symbolsInTab = useMemo(() => TEXTS.symbols.filter((s) => s.category === tab), [tab]);

  // 상세 페이지의 "이 꿈으로 해몽 보기"(#pick.<id>)로 들어오면 그 상징을 골라 둔 채로 엽니다.
  useEffect(() => {
    const m = window.location.hash.match(/^#pick\.([a-z]+)$/);
    const sym = m && SYMBOL_BY_ID[m[1]];
    if (!sym) return;
    setTab(sym.category);
    setSelected([sym.id]);
    window.history.replaceState(null, "", window.location.pathname);
    requestAnimationFrame(() => {
      document.getElementById("dream-select")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  function toggle(id) {
    setHint("");
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECT) {
        setHint(`최대 ${MAX_SELECT}개까지 고를 수 있어요.`);
        return prev;
      }
      return [...prev, id];
    });
  }

  return (
    <section id="dream-select" className={ds.selectSection} aria-labelledby="dream-select-title">
      <h2 id="dream-select-title" className={ds.sectionHead}>
        장면을 골라 종합 해몽 받기
      </h2>
      <p className={ds.sectionLead}>
        꿈에 나온 장면을 최대 {MAX_SELECT}개까지 고르면, 한데 묶어 종합 흐름을 풀어 드려요.
      </p>

      <ScrollHint className={ds.categoryTabs} wrapClassName={ds.categoryTabsWrap} role="tablist" aria-label="꿈 카테고리">
        {TEXTS.categories.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={tab === c.id}
            className={`${ds.categoryTab} ${tab === c.id ? ds.categoryTabOn : ""}`}
            onClick={(e) => {
              setTab(c.id);
              e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }}
          >
            {c.label}
          </button>
        ))}
      </ScrollHint>

      <div className={ds.symbolGrid}>
        {symbolsInTab.map((s) => {
          const on = selected.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              className={`${ds.symbolTile} ${on ? ds.symbolTileOn : ""}`}
              onClick={() => toggle(s.id)}
            >
              <span className={ds.symbolTileArt}>
                <DreamArt id={s.id} small />
                <span className={ds.symbolCheck} aria-hidden="true">
                  {on ? "✓" : ""}
                </span>
              </span>
              <span className={ds.symbolTileLabel}>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* 하나라도 고르면 화면 아래에 붙어 따라와요(안 골랐을 땐 제자리에 둬서 제목을 가리지 않게) */}
      <div className={`${ds.selectDock} ${selected.length > 0 ? ds.selectDockOn : ""}`}>
        <p className={ds.selectedBar}>
          {selected.length > 0 ? (
            <>선택한 {selected.length}개 — {resolveSymbols(selected).map((s) => s.label.replace(" 꿈", "")).join(", ")}</>
          ) : (
            `아직 고른 꿈이 없어요. 여러 개 골라도 돼요(최대 ${MAX_SELECT}개).`
          )}
        </p>
        {hint && <p className={ds.selectHint}>{hint}</p>}
        <button
          type="button"
          className={styles.cta}
          disabled={selected.length < MIN_SELECT}
          onClick={() => onView(selected, tab)}
        >
          {selected.length > 1 ? `${selected.length}개 장면 합쳐서 해몽 보기` : "꿈해몽 보기"}
        </button>
      </div>
      <p className={styles.small} style={{ textAlign: "center", marginTop: 10 }}>
        고른 내용은 이 브라우저 안에서만 쓰이고, 서버로 전송되거나 저장되지 않아요.
      </p>
    </section>
  );
}

/**
 * snapshot: 친구가 보낸 링크로 보는 결과 — 공유 버튼을 빼고 해석만 보여줍니다.
 */
function DreamResult({ ids, snapshot = false }) {
  const [hintMsg, setHintMsg] = useState("");
  const [card, setCard] = useState(null);
  const [pages, setPages] = useState(null); // 상세 페이지의 상황별 풀이(공유 이미지·글에 함께 담음)

  const symbols = resolveSymbols(ids);
  const keywordsLine = symbols.map((s) => s.keyword).join(" · ");
  const synthesis = resolveSynthesis(ids);
  const cardKey = ids.join("-");
  const situationsOf = (id) => pages?.[id]?.situations || [];

  useEffect(() => {
    if (snapshot) return;
    let cancelled = false;
    setCard(null);
    (async () => {
      // 상황별 풀이 데이터는 커서(약 300KB) 첫 화면에서 받지 않고, 결과를 볼 때 따로 불러옵니다.
      const loaded = (await import("@/lib/dream/pages.json")).default;
      if (cancelled) return;
      setPages(loaded);
      const img = await buildDreamCard({
        keywordsLine,
        intro: TEXTS.intro,
        compact: symbols.length >= 3,
        symbols: symbols.map((s) => ({ label: s.label, text: s.text, situations: loaded[s.id]?.situations || [] })),
        synthesis,
      });
      if (!cancelled) setCard(img);
    })().catch(() => {
      /* 카드를 못 그리면 글로만 공유해요 */
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, snapshot]);

  const url = `${SITE.url}/dream${encodeDreamLink(ids)}`;

  async function share() {
    const shortText = `내 꿈해몽 종합: ${synthesis.title}`;
    const fullText = [
      shortText,
      `\n[종합 흐름] ${synthesis.title}\n${synthesis.text}`,
      "\n고른 상징별로 자세히 보면",
      ...symbols.map((s) => {
        const situations = situationsOf(s.id);
        const lines = [`\n[${s.label}] ${s.keyword} — ${s.text}`];
        if (situations.length) {
          lines.push("상황별로 보면");
          situations.forEach((it) => lines.push(`· ${it.title}: ${it.text}`));
        }
        return lines.join("\n");
      }),
      `\n${TEXTS.disclaimer}`,
      "— 재미로봄 꿈해몽",
    ].join("\n");
    setHintMsg("");
    try {
      const r = await shareResult({
        blob: card?.blob,
        fileName: "jaemirobom-dream.png",
        title: "재미로봄 꿈해몽",
        shortText,
        fullText,
        url,
      });
      track("dream_shared", { mode: r.mode });
      if (r.mode === "files") {
        setHintMsg(
          r.linkCopied
            ? "링크도 복사해 뒀어요. 사진만 전달됐으면 대화창에 붙여넣어 주세요."
            : "사진만 전달됐으면 아래 '링크 복사'를 눌러 주소도 함께 보내 주세요."
        );
      } else if (r.mode === "copied") {
        setHintMsg("공유 글과 링크를 복사했어요. 붙여넣어 보내 주세요.");
      }
    } catch (e) {
      if (e.name !== "AbortError") setHintMsg("공유하지 못했어요. 아래 '링크 복사'를 이용해 주세요.");
    }
  }

  async function copyLink() {
    setHintMsg((await copyText(url)) ? "링크를 복사했어요." : "링크를 복사하지 못했어요.");
  }

  return (
    <section className={styles.block} aria-labelledby="dream-title">
      <h2 id="dream-title" className={styles.blockTitle}>
        내 꿈해몽
      </h2>

      {synthesis && (
        <div className={ds.synthesisBox}>
          <span className={ds.synthesisStars} aria-hidden="true" />
          <span className={ds.synthesisLabel}>{TEXTS.synthesisLabel}</span>
          <h3 className={ds.synthesisTitle}>{synthesis.title}</h3>
          <p className={ds.synthesisText}>{synthesis.text}</p>
        </div>
      )}

      <p className={styles.blockLead} style={{ textAlign: "center" }}>
        {keywordsLine}
      </p>
      <p className={ds.symbolListLabel}>고른 상징별로 자세히 보면</p>
      <div className={ds.symbolList}>
        {symbols.map((s) => (
          <div key={s.id} className={ds.symbolCard}>
            <DreamArt id={s.id} small className={ds.symbolCardArt} />
            <div>
              <div className={ds.symbolHead}>
                <span className={ds.symbolTitle}>{s.label}</span>
                {!s.sensitive && (
                  <span className={`${ds.luckBadge} ${ds[`luck${s.luck}`]}`}>{TEXTS.luckLabels[s.luck]}</span>
                )}
              </div>
              <p className={ds.symbolText}>{s.text}</p>
              {PAGE_IDS.includes(s.id) && (
                <Link href={dreamHref(s.id)} className={ds.symbolMore}>
                  상황별로 자세히 보기 →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.disclaimer} style={{ marginTop: 20 }}>
        {TEXTS.disclaimer}
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
          {hintMsg && <p className={styles.shareHint}>{hintMsg}</p>}
          <p className={styles.small}>
            공유하면 고른 상징의 풀이와 상황별 풀이가 담긴 사진·링크가 전해져요. 링크에는 고른
            상징의 이름만 담겨서 개인정보가 들어가지 않아요.
          </p>
        </>
      )}

      <Link href="/gwansang" className={styles.nextCard} style={{ marginTop: 20 }}>
        <span>
          <small>재미로 보는 또 다른 코너</small>
          <strong>관상도 보러 가기</strong>
          <span>사진 한 장으로 눈·눈썹·코·입·턱선 인상을 풀어 드려요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>
    </section>
  );
}
