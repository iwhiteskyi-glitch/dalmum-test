"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./games.module.css";
import { endlessSpec, judge, LEVELS, randomNumber, starsFor } from "@/lib/games/baseball/baseball";
import { botGuessAt } from "@/lib/games/baseball/ai";
import { BOT, hideMine, ME, newVs, vsCall, VS_LEVELS } from "@/lib/games/baseball/vs";
import {
  addDailyTry,
  addEndlessStreak,
  addStageClear,
  addVsStreak,
  addVsWin,
  clearedCount,
  clearEndlessSaved,
  clearVsSaved,
  dailyCalls,
  dailyNumber,
  dailySpec,
  dailyStatus,
  EMPTY_RECORD,
  isEndlessOpen,
  isStageCleared,
  isStageOpen,
  isVsLegend,
  isVsOpen,
  loadRecord,
  nextStage,
  STAGE_COUNT,
  starTotal,
} from "@/lib/games/baseball/record";
import { LEVELS as DAY_LEVELS, levelOf } from "@/lib/games/daily";

// 숫자 야구 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요).
//  - 숫자 맞히기: 컴퓨터가 숨긴 숫자를 정해진 기회 안에 맞혀요(10단계 · 무한 도전 · 오늘의 숫자)
//  - 컴퓨터와 대결: 서로 숫자를 숨기고 번갈아 불러요(10단계 · 무한 연승)
// 숫자판은 누르기와 키보드(숫자·Backspace·Enter) 둘 다 돼요. 메모판으로 숫자마다 ✕(없음)·○(있음)를 표시해요.

const ENDLESS = 0;
/** 컴퓨터가 부르기 전에 뜸 들이는 시간 */
const BOT_THINK_MS = 1300;
const starText = (n) => "★".repeat(n) + "☆".repeat(3 - n);
const judgeText = (j) => (j.strike === 0 && j.ball === 0 ? "OUT" : `${j.strike}S ${j.ball}B`);

/** 전광판 한 줄: 번호, 부른 숫자, S·B 불빛 */
function CallRow({ index, call, count, compact }) {
  const out = call.judge.strike === 0 && call.judge.ball === 0;
  const lamps = (n, cls) => Array.from({ length: count }, (_, i) => <i key={i} className={i < n ? cls : ""} />);
  return (
    <li className={styles.bbRow} aria-label={`${index}번째 ${call.guess.split("").join(" ")} ${judgeText(call.judge)}`}>
      <span className={styles.bbNo}>{index}</span>
      <b className={styles.bbGuess}>{call.guess}</b>
      {out ? (
        <span className={styles.bbOut}>OUT</span>
      ) : compact ? (
        <span className={styles.bbJudge}>
          <em className={styles.bbS}>{call.judge.strike}S</em> <em className={styles.bbB}>{call.judge.ball}B</em>
        </span>
      ) : (
        <span className={styles.bbLamps}>
          <span>
            <em className={styles.bbS}>S</em>
            {lamps(call.judge.strike, styles.bbLampS)}
          </span>
          <span>
            <em className={styles.bbB}>B</em>
            {lamps(call.judge.ball, styles.bbLampB)}
          </span>
        </span>
      )}
    </li>
  );
}

/** 부른 기록 전광판. 새 줄이 생기면 맨 아래가 보이게 */
function Scoreboard({ title, calls, count, empty, compact = false, open = false }) {
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [calls.length]);
  return (
    <div className={`${styles.bbBoard} ${compact ? styles.bbBoardCompact : ""} ${open ? styles.bbBoardOpen : ""}`}>
      <div className={styles.bbBoardHead}>
        <span>{title}</span>
        {!compact && <small>S 자리까지 맞음 · B 숫자만 맞음</small>}
      </div>
      <ol className={styles.bbList} ref={listRef}>
        {calls.length === 0 && <li className={styles.bbEmpty}>{empty}</li>}
        {calls.map((c, i) => (
          <CallRow key={i} index={i + 1} call={c} count={count} compact={compact} />
        ))}
      </ol>
    </div>
  );
}

