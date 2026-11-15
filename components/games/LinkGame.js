"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./games.module.css";
import { EMPTY, endlessSpec, findPair, LEVELS, makeBoard, TILE_PICTURES, tilesLeft } from "@/lib/games/link/link";
import { breakWithPower, linkPair, newPlay, shufflePlay, takeHint } from "@/lib/games/link/play";
import {
  addEndlessStreak,
  addStageClear,
  clearedCount,
  clearEndlessSaved,
  dailyLinkBoard,
  dailyShuffleRandom,
  dailyStatus,
  EMPTY_RECORD,
  formatClock,
  isEndlessOpen,
  isStageCleared,
  isStageOpen,
  loadRecord,
  nextStage,
  saveDaily,
  STAGE_COUNT,
  STAR_LINES,
  starsFor,
  starTotal,
} from "@/lib/games/link/record";
import { LEVELS as DAY_LEVELS, levelOf } from "@/lib/games/daily";

// 짝꿍 잇기 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요).
// 같은 그림 두 개를 두 번까지 꺾인 선으로 이으면 사라져요. 3초 안에 계속 이으면 콤보, 5콤보마다 파워(아무 타일이나 누르면
// 같은 그림 하나와 함께 바로 깨짐). 이을 짝이 없으면 잠깐 알리고 남은 타일을 섞어요(그동안 시간은 멈춰요).

const ENDLESS = 0;
/** 이 시간 안에 다음 쌍을 없애면 콤보 */
const COMBO_MS = 3000;
/** 콤보가 이 수의 배수가 될 때마다 파워 */
const POWER_EVERY = 5;
const POWER_MS = 5000;
/** 이을 짝이 없을 때: 알리는 동안 → 타일이 새 자리로 날아가는 동안 (그동안 시계는 멈춰요) */
const SHUFFLE_WAIT_MS = 1100;
const SHUFFLE_MOVE_MS = 650;
/** 쌍을 없앨 때 선과 사라지는 타일을 보여 주는 시간 */
const FLASH_MS = 380;
/** 남은 시간이 이보다 적으면 빨갛게 */
const LOW_MS = 20000;

const PICTURE_NAMES = [
  "도넛", "아이스크림", "샌드위치", "국수", "바나나", "딸기", "커피", "쿠키", "비행기", "구름", "무지개", "해",
  "풍선", "별", "여행 가방", "여권", "카메라", "선글라스", "베개", "배낭", "헤드폰", "티켓", "창문", "안대",
  "지구본", "나침반", "야자수", "등대", "텐트", "산", "모래성", "돛단배", "프레첼", "주스", "컵케이크", "탄산음료",
];
const tileUrl = (picture) => `/games/link/${TILE_PICTURES[picture]}.webp`;

const SLIDES = {
  none: "미끄러짐 없음",
  down: "아래로 미끄러짐",
  up: "위로 미끄러짐",
  left: "왼쪽으로 미끄러짐",
  right: "오른쪽으로 미끄러짐",
  center: "가운데로 모임",
  random: "미끄러짐 무작위",
};
const starText = (n) => "★".repeat(n) + "☆".repeat(3 - n);

