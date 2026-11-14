"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./games.module.css";
import { BOX, conflicts, geometry } from "@/lib/games/sudoku/sudoku";
import {
  checkPlay,
  dailySudoku,
  digitCounts,
  endlessPuzzle,
  eraseCell,
  isLocked,
  newPlay,
  placeDigit,
  STAGE_COUNT,
  STAGE_INFO,
  stagePuzzle,
  takeHint,
  toggleNote,
  undo,
} from "@/lib/games/sudoku/play";
import { STAGES } from "@/lib/games/sudoku/sudoku";
import {
  addEndlessStreak,
  addStageClear,
  clearedCount,
  clearEndlessSaved,
  dailyStatus,
  EMPTY_RECORD,
  formatClock,
  isEndlessOpen,
  isStageOpen,
  loadRecord,
  loadShowClashes,
  nextStage,
  saveDaily,
  saveShowClashes,
  starTotal,
} from "@/lib/games/sudoku/record";
import { LEVELS, levelOf } from "@/lib/games/daily";

// 스도쿠 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요).
// 오늘의 스도쿠나 단계 고르기 → 풀기(문제를 열면 시계가 흘러요) → 다 맞게 채우면 끝.
// 숫자를 넣을 때는 맞는지 알려 주지 않고, 다 채웠을 때 틀린 곳이 있으면 "틀린 곳이 있어요"만 알려 줘요.
// 클릭·터치와 키보드(방향키·숫자·Backspace) 둘 다 돼요.

const ENDLESS = 0;

/** 9×9 문제 은행은 70KB라 처음 화면에 싣지 않고, 필요할 때 한 번만 불러와요 */
let bankPromise = null;
const loadBank = () => (bankPromise ??= import("@/lib/games/sudoku/bank.json").then((m) => m.default));

/** 시계: 푸는 동안만 1초마다 바뀌어요. 판 전체가 다시 그려지지 않게 따로 뒀어요 */
function Clock({ startedAt, stoppedMs }) {
  const [now, setNow] = useState(0);
  const running = stoppedMs === null;
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running, startedAt]);
  const ms = stoppedMs ?? (now ? Math.max(0, now - startedAt) : 0);
  return <span className={styles.sdClockTime}>⏱ {formatClock(ms)}</span>;
}

