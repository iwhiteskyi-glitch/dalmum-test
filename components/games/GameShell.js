"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import f from "@/components/fortune/fortune.module.css";
import styles from "./games.module.css";
import { STAGE_COUNT, TIER_CAP, tierOf, tierTitle } from "@/lib/games/meta";
import { loadProgress, saveProgress } from "@/lib/games/progress";
import { buildGameCard, cardContent } from "@/lib/games/card";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { SITE } from "@/lib/site";
import { eulReul, gwaWa, euro, hasBatchim } from "@/lib/korean";
import useComputer from "./useComputer";

const UNDO_LIMIT = 3;
const MIN_THINK_MS = 450; // 너무 빨리 두면 어색해서 최소한 이만큼은 "생각"해요

/**
 * 미니게임 공통 화면: 단계 고르기 → 대국 → 결과·공유. 게임마다 다른 부분은 rules로 받아요.
 *
 * meta: lib/games/meta.js 의 GAMES 항목
 * rules (게임별 어댑터):
 *  init(mySide)              → 처음 상태(그대로 작업자에게 보낼 수 있는 단순한 값)
 *  turn(state)               → 지금 둘 쪽(0 먼저 두는 쪽, 1 나중에 두는 쪽)
 *  apply(state, move)        → { state, end } | null — end: { winner: 0|1|null, reason }
 *  info(state, end)          → 판 위에 한 줄로 보여 줄 말(예: "장군!") 또는 null
 *  Board                     → 판 컴포넌트 ({ state, mySide, active, end, onMove, onNotice, extra })
 *  createWorker / loadAi     → 컴퓨터 생각(작업자 / 작업자를 못 쓸 때)
 *  rule                      → 판 아래 규칙 한 줄
 *  Setup (선택)              → 대국 전에 고르는 것(장기 상차림 등) — 고른 값은 init(mySide, choice)로 전해요
 */