/** 판. 타일은 이름표(id) 순서로 그려서, 미끄러지거나 섞일 때 같은 타일이 제자리에서 새 자리로 움직여요 */
const Board = memo(function Board({ board, ids, cell, selected, hint, shake, flash, moveMs, power, hidden, locked, onPress }) {
  const { cols, rows, cells } = board;
  const where = new Map();
  ids.forEach((id, index) => id !== EMPTY && where.set(id, index));
  const order = [...where.keys()].sort((a, b) => a - b);
  const at = (index) => `translate(${((index % cols) + 0.5) * cell}px, ${(Math.floor(index / cols) + 0.5) * cell}px)`;
  const hinted = new Set(hint || []);
  const shaking = new Set(shake?.indices || []);
  return (
    <div
      className={`${styles.lkBoard} ${power ? styles.lkPowerOn : ""} ${hidden ? styles.lkHidden : ""} ${locked ? styles.lkLocked : ""}`}
      style={{ width: (cols + 1) * cell, height: (rows + 1) * cell, "--cell": `${cell}px`, "--move": `${moveMs}ms` }}
    >
      {order.map((id) => {
        const index = where.get(id);
        const picture = cells[index];
        const cls = [
          styles.lkTile,
          index === selected ? styles.lkSel : "",
          hinted.has(index) ? styles.lkHint : "",
          shaking.has(index) ? styles.lkShake : "",
        ].join(" ");
        return (
          <button
            key={id}
            type="button"
            className={cls}
            style={{ transform: at(index) }}
            aria-label={`${Math.floor(index / cols) + 1}행 ${(index % cols) + 1}열 ${PICTURE_NAMES[picture]}`}
            aria-pressed={index === selected}
            onClick={() => onPress(index)}
          >
            <img src={tileUrl(picture)} alt="" draggable="false" />
          </button>
        );
      })}
      {flash &&
        flash.removed.map((r) => (
          <span key={`g${flash.key}-${r.id}`} className={`${styles.lkTile} ${styles.lkGone}`} style={{ transform: at(r.index) }} aria-hidden="true">
            <img src={tileUrl(r.picture)} alt="" />
          </span>
        ))}
      {flash && flash.path.length > 1 && (
        <svg key={`p${flash.key}`} className={styles.lkPath} width={(cols + 1) * cell} height={(rows + 1) * cell} aria-hidden="true">
          <polyline points={flash.path.map((p) => `${(p.col + 1) * cell},${(p.row + 1) * cell}`).join(" ")} />
        </svg>
      )}
    </div>
  );
});

