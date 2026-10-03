"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import styles from "@/components/fortune/fortune.module.css";
import ds from "./dream.module.css";
import TEXTS from "@/lib/dream/symbols.json";
import { MIN_SELECT, MAX_SELECT, synthesisBucket } from "@/lib/dream/select";
import { buildDreamCard } from "@/lib/dream/card";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { encodeDreamLink, decodeDreamLink } from "@/lib/dream/resultLink";
import { PAGE_IDS, dreamHref } from "@/lib/dream/pageIds";
import { SITE } from "@/lib/site";

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

export default function DreamView() {
  const [shared, setShared] = useState(null);

  useEffect(() => {
    const got = decodeDreamLink(window.location.hash);
    if (!got) return;
    setShared(got);
    track("dream_shared_link_opened");
  }, []);

  function onResult() {
    setShared(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    track("dream_result_viewed");
  }

  return (
    <>
      {shared && (
        <>
          <p className={styles.sharedNote}>
            친구가 보낸 <b>꿈해몽</b> 결과예요. 아래에서 내 꿈도 바로 풀어볼 수 있어요.
          </p>
          <div className={styles.result}>
            <DreamResult ids={shared} snapshot />
          </div>
          <p className={styles.sectionDivider}>내 꿈 풀어보기</p>
        </>
      )}
      <SelectFlow onResult={onResult} />
    </>
  );
}

/** 상징 선택(카테고리 탭 + 체크박스형 칩) → 결과까지의 전체 흐름. */
function SelectFlow({ onResult }) {
  const [tab, setTab] = useState(TEXTS.categories[0].id);
  const [selected, setSelected] = useState([]);
  const [done, setDone] = useState(null); // 결과 화면에 고정해 둔 ids(선택을 계속 바꿔도 안 흔들리게)
  const [hint, setHint] = useState("");
  const [query, setQuery] = useState("");

  const symbolsInTab = useMemo(() => TEXTS.symbols.filter((s) => s.category === tab), [tab]);

  // 검색어가 있으면 카테고리를 넘나들며 라벨·키워드로 찾고, 없으면 평소처럼 탭별로 보여줍니다.
  const q = query.trim();
  const searching = q.length > 0;
  const searchResults = useMemo(() => {
    if (!searching) return [];
    return TEXTS.symbols.filter((s) => s.label.includes(q) || s.keyword.includes(q));
  }, [q, searching]);
  const visibleSymbols = searching ? searchResults : symbolsInTab;

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

  function viewResult() {
    if (selected.length < MIN_SELECT) return;
    setDone(selected);
    track("dream_analyzed", { count: selected.length });
    onResult();
    requestAnimationFrame(() => {
      document.getElementById("dream-result-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (done) {
    return (
      <div id="dream-result-top" className={styles.result}>
        <DreamResult ids={done} />
        <p style={{ textAlign: "center", marginTop: 24 }}>
          <button
            type="button"
            className={styles.ghostSm}
            onClick={() => {
              setDone(null);
              setSelected([]);
            }}
          >
            다른 꿈으로 다시 보기
          </button>
        </p>
      </div>
    );
  }

  return (
    <div id="dream-select">
      <p className={styles.blockLead} style={{ textAlign: "center" }}>
        {TEXTS.selectHint}
      </p>

      <input
        type="search"
        inputMode="search"
        className={ds.searchBox}
        placeholder="상징 이름으로 검색 (예: 뱀, 돈, 이빨)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="상징 검색"
      />

      {!searching && (
        <div className={ds.categoryTabs} role="tablist" aria-label="꿈 카테고리">
          {TEXTS.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={tab === c.id}
              className={`${ds.categoryTab} ${tab === c.id ? ds.categoryTabOn : ""}`}
              onClick={() => setTab(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {searching && (
        <p className={ds.searchResultNote}>
          {searchResults.length > 0 ? `검색 결과 ${searchResults.length}개` : "찾는 상징이 없어요. 다른 낱말로 검색해 보세요."}
        </p>
      )}

      <div className={ds.symbolGrid}>
        {visibleSymbols.map((s) => {
          const on = selected.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              className={`${ds.symbolChip} ${on ? ds.symbolChipOn : ""}`}
              onClick={() => toggle(s.id)}
            >
              <span className={ds.symbolChipLabel}>{s.label}</span>
              <span className={ds.symbolChipKeyword}>{s.keyword}</span>
            </button>
          );
        })}
      </div>

      <p className={ds.selectedBar}>
        {selected.length > 0 ? (
          <>선택한 {selected.length}개 — {resolveSymbols(selected).map((s) => s.label.replace(" 꿈", "")).join(", ")}</>
        ) : (
          "아직 고른 꿈이 없어요."
        )}
      </p>
      {hint && (
        <p className={styles.small} style={{ textAlign: "center" }}>
          {hint}
        </p>
      )}

      <button type="button" className={styles.cta} disabled={selected.length < MIN_SELECT} onClick={viewResult}>
        꿈해몽 보기
      </button>
      <p className={styles.small} style={{ textAlign: "center", marginTop: 10 }}>
        고른 내용은 이 브라우저 안에서만 쓰이고, 서버로 전송되거나 저장되지 않아요.
      </p>
    </div>
  );
}

/**
 * snapshot: 친구가 보낸 링크로 보는 결과 — 공유 버튼을 빼고 해석만 보여줍니다.
 */
function DreamResult({ ids, snapshot = false }) {
  const [hintMsg, setHintMsg] = useState("");
  const [card, setCard] = useState(null);

  const symbols = resolveSymbols(ids);
  const keywordsLine = symbols.map((s) => s.keyword).join(" · ");
  const synthesis = resolveSynthesis(ids);
  const cardKey = ids.join("-");

  useEffect(() => {
    if (snapshot) return;
    let cancelled = false;
    setCard(null);
    (async () => {
      const img = await buildDreamCard({
        keywordsLine,
        intro: TEXTS.intro,
        symbols: symbols.map((s) => ({ label: s.label, text: s.text })),
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
      ...symbols.map((s) => `[${s.label}] ${s.keyword} — ${s.text}`),
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
            공유하면 고른 상징이 담긴 사진·링크가 전해져요. 링크에는 고른 상징의 이름만 담겨서
            개인정보가 들어가지 않아요.
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
