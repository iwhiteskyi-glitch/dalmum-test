"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./games.module.css";
import FirstPicker, { PLAYER_COLORS, useFirstSpin } from "./FirstPicker";
import { CardBack, CardFace, cardName } from "./PlayingCard";
import { useLocalRoom } from "./useLocalRoom";
import { isJoker, rankOf } from "@/lib/games/onecard/cards";
import { thiefLogic } from "@/lib/games/thief/logic";
import { isMatchOver, isOpening, isRoundOver, LIVES_OPTIONS, onlyBotsPlaying, sourceOf } from "@/lib/games/thief/match";
import { addMatch, addRound, EMPTY_RECORD, loadRecord, saveSetup } from "@/lib/games/thief/record";
import { BOT_COUNTS } from "@/lib/games/matchRecord";
import { botIdOf, isBotId, ME } from "@/lib/games/localRoom";

// 도둑잡기 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요). 컴퓨터 1~3명과 옆 사람 카드를 뽑아 짝을 맞춰요.
// 규칙·컴퓨터는 앱 그대로(lib/games/thief), 방장 노릇은 lib/games/localRoom.js가 이 브라우저에서 해요.
// 뽑을 카드는 뒷면만 보여요. 한 번 누르면 카드를 들고(모두에게 보여요), 든 카드를 한 번 더 누르면 가져와요.
// 뽑은 뒤·판 시작(짝 버리기) 동안은 쉬는 시간이라 다음 차례가 바로 움직이지 않아요(규칙 쪽 시간과 같아요).

const nameOf = (id) => (id === ME ? "나" : `컴퓨터 ${id.replace("bot-", "")}`);
// 이름 뒤 조사(이/가)는 숫자에 따라 달라져서, 이름 뒤는 쉼표로 이어요
const RESULT_DELAY_MS = 1200;
const hearts = (n, max) => "♥".repeat(n) + "♡".repeat(Math.max(0, max - n));

/** 남은 쉬는 시간: 방장이 상태와 함께 보내 준 값으로 맞춰요 */
function useReady(view) {
  const [clock, setClock] = useState({ stamp: -1, endsAt: 0 });
  if (view && clock.stamp !== view.stamp) setClock({ stamp: view.stamp, endsAt: Date.now() + view.left });
  const [now, setNow] = useState(() => Date.now());
  const waiting = Boolean(view) && now < clock.endsAt;
  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => setNow(Date.now()), Math.max(30, clock.endsAt - Date.now() + 10));
    return () => clearTimeout(t);
  }, [waiting, clock.endsAt]);
  useEffect(() => setNow(Date.now()), [clock.endsAt]);
  return !waiting;
}