/** 넣는 칸 · 메모판 · 숫자판. 고른 숫자와 메모는 이 안에서 갖고, 부르면 onCall로 알려요 */
function NumberPad({ count, disabled, called, onCall, callLabel = "부르기" }) {
  const [input, setInput] = useState("");
  const [marks, setMarks] = useState(() => Array(10).fill(0)); // 0 모름 · 1 없음(✕) · 2 있음(○)
  const [message, setMessage] = useState(null);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 1500);
    return () => clearTimeout(t);
  }, [message]);

  // 빠르게 연달아 눌러도 같은 숫자가 두 번 들어가지 않게, 늘 지금 값에서 고쳐요
  const press = (d) => {
    if (disabled) return;
    setInput((cur) => (cur.length >= count || cur.includes(d) ? cur : cur + d));
    setMessage(null);
  };
  const erase = () => !disabled && setInput((cur) => cur.slice(0, -1));
  const call = () => {
    if (disabled || input.length !== count) return;
    if (called.includes(input)) {
      setMessage("이미 부른 숫자예요");
      return;
    }
    onCall(input);
    setInput("");
  };
  // 키보드: 숫자 · Backspace · Enter
  const keyRef = useRef(null);
  keyRef.current = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      press(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      erase();
    } else if (e.key === "Enter") {
      e.preventDefault();
      call();
    }
  };
  useEffect(() => {
    const onKey = (e) => keyRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const memoUsed = marks.some((m) => m !== 0);
  return (
    <div className={styles.bbPad}>
      <div className={styles.bbSlots}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`${styles.bbSlot} ${i === input.length && !disabled ? styles.bbSlotNext : ""}`}>
            {input[i] ?? ""}
          </span>
        ))}
        {message && (
          <span className={styles.bbMsg} role="status">
            {message}
          </span>
        )}
      </div>
      <div className={styles.bbMemo}>
        <span className={styles.bbMemoLabel}>메모</span>
        {marks.map((m, d) => (
          <button
            key={d}
            type="button"
            className={`${styles.bbMemoKey} ${m === 1 ? styles.bbMemoNo : m === 2 ? styles.bbMemoYes : ""}`}
            aria-label={`메모 ${d}: ${m === 1 ? "없음" : m === 2 ? "있음" : "모름"}`}
            onClick={() => setMarks((cur) => cur.map((v, i) => (i === d ? (v + 1) % 3 : v)))}
          >
            {d}
          </button>
        ))}
      </div>
      {!memoUsed && <p className={styles.bbMemoHint}>메모는 누를 때마다 ✕ 없음 → ○ 있음 → 지움</p>}
      <div className={styles.bbKeys}>
        {"1234567890".split("").map((d) => {
          const m = marks[Number(d)];
          return (
            <button
              key={d}
              type="button"
              className={`${styles.bbKey} ${m === 1 ? styles.bbKeyNo : m === 2 ? styles.bbKeyYes : ""}`}
              disabled={disabled || input.includes(d) || input.length >= count}
              onClick={() => press(d)}
            >
              {d}
            </button>
          );
        })}
        <button type="button" className={`${styles.bbKey} ${styles.bbErase}`} disabled={disabled || !input} onClick={erase} aria-label="지우기">
          ⌫
        </button>
        <button type="button" className={`${styles.bbKey} ${styles.bbCall}`} disabled={disabled || input.length !== count} onClick={call}>
          {callLabel}
        </button>
      </div>
      <p className={styles.sdKeys}>PC에서는 숫자 키로 넣고 Enter로 불러요 · Backspace 지우기</p>
    </div>
  );
}

/** 남은 기회: 야구공(쓴 공은 흐리게) */
function Balls({ chances, used }) {
  return (
    <div className={styles.bbBalls} aria-hidden="true">
      {Array.from({ length: chances }, (_, i) => (
        <i key={i} className={i < used ? styles.bbBallUsed : ""} />
      ))}
    </div>
  );
}

