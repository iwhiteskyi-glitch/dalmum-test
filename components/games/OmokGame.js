"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import f from "@/components/fortune/fortune.module.css";
import styles from "./games.module.css";
import OmokBoard from "./OmokBoard";
import { BLACK, WHITE, gridOf, moveProblem, play, lastWinningLine, colorOfTurn } from "@/lib/games/omok/rules";
import { STAGES, STAGE_COUNT, TRACKS, TIERS, tierOf } from "@/lib/games/omok/stages";
import { loadProgress, saveProgress } from "@/lib/games/progress";
import { buildGameCard, cardContent } from "@/lib/games/card";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { SITE } from "@/lib/site";
import { eulReul } from "@/lib/korean";

const GAME = "omok";
const UNDO_LIMIT = 3;
const MIN_THINK_MS = 450; // 너무 빨리 두면 어색해서 최소한 이만큼은 "생각"해요

/** 컴퓨터 생각: 작업자(Web Worker)에서 하고, 작업자를 못 쓰는 환경이면 화면 쪽에서 계산해요. */
function useComputer() {
  const workerRef = useRef(null);
  const seq = useRef(0);
  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );
  return useCallback((moves, level) => {
    const id = ++seq.current;
    return new Promise((resolve) => {
      let worker = workerRef.current;
      if (!worker && typeof Worker !== "undefined") {
        try {
          worker = new Worker(new URL("../../lib/games/omok/worker.js", import.meta.url));
          workerRef.current = worker;
        } catch {
          worker = null;
        }
      }
      if (worker) {
        const onMessage = (e) => {
          if (e.data.id !== id) return;
          worker.removeEventListener("message", onMessage);
          resolve(e.data.cell);
        };
        worker.addEventListener("message", onMessage);
        worker.postMessage({ id, moves, level });
        return;
      }
      import("@/lib/games/omok/ai").then(({ chooseMove }) => setTimeout(() => resolve(chooseMove(moves, level)), 0));
    });
  }, []);
}

