"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./games.module.css";
import { seededRandom } from "@/lib/games/slide/slide";
import {
  dailyPick,
  judgeTap,
  lockMs,
  MAX_WRONG,
  nextPicture,
  PICTURE_COUNT,
  PICTURE_SIZE,
  pickSpots,
  rememberPicture,
  shiftClock,
  SPOT_COUNT,
  spotDataUrl,
  spotPath,
  spotPictureUrl,
  stageLevel,
  stageSeconds,
} from "@/lib/games/spot/spot";
import { dailyStatus, loadBest, loadSeen, saveBest, saveDaily, saveSeen } from "@/lib/games/spot/record";
import { formatClock } from "@/lib/games/sudoku/record";

// 틀린 그림 찾기 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요).
//  - 연승 도전: 두 그림에서 다른 곳 5곳을 시간 안에 찾으면 다음 판. 갈수록 시간이 줄고 다른 곳이 작아져요.
//    시간이 다 되거나 한 판에 5번 잘못 누르면 끝, 최고 연승을 남겨요.
//  - 오늘의 그림: 날마다 정해진 그림 한 장(어려움). 시간 제한 없이 다 찾은 시간을 남겨요.
// 잘못 누르면 잠깐(1·2·3초) 못 눌러요. 힌트는 판마다 한 번. 잠깐 멈추면 그림을 가리고 시간도 멈춰요.

const CLEAR_MS = 1300;
const HINT_MS = 1800;
const LOW_SECONDS = 10;

/** 그림마다 다른 곳 자료(약 22KB)는 필요할 때 받아서 기억해 둬요 */
const dataCache = new Map();
function loadPicture(picture) {
  if (!dataCache.has(picture)) {
    const data = fetch(spotDataUrl(picture)).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
    const image = new Promise((resolve) => {
      const img = new window.Image();
      img.onload = img.onerror = () => resolve();
      img.src = spotPictureUrl(picture);
    });
    const both = Promise.all([data, image]).then(([d]) => d);
    both.catch(() => dataCache.delete(picture)); // 실패하면 다음에 다시 받아요
    dataCache.set(picture, both);
  }
  return dataCache.get(picture);
}

/** 본 그림 기록에서 다음 그림을 골라 기록해요(50장이 한 바퀴 돌기 전에는 겹치지 않아요) */
function pickNextPicture() {
  const seen = loadSeen(PICTURE_COUNT);
  const picture = nextPicture(seen, PICTURE_COUNT, Math.random);
  saveSeen(rememberPicture(seen, picture, PICTURE_COUNT));
  return picture;
}

/** 그림 한 장: 이쪽을 바꾸는 다른 곳을 덮어 그리고, 찾은 곳·힌트·잘못 누른 표시를 위에 그려요 */
function Picture({ run, side, now, showAll, hidden, onTap }) {
  const paths = useMemo(() => run.spots.flatMap((spot) => (spot.side === side ? [{ d: spotPath(spot.polygons), color: spot.color }] : [])), [run.spots, side]);
  const marker = PICTURE_SIZE / 60;
  const mark = run.mark && now < run.lockUntil ? run.mark : null;
  const hint = run.hint !== null && now < run.hintUntil ? run.hint : null;
  const press = (e) => {
    if (e.button !== 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    onTap(((e.clientX - r.left) / r.width) * PICTURE_SIZE, ((e.clientY - r.top) / r.height) * PICTURE_SIZE);
  };
  return (
    <div className={`${styles.spPic} ${hidden ? styles.spHidden : ""}`} onPointerDown={press} onContextMenu={(e) => e.preventDefault()}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 미리 받아 둔 그림을 그대로 써요 */}
      <img src={spotPictureUrl(run.picture)} alt={side === "top" ? "첫 번째 그림" : "두 번째 그림"} draggable={false} />
      <svg viewBox={`0 0 ${PICTURE_SIZE} ${PICTURE_SIZE}`} aria-hidden="true">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} fillRule="evenodd" />
        ))}
        {run.spots.map((spot, i) => {
          const isFound = run.found.includes(i);
          if (!isFound && !showAll && hint !== i) return null;
          // 어떤 색 위에서도 보이게 어두운 테두리 위에 밝은(못 찾은 곳은 빨간) 동그라미를 겹쳐요
          return (
            <g key={i}>
              <circle cx={spot.x} cy={spot.y} r={spot.radius} fill="none" stroke="#1d1d2b" strokeWidth={marker * 2} />
              <circle cx={spot.x} cy={spot.y} r={spot.radius} fill="none" stroke={isFound ? "#fff6d8" : "#e53935"} strokeWidth={marker} />
            </g>
          );
        })}
        {mark && (
          <g stroke="#e53935" strokeWidth={marker * 1.5} strokeLinecap="round">
            <line x1={mark.x - 36} y1={mark.y - 36} x2={mark.x + 36} y2={mark.y + 36} />
            <line x1={mark.x + 36} y1={mark.y - 36} x2={mark.x - 36} y2={mark.y + 36} />
          </g>
        )}
      </svg>
    </div>
  );
}

