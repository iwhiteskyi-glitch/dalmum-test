"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./games.module.css";
import FirstPicker, { PLAYER_COLORS, useFirstSpin } from "./FirstPicker";
import { useLocalRoom } from "./useLocalRoom";
import { dingDongLogic } from "@/lib/games/dingdong/logic";
import { BOT_SPEEDS, countOf, isMatchOver, isOpening, isRoundOver, onlyBotsPlaying, ROUND_MS, snackOf, tableRows, TURN_SECONDS, WINS_OPTIONS } from "@/lib/games/dingdong/match";
import { addMatch, addReact, addRound, EMPTY_RECORD, loadBestReact, loadRecord, saveSetup } from "@/lib/games/dingdong/record";
import { BOT_COUNTS } from "@/lib/games/matchRecord";
import { botIdOf, isBotId, ME } from "@/lib/games/localRoom";

// 띵동 다섯 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요). 차례대로 카드를 펼치고, 보이는 카드에서 같은 간식이 딱 5개면
// 버튼을 먼저 눌러요. 규칙·컴퓨터는 앱 그대로(lib/games/dingdong), 방장 노릇은 lib/games/localRoom.js가 이 브라우저에서 해요.
// 누가 먼저인지는 "카드가 화면에 뜬 뒤 누르기까지 걸린 시간"으로 정해요(앱과 같아요). 컴퓨터도 같은 잣대로 반응 시간을 가져요.
// 키보드: Space 띵동 · Enter 펼치기.

const nameOf = (id) => (id === ME ? "나" : `컴퓨터 ${id.replace("bot-", "")}`);
const SNACK_NAMES = { p: "프레첼", j: "주스", c: "컵케이크", s: "탄산음료" };
const SNACK_IMAGES = { p: "pretzel", j: "juice", c: "cupcake", s: "soda" };
const SPEED_NAMES = { slow: "느림", normal: "보통", fast: "빠름" };
/** 개수별 간식 자리(주사위 눈처럼) */
const SPOTS = {
  1: [[0.5, 0.5]],
  2: [[0.32, 0.27], [0.68, 0.73]],
  3: [[0.28, 0.21], [0.5, 0.5], [0.72, 0.79]],
  4: [[0.29, 0.27], [0.71, 0.27], [0.29, 0.73], [0.71, 0.73]],
  5: [[0.27, 0.2], [0.73, 0.2], [0.5, 0.5], [0.27, 0.8], [0.73, 0.8]],
};
const sec = (ms) => `${(ms / 1000).toFixed(2)}초`;
const clock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** 간식 카드 한 장 */
export function SnackCard({ card, fresh }) {
  const count = countOf(card);
  const size = count === 1 ? 62 : count === 2 ? 46 : 40;
  return (
    <span className={`${styles.ddCard} ${fresh ? styles.ddFresh : ""}`} role="img" aria-label={`${SNACK_NAMES[snackOf(card)]} ${count}개`}>
      {SPOTS[count].map(([x, y], i) => (
        <img key={i} src={`/games/dingdong/${SNACK_IMAGES[snackOf(card)]}.webp`} alt="" draggable="false" style={{ width: `${size}%`, left: `${x * 100 - size / 2}%`, top: `${y * 100 - (size / 1.4) / 2}%` }} />
      ))}
    </span>
  );
}