export default function OmokGame() {
  const [progress, setProgress] = useState(null); // 불러오기 전에는 null
  const progressRef = useRef(null);
  const [tab, setTab] = useState("black");
  const [game, setGame] = useState(null); // { track, stage, moves, status, undoLeft }
  const [ghost, setGhost] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [notice, setNotice] = useState("");
  const [thinking, setThinking] = useState(false);
  const [celebrate, setCelebrate] = useState(null); // "master" | "legend" — 완주 축하
  const topRef = useRef(null);
  const think = useComputer();

  useEffect(() => {
    const p = loadProgress(GAME);
    progressRef.current = p;
    setProgress(p);
    if (p.black >= STAGE_COUNT && p.white < STAGE_COUNT) setTab("white");
  }, []);

  const scrollTop = () =>
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

  function start(track, stage) {
    setGame({ track, stage, moves: [], status: "playing", undoLeft: UNDO_LIMIT });
    setGhost(null);
    setBlocked(null);
    setNotice("");
    setCelebrate(null);
    scrollTop();
  }

  const myColor = game?.track === "white" ? WHITE : BLACK;
  const myTurn = game && game.status === "playing" && colorOfTurn(game.moves.length) === myColor;

  // 컴퓨터 차례면 생각해서 둡니다.
  useEffect(() => {
    if (!game || game.status !== "playing" || colorOfTurn(game.moves.length) === myColor) return;
    let cancelled = false;
    setThinking(true);
    const began = Date.now();
    think(game.moves, game.stage).then((cell) => {
      const wait = Math.max(0, MIN_THINK_MS - (Date.now() - began));
      setTimeout(() => {
        if (cancelled) return;
        setThinking(false);
        const r = cell >= 0 ? play(game.moves, cell) : null;
        if (!r) {
          // 컴퓨터가 둘 곳을 못 찾으면 무승부로 끝내요(거의 일어나지 않아요)
          finish({ ...game, status: "draw" });
          return;
        }
        const next = { ...game, moves: r.moves };
        if (r.outcome === "win") finish({ ...next, status: "lost" });
        else if (r.outcome === "draw") finish({ ...next, status: "draw" });
        else setGame(next);
      }, wait);
    });
    return () => {
      cancelled = true;
    };
    // 수가 바뀔 때만 다시 생각해요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.moves.length, game?.status, game?.track, game?.stage]);

  function finish(ended) {
    setGame(ended);
    setGhost(null);
    track("omok_game_end", { track: ended.track, stage: ended.stage, result: ended.status, moves: ended.moves.length });
    if (ended.status !== "won") return;
    const before = progressRef.current || { black: 0, white: 0 };
    const cleared = Math.max(before[ended.track] || 0, ended.stage);
    const next = { ...before, [ended.track]: cleared, last: { track: ended.track, stage: ended.stage } };
    progressRef.current = next;
    saveProgress(GAME, next);
    setProgress(next);
    if (cleared === STAGE_COUNT && (before[ended.track] || 0) < STAGE_COUNT) {
      setCelebrate(ended.track === "black" ? "master" : "legend");
      if (ended.track === "black") setTab("white");
    }
  }

  function tap(cell) {
    if (!myTurn || thinking) return;
    setBlocked(null);
    if (gridOf(game.moves)[cell]) return;
    // 한 번 누르면 미리보기, 같은 자리를 한 번 더 누르면 둬요(손가락이 빗나가 엉뚱한 곳에 두지 않게)
    if (ghost !== cell) {
      setGhost(cell);
      setNotice("");
      return;
    }
    const problem = moveProblem(gridOf(game.moves), myColor, cell);
    if (problem === "doubleThree") {
      setGhost(null);
      setBlocked(cell);
      setNotice("쌍삼(열린 3이 두 개 동시에 생기는 수)은 둘 수 없어요. 다른 곳에 둬 보세요.");
      return;
    }
    const r = play(game.moves, cell);
    if (!r) return;
    setGhost(null);
    setNotice("");
    const next = { ...game, moves: r.moves };
    if (r.outcome === "win") finish({ ...next, status: "won" });
    else if (r.outcome === "draw") finish({ ...next, status: "draw" });
    else setGame(next);
  }

  function undo() {
    if (!game || thinking || game.undoLeft <= 0 || game.status === "won") return;
    // 내 마지막 수까지 되돌려요(그 뒤 컴퓨터 수 포함)
    const myParity = myColor === BLACK ? 0 : 1;
    let moves = [...game.moves];
    while (moves.length && (moves.length - 1) % 2 !== myParity) moves.pop();
    if (!moves.length) return;
    moves.pop();
    setGame({ ...game, moves, status: "playing", undoLeft: game.undoLeft - 1 });
    setGhost(null);
    setBlocked(null);
    setNotice("");
  }

  // 대국이 끝나면 결과 상자가 보이게 살짝 내려 줘요.
  useEffect(() => {
    if (!game || game.status === "playing") return;
    const t = setTimeout(() => document.getElementById("omok-end")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 350);
    return () => clearTimeout(t);
  }, [game?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!progress) return <div className={styles.placeholder} aria-hidden="true" />;

  if (!game) {
    return (
      <div ref={topRef} className={styles.anchor}>
        {celebrate && <Celebrate kind={celebrate} />}
        <StageList progress={progress} tab={tab} setTab={setTab} onStart={start} />
      </div>
    );
  }

  const stage = STAGES[game.stage - 1];
  const winLine = game.status === "won" || game.status === "lost" ? lastWinningLine(game.moves) : null;
  const ended = game.status !== "playing";
  const isLastStage = game.stage >= STAGE_COUNT;

  return (
    <div ref={topRef} className={styles.play}>
      <div className={styles.playHead}>
        <p className={styles.kicker}>
          오목 · {TRACKS[game.track].short} {game.stage}단계
        </p>
        <h2 className={styles.opponent}>{stage.name}</h2>
      </div>

      <div className={styles.vs}>
        <span className={styles.who}>
          <span className={`${styles.dot} ${myColor === BLACK ? styles.dotBlack : styles.dotWhite}`} />나 ({TRACKS[game.track].stone})
        </span>
        <span className={`${styles.turn} ${ended ? styles.turnEnd : ""}`} aria-live="polite">
          {ended ? "대국 끝" : thinking ? "생각 중…" : myTurn ? "내 차례" : "상대 차례"}
        </span>
        <span className={styles.who}>
          컴퓨터 ({myColor === BLACK ? "백" : "흑"})
          <span className={`${styles.dot} ${myColor === BLACK ? styles.dotWhite : styles.dotBlack}`} />
        </span>
      </div>

      <OmokBoard
        moves={game.moves}
        ghost={ghost}
        ghostColor={myColor}
        lastCell={game.moves[game.moves.length - 1]}
        winLine={winLine}
        blocked={blocked}
        disabled={!myTurn || thinking}
        onTap={tap}
      />

      <p className={styles.hint} aria-live="polite">
        {notice || (ended ? "" : ghost != null ? "같은 자리를 한 번 더 누르면 돌을 놓아요." : "놓고 싶은 자리를 누르세요. 한 번 더 누르면 놓여요.")}
      </p>

      {ended ? (
        <EndPanel
          game={game}
          isLastStage={isLastStage}
          progress={progress}
          onNext={() => start(game.track, game.stage + 1)}
          onRetry={() => start(game.track, game.stage)}
          onUndo={game.status === "lost" && game.undoLeft > 0 ? undo : null}
          onList={() => {
            setGame(null);
            scrollTop();
          }}
        />
      ) : (
        <div className={styles.btns}>
          <button type="button" className={styles.btn} onClick={undo} disabled={!myTurn || game.undoLeft <= 0 || game.moves.length < 2}>
            ↶ 한 수 무르기 ({game.undoLeft})
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              setGame(null);
              scrollTop();
            }}
          >
            단계 목록
          </button>
        </div>
      )}
      <p className={styles.rule}>쌍삼 금지 · 가로·세로·대각선으로 5개를 먼저 이으면 이겨요(6개 이상도 승리)</p>
    </div>
  );
}

function StageList({ progress, tab, setTab, onStart }) {
  const whiteOpen = progress.black >= STAGE_COUNT;
  const cleared = progress[tab] || 0;
  const tier = tierOf(progress);
  return (
    <section className={styles.stagesBox} aria-labelledby="stages-title">
      <div className={styles.tabs} role="tablist" aria-label="도전 고르기">
        {["black", "white"].map((t) => {
          const locked = t === "white" && !whiteOpen;
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
              {TRACKS[t].label}
            </button>
          );
        })}
      </div>
      <h2 id="stages-title" className={styles.stagesTitle}>
        {tab === "white" ? "이번엔 백돌로, 다시 1단계부터" : "몇 단계까지 갈 수 있을까?"}
      </h2>
      <p className={styles.stagesLead}>
        {tab === "white" ? "컴퓨터가 먼저 둬요" : TRACKS[tab].note}
        {" · "}
        {cleared >= STAGE_COUNT ? "모두 깼어요!" : cleared ? `${cleared}단계까지 깼어요` : "1단계부터 시작해요"}
      </p>
      <div className={styles.bar} aria-hidden="true">
        <i style={{ width: `${(cleared / STAGE_COUNT) * 100}%` }} />
      </div>

      <ol className={styles.stages}>
        {STAGES.map((s, i) => {
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
                  <b>{s.name}</b>
                  <small>{s.level}</small>
                </span>
                <span className={styles.stageState}>{done ? "다시 하기" : now ? "도전 ›" : "잠김"}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {tier && <ShareRecord progress={progress} />}
      <p className={styles.saveNote}>기록은 이 기기의 브라우저에만 저장돼요. 다른 기기에서는 1단계부터 시작해요.</p>
    </section>
  );
}

function EndPanel({ game, isLastStage, progress, onNext, onRetry, onUndo, onList }) {
  const won = game.status === "won";
  const stage = STAGES[game.stage - 1];
  return (
    <div id="omok-end" className={`${styles.end} ${won ? styles.endWin : ""}`} role="status">
      <p className={styles.endTitle}>
        {won ? `${game.stage}단계 통과!` : game.status === "draw" ? "무승부예요" : "아쉽게 졌어요"}
      </p>
      <p className={styles.endText}>
        {won
          ? isLastStage
            ? game.track === "black"
              ? "오목의 신을 이겼어요! 백돌 도전이 열렸어요."
              : "백돌로도 오목의 신을 이겼어요. 오목 전설이에요!"
            : `${stage.name}${eulReul(stage.name)} 이겼어요. 다음 상대가 기다려요.`
          : "한 번 더 도전해 보세요. 상대가 3을 만들면 바로 막는 게 요령이에요."}
      </p>
      <div className={styles.endBtns}>
        {won && !isLastStage && (
          <button type="button" className={styles.primary} onClick={onNext}>
            다음 단계 도전 →
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
      {won && <ShareRecord progress={progress} compact />}
    </div>
  );
}

function Celebrate({ kind }) {
  return (
    <div className={`${styles.celebrate} ${kind === "legend" ? styles.celebrateLegend : ""}`} role="status">
      <span className={styles.crown} aria-hidden="true">
        👑
      </span>
      <p className={styles.celebrateTitle}>{kind === "legend" ? "오목 전설 달성!" : "흑돌 10단계 완주!"}</p>
      <p className={styles.celebrateText}>
        {kind === "legend"
          ? "흑돌과 백돌 모두 오목의 신을 이겼어요. 이 기록을 친구에게 자랑해 보세요."
          : "오목의 신을 이겼어요. 이번엔 컴퓨터가 먼저 두는 백돌 도전이 열렸어요. 같은 상대라도 훨씬 어려워요!"}
      </p>
    </div>
  );
}

/** 지금 기록으로 등급 카드를 그려 공유해요. */
function ShareRecord({ progress, compact = false }) {
  const [card, setCard] = useState(null);
  const [hint, setHint] = useState("");
  const content = cardContent(progress);
  const key = `${progress.black}-${progress.white}`;
  useEffect(() => {
    let cancelled = false;
    setCard(null);
    buildGameCard(progress)
      .then((img) => !cancelled && setCard(img))
      .catch(() => {
        /* 카드를 못 그리면 글로만 공유해요 */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!content) return null;

  const url = `${SITE.url}/games/omok`;
  async function share() {
    const shortText = `${content.title} — ${content.sub}`;
    const fullText = [
      `[재미로봄 미니게임 오목] ${content.title}`,
      content.sub,
      `${content.lastLabel}: ${content.lastName}`,
      ...content.rows.map(([a, b]) => `· ${a} ${b}`),
      "나보다 높이 갈 수 있을까?",
    ].join("\n");
    setHint("");
    try {
      const r = await shareResult({ blob: card?.blob, fileName: "jaemirobom-omok.png", title: "재미로봄 오목", shortText, fullText, url });
      track("omok_shared", { mode: r.mode, tier: content.tier });
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
            <small>지금 내 등급</small>
            <b>{TIERS[content.tier].title}</b>
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