export default function ThiefGame() {
  const topRef = useRef(null);
  const resultRef = useRef(null);
  const { room, start, send, finish, stop } = useLocalRoom();
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [setup, setSetup] = useState(EMPTY_RECORD.setup);
  const [gameNo, setGameNo] = useState(0);
  const [notice, setNotice] = useState(null);
  const [resultShown, setResultShown] = useState(false);
  const counted = useRef("");
  const prevHand = useRef([]);
  const seenDraw = useRef("");

  useEffect(() => {
    const r = loadRecord();
    setRecord(r);
    setSetup(r.setup);
  }, []);
  const toTop = () => requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));

  const view = room?.view;
  const match = view?.match ?? null;
  const round = match?.round;
  const roundOver = Boolean(match) && isRoundOver(match);
  const matchOver = Boolean(match) && isMatchOver(match);
  const ready = useReady(view);
  const { spinning, finishSpin } = useFirstSpin(Boolean(match) && isOpening(match));
  const myHand = view?.myHand ?? [];
  const source = round && !roundOver ? sourceOf(round) : null;
  const myTurn = Boolean(round) && !roundOver && !spinning && ready && round.turn === ME && Boolean(source);

  /* 뽑기 알림: 누가 누구에게서 뽑았는지, 짝이 맞았는지 */
  const drawKey = round?.lastDraw ? `${gameNo}-${match.roundNumber}-${round.lastDraw.seq}` : "";
  const handKey = myHand.join(",");
  useEffect(() => {
    const before = prevHand.current;
    prevHand.current = myHand;
    if (!drawKey || drawKey === seenDraw.current) return;
    seenDraw.current = drawKey;
    const d = round.lastDraw;
    let text;
    let tone = "";
    if (d.to === ME) {
      const card = view.drew?.card;
      if (card && isJoker(card)) [text, tone] = [`${nameOf(d.from)}에게서 조커를 뽑았어요! 😱`, "bad"];
      else if (d.pair) [text, tone] = [`${card ? cardName(card) : "카드"} 뽑기 → 짝! 두 장 버렸어요`, "good"];
      else text = `뽑은 카드: ${card ? cardName(card) : "1장"}`;
    } else if (d.from === ME) {
      const lost = before.find((c) => !myHand.includes(c));
      if (lost && isJoker(lost)) [text, tone] = [`${nameOf(d.to)}에게 조커를 넘겼어요! 🎉`, "good"];
      else text = `${nameOf(d.to)}, 내 카드를 뽑아 갔어요${d.pair ? " → 짝!" : ""}`;
    } else text = `${nameOf(d.to)}, ${nameOf(d.from)}에게서 1장${d.pair ? ` → 짝! ${rankOf(d.pair[0])} 두 장 버림` : ""}`;
    setNotice({ key: drawKey, text, tone });
  }, [drawKey, handKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(t);
  }, [notice]);

  /* 판이 끝나면 잠깐 뒤 결과 → 기록(판마다 한 번) → 결과로 내려가기 */
  useEffect(() => {
    if (!roundOver) {
      setResultShown(false);
      return;
    }
    const t = setTimeout(() => setResultShown(true), RESULT_DELAY_MS);
    return () => clearTimeout(t);
  }, [roundOver, match?.roundNumber]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!roundOver) return;
    const key = `${gameNo}-${match.roundNumber}`;
    if (counted.current === key) return;
    counted.current = key;
    addRound(round.thief !== ME);
    if (matchOver) addMatch(match.loser !== ME);
    setRecord(loadRecord());
  }, [roundOver]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!resultShown) return;
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 150);
    return () => clearTimeout(t);
  }, [resultShown]);

  const changeSetup = (next) => {
    const merged = { ...setup, ...next };
    setSetup(merged);
    saveSetup(merged);
  };
  const reset = () => {
    prevHand.current = [];
    seenDraw.current = "";
    setNotice(null);
  };
  const begin = () => {
    const players = [ME, ...Array.from({ length: setup.bots }, (_, i) => botIdOf(i + 1))];
    setGameNo((n) => n + 1);
    reset();
    start(thiefLogic, { lives: setup.lives, turnSeconds: 0 }, players);
    toTop();
  };
  const restart = () => {
    setGameNo((n) => n + 1);
    reset();
    send({ type: "restart" });
    toTop();
  };
  const next = () => {
    reset();
    send({ type: "next" });
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
    const lostRounds = record.rounds - record.roundWins;
    return (
      <div className={styles.anchor} ref={topRef}>
        <section className={styles.stagesBox} aria-labelledby="thief-title">
          <h2 id="thief-title" className={styles.stagesTitle}>
            컴퓨터와 도둑잡기
          </h2>
          <p className={styles.stagesLead}>
            {record.rounds ? `${record.rounds}판 중 도둑이 된 판 ${lostRounds}번${record.matches ? ` · 꼴찌 피한 경기 ${record.champions}/${record.matches}` : ""}` : "옆 사람 카드를 뽑아 짝을 버리고, 조커(도둑)는 남에게 넘겨요"}
          </p>
          <div className={styles.bnChoice}>
            <span className={styles.bnChoiceLabel}>함께할 컴퓨터</span>
            <div className={styles.bnChips} role="group" aria-label="함께할 컴퓨터">
              {BOT_COUNTS.map((n) => (
                <button key={n} type="button" className={`${styles.bnChip} ${setup.bots === n ? styles.bnChipOn : ""}`} aria-pressed={setup.bots === n} onClick={() => changeSetup({ bots: n })}>
                  {n}명
                </button>
              ))}
            </div>
          </div>
          <div className={styles.bnChoice}>
            <span className={styles.bnChoiceLabel}>시작 점수</span>
            <div className={styles.bnChips} role="group" aria-label="시작 점수">
              {LIVES_OPTIONS.map((n) => (
                <button key={n} type="button" className={`${styles.bnChip} ${setup.lives === n ? styles.bnChipOn : ""}`} aria-pressed={setup.lives === n} onClick={() => changeSetup({ lives: n })}>
                  {n}점
                </button>
              ))}
            </div>
          </div>
          <p className={styles.bnHint}>모두 같은 점수로 시작해요. 조커를 마지막까지 들고 있으면 도둑이 되어 1점을 잃고, 0점이 되는 사람이 꼴찌예요.</p>
          <button type="button" className={`${styles.primary} ${styles.endlessStart}`} onClick={begin}>
            시작하기
          </button>
        </section>
        <p className={styles.saveNote}>기록과 고른 설정은 이 기기의 브라우저에만 저장돼요.</p>
      </div>
    );
  }

  const top = (
    <div className={styles.slideTop}>
      <span className={styles.slideTitle}>{match ? `ROUND ${match.roundNumber}` : "도둑잡기"}</span>
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
  const lives = match.settings.lives;
  const iOut = round.out.includes(ME);
  const botsOnly = onlyBotsPlaying(match, isBotId);
  const dealing = !round.lastDraw && !ready && !roundOver;
  const myPairs = (view.deal?.discards ?? []).length / 2;
  const sourceCount = source ? (round.handCounts[source] ?? 0) : 0;
  const fromMe = source === ME;
  const showResult = roundOver && resultShown;

  const pick = (index) => {
    if (!myTurn) return;
    if (round.hover === index) send({ type: "draw", index });
    else send({ type: "hover", index });
  };

  let status;
  if (roundOver) status = round.thief === ME ? "도둑이 됐어요! 1점 잃음" : round.thief ? `도둑은 ${nameOf(round.thief)}! 1점 잃음` : "이번 판은 무효예요";
  else if (dealing) status = "카드를 나누고 짝을 버리는 중…";
  else if (iOut) status = botsOnly ? "탈출했어요! 컴퓨터끼리 남았어요" : "탈출했어요! 이번 판은 안전해요";
  else if (myTurn) status = round.hover === null ? `내 차례! ${nameOf(source)}의 카드를 하나 골라요` : "든 카드를 한 번 더 누르면 가져와요";
  else if (!ready) status = round.turn === ME ? "곧 내 차례예요" : `다음은 ${nameOf(round.turn)} 차례예요`;
  else status = `${nameOf(round.turn)}, ${nameOf(source)}의 카드를 고르는 중…`;

  const ranking = [...match.players].sort((a, b) => (match.points[b] ?? 0) - (match.points[a] ?? 0));

  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      {top}
      <p className={styles.bnRules}>
        시작 {lives}점 · 0점이 되면 꼴찌 · 컴퓨터 {match.players.length - 1}명
      </p>

      <div className={styles.ocSeats}>
        {match.players
          .filter((id) => id !== ME)
          .map((id) => {
            const i = match.players.indexOf(id);
            const out = round.out.includes(id);
            return (
              <div key={id} className={`${styles.ocSeat} ${!roundOver && round.turn === id && ready ? styles.ocSeatTurn : ""} ${round.thief === id && roundOver ? styles.tfSeatThief : ""} ${out && !roundOver ? styles.tfSeatOut : ""} ${source === id && !roundOver ? styles.tfSeatSource : ""}`} style={{ "--pc": PLAYER_COLORS[i % PLAYER_COLORS.length] }}>
                <b>{nameOf(id)}</b>
                <span className={styles.ocSeatCards}>
                  <CardBack size="tiny" />
                  {out ? "탈출" : `${round.handCounts[id] ?? 0}장`}
                </span>
                <small className={styles.tfHearts} aria-label={`${match.points[id]}점`}>
                  {hearts(match.points[id] ?? 0, lives)}
                </small>
              </div>
            );
          })}
      </div>

      <div className={styles.tfTable}>
        {dealing ? (
          <div className={styles.tfDeal}>
            <p>처음 받은 카드에서 같은 숫자 짝 {myPairs}쌍을 버렸어요</p>
            <div className={styles.tfPairs}>
              {(view.deal?.discards ?? []).map((c, i) => (
                <CardFace key={c} card={c} size="mini" className={styles.tfGone} style={{ animationDelay: `${Math.floor(i / 2) * 120}ms` }} />
              ))}
            </div>
          </div>
        ) : source && !fromMe && !roundOver ? (
          <div className={styles.tfSource}>
            <p>
              {nameOf(source)}의 카드 {sourceCount}장{myTurn ? " · 하나를 골라요" : ""}
            </p>
            <div className={styles.tfFan}>
              {Array.from({ length: sourceCount }, (_, i) => {
                const held = round.hover === i;
                return myTurn ? (
                  <button key={i} type="button" className={`${styles.tfBack} ${held ? styles.tfHeld : ""}`} onClick={() => pick(i)} aria-label={held ? `${i + 1}번째 카드 · 한 번 더 누르면 가져와요` : `${i + 1}번째 카드 들기`}>
                    <CardBack size="hand" />
                  </button>
                ) : (
                  <span key={i} className={`${styles.tfBack} ${held ? styles.tfHeld : ""}`}>
                    <CardBack size="hand" />
                  </span>
                );
              })}
            </div>
            {myTurn && round.hover !== null && (
              <button type="button" className={`${styles.primary} ${styles.tfTake}`} onClick={() => pick(round.hover)}>
                이 카드 가져오기
              </button>
            )}
          </div>
        ) : fromMe && !roundOver ? (
          <p className={styles.tfWatch}>{nameOf(round.turn)}, 내 카드를 고르는 중… {round.hover !== null ? (isJoker(myHand[round.hover] ?? "") ? "조커를 들었어요! 😳" : "한 장을 들었어요") : ""}</p>
        ) : (
          <p className={styles.tfWatch}>{roundOver ? "판이 끝났어요" : " "}</p>
        )}
        {notice && (
          <span key={notice.key} className={`${styles.bnFx} ${styles.tfNotice} ${notice.tone === "bad" ? styles.bnFxBig : notice.tone === "good" ? styles.bnFxWin : ""}`} role="status">
            {notice.text}
          </span>
        )}
      </div>

      <p className={`${styles.bbStatus} ${roundOver ? (round.thief === ME ? styles.bbStatusLose : styles.bbStatusWin) : myTurn ? "" : styles.bbStatusWait}`} role="status">
        {status}
      </p>

      {!roundOver && (
        <div className={styles.ocHandBox}>
          <div className={styles.ocHandHead}>
            <span>
              내 카드 <b>{iOut ? "탈출" : `${myHand.length}장`}</b>
            </span>
            <span className={styles.tfHearts} aria-label={`내 점수 ${match.points[ME]}점`}>
              {hearts(match.points[ME] ?? 0, lives)}
            </span>
          </div>
          {!iOut && (
            <div className={styles.ocHand}>
              {myHand.map((card, i) => (
                <CardFace key={card} card={card} size="hand" className={fromMe && round.hover === i ? `${styles.tfHeldMine} ${isJoker(card) ? styles.tfThrob : ""}` : ""} />
              ))}
            </div>
          )}
          {iOut && botsOnly && (
            <div className={styles.btns}>
              <button type="button" className={styles.primary} onClick={finish}>
                결과 바로 보기
              </button>
            </div>
          )}
        </div>
      )}

      {showResult && (
        <div className={styles.slideResult} role="status" ref={resultRef}>
          <p className={styles.endTitle}>{matchOver ? (match.loser === ME ? "꼴찌가 됐어요 😢" : `꼴찌는 ${nameOf(match.loser)}! 살아남았어요`) : status}</p>
          <p className={styles.endText}>{matchOver ? "경기가 끝났어요" : `내 점수 ${match.points[ME]}점 · 0점이 되면 꼴찌`}</p>
          <ol className={styles.tfRank}>
            {ranking.map((id) => (
              <li key={id} className={id === ME ? styles.tfRankMe : ""}>
                <span>{nameOf(id)}</span>
                <span className={styles.tfHearts}>{hearts(match.points[id] ?? 0, lives)}</span>
                <small>{round.thief === id ? "이번 판 도둑" : round.out.includes(id) ? `${round.out.indexOf(id) + 1}번째 탈출` : ""}</small>
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
              <button type="button" className={styles.primary} onClick={next}>
                다음 판{round.thief ? ` · ${nameOf(round.thief)}부터` : ""}
              </button>
            )}
          </div>
        </div>
      )}
      {spinning && <FirstPicker people={match.players.map((id) => ({ id, name: nameOf(id) }))} first={round.seats[0]} seed={`${round.seats.join()}-${gameNo}`} onDone={finishSpin} />}
    </div>
  );
}