export default function LinkGame() {
  const topRef = useRef(null);
  const wrapRef = useRef(null);
  const resultRef = useRef(null);
  const roundRef = useRef(0);
  const keys = useRef(0);
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [daily, setDaily] = useState(null);
  const [run, setRun] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hint, setHint] = useState(null);
  const [flash, setFlash] = useState(null);
  const [shake, setShake] = useState(null);
  const [message, setMessage] = useState(null);
  const [pausedAt, setPausedAt] = useState(null);
  const [shuffle, setShuffle] = useState(null);
  const [now, setNow] = useState(0);
  const [cell, setCell] = useState(0);
  const combo = useRef({ count: 0, at: 0 });
  const powerUntil = useRef(0);
  const shuffleRandom = useRef(Math.random);

  const refresh = () => {
    setRecord(loadRecord());
    setDaily(dailyStatus());
  };
  // 타일 그림은 판을 시작할 때 그 판에 나온 것만 받아요(처음 화면에서 미리 받지 않아요)
  useEffect(() => {
    refresh();
  }, []);
  const runRef = useRef(run);
  runRef.current = run;

  /** stage: 1~10 단계, 0 무한 도전, "daily" 오늘의 짝꿍 잇기 */
  const start = (stage, streak = 0) => {
    let board;
    let spec;
    let key = null;
    if (stage === "daily") {
      key = dailyStatus().today;
      board = dailyLinkBoard(key);
      spec = { seconds: null };
      shuffleRandom.current = dailyShuffleRandom(key);
    } else {
      if (stage === ENDLESS) clearEndlessSaved(); // 판을 깨야 다시 저장돼요. 중간에 나가면 연속이 끝나요
      spec = stage === ENDLESS ? endlessSpec(streak + 1) : LEVELS[stage - 1];
      board = makeBoard(spec, Math.random);
      shuffleRandom.current = Math.random;
    }
    roundRef.current += 1;
    combo.current = { count: 0, at: 0 };
    powerUntil.current = 0;
    const t = Date.now();
    setRun({ stage, daily: key, seconds: spec.seconds, play: newPlay(board), round: roundRef.current, startedAt: t, streak, done: null });
    setSelected(null);
    setHint(null);
    setFlash(null);
    setShake(null);
    // 드물게 처음부터 이을 짝이 없는 판이 나오면(판 만들기가 40번 안에 못 찾을 때) 바로 섞어요
    const stuck = !findPair(board);
    setMessage(stuck ? "이을 짝이 없어요! 섞을게요" : null);
    setShuffle(stuck ? { phase: "wait", at: t } : null);
    setPausedAt(document.hidden ? t : null);
    setNow(t);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  };

  /* ---------- 판 크기: 화면 폭과 높이에 맞춰요 ---------- */
  const cols = run?.play.board.cols;
  const rows = run?.play.board.rows;
  useLayoutEffect(() => {
    if (!cols) return;
    const fit = () => {
      const width = wrapRef.current?.clientWidth || 320;
      const height = window.innerHeight - 260;
      setCell(Math.max(26, Math.min(56, Math.floor(width / (cols + 1)), Math.floor(height / (rows + 1)))));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [cols, rows]);

  /* ---------- 시계 ---------- */
  const limitMs = run?.seconds ? run.seconds * 1000 : 0;
  const elapsed = run ? (run.done?.ms ?? (pausedAt ?? shuffle?.at ?? (now || run.startedAt)) - run.startedAt) : 0;
  const running = Boolean(run) && !run.done && pausedAt === null && !shuffle;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [running]);

  /** 멈췄던 시간만큼 시작 시각·콤보·파워 시각을 뒤로 밀어요 */
  const shift = (ms) => {
    setRun((r) => r && { ...r, startedAt: r.startedAt + ms });
    combo.current = { ...combo.current, at: combo.current.at + ms };
    if (powerUntil.current) powerUntil.current += ms;
  };

  // 시간이 다 되면 끝
  const timedOut = running && limitMs > 0 && elapsed >= limitMs;
  useEffect(() => {
    if (!timedOut) return;
    if (run.stage === ENDLESS) clearEndlessSaved();
    setRun((r) => r && { ...r, done: { kind: "timeUp", ms: limitMs } });
    setSelected(null);
    setHint(null);
    powerUntil.current = 0;
    refresh();
  }, [timedOut]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- 하는 동안 화면이 밀리지 않게 ---------- */
  // 판은 한 화면에 들어오게 크기를 맞춰 두었어요. 그래서 판을 푸는 동안(멈춤·끝 제외)은 화면 스크롤을 막아,
  // 타일을 누르다 손가락이 미끄러져도 화면이 움직이지 않게 해요. 끝나면 결과와 다음 버튼 쪽으로 내려가요.
  // (가로로 눕힌 폰처럼 화면이 낮으면 판이 한 화면에 안 들어와서 막지 않아요)
  const solving = Boolean(run) && !run.done && pausedAt === null && typeof window !== "undefined" && window.innerHeight >= 520;
  useEffect(() => {
    if (!solving) return;
    const root = document.documentElement;
    const before = { overflow: root.style.overflow, overscroll: root.style.overscrollBehavior };
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    const stop = (e) => e.cancelable && e.preventDefault(); // 아이폰 사파리는 overflow만으로는 안 막혀요
    document.addEventListener("touchmove", stop, { passive: false });
    return () => {
      root.style.overflow = before.overflow;
      root.style.overscrollBehavior = before.overscroll;
      document.removeEventListener("touchmove", stop);
    };
  }, [solving]);
  const finished = Boolean(run?.done);
  useEffect(() => {
    if (!finished) return;
    const timer = setTimeout(() => resultRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 450);
    return () => clearTimeout(timer);
  }, [finished]);

  /* ---------- 잠깐 멈춤 ---------- */
  const pause = () => {
    if (run && !run.done && pausedAt === null && !shuffle) setPausedAt(Date.now());
  };
  const resume = () => {
    if (pausedAt === null) return;
    shift(Date.now() - pausedAt);
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

  /* ---------- 섞기: 알리고 → 섞고(타일이 날아감) → 멈췄던 시간을 빼요 ---------- */
  useEffect(() => {
    if (!shuffle) return;
    if (shuffle.phase === "wait") {
      const timer = setTimeout(() => {
        setRun((r) => r && { ...r, play: shufflePlay(r.play, shuffleRandom.current) });
        setShuffle((s) => s && { ...s, phase: "move" });
      }, SHUFFLE_WAIT_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      const t = Date.now();
      shift(t - shuffle.at);
      // 섞은 판에도 이을 짝이 없으면(아주 드물어요) 한 번 더 섞어요
      const current = runRef.current?.play.board;
      if (current && tilesLeft(current) > 0 && !findPair(current)) {
        setShuffle({ phase: "wait", at: t });
        return;
      }
      setShuffle(null);
      setMessage(null);
      setNow(t);
      if (document.hidden) setPausedAt(t); // 섞는 동안 다른 탭으로 갔으면 멈춘 채로
    }, SHUFFLE_MOVE_MS);
    return () => clearTimeout(timer);
  }, [shuffle]); // eslint-disable-line react-hooks/exhaustive-deps

  // 선·사라지는 타일, 흔들림은 잠깐만
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);
  useEffect(() => {
    if (!shake) return;
    const timer = setTimeout(() => setShake(null), 420);
    return () => clearTimeout(timer);
  }, [shake]);

  const locked = !run || Boolean(run.done) || pausedAt !== null || Boolean(shuffle);
  const clockNow = now || run?.startedAt || 0;
  const powerOn = !locked && powerUntil.current > clockNow;
  const comboShown = !run?.done && combo.current.count >= 2 && clockNow - combo.current.at <= COMBO_MS ? combo.current.count : 0;

  /** 쌍을 없앤 뒤: 선·사라짐을 그리고, 다 없앴는지·콤보·파워·섞기를 처리해요 */
  const afterRemove = (result) => {
    const t = Date.now();
    combo.current = t - combo.current.at <= COMBO_MS ? { count: combo.current.count + 1, at: t } : { count: 1, at: t };
    const count = combo.current.count;
    const cleared = tilesLeft(result.play.board) === 0;
    setFlash({ key: ++keys.current, path: result.path, removed: result.removed });
    setSelected(null);
    setHint(null); // 미끄러지거나 섞이면 힌트 자리가 바뀌어서, 한 쌍을 없앨 때마다 지워요
    setNow(t);
    if (cleared) {
      const ms = t - run.startedAt;
      let done;
      if (run.daily) done = { kind: "clear", ms, newBest: saveDaily(run.daily, ms) };
      else if (run.stage === ENDLESS) {
        const n = run.streak + 1;
        done = { kind: "clear", ms, count: n, newBest: addEndlessStreak(n).newBest };
      } else {
        const stars = starsFor(ms, run.seconds);
        done = { kind: "clear", ms, stars, ...addStageClear(run.stage, ms, stars) };
      }
      powerUntil.current = 0;
      setMessage(null);
      setRun({ ...run, play: result.play, done });
      refresh();
      return;
    }
    powerUntil.current = count % POWER_EVERY === 0 ? t + POWER_MS : powerUntil.current > t ? powerUntil.current : 0;
    setRun({ ...run, play: result.play });
    if (result.stuck) {
      setMessage("이을 짝이 없어요! 섞을게요");
      setShuffle({ phase: "wait", at: t });
    } else setMessage(null);
  };

  const pressTile = (index) => {
    if (locked) return;
    const { play } = run;
    const cells = play.board.cells;
    if (cells[index] === EMPTY) return;
    // 시간이 막 다 됐는데 아직 시계가 안 바뀐 때(0.25초 사이)는 누르기를 받지 않아요. 곧 "시간이 다 됐어요"로 바뀌어요
    if (limitMs && Date.now() - run.startedAt >= limitMs) {
      setNow(Date.now());
      return;
    }
    // 파워: 누른 타일과 같은 그림 하나가 선과 상관없이 함께 깨져요
    if (powerOn) {
      const result = breakWithPower(play, index);
      if (result) {
        powerUntil.current = 0;
        afterRemove(result);
        return;
      }
    }
    if (selected === null || cells[selected] !== cells[index]) {
      setSelected(index);
      setMessage(null);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const result = linkPair(play, selected, index);
    if (!result) {
      setShake({ key: ++keys.current, indices: [selected, index] });
      setSelected(index);
      setMessage("지금은 이을 수 없어요 · 선은 두 번까지만 꺾여요");
      return;
    }
    afterRemove(result);
  };
  // 판에 주는 누르기 함수는 늘 같은 것(그래야 시계가 바뀔 때 판을 다시 그리지 않아요)
  const pressRef = useRef(pressTile);
  pressRef.current = pressTile;
  const onPress = useCallback((index) => pressRef.current(index), []);

  const pressHint = () => {
    if (locked) return;
    const r = takeHint(run.play);
    if (!r) return;
    setHint(r.pair);
    setSelected(null);
    setRun({ ...run, play: r.play });
  };

  const leave = () => {
    if (run && !run.done && elapsed > 20000) {
      const msg =
        run.stage === ENDLESS && run.streak > 0
          ? `지금 그만두면 연속 ${run.streak}판에서 끝나요. 판을 깬 뒤에 나가면 다음에 이어서 할 수 있어요. 나갈까요?`
          : "지금 나가면 이번 판은 사라져요. 나갈까요?";
      if (!window.confirm(msg)) return;
    }
    setRun(null);
    setPausedAt(null);
    setShuffle(null);
    refresh();
  };

  /* ---------- 단계 고르기 ---------- */
  if (!run) {
    const cleared = clearedCount(record);
    const stars = starTotal(record);
    const endlessOpen = isEndlessOpen(record);
    const current = nextStage(record);
    const todayLevel = daily ? levelOf(daily.today) : null;
    return (
      <div className={styles.anchor} ref={topRef}>
        <button type="button" className={styles.slideDaily} onClick={() => start("daily")}>
          <span>
            <strong>
              오늘의 짝꿍 잇기
              {todayLevel && <span className={`${styles.lv} ${styles[`lv_${todayLevel}`]}`}>{DAY_LEVELS[todayLevel].label}</span>}
            </strong>
            <small>
              {daily?.done
                ? `오늘 ⏱ ${formatClock(daily.done.ms)}${daily.streak > 1 ? ` · ${daily.streak}일 연속` : ""}`
                : "자정마다 바뀌는 한 판, 시간 제한 없이 기록을 재요"}
            </small>
          </span>
          <span className={styles.gameGo} aria-hidden="true">
            ›
          </span>
        </button>

        <section className={styles.stagesBox} aria-labelledby="stages-title">
          <h2 id="stages-title" className={styles.stagesTitle}>
            10단계 도전
          </h2>
          <p className={styles.stagesLead}>
            {cleared >= STAGE_COUNT ? "모두 깼어요!" : cleared ? `${cleared}단계까지 깼어요` : "6×6 작은 판부터 시작해요"}
            {cleared > 0 && ` · ★ ${stars}/${STAGE_COUNT * 3}`}
          </p>
          <div className={styles.bar} aria-hidden="true">
            <i style={{ width: `${(cleared / STAGE_COUNT) * 100}%` }} />
          </div>
          <ol className={styles.stages}>
            {LEVELS.map((spec, i) => {
              const n = i + 1;
              const r = record.stages[n];
              const open = isStageOpen(record, n);
              const done = isStageCleared(record, n);
              const isNow = n === current && !done;
              return (
                <li key={n}>
                  <button
                    type="button"
                    className={`${styles.stage} ${done ? styles.stageDone : ""} ${isNow ? styles.stageNow : ""}`}
                    disabled={!open}
                    onClick={() => start(n)}
                  >
                    <span className={styles.num}>{n}</span>
                    <span className={styles.stageText}>
                      <b>
                        {spec.cols}×{spec.rows} · {SLIDES[spec.slide]}
                        {done && (
                          <span className={styles.star} aria-label={`별 ${r.stars}개`}>
                            {" "}
                            {starText(r.stars)}
                          </span>
                        )}
                      </b>
                      <small>
                        제한 {formatClock(spec.seconds * 1000)}
                        {r?.bestMs ? ` · 최고 ⏱ ${formatClock(r.bestMs)}` : ""}
                      </small>
                    </span>
                    <span className={styles.stageState}>{done ? "다시 하기" : open ? "도전 ›" : "잠김"}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className={styles.starNote}>★ = 남은 시간이 절반 넘으면 3개, 4분의 1 넘으면 2개</p>

          <div className={styles.sdEndless}>
            <h3 className={styles.sdEndlessTitle}>👑 무한 도전</h3>
            {endlessOpen ? (
              <>
                <p className={styles.sdEndlessText}>
                  8×12 판이 계속 나와요. 3분에서 시작해 판마다 10초씩 줄어요. 판을 깬 뒤에 나가면 다음에 이어서 할 수 있어요.
                </p>
                <p className={styles.endlessBest}>{record.endlessBest ? `내 최고 기록 연속 ${record.endlessBest}판` : "아직 기록이 없어요"}</p>
                <button type="button" className={`${styles.primary} ${styles.endlessStart}`} onClick={() => start(ENDLESS, record.endlessSaved)}>
                  {record.endlessSaved ? `이어서 하기 · ${record.endlessSaved + 1}판째부터` : "무한 도전 시작"}
                </button>
                {record.endlessSaved > 0 && (
                  <button
                    type="button"
                    className={styles.slideBack}
                    onClick={() =>
                      window.confirm(`이어 하던 연속 ${record.endlessSaved}판은 사라져요. 최고 기록은 그대로예요. 처음부터 할까요?`) && start(ENDLESS)
                    }
                  >
                    처음부터 다시
                  </button>
                )}
              </>
            ) : (
              <p className={styles.sdEndlessText}>10단계를 깨면 열려요.</p>
            )}
          </div>
          <p className={styles.saveNote}>기록은 이 기기의 브라우저에만 저장돼요. 다른 기기에서는 1단계부터 시작해요.</p>
        </section>
      </div>
    );
  }

  /* ---------- 푸는 화면 ---------- */
  const { play, done } = run;
  const { board } = play;
  const left = tilesLeft(board);
  const leftMs = Math.max(0, limitMs - elapsed);
  const low = limitMs > 0 && !done && leftMs < LOW_MS;
  const slideName = SLIDES[board.slide];
  const title = run.daily
    ? `오늘의 짝꿍 잇기 · ${DAY_LEVELS[levelOf(run.daily)].label}`
    : run.stage === ENDLESS
      ? `👑 무한 도전 · ${run.streak + 1}판째`
      : `${run.stage}단계 · ${board.cols}×${board.rows}`;
  const info = done
    ? null
    : pausedAt !== null
      ? "잠깐 멈췄어요"
      : powerOn
        ? "⚡ 파워! 아무 타일이나 누르면 짝과 함께 깨져요"
        : message
          ? message
          : comboShown
            ? `🔥 ${comboShown}콤보!${comboShown % POWER_EVERY === POWER_EVERY - 1 ? " 한 번 더 이으면 파워" : ""}`
            : selected !== null
              ? "같은 그림을 하나 더 눌러요"
              : "같은 그림 두 개를 눌러 이어요 (두 번까지 꺾인 선)";
  const warn = !done && Boolean(message) && !powerOn;

  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      <div className={styles.slideTop}>
        <span className={styles.slideTitle}>{title}</span>
        <button type="button" className={styles.slideBack} onClick={leave}>
          {run.daily ? "나가기" : "단계 고르기"}
        </button>
      </div>
      <div className={styles.spStatus}>
        <button
          type="button"
          className={styles.sdPause}
          onClick={pausedAt === null ? pause : resume}
          disabled={Boolean(done) || Boolean(shuffle)}
          aria-label={pausedAt === null ? "잠깐 멈추기" : "다시 시작"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            {pausedAt === null ? <path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" /> : <path d="M3.5 2 12 7l-8.5 5z" fill="currentColor" />}
          </svg>
        </button>
        <span className={styles.spCount}>
          남은 타일 <b>{left}</b>
        </span>
        {!run.daily && run.stage !== ENDLESS && !done && <span className={styles.lkStarNow}>{starText(starsFor(elapsed, run.seconds))}</span>}
        <span className={`${styles.spTime} ${low ? styles.spTimeLow : ""}`}>
          {run.daily ? `⏱ ${formatClock(Math.max(0, elapsed))}` : done ? "끝" : formatClock(leftMs + 999)}
        </span>
      </div>
      {limitMs > 0 && (
        <div className={`${styles.spTrack} ${styles.lkTrack}`} aria-hidden="true">
          <i className={low ? styles.spTrackLow : ""} style={{ width: `${(leftMs / limitMs) * 100}%` }} />
          {run.stage !== ENDLESS && STAR_LINES.map((line) => <b key={line} style={{ left: `${line * 100}%` }} />)}
        </div>
      )}
      {info && (
        <p className={`${styles.slideHint} ${styles.lkInfo} ${warn ? styles.sdWrong : ""} ${powerOn ? styles.lkPowerText : ""} ${comboShown && !message && !powerOn ? styles.lkComboText : ""}`} role="status">
          {info}
        </p>
      )}

      <div className={styles.lkWrap} ref={wrapRef}>
        {cell > 0 && (
          <Board
            key={run.round}
            board={board}
            ids={play.ids}
            cell={cell}
            selected={selected}
            hint={hint}
            shake={shake}
            flash={flash}
            moveMs={shuffle?.phase === "move" ? SHUFFLE_MOVE_MS : 160}
            power={powerOn}
            hidden={pausedAt !== null}
            locked={locked}
            onPress={onPress}
          />
        )}
        {pausedAt !== null && (
          <button type="button" className={styles.sdResume} onClick={resume}>
            이어서 하기
          </button>
        )}
      </div>

      {done ? (
        <div className={styles.slideResult} role="status" ref={resultRef}>
          {done.kind === "clear" ? (
            <>
              <p className={styles.endTitle}>{run.stage === ENDLESS && !run.daily ? `연속 ${done.count}판 성공!` : `다 없앴어요! ⏱ ${formatClock(done.ms)}`}</p>
              {done.stars && <p className={styles.lkEndStars}>{starText(done.stars)}</p>}
              {done.newBest && <p className={styles.endText}>{run.daily ? "오늘의 최고 기록이에요!" : run.stage === ENDLESS ? "🎉 새 기록이에요!" : "최고 기록이에요!"}</p>}
            </>
          ) : (
            <>
              <p className={styles.endTitle}>{run.stage === ENDLESS ? `시간이 다 됐어요! 연속 ${run.streak}판` : "시간이 다 됐어요!"}</p>
              <p className={styles.endText}>남은 타일 {left}개</p>
            </>
          )}
          <div className={styles.btns}>
            {run.daily ? (
              <button type="button" className={styles.primary} onClick={leave}>
                단계 고르기로
              </button>
            ) : done.kind === "timeUp" ? (
              <button type="button" className={styles.primary} onClick={() => start(run.stage)}>
                다시 하기
              </button>
            ) : run.stage === ENDLESS ? (
              <button type="button" className={styles.primary} onClick={() => start(ENDLESS, done.count)}>
                다음 판
              </button>
            ) : run.stage < STAGE_COUNT ? (
              <button type="button" className={styles.primary} onClick={() => start(run.stage + 1)}>
                다음 단계
              </button>
            ) : (
              <button type="button" className={styles.primary} onClick={() => start(ENDLESS)}>
                👑 무한 도전
              </button>
            )}
            {!run.daily && (
              <button type="button" className={styles.btn} onClick={leave}>
                단계 고르기
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.spBottom}>
          <span className={styles.lkSlide}>{slideName}</span>
          <button type="button" className={styles.sdTool} onClick={pressHint} disabled={locked || play.hintsLeft <= 0}>
            {play.hintsLeft > 0 ? `💡 힌트 ${play.hintsLeft}` : "💡 힌트 없음"}
          </button>
        </div>
      )}
    </div>
  );
}