function Board({ play, selected, clashes, onSelect, hidden }) {
  const { size, puzzle, grid, notes, hinted } = play;
  const { rows: br, cols: bc } = BOX[size];
  const geo = geometry(size);
  const selectedDigit = selected !== null ? grid[selected] : 0;
  const hintedSet = new Set(hinted);
  const near = (i) =>
    selected !== null &&
    (geo.rowOf[i] === geo.rowOf[selected] || geo.colOf[i] === geo.colOf[selected] || geo.boxOf[i] === geo.boxOf[selected]);
  return (
    <div
      className={`${styles.sdBoard} ${hidden ? styles.sdHidden : ""}`}
      style={{ "--n": size, "--bx": size / bc, "--by": size / br, "--bc": bc, "--br": br }}
      role="grid"
      aria-label={`스도쿠 ${size}×${size} 판`}
    >
      {geo.boxes.map((box, b) => (
        <div key={b} className={styles.sdBox}>
          {box.map((i) => {
            const value = grid[i];
            const given = puzzle[i] !== 0;
            const cls = [
              styles.sdCell,
              i === selected ? styles.sdSel : selectedDigit && value === selectedDigit ? styles.sdSame : near(i) ? styles.sdNear : "",
              clashes.has(i) ? styles.sdClash : "",
              given ? styles.sdGiven : hintedSet.has(i) ? styles.sdHinted : value ? styles.sdMine : "",
            ].join(" ");
            const where = `${geo.rowOf[i] + 1}행 ${geo.colOf[i] + 1}열`;
            return (
              <button
                key={i}
                type="button"
                className={cls}
                aria-label={value ? `${where} ${value}${given ? " (문제 숫자)" : ""}` : `${where} 빈칸`}
                aria-pressed={i === selected}
                onClick={() => onSelect(i)}
              >
                {value ? (
                  value
                ) : notes[i] ? (
                  <span className={styles.sdNotes} aria-hidden="true">
                    {Array.from({ length: size }, (_, k) => (
                      <i key={k} className={selectedDigit === k + 1 ? styles.sdNoteHit : ""}>
                        {notes[i] & (1 << (k + 1)) ? k + 1 : ""}
                      </i>
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Sudoku() {
  const topRef = useRef(null);
  const roundRef = useRef(0);
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [daily, setDaily] = useState(null);
  const [showClashes, setShowClashes] = useState(true);
  const [run, setRun] = useState(null);
  const [selected, setSelected] = useState(null);
  const [noteMode, setNoteMode] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [pausedAt, setPausedAt] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setRecord(loadRecord());
    setDaily(dailyStatus());
  };
  useEffect(() => {
    refresh();
    setShowClashes(loadShowClashes());
    loadBank(); // 미리 받아 둬요
  }, []);

  /** stage: 1~10 단계, 0 무한 도전, "daily" 오늘의 스도쿠 */
  const start = async (stage, streak = 0) => {
    setLoading(true);
    let bank;
    try {
      bank = await loadBank();
    } catch {
      setLoading(false);
      window.alert("문제를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      return;
    }
    let made;
    let key = null;
    if (stage === "daily") {
      key = dailyStatus().today;
      made = dailySudoku(key, bank);
    } else if (stage === ENDLESS) {
      clearEndlessSaved(); // 풀어야 다시 저장돼요. 중간에 나가면 연속이 끝나요
      made = endlessPuzzle(bank);
    } else made = stagePuzzle(stage, bank);
    roundRef.current += 1;
    setRun({
      stage,
      daily: key,
      play: newPlay(made.puzzle, made.solution, made.size),
      round: roundRef.current,
      startedAt: Date.now(),
      streak,
      done: null,
    });
    setSelected(null);
    setNoteMode(false);
    setWrong(false);
    setPausedAt(null);
    setLoading(false);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  };

  const elapsedNow = () => (run ? (pausedAt ?? Date.now()) - run.startedAt : 0);

  const leave = () => {
    if (run && !run.done && elapsedNow() > 30000) {
      const msg =
        run.stage === ENDLESS && run.streak > 0
          ? `지금 그만두면 연속 ${run.streak}문제에서 끝나요. 문제를 푼 뒤에 나가면 다음에 이어서 할 수 있어요. 나갈까요?`
          : "지금 나가면 이번 판은 사라져요. 나갈까요?";
      if (!window.confirm(msg)) return;
    }
    setRun(null);
    refresh();
  };

  const newPuzzle = () => {
    if (!run.done && elapsedNow() > 30000 && !window.confirm("새 문제로 할까요? 지금 판은 사라져요.")) return;
    start(run.stage);
  };

  // 잠깐 멈춤: 멈춘 시간만큼 시작 시각을 뒤로 밀어 기록에서 빼요(멈춘 동안 판은 가려요)
  const pause = () => {
    if (run && !run.done && pausedAt === null) setPausedAt(Date.now());
  };
  const resume = () => {
    if (pausedAt === null) return;
    setRun((r) => ({ ...r, startedAt: r.startedAt + (Date.now() - pausedAt) }));
    setPausedAt(null);
  };
  // 다른 탭으로 가면 저절로 멈춰요
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  useEffect(() => {
    const onHide = () => document.hidden && pauseRef.current();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const clashes = useMemo(() => (run && showClashes ? conflicts(run.play.grid, run.play.size) : new Set()), [run, showClashes]);

  /** 판을 바꾼 뒤: 다 채웠으면 채점 */
  const apply = (next) => {
    if (!run || next === run.play) return;
    const check = checkPlay(next);
    if (check === "solved") {
      const ms = Date.now() - run.startedAt;
      let done;
      if (run.daily) {
        done = { ms, newBest: saveDaily(run.daily, ms), star: false, count: 0 };
      } else if (run.stage === ENDLESS) {
        const count = run.streak + 1;
        done = { ms, newBest: addEndlessStreak(count).newBest, star: false, count };
      } else {
        const star = next.hinted.length === 0;
        done = { ms, newBest: addStageClear(run.stage, ms, !star).newBest, star, count: 0 };
      }
      setRun({ ...run, play: next, done });
      setSelected(null);
      setWrong(false);
      refresh();
      return;
    }
    setWrong(check === "wrong");
    setRun({ ...run, play: next });
  };

  const locked = !run || Boolean(run.done) || pausedAt !== null;
  const pressDigit = (digit) => {
    if (locked || selected === null) return;
    apply(noteMode ? toggleNote(run.play, selected, digit) : placeDigit(run.play, selected, digit));
  };
  const erase = () => !locked && selected !== null && apply(eraseCell(run.play, selected));
  const back = () => !locked && apply(undo(run.play));
  const hint = () => {
    if (locked) return;
    const r = takeHint(run.play, selected);
    if (r.cell === null) return;
    setSelected(r.cell);
    apply(r.play);
  };

  // 키보드: 방향키로 칸 옮기기 · 숫자 넣기 · Backspace/Delete 지우기 · N 메모 · Ctrl+Z 되돌리기
  const keys = useRef(null);
  keys.current = (e) => {
    if (locked || e.altKey || e.metaKey) return;
    const size = run.play.size;
    if ((e.ctrlKey && e.key.toLowerCase() === "z") || e.key === "u") {
      e.preventDefault();
      back();
      return;
    }
    if (e.ctrlKey) return;
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const cur = selected ?? 0;
      const r = Math.floor(cur / size);
      const c = cur % size;
      const move = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      if (!move) return;
      if (selected === null) setSelected(0);
      else setSelected(((r + move[0] + size) % size) * size + ((c + move[1] + size) % size));
      return;
    }
    const d = Number(e.key);
    if (Number.isInteger(d) && d >= 1 && d <= size) {
      e.preventDefault();
      pressDigit(d);
    } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
      e.preventDefault();
      erase();
    } else if (e.key.toLowerCase() === "n") {
      setNoteMode((on) => !on);
    }
  };
  const playing = Boolean(run);
  useEffect(() => {
    if (!playing) return;
    const onKey = (e) => keys.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  /* ---------- 단계 고르기 ---------- */
  if (!run) {
    const cleared = clearedCount(record);
    const stars = starTotal(record);
    const endlessOpen = isEndlessOpen(record);
    const now = nextStage(record);
    const todayLevel = daily ? levelOf(daily.today) : null;
    return (
      <div className={styles.anchor} ref={topRef}>
        <button type="button" className={styles.slideDaily} onClick={() => start("daily")} disabled={loading}>
          <span>
            <strong>
              오늘의 스도쿠
              {todayLevel && <span className={`${styles.lv} ${styles[`lv_${todayLevel}`]}`}>{LEVELS[todayLevel].label}</span>}
            </strong>
            <small>
              {daily?.done
                ? `오늘 ⏱ ${formatClock(daily.done.ms)}${daily.streak > 1 ? ` · ${daily.streak}일 연속` : ""}`
                : "자정마다 바뀌는 9×9 한 판, 모두 같은 문제예요"}
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
            {cleared >= STAGE_COUNT ? "모두 깼어요!" : cleared ? `${cleared}단계까지 깼어요` : "4×4 연습부터 시작해요"}
            {cleared > 0 && ` · ★ ${stars}/${STAGE_COUNT}`}
          </p>
          <div className={styles.bar} aria-hidden="true">
            <i style={{ width: `${(cleared / STAGE_COUNT) * 100}%` }} />
          </div>
          <label className={styles.sdOption}>
            <input
              type="checkbox"
              checked={showClashes}
              onChange={(e) => {
                setShowClashes(e.target.checked);
                saveShowClashes(e.target.checked);
              }}
            />
            같은 줄·상자에 겹친 숫자 빨갛게 보기
          </label>
          <ol className={styles.stages}>
            {STAGES.map((spec) => {
              const n = spec.stage;
              const r = record.stages[n];
              const open = isStageOpen(record, n);
              const done = r?.cleared;
              const isNow = n === now && !done;
              return (
                <li key={n}>
                  <button
                    type="button"
                    className={`${styles.stage} ${done ? styles.stageDone : ""} ${isNow ? styles.stageNow : ""}`}
                    disabled={!open || loading}
                    onClick={() => start(n)}
                  >
                    <span className={styles.num}>{n}</span>
                    <span className={styles.stageText}>
                      <b>
                        {spec.size}×{spec.size} · {STAGE_INFO[n - 1].level}
                        {r?.star && (
                          <span className={styles.star} aria-label="힌트 없이 깸">
                            {" "}★
                          </span>
                        )}
                      </b>
                      <small>{r?.bestMs ? `최고 ⏱ ${formatClock(r.bestMs)}` : STAGE_INFO[n - 1].note}</small>
                    </span>
                    <span className={styles.stageState}>{done ? "다시 하기" : open ? "도전 ›" : "잠김"}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className={styles.starNote}>★ = 힌트 없이 깬 단계</p>

          <div className={styles.sdEndless}>
            <h3 className={styles.sdEndlessTitle}>👑 무한 도전</h3>
            {endlessOpen ? (
              <>
                <p className={styles.sdEndlessText}>
                  어려움 이상(8~10단계) 문제가 계속 나와요. 문제를 다 푼 뒤에 나가면 다음에 이어서 할 수 있어요.
                </p>
                <p className={styles.endlessBest}>{record.endlessBest ? `내 최고 기록 연속 ${record.endlessBest}문제` : "아직 기록이 없어요"}</p>
                <button
                  type="button"
                  className={`${styles.primary} ${styles.endlessStart}`}
                  disabled={loading}
                  onClick={() => start(ENDLESS, record.endlessSaved)}
                >
                  {record.endlessSaved ? `이어서 하기 · ${record.endlessSaved + 1}문제째부터` : "무한 도전 시작"}
                </button>
                {record.endlessSaved > 0 && (
                  <button
                    type="button"
                    className={styles.slideBack}
                    onClick={() =>
                      window.confirm(`이어 하던 연속 ${record.endlessSaved}문제는 사라져요. 최고 기록은 그대로예요. 처음부터 할까요?`) &&
                      start(ENDLESS)
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
  const size = play.size;
  const counts = digitCounts(play);
  const title = run.daily
    ? `오늘의 스도쿠 · ${LEVELS[levelOf(run.daily)].label}`
    : run.stage === ENDLESS
      ? `👑 무한 도전 · ${run.streak + 1}문제째`
      : `${run.stage}단계 · ${size}×${size} ${STAGE_INFO[run.stage - 1].level}`;
  const best = run.daily
    ? daily?.done?.ms
    : run.stage === ENDLESS
      ? null
      : record.stages[run.stage]?.bestMs;
  const message = done
    ? "다 맞았어요!"
    : pausedAt !== null
      ? "잠깐 멈췄어요"
      : wrong
        ? "틀린 곳이 있어요. 다시 살펴봐요!"
        : noteMode
          ? "✏️ 메모 켜짐: 후보 숫자를 작게 적어요"
          : selected === null
            ? "칸을 누르고 아래 숫자를 눌러요"
            : isLocked(play, selected)
              ? "처음부터 있던 숫자는 바꿀 수 없어요"
              : "숫자를 눌러 넣어요 · 같은 숫자를 또 누르면 빠져요";

  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      <div className={styles.slideTop}>
        <span className={styles.slideTitle}>{title}</span>
        <span className={styles.sdTopBtns}>
          {!run.daily && run.stage !== ENDLESS && !done && (
            <button type="button" className={styles.slideBack} onClick={newPuzzle}>
              새 문제
            </button>
          )}
          <button type="button" className={styles.slideBack} onClick={leave}>
            {run.daily ? "나가기" : "단계 고르기"}
          </button>
        </span>
      </div>
      <div className={styles.sdClock}>
        <button
          type="button"
          className={styles.sdPause}
          onClick={pausedAt === null ? pause : resume}
          disabled={Boolean(done)}
          aria-label={pausedAt === null ? "잠깐 멈추기" : "다시 시작"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            {pausedAt === null ? <path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" /> : <path d="M3.5 2 12 7l-8.5 5z" fill="currentColor" />}
          </svg>
        </button>
        <Clock startedAt={run.startedAt} stoppedMs={done ? done.ms : pausedAt !== null ? pausedAt - run.startedAt : null} />
        <span className={styles.sdBest}>{run.stage === ENDLESS && !run.daily ? `최고 ${record.endlessBest}문제` : best ? `최고 ${formatClock(best)}` : "기록 없음"}</span>
      </div>
      <p className={`${styles.slideHint} ${wrong && !done ? styles.sdWrong : ""}`} role="status">
        {message}
      </p>
      <div className={styles.sdBoardWrap}>
        <Board key={run.round} play={play} selected={selected} clashes={clashes} onSelect={(i) => !locked && setSelected(i)} hidden={pausedAt !== null} />
        {pausedAt !== null && (
          <button type="button" className={styles.sdResume} onClick={resume}>
            이어서 풀기
          </button>
        )}
      </div>

      {done ? (
        <div className={styles.slideResult}>
          <p className={styles.endTitle}>{run.stage === ENDLESS && !run.daily ? `연속 ${done.count}문제 성공!` : `⏱ ${formatClock(done.ms)}`}</p>
          {done.newBest && <p className={styles.endText}>최고 기록이에요!</p>}
          {done.star && <p className={styles.endStar}>★ 힌트 없이 풀었어요!</p>}
          <div className={styles.btns}>
            {run.daily ? (
              <button type="button" className={styles.primary} onClick={leave}>
                단계 고르기로
              </button>
            ) : run.stage === ENDLESS ? (
              <button type="button" className={styles.primary} onClick={() => start(ENDLESS, done.count)}>
                다음 문제
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
        <div className={styles.sdPad}>
          <div className={styles.sdTools}>
            <button type="button" className={styles.sdTool} onClick={back} disabled={locked || play.history.length === 0}>
              ↶ 되돌리기
            </button>
            <button type="button" className={styles.sdTool} onClick={erase} disabled={locked || selected === null}>
              ⌫ 지우기
            </button>
            <button
              type="button"
              className={`${styles.sdTool} ${noteMode ? styles.sdToolOn : ""}`}
              aria-pressed={noteMode}
              onClick={() => setNoteMode((on) => !on)}
              disabled={locked}
            >
              ✏️ 메모
            </button>
            <button type="button" className={styles.sdTool} onClick={hint} disabled={locked || play.hintsLeft <= 0}>
              💡 힌트 {play.hintsLeft}
            </button>
          </div>
          <div className={`${styles.sdDigits} ${noteMode ? styles.sdDigitsNote : ""}`} style={{ "--n": size }}>
            {Array.from({ length: size }, (_, k) => k + 1).map((d) => (
              <button
                key={d}
                type="button"
                className={`${styles.sdDigit} ${counts[d] >= size ? styles.sdDigitUsed : ""}`}
                onClick={() => pressDigit(d)}
                disabled={locked}
                aria-label={`${d}${noteMode ? " 메모" : ""}`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className={styles.sdKeys}>PC에서는 방향키로 칸을 옮기고 숫자 키로 넣어요 · N 메모 · Backspace 지우기 · Ctrl+Z 되돌리기</p>
        </div>
      )}
    </div>
  );
}
