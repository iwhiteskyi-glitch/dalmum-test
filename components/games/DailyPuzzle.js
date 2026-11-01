"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import f from "@/components/fortune/fortune.module.css";
import styles from "./games.module.css";
import { PUZZLE_RULES } from "./puzzleRules";
import {
  PUZZLE_GAMES,
  PUZZLE_ORDER,
  PUZZLE_EPOCH,
  LEVELS,
  todayKey,
  addDays,
  isValidKey,
  levelOf,
  dateLabel,
  puzzleFor,
  loadPuzzleSet,
  loadSolved,
  saveSolved,
  streakOf,
} from "@/lib/games/daily";
import { buildPuzzleCard } from "@/lib/games/puzzleCard";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { SITE } from "@/lib/site";

const REPLY_MS = 550; // 상대가 막는 수를 두기 전 잠깐 기다려요
const PAST_STEP = 14;
const triesText = (n) => (n === 1 ? "한 번에" : `${n}번 만에`);

/**
 * 오늘의 문제 화면. 주소 끝에 ?d=2026-10-08 을 붙이면 그날 문제를 보여 줘요(지난 문제).
 * game: "omok" | "janggi" | "chess"
 */
export default function DailyPuzzle({ game }) {
  const meta = PUZZLE_GAMES[game];
  const rules = PUZZLE_RULES[game];
  const [today, setToday] = useState(null);
  const [date, setDate] = useState(null);
  const [set, setSet] = useState(null);
  const [failed, setFailed] = useState(false);
  const [solved, setSolved] = useState({});
  const topRef = useRef(null);

  useEffect(() => {
    const t = todayKey();
    setToday(t);
    const d = new URLSearchParams(window.location.search).get("d");
    setDate(isValidKey(d) && d >= PUZZLE_EPOCH && d <= t ? d : t);
    setSolved(loadSolved(game));
    loadPuzzleSet(game)
      .then(setSet)
      .catch(() => setFailed(true));
  }, [game]);

  function pick(d) {
    setDate(d);
    const url = d === today ? window.location.pathname : `${window.location.pathname}?d=${d}`;
    window.history.replaceState(null, "", url);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (failed) return <p className={styles.pzError}>문제를 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.</p>;
  if (!set || !date) return <div className={styles.placeholder} aria-hidden="true" />;

  const p = puzzleFor(set, date);
  return (
    <div ref={topRef} className={styles.anchor}>
      <Solver
        key={`${game}-${date}`}
        game={game}
        meta={meta}
        rules={rules}
        p={p}
        date={date}
        isToday={date === today}
        record={solved[date]}
        onSolved={(rec) => {
          saveSolved(game, date, rec);
          setSolved(loadSolved(game));
        }}
        streak={streakOf(solved, today)}
      />
      <PastList today={today} date={date} solved={solved} onPick={pick} />
    </div>
  );
}

function Solver({ game, meta, rules, p, date, isToday, record, onSolved, streak }) {
  const start = useMemo(() => rules.start(p), [rules, p]);
  const [state, setState] = useState(start.state);
  const [left, setLeft] = useState(p.n);
  const [status, setStatus] = useState("play"); // play · reply · wrong · solved
  const [tries, setTries] = useState(1);
  const [hint, setHint] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState(null); // 푼 뒤 { tries, hint }
  const startLength = start.state.moves ? start.state.moves.length : 0;
  const Board = rules.Board;
  const level = LEVELS[p.level];
  const sideName = rules.sideName(start.side);

  function restart() {
    setState(start.state);
    setLeft(p.n);
    setStatus("play");
    setTries((t) => t + 1);
    setHint(null);
    setNotice("");
  }

  function move(m) {
    if (status !== "play") return;
    const v = rules.judge(p, state, m, left);
    if (v.kind === "illegal") return;
    setHint(null);
    setNotice("");
    setState(v.after);
    if (v.kind === "solved") {
      setStatus("solved");
      const rec = { tries, hint: hintUsed };
      setResult(rec);
      onSolved(rec);
      track("puzzle_solved", { game, level: p.level, tries, hint: hintUsed, today: isToday });
      return;
    }
    if (v.kind === "wrong") {
      setStatus("wrong");
      track("puzzle_wrong", { game, level: p.level, tries });
      return;
    }
    setStatus("reply");
    setTimeout(() => {
      const r = v.reply();
      setState(r.state);
      setLeft((n) => n - 1);
      setNotice(r.notice || "상대가 막았어요. 다음 수를 찾아보세요.");
      setStatus("play");
    }, REPLY_MS);
  }

  function showHint() {
    setHint(rules.hint(p, state, left));
    setHintUsed(true);
    setNotice(game === "omok" ? "초록색으로 칠한 9칸 안에 다음 수가 있어요." : "점선으로 표시한 말을 움직여 보세요.");
    track("puzzle_hint", { game, level: p.level });
  }

  const pill = { play: "내 차례", reply: "상대가 막는 중…", wrong: "아쉬워요", solved: "성공!" }[status];
  return (
    <section className={styles.play} aria-labelledby="pz-title">
      <div className={styles.playHead}>
        <p className={styles.kicker}>
          {isToday ? `오늘의 ${meta.name} 문제` : `지난 ${meta.name} 문제`} · {p.number}번째
        </p>
        <h2 id="pz-title" className={styles.opponent}>
          {dateLabel(date)} <span className={`${styles.lv} ${styles[`lv_${level.tone}`]}`}>{level.label}</span>
        </h2>
      </div>

      <p className={styles.pzGoal}>
        <span className={`${styles.dot} ${styles[`dot_${rules.dot(start.side)}`]}`} />
        <span>
          <b>{sideName} 차례예요.</b> {meta.goal(p)}.
        </span>
      </p>
      {record && !result && (
        <p className={styles.pzDone}>
          ✓ 이미 푼 문제예요({triesText(record.tries)}{record.hint ? ", 힌트 사용" : ""}). 다시 풀어 봐도 돼요.
        </p>
      )}

      <div className={styles.vs}>
        <span className={styles.who}>나 ({sideName})</span>
        <span className={`${styles.turn} ${status === "wrong" || status === "solved" ? styles.turnEnd : ""}`} aria-live="polite">
          {pill}
        </span>
        <span className={styles.who}>{status === "solved" ? "완료" : `남은 수 ${left}`}</span>
      </div>

      <Board
        state={state}
        side={start.side}
        active={status === "play"}
        onMove={move}
        onNotice={setNotice}
        hint={status === "play" ? hint : null}
        startLength={startLength}
      />

      <p className={styles.hint} aria-live="polite">
        {notice}
      </p>

      {status === "wrong" && (
        <div id="pz-end" className={styles.end} role="status">
          <p className={styles.endTitle}>아쉬워요!</p>
          <p className={styles.endText}>
            그 수로는 {left}수 안에 {game === "omok" ? "이길" : game === "janggi" ? "외통을 만들" : "체크메이트를 만들"} 수 없어요. 처음
            판으로 돌아가 다른 수를 찾아보세요.
          </p>
          <div className={styles.endBtns}>
            <button type="button" className={styles.primary} onClick={restart}>
              다시 풀기
            </button>
          </div>
        </div>
      )}

      {status === "solved" && result && (
        <SolvedPanel game={game} meta={meta} p={p} date={date} isToday={isToday} result={result} streak={streak} start={start} sideName={sideName} />
      )}

      {(status === "play" || status === "reply") && (
        <div className={styles.btns}>
          <button type="button" className={styles.btn} onClick={showHint} disabled={status !== "play" || hint !== null}>
            💡 힌트 보기
          </button>
          <button type="button" className={styles.btn} onClick={restart} disabled={status !== "play" || left === p.n}>
            ↺ 처음부터
          </button>
        </div>
      )}
      <p className={styles.rule}>
        {game === "omok"
          ? "4(한 수만 더 두면 5목이 되는 모양)를 만들면 상대는 그 자리를 막아요 · 쌍삼 금지는 양쪽 모두 적용"
          : game === "janggi"
            ? "내가 장군을 부를 때마다 상대는 가장 오래 버티는 수로 막아요"
            : "상대는 가장 끈질기게 버티는 수로 응수해요 · 문제 출처: 리체스(lichess.org) 공개 문제"}
      </p>
    </section>
  );
}

function SolvedPanel({ game, meta, p, date, isToday, result, streak, start, sideName }) {
  const [card, setCard] = useState(null);
  const [msg, setMsg] = useState("");
  const shareStreak = isToday ? streak : 0;
  const level = LEVELS[p.level].label;

  useEffect(() => {
    let cancelled = false;
    const board =
      game === "omok"
        ? { kind: "omok", moves: start.state.moves }
        : { kind: game, squares: start.state.squares, flip: start.side === 1 };
    buildPuzzleCard({
      game: meta,
      date: dateLabel(date),
      level,
      n: p.n,
      goal: meta.goal(p),
      sideName,
      tries: result.tries,
      hint: result.hint,
      streak: shareStreak,
      board,
    })
      .then((c) => !cancelled && setCard(c))
      .catch(() => {
        /* 카드를 못 그리면 글로만 공유해요 */
      });
    const t = setTimeout(() => document.getElementById("pz-end")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const url = `${SITE.url}${meta.path}?d=${date}`;
  async function share() {
    const title = `${dateLabel(date)} ${meta.name} 문제를 ${triesText(result.tries)} 풀었어요${result.hint ? "(힌트 사용)" : ""}`;
    setMsg("");
    try {
      const r = await shareResult({
        blob: card?.blob,
        fileName: `jaemirobom-puzzle-${game}-${date}.png`,
        title: `재미로봄 오늘의 ${meta.name} 문제`,
        shortText: `${title} — 이 문제, 풀 수 있을까?`,
        fullText: [`[재미로봄 오늘의 ${meta.name} 문제] ${dateLabel(date)} · ${level}`, title, shareStreak >= 2 ? `연속 ${shareStreak}일째 풀었어요` : "", "이 문제, 풀 수 있을까?"]
          .filter(Boolean)
          .join("\n"),
        url,
      });
      track("puzzle_shared", { game, mode: r.mode });
      if (r.mode === "files") setMsg(r.linkCopied ? "링크도 복사해 뒀어요. 사진만 전달됐으면 대화창에 붙여넣어 주세요." : "");
      else if (r.mode === "copied") setMsg("공유 글과 링크를 복사했어요. 붙여넣어 보내 주세요.");
    } catch (e) {
      if (e.name !== "AbortError") setMsg("공유하지 못했어요. 링크 복사를 이용해 주세요.");
    }
  }

  const others = PUZZLE_ORDER.filter((k) => k !== game).map((k) => PUZZLE_GAMES[k]);
  return (
    <div id="pz-end" className={`${styles.end} ${styles.endWin}`} role="status">
      <p className={styles.endTitle}>성공!</p>
      <p className={styles.endText}>
        {result.tries === 1 && !result.hint ? "단번에, 힌트 없이 풀었어요." : `${triesText(result.tries)} 풀었어요${result.hint ? "(힌트 사용)" : ""}.`}
        {shareStreak >= 2 && (
          <>
            <br />
            <b className={styles.pzStreak}>🔥 {meta.name} 문제 연속 {shareStreak}일째</b>
          </>
        )}
        {isToday && (
          <>
            <br />
            내일은 {LEVELS[levelOf(addDays(date, 1))].label} 문제가 나와요.
          </>
        )}
      </p>
      <div className={f.shareRow}>
        <button type="button" className={styles.primary} onClick={share}>
          친구에게 보내기
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={async () => setMsg((await copyText(url)) ? "이 문제 링크를 복사했어요." : "링크를 복사하지 못했어요.")}
        >
          링크 복사
        </button>
      </div>
      {msg && <p className={styles.shareHint}>{msg}</p>}
      <div className={styles.pzMore}>
        {others.map((o) => (
          <Link key={o.key} href={o.path} className={styles.btn}>
            오늘의 {o.name} 문제 →
          </Link>
        ))}
        <Link href={meta.gamePath} className={styles.btn}>
          {meta.name} 컴퓨터와 대결 →
        </Link>
      </div>
    </div>
  );
}

/** 지난 문제: 오늘부터 거꾸로 날짜 목록(처음 날까지) */
function PastList({ today, date, solved, onPick }) {
  const [count, setCount] = useState(PAST_STEP);
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = addDays(today, -i);
    if (d < PUZZLE_EPOCH) break;
    days.push(d);
  }
  const more = addDays(today, -count) >= PUZZLE_EPOCH;
  const done = days.filter((d) => solved[d]).length;
  return (
    <section className={styles.pzPast} aria-labelledby="pz-past">
      <h2 id="pz-past" className={styles.pzPastTitle}>
        지난 문제 <small>최근 {days.length}일 중 {done}개 풀었어요</small>
      </h2>
      <ul className={styles.pzDays}>
        {days.map((d) => {
          const lv = LEVELS[levelOf(d)];
          const on = d === date;
          return (
            <li key={d}>
              <button type="button" className={`${styles.pzDay} ${on ? styles.pzDayOn : ""} ${solved[d] ? styles.pzDaySolved : ""}`} onClick={() => onPick(d)} aria-current={on ? "true" : undefined}>
                <b>{d === today ? "오늘" : dateLabel(d).replace(/^\d+월 /, "")}</b>
                <small className={styles[`lvText_${lv.tone}`]}>{lv.label}</small>
                <span aria-label={solved[d] ? "푼 문제" : "안 푼 문제"}>{solved[d] ? "✓" : "·"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {more && (
        <button type="button" className={styles.btn} onClick={() => setCount((c) => c + PAST_STEP)}>
          더 이전 문제 보기
        </button>
      )}
      <p className={styles.saveNote}>푼 기록은 이 기기의 브라우저에만 저장돼요.</p>
    </section>
  );
}