export default function SpotGame() {
  const topRef = useRef(null);
  const upcoming = useRef(null);
  const timer = useRef(null);
  const [best, setBest] = useState(0);
  const [daily, setDaily] = useState(null);
  const [run, setRun] = useState(null);
  const [over, setOver] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [pausedAt, setPausedAt] = useState(null);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const refresh = () => {
    setBest(loadBest());
    setDaily(dailyStatus());
  };
  useEffect(() => {
    refresh();
    return () => clearTimeout(timer.current);
  }, []);

  /** 판 하나 준비: 자료와 그림을 다 받은 뒤에 시작해요(시간이 그림 받는 동안 흐르지 않게) */
  const begin = async (mode, number) => {
    setLoading(true);
    setFailed(false);
    try {
      let picture;
      let random = Math.random;
      let key = null;
      if (mode === "daily") {
        key = dailyStatus().today;
        const pick = dailyPick(key);
        picture = pick.picture;
        random = seededRandom(pick.seed);
      } else {
        picture = upcoming.current ?? pickNextPicture();
        upcoming.current = null;
      }
      const data = await loadPicture(picture);
      const level = mode === "daily" ? "h" : stageLevel(number);
      const at = Date.now();
      setRun({
        mode,
        key,
        number,
        picture,
        spots: pickSpots(data[level], random),
        found: [],
        wrong: 0,
        wrongInARow: 0,
        hintUsed: false,
        startedAt: at,
        deadline: mode === "daily" ? 0 : at + stageSeconds(number) * 1000,
        lockUntil: 0,
        mark: null,
        hint: null,
        hintUntil: 0,
      });
      setNow(at);
      setClearing(false);
      setPausedAt(null);
      if (mode !== "daily") {
        // 다음 판 그림을 미리 받아 둬요
        upcoming.current = pickNextPicture();
        loadPicture(upcoming.current).catch(() => {});
      }
    } catch {
      // 그림을 못 받으면 처음 화면으로(연승 중이었다면 깬 판까지는 기록해요)
      if (mode === "streak" && number > 1) saveBest(number - 1);
      clearTimeout(timer.current);
      setRun(null);
      setOver(null);
      setClearing(false);
      setFailed(true);
      refresh();
    }
    setLoading(false);
  };

  const start = (mode) => {
    clearTimeout(timer.current);
    setOver(null);
    setRun(null);
    begin(mode, 1);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  };

  const finish = (current, reason) => {
    clearTimeout(timer.current);
    if (current.mode === "daily") {
      const ms = Date.now() - current.startedAt;
      setOver({ reason, ms, newBest: reason === "found" ? saveDaily(current.key, ms) : false });
    } else {
      // 깬 판 수. 다 찾고 다음 판으로 넘어가는 중에 그만두면 그 판까지 쳐요
      const streak = reason === "quit" && clearing ? current.number : current.number - 1;
      setOver({ reason, streak, newBest: saveBest(streak) });
    }
    setClearing(false);
    setPausedAt(null);
    refresh();
  };

  // 시계: 푸는 동안 0.1초마다. 시간이 다 되면 끝
  const running = Boolean(run) && !over && !clearing && pausedAt === null;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (running && run.deadline && now >= run.deadline) finish(run, "time");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, now, run]);

  // 잠깐 멈춤: 멈춘 동안 그림을 가리고, 이어 하면 멈춘 시간만큼 시각들을 뒤로 밀어요
  const pause = () => {
    if (running) setPausedAt(Date.now());
  };
  const resume = () => {
    if (pausedAt === null) return;
    const ms = Date.now() - pausedAt;
    setRun((r) => ({ ...shiftClock(r, ms), startedAt: r.startedAt + ms }));
    setPausedAt(null);
    setNow(Date.now());
  };
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  useEffect(() => {
    const onHide = () => document.hidden && pauseRef.current();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const tap = (x, y) => {
    if (!run || over || clearing || pausedAt !== null) return;
    const at = Date.now();
    if (at < run.lockUntil) return;
    const result = judgeTap(run.spots, run.found, x, y);
    if (result === "again") return;
    if (result === "miss") {
      const wrong = run.wrong + 1;
      const wrongInARow = run.wrongInARow + 1;
      const next = { ...run, wrong, wrongInARow, lockUntil: at + lockMs(wrongInARow), mark: { x, y } };
      setRun(next);
      setNow(at);
      if (run.mode !== "daily" && wrong >= MAX_WRONG) finish(next, "wrong");
      return;
    }
    const found = [...run.found, result];
    const next = { ...run, found, wrongInARow: 0, hintUntil: run.hint === result ? 0 : run.hintUntil };
    setRun(next);
    if (found.length < SPOT_COUNT) return;
    if (run.mode === "daily") {
      finish(next, "found");
      return;
    }
    setClearing(true);
    timer.current = setTimeout(() => begin("streak", run.number + 1), CLEAR_MS);
  };

  const showHint = () => {
    if (!run || run.hintUsed || over || clearing || pausedAt !== null) return;
    const remaining = run.spots.map((_, i) => i).filter((i) => !run.found.includes(i));
    const hint = remaining[Math.floor(Math.random() * remaining.length)];
    const at = Date.now();
    setRun({ ...run, hintUsed: true, hint, hintUntil: at + HINT_MS });
    setNow(at);
  };

  const leave = () => {
    if (!run || over) {
      clearTimeout(timer.current);
      setRun(null);
      setOver(null);
      refresh();
      return;
    }
    const msg = run.mode === "daily" ? "그만할까요? 오늘의 그림은 언제든 다시 할 수 있어요." : "그만할까요? 지금 판은 사라지고, 깬 판까지 기록에 남아요.";
    if (!window.confirm(msg)) return;
    if (run.mode === "daily") {
      setRun(null);
      refresh();
    } else finish(run, "quit");
  };

  /* ---------- 첫 화면 ---------- */
  if (!run) {
    return (
      <div className={styles.anchor} ref={topRef}>
        <button type="button" className={styles.slideDaily} onClick={() => start("daily")} disabled={loading}>
          <span>
            <strong>
              오늘의 그림<span className={`${styles.lv} ${styles.lv_hard}`}>어려움</span>
            </strong>
            <small>
              {daily?.done
                ? `오늘 ⏱ ${formatClock(daily.done.ms)}${daily.streak > 1 ? ` · ${daily.streak}일 연속` : ""}`
                : "자정마다 바뀌는 그림 한 장, 시간 제한 없이 다른 곳 5곳 찾기"}
            </small>
          </span>
          <span className={styles.gameGo} aria-hidden="true">
            ›
          </span>
        </button>

        <section className={styles.stagesBox} aria-labelledby="spot-title">
          <h2 id="spot-title" className={styles.stagesTitle}>
            🔥 연승 도전
          </h2>
          <p className={styles.endlessBest}>{best ? `내 최고 기록 ${best}연승` : "아직 기록이 없어요"}</p>
          <ul className={styles.endlessRules}>
            <li>두 그림에서 다른 곳 5곳을 찾으면 다음 판으로 가요.</li>
            <li>첫 판은 60초, 판마다 시간이 줄어 10판째부터 30초예요.</li>
            <li>6판째부터 다른 곳이 더 작고 찾기 어려워져요.</li>
            <li>잘못 누르면 잠깐 못 누르고, 한 판에 {MAX_WRONG}번 잘못 누르면 끝나요.</li>
            <li>힌트는 판마다 한 번, 다른 곳 하나를 잠깐 보여 줘요.</li>
          </ul>
          {failed && <p className={styles.sdWrong}>그림을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.</p>}
          <button type="button" className={`${styles.primary} ${styles.endlessStart}`} onClick={() => start("streak")} disabled={loading}>
            {loading ? "그림을 불러오는 중…" : "연승 도전 시작"}
          </button>
          <p className={styles.saveNote}>기록은 이 기기의 브라우저에만 저장돼요.</p>
        </section>
      </div>
    );
  }

  /* ---------- 푸는 화면 ---------- */
  const daily_ = run.mode === "daily";
  const seconds = stageSeconds(run.number);
  const left = daily_ || over ? 0 : clearing ? run.deadline - (pausedAt ?? now) : Math.max(0, run.deadline - (pausedAt ?? now));
  const leftSeconds = Math.ceil(Math.max(0, left) / 1000);
  const elapsed = over?.ms ?? (pausedAt ?? now) - run.startedAt;
  const lockLeft = Math.ceil((run.lockUntil - now) / 1000);
  const message = over
    ? null
    : clearing
      ? "다 찾았어요! 다음 판으로 가요"
      : pausedAt !== null
        ? "잠깐 멈췄어요"
        : now < run.lockUntil
          ? `아니에요! ${lockLeft}초 뒤에 눌러요`
          : "두 그림에서 다른 곳을 눌러요 (어느 쪽을 눌러도 돼요)";

  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      <div className={styles.slideTop}>
        <span className={styles.slideTitle}>{daily_ ? "오늘의 그림" : `🔥 ${run.number}판째`}</span>
        <button type="button" className={styles.slideBack} onClick={leave}>
          {over ? "처음으로" : "그만하기"}
        </button>
      </div>
      <div className={styles.spStatus}>
        <button
          type="button"
          className={styles.sdPause}
          onClick={pausedAt === null ? pause : resume}
          disabled={Boolean(over) || clearing}
          aria-label={pausedAt === null ? "잠깐 멈추기" : "다시 시작"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            {pausedAt === null ? <path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" /> : <path d="M3.5 2 12 7l-8.5 5z" fill="currentColor" />}
          </svg>
        </button>
        <span className={styles.spCount}>
          찾음 <b>{run.found.length}</b>/{SPOT_COUNT}
        </span>
        <span className={`${styles.spCount} ${run.wrong ? styles.sdWrong : ""}`}>{daily_ ? `틀림 ${run.wrong}` : `틀림 ${run.wrong}/${MAX_WRONG}`}</span>
        <span className={`${styles.spTime} ${!daily_ && !over && leftSeconds <= LOW_SECONDS && !clearing ? styles.spTimeLow : ""}`}>
          {daily_ ? `⏱ ${formatClock(Math.max(0, elapsed))}` : over ? "끝" : clearing ? "✔" : `${leftSeconds}초`}
        </span>
      </div>
      {!daily_ && (
        <div className={styles.spTrack} aria-hidden="true">
          <i
            className={leftSeconds <= LOW_SECONDS && !clearing ? styles.spTrackLow : ""}
            style={{ width: `${clearing ? 100 : Math.min(100, Math.round((Math.max(0, left) / (seconds * 1000)) * 100))}%` }}
          />
        </div>
      )}
      {message && (
        <p className={`${styles.slideHint} ${now < run.lockUntil && !clearing ? styles.sdWrong : ""}`} role="status">
          {message}
        </p>
      )}

      <div className={styles.spPair}>
        <Picture key={`t${run.number}-${run.picture}`} run={run} side="top" now={now} showAll={Boolean(over)} hidden={pausedAt !== null} onTap={tap} />
        <Picture key={`b${run.number}-${run.picture}`} run={run} side="bottom" now={now} showAll={Boolean(over)} hidden={pausedAt !== null} onTap={tap} />
        {pausedAt !== null && (
          <button type="button" className={styles.sdResume} onClick={resume}>
            이어서 하기
          </button>
        )}
      </div>

      {over ? (
        <div className={styles.slideResult} role="status">
          {daily_ ? (
            <>
              <p className={styles.endTitle}>⏱ {formatClock(over.ms)}</p>
              <p className={styles.endText}>{over.newBest ? "오늘의 최고 기록이에요!" : "다 찾았어요!"}</p>
            </>
          ) : (
            <>
              <p className={styles.endTitle}>
                {over.reason === "time" ? "시간이 다 됐어요!" : over.reason === "wrong" ? `${MAX_WRONG}번 틀렸어요!` : "여기까지!"} {over.streak}연승
              </p>
              <p className={styles.endText}>{over.newBest ? "🎉 새 기록이에요!" : `최고 기록 ${best}연승`}</p>
              {over.reason !== "quit" && <p className={styles.spNote}>빨간 동그라미가 못 찾은 곳이에요.</p>}
            </>
          )}
          <div className={styles.btns}>
            <button type="button" className={styles.primary} onClick={() => start("streak")}>
              {daily_ ? "연승 도전 하기" : "다시 도전"}
            </button>
            <button type="button" className={styles.btn} onClick={leave}>
              처음으로
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.spBottom}>
          <button type="button" className={styles.sdTool} onClick={showHint} disabled={run.hintUsed || clearing || pausedAt !== null}>
            {run.hintUsed ? "💡 힌트 씀" : "💡 힌트 (판마다 1번)"}
          </button>
        </div>
      )}
    </div>
  );
}