export default function DingDongGame() {
  const topRef = useRef(null);
  const resultRef = useRef(null);
  const { room, start, send, finish, stop } = useLocalRoom();
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [setup, setSetup] = useState(EMPTY_RECORD.setup);
  const [best, setBest] = useState(null);
  const [gameNo, setGameNo] = useState(0);
  const [notice, setNotice] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const counted = useRef("");
  const seen = useRef({ stamp: -1, at: 0, left: 0, endsIn: 0 });
  const seqSeen = useRef({ key: "", at: 0 });
  const bellSeen = useRef("");

  useEffect(() => {
    const r = loadRecord();
    setRecord(r);
    setSetup(r.setup);
    setBest(loadBestReact());
  }, []);
  const toTop = () => requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));

  const view = room?.view;
  const match = view?.match ?? null;
  const round = match?.round;
  const roundOver = Boolean(match) && isRoundOver(match);
  const matchOver = Boolean(match) && isMatchOver(match);
  const { spinning, finishSpin } = useFirstSpin(Boolean(match) && isOpening(match));

  /* 시계: 상태를 받은 때 기준으로 남은 시간을 맞춰요 */
  if (view && seen.current.stamp !== view.stamp) seen.current = { stamp: view.stamp, at: Date.now(), left: view.left, endsIn: view.endsIn };
  const turnSeconds = match?.settings.turnSeconds ?? 5;
  const turnEndsAt = seen.current.at + seen.current.left;
  const restUntil = turnEndsAt - turnSeconds * 1000;
  const roundEndsAt = seen.current.at + seen.current.endsIn;
  const resting = now < restUntil;
  const playing = Boolean(round) && !roundOver;
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [playing]);

  /* 이 판(번호)이 내 화면에 뜬 때: 쉬는 중이면 쉬는 시간이 끝난 때부터 재요 */
  const seqKey = round ? `${gameNo}-${match.roundNumber}-${round.seq}` : "";
  if (seqKey && seqSeen.current.key !== seqKey) seqSeen.current = { key: seqKey, at: Math.max(Date.now(), restUntil) };

  const iOut = Boolean(round) && round.out.includes(ME);
  const myTurn = playing && !spinning && round.turn === ME && !round.belling && !resting;
  const canPress = playing && !spinning && !iOut && !resting;

  const press = () => {
    if (!canPress) return;
    const at = Date.now();
    send({ type: "press", seq: round.seq, reactMs: Math.max(0, at - seqSeen.current.at) });
  };
  const flip = () => myTurn && send({ type: "flip" });
  const keyRef = useRef(null);
  keyRef.current = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target instanceof Element && e.target.closest("button, a, input, select, textarea") && e.key !== " ") return;
    if (e.key === " " && canPress) {
      e.preventDefault();
      press();
    } else if (e.key === "Enter" && myTurn) {
      e.preventDefault();
      flip();
    }
  };
  useEffect(() => {
    const onKey = (e) => keyRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* 판정 결과 알림(누가 몇 초에 눌렀는지) */
  const bell = round?.lastBell;
  const bellKey = bell ? `${gameNo}-${match.roundNumber}-${bell.n}` : "";
  useEffect(() => {
    if (!bellKey || bellSeen.current === bellKey) return;
    bellSeen.current = bellKey;
    const times = bell.presses.map((p) => `${nameOf(p.id)} ${sec(p.reactMs)}${p.right ? "" : " ✕"}`).join(" · ");
    let text;
    let tone = "";
    if (bell.winner) {
      const mine = bell.presses.find((p) => p.id === ME && p.right);
      if (bell.winner === ME) {
        text = `띵동! 카드 ${bell.taken}장 가져왔어요`;
        tone = "good";
        if (mine && addReact(mine.reactMs)) setBest(loadBestReact());
      } else text = `${nameOf(bell.winner)} 띵동! 카드 ${bell.taken}장 가져감`;
    } else {
      const wrong = bell.paid.map((p) => p.from);
      text = wrong.includes(ME) ? "땡! 5개가 아니었어요 · 한 장씩 나눠 줬어요" : `${wrong.map(nameOf).join(", ")} 땡! 한 장씩 나눠 줌`;
      tone = wrong.includes(ME) ? "bad" : "";
    }
    setNotice({ key: bellKey, text, times, tone });
  }, [bellKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  /* 판이 끝나면 기록(판마다 한 번) → 결과로 내려가기 */
  useEffect(() => {
    if (!roundOver) return;
    const key = `${gameNo}-${match.roundNumber}`;
    if (counted.current === key) return;
    counted.current = key;
    addRound(round.winners.includes(ME));
    if (matchOver) addMatch(match.champions.includes(ME));
    setRecord(loadRecord());
  }, [roundOver]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!roundOver) return;
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 700);
    return () => clearTimeout(t);
  }, [roundOver]);

  const changeSetup = (next) => {
    const merged = { ...setup, ...next };
    setSetup(merged);
    saveSetup(merged);
  };
  const begin = () => {
    const players = [ME, ...Array.from({ length: setup.bots }, (_, i) => botIdOf(i + 1))];
    setGameNo((n) => n + 1);
    const { bots, ...settings } = setup;
    start(dingDongLogic, settings, players);
    toTop();
  };
  const restart = () => {
    setGameNo((n) => n + 1);
    send({ type: "restart" });
    toTop();
  };
  const leave = () => {
    const started = match && !matchOver && (!roundOver || match.roundNumber > 1);
    if (started && !window.confirm("지금 나가면 이번 경기는 사라져요. 나갈까요?")) return;
    stop();
    setRecord(loadRecord());
  };

  /* ---------- 설정 고르기 ---------- */
  if (!room) {
    const chips = (label, key, options, text) => (
      <div className={styles.bnChoice}>
        <span className={styles.bnChoiceLabel}>{label}</span>
        <div className={styles.bnChips} role="group" aria-label={label}>
          {options.map((o) => (
            <button key={String(o)} type="button" className={`${styles.bnChip} ${setup[key] === o ? styles.bnChipOn : ""}`} aria-pressed={setup[key] === o} onClick={() => changeSetup({ [key]: o })}>
              {text(o)}
            </button>
          ))}
        </div>
      </div>
    );
    return (
      <div className={styles.anchor} ref={topRef}>
        <section className={styles.stagesBox} aria-labelledby="dingdong-title">
          <h2 id="dingdong-title" className={styles.stagesTitle}>
            컴퓨터와 띵동 다섯
          </h2>
          <p className={styles.stagesLead}>
            {record.rounds ? `${record.rounds}판 중 ${record.roundWins}판 이겼어요${record.champions ? ` · 우승 ${record.champions}번` : ""}` : "같은 간식이 딱 5개면 버튼을 가장 먼저 눌러요"}
            {best ? ` · 가장 빠른 띵동 ${sec(best)}` : ""}
          </p>
          {chips("함께할 컴퓨터", "bots", BOT_COUNTS, (n) => `${n}명`)}
          {chips("컴퓨터 빠르기", "botSpeed", BOT_SPEEDS, (s) => SPEED_NAMES[s])}
          {chips("우승 조건", "winsToChampion", WINS_OPTIONS, (n) => `${n}승`)}
          {chips("펼치는 시간", "turnSeconds", TURN_SECONDS, (n) => `${n}초`)}
          <p className={styles.bnHint}>
            {setup.botSpeed === "slow" ? "느림: 컴퓨터가 1.6~2.6초 만에 눌러요." : setup.botSpeed === "fast" ? "빠름: 컴퓨터가 0.7~1.2초 만에 눌러요." : "보통: 컴퓨터가 1.0~1.8초 만에 눌러요."} 가끔은 놓치기도 해요. 내 차례에 {setup.turnSeconds}초 안에 안 펼치면 저절로 펼쳐져요.
          </p>
          <div className={styles.ddRuleCards} aria-hidden="true">
            <SnackCard card="p2" />
            <span>+</span>
            <SnackCard card="p3" />
            <span>= 5</span>
          </div>
          <p className={styles.starNote}>프레첼 2개 + 프레첼 3개 = 딱 5개! 이럴 때 띵동을 눌러요</p>
          <button type="button" className={`${styles.primary} ${styles.endlessStart}`} onClick={begin}>
            시작하기
          </button>
        </section>
        <p className={styles.saveNote}>기록과 고른 설정은 이 기기의 브라우저에만 저장돼요. PC에서는 Space로 띵동, Enter로 펼쳐요.</p>
      </div>
    );
  }

  const top = (
    <div className={styles.slideTop}>
      <span className={styles.slideTitle}>{match ? `ROUND ${match.roundNumber}` : "띵동 다섯"}</span>
      <button type="button" className={styles.slideBack} onClick={leave}>
        {matchOver ? "설정 바꾸기" : "나가기"}
      </button>
    </div>
  );
  if (!match) {
    return (
      <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
        {top}
        <p className={styles.bbStatus}>카드를 나눠 주는 중이에요</p>
      </div>
    );
  }

  /* ---------- 판 ---------- */
  const rows = tableRows(round.seats, ME);
  const botsOnly = onlyBotsPlaying(match, isBotId);
  const turnLeft = Math.max(0, turnEndsAt - now);
  const status = roundOver
    ? round.winners.includes(ME)
      ? round.winners.length > 1
        ? "공동 승리!"
        : "이겼어요!"
      : `${round.winners.map(nameOf).join(", ")} 승리!`
    : iOut
      ? "카드가 떨어져서 탈락했어요"
      : round.belling
        ? "누가 먼저 눌렀을까…"
        : resting
          ? "잠깐! 다음 카드를 준비해요"
          : round.turn === ME
            ? `내 차례! 카드를 펼쳐요 · ${Math.ceil(turnLeft / 1000)}초`
            : `${nameOf(round.turn)} 차례`;

  const seat = (id) => {
    const i = match.players.indexOf(id);
    const out = round.out.includes(id);
    const card = round.tops[id];
    return (
      <div key={id} className={`${styles.ddSeat} ${!roundOver && round.turn === id && !out ? styles.ddSeatTurn : ""} ${round.winners.includes(id) ? styles.ddSeatWon : ""} ${out ? styles.ddSeatOut : ""}`} style={{ "--pc": PLAYER_COLORS[i % PLAYER_COLORS.length] }}>
        <b>
          {nameOf(id)}
          {match.settings.winsToChampion > 1 ? ` · ${match.wins[id] ?? 0}승` : ""}
        </b>
        <div className={styles.ddSlot}>
          {card ? <SnackCard key={`${round.seq}-${card}-${round.upCounts[id]}`} card={card} fresh /> : <span className={styles.ddEmpty}>{out ? "탈락" : ""}</span>}
        </div>
        <small>{out ? "카드 0장" : `더미 ${round.pileCounts[id]}장${round.upCounts[id] ? ` · 펼친 ${round.upCounts[id]}장` : ""}`}</small>
      </div>
    );
  };

  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      {top}
      <p className={styles.bnRules}>
        컴퓨터 {match.players.length - 1}명 · 빠르기 {SPEED_NAMES[match.settings.botSpeed]} · {match.settings.winsToChampion}승 우승 · 남은 시간 {roundOver ? "0:00" : clock(Math.min(ROUND_MS, roundEndsAt - now))}
      </p>
      <p className={`${styles.bbStatus} ${roundOver ? (round.winners.includes(ME) ? styles.bbStatusWin : styles.bbStatusLose) : round.turn === ME && !resting ? "" : styles.bbStatusWait}`} role="status">
        {status}
      </p>
      <div className={styles.ddTable}>
        {rows.map((row, r) => (
          <div key={r} className={styles.ddRow}>
            {row.map(seat)}
          </div>
        ))}
        {notice && (
          <span key={notice.key} className={`${styles.bnFx} ${styles.tfNotice} ${notice.tone === "bad" ? styles.bnFxBig : notice.tone === "good" ? styles.bnFxWin : ""}`} role="status">
            {notice.text}
            {notice.times && <small className={styles.ddTimes}>{notice.times}</small>}
          </span>
        )}
      </div>

      {!roundOver && !iOut && (
        <div className={styles.ddControls}>
          <button type="button" className={styles.ddFlip} disabled={!myTurn} onClick={flip}>
            {round.turn === ME && !resting ? (
              <>
                펼치기
                <i style={{ width: `${(turnLeft / (turnSeconds * 1000)) * 100}%` }} />
              </>
            ) : (
              `내 더미 ${round.pileCounts[ME]}장`
            )}
          </button>
          <button type="button" className={styles.ddBell} disabled={!canPress} onPointerDown={(e) => { e.preventDefault(); press(); }} onClick={(e) => e.detail === 0 && press()} aria-label="띵동! 같은 간식이 딱 5개">
            <img src="/games/dingdong/button.webp" alt="" draggable="false" />
            <b>띵동!</b>
          </button>
        </div>
      )}
      {iOut && botsOnly && !roundOver && (
        <div className={styles.btns}>
          <button type="button" className={styles.primary} onClick={finish}>
            결과 바로 보기
          </button>
        </div>
      )}

      {roundOver && (
        <div className={styles.slideResult} role="status" ref={resultRef}>
          <p className={styles.endTitle}>{matchOver ? (match.champions.includes(ME) ? "🏆 우승했어요!" : `${match.champions.map(nameOf).join(", ")} 우승`) : status}</p>
          <p className={styles.endText}>
            {round.timeUp ? "3분이 다 돼서 더미 카드가 가장 많은 사람이 이겼어요. " : ""}
            {match.settings.winsToChampion}승 먼저 우승 · 내 승수 {match.wins[ME] ?? 0}승
          </p>
          <ol className={styles.tfRank}>
            {[...round.seats]
              .sort((a, b) => (round.pileCounts[b] ?? 0) - (round.pileCounts[a] ?? 0))
              .map((id) => (
                <li key={id} className={id === ME ? styles.tfRankMe : ""}>
                  <span>
                    {nameOf(id)} {round.winners.includes(id) ? "👑" : ""}
                  </span>
                  <span>{round.out.includes(id) ? "탈락" : `카드 ${round.pileCounts[id]}장`}</span>
                </li>
              ))}
          </ol>
          <div className={styles.btns}>
            {matchOver ? (
              <>
                <button type="button" className={styles.primary} onClick={restart}>
                  다시 하기
                </button>
                <button type="button" className={styles.btn} onClick={leave}>
                  설정 바꾸기
                </button>
              </>
            ) : (
              <button type="button" className={styles.primary} onClick={() => send({ type: "next" })}>
                다음 판
              </button>
            )}
          </div>
        </div>
      )}
      {spinning && <FirstPicker people={match.players.map((id) => ({ id, name: nameOf(id) }))} first={round.seats[0]} seed={`${round.seats.join()}-${gameNo}`} onDone={finishSpin} />}
    </div>
  );
}