export default function GameShell({ meta, rules }) {
  const [progress, setProgress] = useState(null); // 불러오기 전에는 null
  const progressRef = useRef(null);
  const [tab, setTab] = useState("first"); // "first" | "second" | "endless"(무한 연승)
  // { track, stage, mySide, history: [state…], end, undoLeft, star, endless: { round, streak } | null }
  const [game, setGame] = useState(null);
  const [notice, setNotice] = useState("");
  const [thinking, setThinking] = useState(false);
  const [celebrate, setCelebrate] = useState(null); // "master" | "legend"
  const [choice, setChoice] = useState(rules.defaultChoice ?? null);
  const topRef = useRef(null);
  const think = useComputer(rules);

  useEffect(() => {
    const p = loadProgress(meta.key);
    progressRef.current = p;
    setProgress(p);
    if (p.first >= STAGE_COUNT) setTab(p.second >= STAGE_COUNT ? "endless" : "second");
  }, [meta.key]);

  const scrollTop = () =>
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

  function start(trackKey, stage, endless = null) {
    const mySide = trackKey === "first" ? 0 : 1;
    setGame({
      track: trackKey,
      stage,
      mySide,
      history: [rules.init(mySide, choice)],
      end: null,
      undoLeft: endless ? 0 : UNDO_LIMIT,
      endless,
    });
    setNotice("");
    setCelebrate(null);
    scrollTop();
  }

  // 무한 연승: 가장 센 10단계와 무르기 없이 연달아 둬요. 판마다 내 쪽이 번갈아 바뀌어요(첫 판은 먼저 두는 쪽).
  function startEndless(round, streak) {
    start(round % 2 === 0 ? "first" : "second", STAGE_COUNT, { round, streak });
  }

  const state = game ? game.history[game.history.length - 1] : null;
  const myTurn = Boolean(game && !game.end && rules.turn(state) === game.mySide);

  // 컴퓨터 차례면 생각해서 둡니다.
  useEffect(() => {
    if (!game || game.end || rules.turn(state) === game.mySide) return;
    let cancelled = false;
    setThinking(true);
    const began = Date.now();
    think(state, game.stage).then((move) => {
      const wait = Math.max(0, MIN_THINK_MS - (Date.now() - began));
      setTimeout(() => {
        if (cancelled) return;
        setThinking(false);
        const r = move != null ? rules.apply(state, move) : null;
        if (!r) {
          // 컴퓨터가 둘 수를 못 찾으면(거의 없어요) 무승부로 끝내요
          finish({ ...game, end: { winner: null, reason: "컴퓨터가 둘 수를 찾지 못했어요" } });
          return;
        }
        const next = { ...game, history: [...game.history, r.state] };
        if (r.end) finish({ ...next, end: r.end });
        else setGame(next);
      }, wait);
    });
    return () => {
      cancelled = true;
    };
    // 수가 바뀔 때만 다시 생각해요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.history.length, game?.end, game?.track, game?.stage]);

  function finish(ended) {
    setGame(ended);
    const result = ended.end.winner === null ? "draw" : ended.end.winner === ended.mySide ? "won" : "lost";
    const before = progressRef.current || { first: 0, second: 0, stars: { first: [], second: [] }, best: 0 };
    if (ended.endless) {
      // 이기면 +1, 비기면 그대로(연승은 이어짐), 지면 여기서 멈춰요
      const streak = result === "won" ? ended.endless.streak + 1 : ended.endless.streak;
      const newBest = result === "won" && streak > (before.best || 0);
      track(`${meta.key}_endless_end`, { round: ended.endless.round, result, streak });
      if (newBest) {
        const next = { ...before, best: streak };
        progressRef.current = next;
        saveProgress(meta.key, next);
        setProgress(next);
      }
      setGame({ ...ended, endless: { ...ended.endless, streak, newBest } });
      return;
    }
    track(`${meta.key}_game_end`, { track: ended.track, stage: ended.stage, result, moves: ended.history.length - 1 });
    if (result !== "won") return;
    // 무르기를 한 번도 안 쓰고 이기면 ★
    const star = ended.undoLeft >= UNDO_LIMIT;
    setGame({ ...ended, star });
    const cleared = Math.max(before[ended.track] || 0, ended.stage);
    const stars = { first: [], second: [], ...before.stars };
    if (star && !stars[ended.track].includes(ended.stage)) {
      stars[ended.track] = [...stars[ended.track], ended.stage].sort((a, b) => a - b);
    }
    const next = { ...before, [ended.track]: cleared, stars, last: { track: ended.track, stage: ended.stage } };
    progressRef.current = next;
    saveProgress(meta.key, next);
    setProgress(next);
    if (cleared === STAGE_COUNT && (before[ended.track] || 0) < STAGE_COUNT) {
      setCelebrate(ended.track === "first" ? "master" : "legend");
      setTab(ended.track === "first" ? "second" : "endless");
    }
  }

  function move(m) {
    if (!myTurn || thinking) return false;
    const r = rules.apply(state, m);
    if (!r) return false;
    setNotice("");
    const next = { ...game, history: [...game.history, r.state] };
    if (r.end) finish({ ...next, end: r.end });
    else setGame(next);
    return true;
  }

  function undo() {
    if (!game || thinking || game.undoLeft <= 0) return;
    if (game.end && game.end.winner === game.mySide) return;
    // 내 마지막 수를 두기 직전으로 되돌려요(그 뒤 컴퓨터 수 포함)
    let i = game.history.length - 2;
    while (i >= 0 && rules.turn(game.history[i]) !== game.mySide) i--;
    if (i < 0) return;
    setGame({ ...game, history: game.history.slice(0, i + 1), end: null, undoLeft: game.undoLeft - 1 });
    setNotice("");
  }
  const canUndo = (() => {
    if (!game || thinking || game.undoLeft <= 0) return false;
    for (let i = game.history.length - 2; i >= 0; i--) if (rules.turn(game.history[i]) === game.mySide) return true;
    return false;
  })();

  // 대국이 끝나면 결과 상자가 보이게 살짝 내려 줘요.
  useEffect(() => {
    if (!game?.end) return;
    const t = setTimeout(() => document.getElementById("game-end")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 350);
    return () => clearTimeout(t);
  }, [game?.end]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!progress) return <div className={styles.placeholder} aria-hidden="true" />;

  function leave() {
    if (game?.endless && !game.end && game.endless.streak > 0 && !window.confirm("지금 나가면 연승이 끝나요. 나갈까요?")) return;
    setGame(null);
    scrollTop();
  }

  if (!game) {
    return (
      <div ref={topRef} className={styles.anchor}>
        {celebrate && <Celebrate meta={meta} kind={celebrate} />}
        <StageList meta={meta} progress={progress} tab={tab} setTab={setTab} onStart={start} onEndless={() => startEndless(0, 0)}>
          {rules.Setup && <rules.Setup value={choice} onChange={setChoice} />}
        </StageList>
      </div>
    );
  }

  const stage = meta.stages[game.stage - 1];
  const me = meta.sides[game.mySide];
  const cpu = meta.sides[1 - game.mySide];
  const info = rules.info?.(state, game.end, game.mySide);
  const Board = rules.Board;

  return (
    <div ref={topRef} className={`${styles.play} ${styles.anchor}`}>
      <div className={styles.playHead}>
        <p className={styles.kicker}>
          {game.endless
            ? `${meta.name} · 무한 연승 ${game.endless.round + 1}번째 판 · ${game.endless.streak}연승 중`
            : `${meta.name} · ${meta.tracks[game.track].short} ${game.stage}단계`}
        </p>
        <h2 className={styles.opponent}>{stage.name}</h2>
      </div>

      <div className={styles.vs}>
        <span className={styles.who}>
          <span className={`${styles.dot} ${styles[`dot_${me.dot}`]}`} />나 ({me.name})
        </span>
        <span className={`${styles.turn} ${game.end ? styles.turnEnd : ""}`} aria-live="polite">
          {game.end ? "대국 끝" : thinking ? "생각 중…" : myTurn ? "내 차례" : "상대 차례"}
        </span>
        <span className={styles.who}>
          컴퓨터 ({cpu.name})
          <span className={`${styles.dot} ${styles[`dot_${cpu.dot}`]}`} />
        </span>
      </div>

      <Board state={state} mySide={game.mySide} active={myTurn && !thinking} end={game.end} onMove={move} onNotice={setNotice} />

      <p className={styles.hint} aria-live="polite">
        {notice || info || ""}
      </p>

      {game.end ? (
        game.endless ? (
          <EndlessEnd
            meta={meta}
            game={game}
            best={progress.best || 0}
            onNext={() => startEndless(game.endless.round + 1, game.endless.streak)}
            onRetry={() => startEndless(0, 0)}
            onList={leave}
          />
        ) : (
          <EndPanel
            meta={meta}
            game={game}
            progress={progress}
            onNext={() => start(game.track, game.stage + 1)}
            onRetry={() => start(game.track, game.stage)}
            onSecond={() => {
              setTab("second");
              start("second", 1);
            }}
            onEndless={() => {
              setTab("endless");
              startEndless(0, 0);
            }}
            onUndo={game.end.winner !== game.mySide && canUndo ? undo : null}
            onList={leave}
          />
        )
      ) : (
        <>
          <div className={styles.btns}>
            {rules.Extra && <rules.Extra state={state} active={myTurn && !thinking} onMove={move} />}
            {!game.endless && (
              <button type="button" className={styles.btn} onClick={undo} disabled={!canUndo || !myTurn}>
                ↶ 무르기 ({game.undoLeft})
              </button>
            )}
            <button type="button" className={styles.btn} onClick={leave}>
              {game.endless ? "그만하기" : "단계 목록"}
            </button>
          </div>
          <p className={styles.starHint}>
            {game.endless
              ? "무한 연승에는 무르기가 없어요. 지면 끝, 비기면 연승이 이어져요."
              : game.undoLeft >= UNDO_LIMIT
                ? "무르기 없이 이기면 ★을 받아요."
                : "무르기를 써서 이번 판은 ★ 없이 기록돼요."}
          </p>
        </>
      )}
      <p className={styles.rule}>{rules.rule}</p>
    </div>
  );
}

function StageList({ meta, progress, tab, setTab, onStart, onEndless, children }) {
  const secondOpen = progress.first >= STAGE_COUNT;
  const endlessOpen = progress.second >= STAGE_COUNT;
  const tier = tierOf(progress);
  const tabs = (
    <div className={styles.tabs} role="tablist" aria-label="도전 고르기">
      {["first", "second", "endless"].map((t) => {
        const locked = (t === "second" && !secondOpen) || (t === "endless" && !endlessOpen);
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`${styles.tab} ${tab === t ? styles.tabOn : ""}`}
            disabled={locked}
            onClick={() => setTab(t)}
          >
            {locked ? "🔒 " : ""}
            {t === "endless" ? "무한 연승" : meta.tracks[t].label}
          </button>
        );
      })}
    </div>
  );

  if (tab === "endless") {
    const top = meta.stages[STAGE_COUNT - 1].name;
    return (
      <section className={styles.stagesBox} aria-labelledby="stages-title">
        {tabs}
        <h2 id="stages-title" className={styles.stagesTitle}>
          👑 무한 연승, 몇 판까지 이어 갈까?
        </h2>
        <ul className={styles.endlessRules}>
          <li>
            가장 센 10단계 &lsquo;{top}&rsquo;{gwaWa(top)} 연달아 둬요.
          </li>
          <li>무르기는 없어요.</li>
          <li>
            판마다 {meta.sides[0].name}·{meta.sides[1].name}이 번갈아 바뀌어요(첫 판은 내가 {meta.sides[0].name}).
          </li>
          <li>지면 끝! 비기면 연승이 이어져요.</li>
        </ul>
        <p className={styles.endlessBest}>{progress.best ? `내 최고 기록 ${progress.best}연승` : "아직 기록이 없어요"}</p>
        {children}
        <button type="button" className={`${styles.primary} ${styles.endlessStart}`} onClick={onEndless}>
          무한 연승 도전 시작
        </button>
        {tier && <ShareRecord meta={meta} progress={progress} />}
        <p className={styles.saveNote}>기록은 이 기기의 브라우저에만 저장돼요. 다른 기기에서는 1단계부터 시작해요.</p>
      </section>
    );
  }

  const cleared = progress[tab] || 0;
  const starred = progress.stars?.[tab] || [];
  const side = meta.sides[tab === "first" ? 0 : 1].name;
  return (
    <section className={styles.stagesBox} aria-labelledby="stages-title">
      {tabs}
      <h2 id="stages-title" className={styles.stagesTitle}>
        {tab === "second" ? `이번엔 ${meta.tracks.second.short}${euro(meta.tracks.second.short)}, 다시 1단계부터` : "몇 단계까지 갈 수 있을까?"}
      </h2>
      <p className={styles.stagesLead}>
        {tab === "first" ? `내가 먼저 둬요(${side})` : `컴퓨터가 먼저 둬요 · 나는 ${side}`}
        {" · "}
        {cleared >= STAGE_COUNT ? "모두 깼어요!" : cleared ? `${cleared}단계까지 깼어요` : "1단계부터 시작해요"}
        {cleared > 0 && ` · ★ ${starred.length}/${STAGE_COUNT}`}
      </p>
      {!secondOpen && tab === "first" && (
        <p className={styles.stagesNote}>10단계를 모두 깨면 {meta.tracks.second.label}이 열려요.</p>
      )}
      {secondOpen && !endlessOpen && tab === "second" && (
        <p className={styles.stagesNote}>10단계를 모두 깨면 무한 연승이 열려요.</p>
      )}
      <div className={styles.bar} aria-hidden="true">
        <i style={{ width: `${(cleared / STAGE_COUNT) * 100}%` }} />
      </div>

      {children}

      <ol className={styles.stages}>
        {meta.stages.map((s, i) => {
          const n = i + 1;
          const done = n <= cleared;
          const now = n === cleared + 1;
          const locked = n > cleared + 1;
          return (
            <li key={s.name}>
              <button
                type="button"
                className={`${styles.stage} ${done ? styles.stageDone : ""} ${now ? styles.stageNow : ""}`}
                disabled={locked}
                onClick={() => onStart(tab, n)}
              >
                <span className={styles.num}>{n}</span>
                <span className={styles.stageText}>
                  <b>
                    {s.name}
                    {starred.includes(n) && (
                      <span className={styles.star} aria-label="무르기 없이 이김">
                        {" "}★
                      </span>
                    )}
                  </b>
                  <small>
                    {s.level} · {s.note}
                  </small>
                </span>
                <span className={styles.stageState}>{done ? "다시 하기" : now ? "도전 ›" : "잠김"}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className={styles.starNote}>★ = 무르기 없이 이긴 단계</p>
      {tier && <ShareRecord meta={meta} progress={progress} />}
      <p className={styles.saveNote}>기록은 이 기기의 브라우저에만 저장돼요. 다른 기기에서는 1단계부터 시작해요.</p>
    </section>
  );
}

function EndlessEnd({ meta, game, best, onNext, onRetry, onList }) {
  const won = game.end.winner === game.mySide;
  const draw = game.end.winner === null;
  const { streak, newBest } = game.endless;
  const nextSide = meta.sides[game.mySide === 0 ? 1 : 0].name;
  return (
    <div id="game-end" className={`${styles.end} ${won ? styles.endWin : ""}`} role="status">
      <p className={styles.endTitle}>{won ? `${streak}연승!` : draw ? "비겼어요" : `${streak}연승에서 멈췄어요`}</p>
      {game.end.reason && <p className={styles.endReason}>{game.end.reason}</p>}
      <p className={styles.endText}>
        {won
          ? newBest
            ? "🎉 최고 기록이에요! "
            : `최고 기록은 ${best}연승이에요. `
          : draw
            ? `비겨도 연승은 이어져요(지금 ${streak}연승). `
            : `최고 기록은 ${best}연승이에요. 다시 첫 판부터 도전해 보세요.`}
        {(won || draw) && `다음 판은 내가 ${nextSide}${hasBatchim(nextSide) ? "이에요" : "예요"}.`}
      </p>
      <div className={styles.endBtns}>
        {won || draw ? (
          <button type="button" className={styles.primary} onClick={onNext}>
            다음 판 →
          </button>
        ) : (
          <button type="button" className={styles.primary} onClick={onRetry}>
            다시 도전
          </button>
        )}
        <button type="button" className={styles.btn} onClick={onList}>
          {won || draw ? "그만하기" : "목록으로"}
        </button>
      </div>
    </div>
  );
}

function EndPanel({ meta, game, progress, onNext, onRetry, onSecond, onEndless, onUndo, onList }) {
  const won = game.end.winner === game.mySide;
  const draw = game.end.winner === null;
  const stage = meta.stages[game.stage - 1];
  const isLast = game.stage >= STAGE_COUNT;
  const second = meta.tracks.second;
  return (
    <div id="game-end" className={`${styles.end} ${won ? styles.endWin : ""}`} role="status">
      <p className={styles.endTitle}>{won ? `${game.stage}단계 통과!` : draw ? "무승부예요" : "아쉽게 졌어요"}</p>
      {game.end.reason && <p className={styles.endReason}>{game.end.reason}</p>}
      <p className={styles.endText}>
        {won
          ? isLast
            ? game.track === "first"
              ? `${stage.name}${eulReul(stage.name)} 이겼어요! ${second.label}이 열렸어요.`
              : `${second.short}${euro(second.short)}도 ${stage.name}${eulReul(stage.name)} 이겼어요. ${tierTitle(meta, "legend")}이에요!`
            : `${stage.name}${eulReul(stage.name)} 이겼어요. 다음 상대가 기다려요.`
          : `한 번 더 도전해 보세요. ${meta.tip}`}
      </p>
      {won && (
        <p className={styles.endStar}>
          {game.star ? "무르기 없이 이겼어요 ★" : "무르기를 써서 ★은 못 받았어요. 다시 해서 ★에 도전해 보세요."}
        </p>
      )}
      <div className={styles.endBtns}>
        {won && !isLast && (
          <button type="button" className={styles.primary} onClick={onNext}>
            다음 단계 도전 →
          </button>
        )}
        {won && isLast && (
          <button type="button" className={styles.primary} onClick={game.track === "first" ? onSecond : onEndless}>
            {game.track === "first" ? `${second.label}하기 →` : "무한 연승 도전 →"}
          </button>
        )}
        {!won && (
          <button type="button" className={styles.primary} onClick={onRetry}>
            다시 도전
          </button>
        )}
        {onUndo && (
          <button type="button" className={styles.btn} onClick={onUndo}>
            ↶ 무르고 이어 두기 ({game.undoLeft})
          </button>
        )}
        <button type="button" className={styles.btn} onClick={onList}>
          단계 목록
        </button>
      </div>
      {won && <ShareRecord meta={meta} progress={progress} compact />}
    </div>
  );
}

function Celebrate({ meta, kind }) {
  const last = meta.stages[STAGE_COUNT - 1].name;
  const second = meta.tracks.second;
  return (
    <div className={`${styles.celebrate} ${kind === "legend" ? styles.celebrateLegend : ""}`} role="status">
      <span className={styles.crown} aria-hidden="true">
        👑
      </span>
      <p className={styles.celebrateTitle}>
        {kind === "legend" ? `${tierTitle(meta, "legend")} 달성!` : `${meta.tracks.first.short} 10단계 완주!`}
      </p>
      <p className={styles.celebrateText}>
        {kind === "legend"
          ? `${meta.sides[0].name}${gwaWa(meta.sides[0].name)} ${meta.sides[1].name} 모두 ${last}${eulReul(last)} 이겼어요. 이제 무한 연승이 열렸어요. 이 기록을 친구에게 자랑해 보세요.`
          : `${last}${eulReul(last)} 이겼어요. 이번엔 컴퓨터가 먼저 두는 ${second.label}이 열렸어요. 같은 상대라도 훨씬 어려워요!`}
      </p>
    </div>
  );
}

/** 지금 기록으로 등급 카드를 그려 공유해요. */
function ShareRecord({ meta, progress, compact = false }) {
  const [card, setCard] = useState(null);
  const [hint, setHint] = useState("");
  const content = cardContent(meta, progress);
  const key = `${progress.first}-${progress.second}`;
  useEffect(() => {
    let cancelled = false;
    setCard(null);
    buildGameCard(meta, progress)
      .then((img) => !cancelled && setCard(img))
      .catch(() => {
        /* 카드를 못 그리면 글로만 공유해요 */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, meta.key]);
  if (!content) return null;

  const url = `${SITE.url}${meta.path}`;
  async function share() {
    const shortText = `${content.title} — ${content.sub}`;
    const fullText = [
      `[재미로봄 미니게임 ${meta.name}] ${content.title}`,
      content.sub,
      `${content.lastLabel}: ${content.lastName}`,
      ...content.rows.map(([a, b]) => `· ${a} ${b}`),
      "나보다 높이 갈 수 있을까?",
    ].join("\n");
    setHint("");
    try {
      const r = await shareResult({
        blob: card?.blob,
        fileName: `jaemirobom-${meta.key}.png`,
        title: `재미로봄 ${meta.name}`,
        shortText,
        fullText,
        url,
      });
      track(`${meta.key}_shared`, { mode: r.mode, tier: content.tier });
      if (r.mode === "files") setHint(r.linkCopied ? "링크도 복사해 뒀어요. 사진만 전달됐으면 대화창에 붙여넣어 주세요." : "");
      else if (r.mode === "copied") setHint("공유 글과 링크를 복사했어요. 붙여넣어 보내 주세요.");
    } catch (e) {
      if (e.name !== "AbortError") setHint("공유하지 못했어요. 링크 복사를 이용해 주세요.");
    }
  }

  return (
    <div className={`${styles.share} ${compact ? styles.shareCompact : ""}`}>
      {!compact && (
        <div className={`${styles.badge} ${styles[`badge_${content.tier}`]}`}>
          <span className={styles.badgeDisc}>{content.number}</span>
          <span>
            <small>지금 내 등급 · {TIER_CAP[content.tier]}</small>
            <b>{content.title}</b>
          </span>
        </div>
      )}
      <div className={f.shareRow}>
        <button type="button" className={styles.primary} onClick={share}>
          내 기록 자랑하기
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={async () => setHint((await copyText(url)) ? "링크를 복사했어요." : "링크를 복사하지 못했어요.")}
        >
          링크 복사
        </button>
      </div>
      {hint && <p className={styles.shareHint}>{hint}</p>}
    </div>
  );
}