export default function BaseballGame() {
  const topRef = useRef(null);
  const resultRef = useRef(null);
  const roundRef = useRef(0);
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [daily, setDaily] = useState(null);
  const [tab, setTab] = useState("guess");
  /** 숫자 맞히기 판: { kind: "guess", stage(1~10·0 무한·"daily"), spec, secret, calls, round, streak, dailyKey, done } */
  const [run, setRun] = useState(null);
  /** 컴퓨터와 대결 판: { kind: "vs", game(vs.js 상태), round, streak, settled } */
  const [vs, setVs] = useState(null);

  const refresh = () => {
    setRecord(loadRecord());
    setDaily(dailyStatus());
  };
  useEffect(() => {
    refresh();
  }, []);
  const toTop = () => requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));

  /* ---------- 숫자 맞히기 ---------- */
  const startGuess = (stage, streak = 0) => {
    let spec;
    let secret;
    let calls = [];
    let dailyKey = null;
    if (stage === "daily") {
      dailyKey = dailyStatus().today;
      spec = dailySpec(dailyKey);
      secret = dailyNumber(dailyKey);
      calls = dailyCalls(dailyKey); // 오늘 부른 것은 나갔다 와도 그대로
    } else {
      if (stage === ENDLESS) clearEndlessSaved(); // 판을 깨야 다시 저장돼요. 중간에 나가면 연속이 끝나요
      spec = stage === ENDLESS ? endlessSpec(streak + 1) : LEVELS[stage - 1];
      secret = randomNumber(spec.count);
    }
    roundRef.current += 1;
    const solvedAt = calls.findIndex((c) => c.judge.strike === spec.count);
    const done = solvedAt >= 0 ? { kind: "solved", used: solvedAt + 1 } : calls.length >= spec.chances ? { kind: "failed" } : null;
    setVs(null);
    setRun({ kind: "guess", stage, spec, secret, calls, round: roundRef.current, streak, dailyKey, done, newBest: false, stars: 0 });
    toTop();
  };

  const callGuess = (guess) => {
    if (!run || run.done) return;
    const j = judge(run.secret, guess);
    const calls = [...run.calls, { guess, judge: j }];
    if (run.dailyKey) addDailyTry(run.dailyKey, guess);
    const used = calls.length;
    let done = null;
    let extra = {};
    if (j.strike === run.spec.count) {
      done = { kind: "solved", used };
      if (run.stage === ENDLESS) extra = { newBest: addEndlessStreak(run.streak + 1).newBest };
      else if (run.stage !== "daily") {
        const stars = starsFor(used, run.spec.count);
        extra = { stars, newBest: addStageClear(run.stage, used, stars).newBest };
      }
    } else if (used >= run.spec.chances) {
      done = { kind: "failed" };
      if (run.stage === ENDLESS) clearEndlessSaved();
    }
    setRun({ ...run, calls, done, ...extra });
    if (done) refresh();
  };

  /* ---------- 컴퓨터와 대결 ---------- */
  const startVs = (level, streak = 0) => {
    if (level === ENDLESS) clearVsSaved(); // 판이 끝나야 다시 저장돼요. 중간에 나가면 연승이 끝나요
    roundRef.current += 1;
    setRun(null);
    setVs({ kind: "vs", level, game: newVs(level), round: roundRef.current, streak, outcome: null });
    toTop();
  };
  const vsGame = vs?.game;
  const botTurn = Boolean(vsGame) && !vsGame.result && !!vsGame.secrets[ME] && vsGame.turn === BOT;
  useEffect(() => {
    if (!botTurn) return;
    const t = setTimeout(() => {
      setVs((cur) => {
        if (!cur || cur.game.result || cur.game.turn !== BOT) return cur;
        const seen = cur.game.calls[BOT];
        const next = vsCall(cur.game, BOT, botGuessAt(cur.game.skill, seen, Math.random));
        return next ? { ...cur, game: next } : cur;
      });
    }, BOT_THINK_MS);
    return () => clearTimeout(t);
  }, [botTurn, vsGame?.calls[BOT].length, vs?.round]); // eslint-disable-line react-hooks/exhaustive-deps

  // 대결이 끝났을 때 기록(한 판에 한 번)
  const vsResult = vsGame?.result;
  useEffect(() => {
    if (!vsResult || !vs || vs.outcome) return;
    const won = vsResult.winner === ME;
    const lost = vsResult.winner === BOT;
    let outcome = { won, lost, draw: Boolean(vsResult.draw), none: Boolean(vsResult.none), streak: vs.streak, newBest: false };
    if (vs.level !== ENDLESS) {
      if (won) addVsWin(vs.level);
    } else if (!lost) {
      // 무한 연승: 이기면 +1, 비기거나 아무도 못 맞히면 그대로 이어져요. 지면 끝
      const streak = vs.streak + (won ? 1 : 0);
      outcome = { ...outcome, streak, newBest: addVsStreak(streak).newBest && won };
    }
    setVs((cur) => cur && { ...cur, outcome });
    refresh();
  }, [vsResult]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- 끝나면 결과와 다음 버튼 쪽으로 내려가요 ---------- */
  const finished = Boolean(run?.done) || Boolean(vs?.outcome);
  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 350);
    return () => clearTimeout(t);
  }, [finished]);

  const leave = () => {
    const inGuess = run && !run.done && run.calls.length > 0 && run.stage !== "daily";
    const inVs = vs && !vs.outcome && vsGame && (vsGame.calls[ME].length > 0 || vsGame.calls[BOT].length > 0);
    if (inGuess || inVs) {
      const endless = (run && run.stage === ENDLESS) || (vs && vs.level === ENDLESS);
      const msg = endless ? "지금 그만두면 연속 기록이 여기서 끝나요. 판이 끝난 뒤에 나가면 다음에 이어서 할 수 있어요. 나갈까요?" : "지금 나가면 이번 판은 사라져요. 나갈까요?";
      if (!window.confirm(msg)) return;
    }
    setRun(null);
    setVs(null);
    refresh();
  };

  /* ---------- 단계 고르기 ---------- */
  if (!run && !vs) {
    const cleared = clearedCount(record);
    const stars = starTotal(record);
    const now = nextStage(record);
    const todayLevel = daily ? levelOf(daily.today) : null;
    const ds = daily?.state;
    const dailyText = !ds
      ? " "
      : ds.kind === "solved"
        ? `오늘 ⚾ ${ds.used}번 만에 맞혔어요${daily.streak > 1 ? ` · ${daily.streak}일 연속` : ""}`
        : ds.kind === "failed"
          ? "오늘은 못 맞혔어요 · 자정에 새 숫자가 나와요"
          : ds.kind === "playing"
            ? `이어서 하기 · ${ds.used}번 불렀어요`
            : "자정마다 바뀌는 4자리 숫자, 하루 한 번 도전해요";
    return (
      <div className={styles.anchor} ref={topRef}>
        <button type="button" className={styles.slideDaily} onClick={() => startGuess("daily")}>
          <span>
            <strong>
              오늘의 숫자
              {todayLevel && <span className={`${styles.lv} ${styles[`lv_${todayLevel}`]}`}>{DAY_LEVELS[todayLevel].label}</span>}
            </strong>
            <small>{dailyText}</small>
          </span>
          <span className={styles.gameGo} aria-hidden="true">
            ›
          </span>
        </button>

        <div className={styles.tabs} role="group" aria-label="놀이 방식">
          <button type="button" className={`${styles.tab} ${tab === "guess" ? styles.slideTabOn : ""}`} aria-pressed={tab === "guess"} onClick={() => setTab("guess")}>
            숫자 맞히기
          </button>
          <button type="button" className={`${styles.tab} ${tab === "vs" ? styles.slideTabOn : ""}`} aria-pressed={tab === "vs"} onClick={() => setTab("vs")}>
            컴퓨터와 대결
          </button>
        </div>

        {tab === "guess" ? (
          <section className={styles.stagesBox} aria-labelledby="stages-title">
            <h2 id="stages-title" className={styles.stagesTitle}>
              숫자 맞히기 10단계
            </h2>
            <p className={styles.stagesLead}>
              {cleared >= STAGE_COUNT ? "모두 깼어요!" : cleared ? `${cleared}단계까지 깼어요` : "컴퓨터가 숨긴 숫자를 기회 안에 맞혀요"}
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
                return (
                  <li key={n}>
                    <button type="button" className={`${styles.stage} ${done ? styles.stageDone : ""} ${n === now && !done ? styles.stageNow : ""}`} disabled={!open} onClick={() => startGuess(n)}>
                      <span className={styles.num}>{n}</span>
                      <span className={styles.stageText}>
                        <b>
                          {spec.count}자리 · 기회 {spec.chances}번
                          {done && (
                            <span className={styles.star} aria-label={`별 ${r.stars}개`}>
                              {" "}
                              {starText(r.stars)}
                            </span>
                          )}
                        </b>
                        <small>{r?.bestUsed ? `최고 ⚾ ${r.bestUsed}번 만에` : n === 6 ? "여기부터 4자리" : "맨 앞 0도 될 수 있어요"}</small>
                      </span>
                      <span className={styles.stageState}>{done ? "다시 하기" : open ? "도전 ›" : "잠김"}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className={styles.starNote}>★ = 3자리는 5번 안 ★3·7번 안 ★2, 4자리는 6번 안 ★3·8번 안 ★2</p>
            <div className={styles.sdEndless}>
              <h3 className={styles.sdEndlessTitle}>👑 무한 도전</h3>
              {isEndlessOpen(record) ? (
                <>
                  <p className={styles.sdEndlessText}>4자리 숫자가 계속 나와요. 기회 12번에서 판마다 1번씩 줄어 7번까지 줄어요.</p>
                  <p className={styles.endlessBest}>{record.endlessBest ? `내 최고 기록 연속 ${record.endlessBest}판` : "아직 기록이 없어요"}</p>
                  <button type="button" className={`${styles.primary} ${styles.endlessStart}`} onClick={() => startGuess(ENDLESS, record.endlessSaved)}>
                    {record.endlessSaved ? `이어서 하기 · ${record.endlessSaved + 1}판째부터` : "무한 도전 시작"}
                  </button>
                  {record.endlessSaved > 0 && (
                    <button type="button" className={styles.slideBack} onClick={() => window.confirm(`이어 하던 연속 ${record.endlessSaved}판은 사라져요. 최고 기록은 그대로예요. 처음부터 할까요?`) && startGuess(ENDLESS)}>
                      처음부터 다시
                    </button>
                  )}
                </>
              ) : (
                <p className={styles.sdEndlessText}>10단계를 깨면 열려요.</p>
              )}
            </div>
          </section>
        ) : (
          <section className={styles.stagesBox} aria-labelledby="vs-title">
            <h2 id="vs-title" className={styles.stagesTitle}>
              컴퓨터와 대결 10단계
            </h2>
            <p className={styles.stagesLead}>
              {record.vsCleared >= VS_LEVELS ? "👑 전설! 모두 이겼어요" : record.vsCleared ? `${record.vsCleared}단계까지 이겼어요` : "서로 숫자를 숨기고 번갈아 불러요. 먼저 맞히면 이겨요"}
            </p>
            <div className={styles.bar} aria-hidden="true">
              <i style={{ width: `${(record.vsCleared / VS_LEVELS) * 100}%` }} />
            </div>
            <ol className={styles.stages}>
              {Array.from({ length: VS_LEVELS }, (_, i) => {
                const n = i + 1;
                const open = isVsOpen(record, n);
                const done = n <= record.vsCleared;
                return (
                  <li key={n}>
                    <button type="button" className={`${styles.stage} ${done ? styles.stageDone : ""} ${n === record.vsCleared + 1 ? styles.stageNow : ""}`} disabled={!open} onClick={() => startVs(n)}>
                      <span className={styles.num}>{n}</span>
                      <span className={styles.stageText}>
                        <b>
                          {n}단계 컴퓨터 · {n <= 5 ? 3 : 4}자리
                        </b>
                        <small>{n === 1 ? "힌트를 자주 잊어버려요" : n === 6 ? "여기부터 4자리, 다시 조금 쉬워져요" : n === 10 ? "가장 센 컴퓨터" : n <= 5 ? "단계마다 힌트를 더 잘 기억해요" : "단계마다 더 빨리 좁혀 와요"}</small>
                      </span>
                      <span className={styles.stageState}>{done ? "✓ 이김" : open ? "도전 ›" : "잠김"}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className={styles.sdEndless}>
              <h3 className={styles.sdEndlessTitle}>👑 무한 연승</h3>
              {isVsLegend(record) ? (
                <>
                  <p className={styles.sdEndlessText}>가장 센 컴퓨터와 몇 판 연속으로 이기는지 도전해요. 비겨도 연승은 이어져요.</p>
                  <p className={styles.endlessBest}>{record.vsStreakBest ? `내 최고 기록 ${record.vsStreakBest}연승` : "아직 기록이 없어요"}</p>
                  <button type="button" className={`${styles.primary} ${styles.endlessStart}`} onClick={() => startVs(ENDLESS, record.vsStreakSaved)}>
                    {record.vsStreakSaved ? `이어서 하기 · ${record.vsStreakSaved}연승부터` : "무한 연승 시작"}
                  </button>
                  {record.vsStreakSaved > 0 && (
                    <button type="button" className={styles.slideBack} onClick={() => window.confirm(`이어 하던 ${record.vsStreakSaved}연승은 사라져요. 최고 기록은 그대로예요. 처음부터 할까요?`) && startVs(ENDLESS)}>
                      처음부터 다시
                    </button>
                  )}
                </>
              ) : (
                <p className={styles.sdEndlessText}>10단계를 이기면 열려요.</p>
              )}
            </div>
          </section>
        )}
        <p className={styles.saveNote}>기록은 이 기기의 브라우저에만 저장돼요. 다른 기기에서는 1단계부터 시작해요.</p>
      </div>
    );
  }

  /* ---------- 숫자 맞히기 판 ---------- */
  if (run) {
    const { spec, calls, done } = run;
    const used = calls.length;
    const left = spec.chances - used;
    const isDaily = run.stage === "daily";
    const title = isDaily ? `오늘의 숫자 · ${DAY_LEVELS[levelOf(run.dailyKey)].label}` : run.stage === ENDLESS ? `👑 무한 도전 · ${run.streak + 1}판째` : `${run.stage}단계 · ${spec.count}자리`;
    const showStars = typeof run.stage === "number" && run.stage !== ENDLESS;
    return (
      <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
        <div className={styles.slideTop}>
          <span className={styles.slideTitle}>{title}</span>
          <button type="button" className={styles.slideBack} onClick={leave}>
            {isDaily ? "나가기" : "단계 고르기"}
          </button>
        </div>
        <div className={styles.bbChance}>
          <span>
            남은 기회 <b>{left}</b>번
          </span>
          {showStars && !done && <span className={styles.bbStarNow}>지금 맞히면 {starText(starsFor(used + 1, spec.count))}</span>}
        </div>
        <Balls chances={spec.chances} used={used} />
        <Scoreboard title="SCOREBOARD" calls={calls} count={spec.count} empty={`숫자 ${spec.count}개를 고르고 [부르기]`} open={Boolean(done)} />
        {done ? (
          <div className={styles.slideResult} role="status" ref={resultRef}>
            {done.kind === "solved" ? (
              <>
                <p className={styles.endTitle}>홈런! ⚾ {done.used}번 만에 맞혔어요</p>
                {run.stars > 0 && <p className={styles.lkEndStars}>{starText(run.stars)}</p>}
                {run.newBest && <p className={styles.endText}>{run.stage === ENDLESS ? "🎉 새 기록이에요!" : "최고 기록이에요!"}</p>}
                {run.stage === ENDLESS && <p className={styles.endText}>연속 {run.streak + 1}판 성공!</p>}
              </>
            ) : (
              <>
                <p className={styles.endTitle}>기회를 다 썼어요</p>
                <p className={styles.endText}>
                  숨긴 숫자는 <b className={styles.bbReveal}>{run.secret}</b>
                  {run.stage === ENDLESS ? ` · 연속 ${run.streak}판에서 끝` : ""}
                </p>
              </>
            )}
            {isDaily && <p className={styles.spNote}>오늘의 숫자는 하루 한 번이에요. 자정에 새 숫자가 나와요.</p>}
            <div className={styles.btns}>
              {isDaily ? (
                <button type="button" className={styles.primary} onClick={leave}>
                  처음으로
                </button>
              ) : done.kind === "failed" ? (
                <button type="button" className={styles.primary} onClick={() => startGuess(run.stage)}>
                  다시 하기
                </button>
              ) : run.stage === ENDLESS ? (
                <button type="button" className={styles.primary} onClick={() => startGuess(ENDLESS, run.streak + 1)}>
                  다음 판
                </button>
              ) : run.stage < STAGE_COUNT ? (
                <button type="button" className={styles.primary} onClick={() => startGuess(run.stage + 1)}>
                  다음 단계
                </button>
              ) : (
                <button type="button" className={styles.primary} onClick={() => startGuess(ENDLESS)}>
                  👑 무한 도전
                </button>
              )}
              {!isDaily && (
                <button type="button" className={styles.btn} onClick={leave}>
                  단계 고르기
                </button>
              )}
            </div>
          </div>
        ) : (
          <NumberPad key={run.round} count={spec.count} disabled={false} called={calls.map((c) => c.guess)} onCall={callGuess} />
        )}
      </div>
    );
  }

  /* ---------- 컴퓨터와 대결 판 ---------- */
  const g = vs.game;
  const hiding = !g.secrets[ME];
  const myCalls = g.calls[ME];
  const botCalls = g.calls[BOT];
  const o = vs.outcome;
  const endless = vs.level === ENDLESS;
  const status = o
    ? o.draw
      ? "무승부! 둘 다 맞혔어요"
      : o.none
        ? "아무도 못 맞혔어요"
        : o.won
          ? "이겼어요!"
          : "졌어요"
    : hiding
      ? "컴퓨터가 맞힐 내 숫자를 숨겨요"
      : g.lastChance
        ? g.turn === ME
          ? "컴퓨터가 맞혔어요! 마지막 기회"
          : "맞혔어요! 컴퓨터의 마지막 기회…"
        : g.turn === ME
          ? myCalls.length === 0 && botCalls.length === 0
            ? "내가 먼저 불러요. 컴퓨터 숫자를 불러 보세요"
            : "내 차례! 컴퓨터 숫자를 불러요"
          : "컴퓨터가 고르는 중…";
  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      <div className={styles.slideTop}>
        <span className={styles.slideTitle}>{endless ? `👑 무한 연승 · ${vs.streak}연승 중` : `${vs.level}단계 컴퓨터 · ${g.count}자리`}</span>
        <button type="button" className={styles.slideBack} onClick={leave}>
          단계 고르기
        </button>
      </div>
      <p className={`${styles.bbStatus} ${o ? (o.won ? styles.bbStatusWin : o.lost ? styles.bbStatusLose : "") : g.turn === BOT && !hiding ? styles.bbStatusWait : ""}`} role="status">
        {status}
      </p>
      {hiding ? (
        <>
          <p className={styles.bbHideNote}>
            서로 {g.count}자리 숫자를 숨기고 번갈아 불러요. 먼저 맞히면 이겨요! 같은 숫자 두 번은 안 되고 맨 앞 0은 돼요.
          </p>
          <NumberPad key={`hide-${vs.round}`} count={g.count} disabled={false} called={[]} callLabel="숨기기" onCall={(secret) => setVs((cur) => ({ ...cur, game: hideMine(cur.game, secret) ?? cur.game }))} />
        </>
      ) : (
        <>
          <div className={styles.bbSecrets}>
            <span>
              내 숫자 <b>{g.secrets[ME]}</b>
            </span>
            <span>
              컴퓨터 숫자 <b>{o ? g.secrets[BOT] : "?".repeat(g.count)}</b>
            </span>
          </div>
          <div className={styles.bbTwo}>
            <Scoreboard title="내가 부른 것" calls={myCalls} count={g.count} empty="아직 안 불렀어요" compact open={Boolean(o)} />
            <Scoreboard title="컴퓨터가 부른 것" calls={botCalls} count={g.count} empty="아직 안 불렀어요" compact open={Boolean(o)} />
          </div>
          {o ? (
            <div className={styles.slideResult} role="status" ref={resultRef}>
              <p className={styles.endTitle}>{status}</p>
              {endless && (
                <p className={styles.endText}>
                  {o.lost ? `${vs.streak}연승에서 멈췄어요` : o.won ? `${o.streak}연승!${o.newBest ? " 🎉 새 기록이에요!" : ""}` : "비겨도 연승은 이어져요"}
                </p>
              )}
              <div className={styles.btns}>
                {endless ? (
                  <button type="button" className={styles.primary} onClick={() => startVs(ENDLESS, o.lost ? 0 : o.streak)}>
                    {o.lost ? "다시 도전" : "다음 판"}
                  </button>
                ) : o.won && vs.level < VS_LEVELS ? (
                  <button type="button" className={styles.primary} onClick={() => startVs(vs.level + 1)}>
                    다음 단계
                  </button>
                ) : o.won ? (
                  <button type="button" className={styles.primary} onClick={() => startVs(ENDLESS)}>
                    👑 무한 연승
                  </button>
                ) : (
                  <button type="button" className={styles.primary} onClick={() => startVs(vs.level)}>
                    다시 도전
                  </button>
                )}
                <button type="button" className={styles.btn} onClick={leave}>
                  단계 고르기
                </button>
              </div>
            </div>
          ) : (
            <NumberPad key={`call-${vs.round}`} count={g.count} disabled={g.turn !== ME} called={myCalls.map((c) => c.guess)} onCall={(guess) => setVs((cur) => ({ ...cur, game: vsCall(cur.game, ME, guess) ?? cur.game }))} />
          )}
        </>
      )}
    </div>
  );
}
