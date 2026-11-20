"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./games.module.css";
import FirstPicker, { PLAYER_COLORS, useFirstSpin } from "./FirstPicker";
import { CardBack, CardFace, isRedSuit, SUIT_MARKS, SUIT_NAMES } from "./PlayingCard";
import { useLocalRoom } from "./useLocalRoom";
import { BUST_SIZE, canPlay, rankOf, sortHand, SUITS } from "@/lib/games/onecard/cards";
import { oneCardLogic } from "@/lib/games/onecard/logic";
import { isMatchOver, isOpening, isRoundOver, onlyBotsPlaying, WINS_OPTIONS } from "@/lib/games/onecard/match";
import { addMatch, addRound, EMPTY_RECORD, loadRecord, saveSetup } from "@/lib/games/onecard/record";
import { BOT_COUNTS } from "@/lib/games/matchRecord";
import { botIdOf, isBotId, ME } from "@/lib/games/localRoom";

// 원카드 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요). 컴퓨터 1~3명과 같은 무늬·숫자를 내며 먼저 다 내기.
// 규칙·컴퓨터는 앱 그대로(lib/games/onecard), 방장 노릇은 lib/games/localRoom.js가 이 브라우저에서 해요.
// 컴퓨터는 자기 패와 공개된 것(맨 위 카드, 남은 장수)만 봐요. "원카드!" 버튼은 앱에서도 사람끼리만 써서 여기에는 없어요.

const nameOf = (id) => (id === ME ? "나" : `컴퓨터 ${id.replace("bot-", "")}`);
/** 마지막 카드가 앉는 걸 보여 준 뒤 결과를 내요 */
const RESULT_DELAY_MS = 900;
const NOTICE_MS = 1300;

/** 탁자 위 잠깐 알림: 특수 카드(J·Q·K·7)와 먹기·파산 */
function useNotice(match) {
  const [notice, setNotice] = useState(null);
  const round = match?.round;
  const newest = round?.recent[round.recent.length - 1];
  const playKey = round && newest ? `${match.roundNumber}-${newest.seq}` : "";
  const eventKey = round?.event ? `${match.roundNumber}-e${round.eventSeq}` : "";
  const seen = useRef({ playKey, eventKey });
  useEffect(() => {
    const before = seen.current;
    seen.current = { playKey, eventKey };
    if (!round) return;
    if (eventKey && eventKey !== before.eventKey) {
      const e = round.event;
      const text =
        e.kind === "ate" ? (e.id === ME ? `${e.count}장 먹었어요!` : `${nameOf(e.id)} ${e.count}장 먹음!`) : e.kind === "bust" ? (e.id === ME ? "파산했어요!" : `${nameOf(e.id)} 파산!`) : null;
      if (text) setNotice({ key: eventKey, text, bad: e.id === ME });
      return;
    }
    if (playKey && playKey !== before.playKey && newest?.by && round.winner === null) {
      const rank = rankOf(newest.card);
      const two = round.order.length === 2;
      const text =
        rank === "J" ? (two ? "한 번 더!" : "건너뛰기!") : rank === "Q" ? (two ? "한 번 더!" : "방향 바뀜!") : rank === "K" ? "한 번 더!" : rank === "7" && round.suit ? `${SUIT_MARKS[round.suit]} ${SUIT_NAMES[round.suit]}로 변경!` : null;
      if (text) setNotice({ key: playKey, text });
    }
  }, [playKey, eventKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);
  return notice;
}

export default function OneCardGame() {
  const topRef = useRef(null);
  const resultRef = useRef(null);
  const { room, start, send, finish, stop } = useLocalRoom();
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [setup, setSetup] = useState(EMPTY_RECORD.setup);
  const [gameNo, setGameNo] = useState(0);
  const [seven, setSeven] = useState(null);
  const [resultShown, setResultShown] = useState(false);
  const counted = useRef("");
  const prevHand = useRef([]);

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
  const { spinning, finishSpin } = useFirstSpin(Boolean(match) && isOpening(match));
  const notice = useNotice(match);
  const myTurn = Boolean(round) && !roundOver && !spinning && round.turn === ME;
  if (seven && !myTurn) setSeven(null);

  /* 방금 받은 카드(먹은 카드)는 잠깐 빛나게 */
  const myHand = view?.myHand ?? [];
  const handKey = myHand.join(",");
  const [fresh, setFresh] = useState([]);
  useEffect(() => {
    const before = prevHand.current;
    prevHand.current = myHand;
    if (!before.length) return setFresh([]);
    const added = myHand.filter((c) => !before.includes(c));
    setFresh(added.length && added.length < myHand.length ? added : []);
  }, [handKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 판이 끝나면 마지막 카드를 본 뒤 결과 → 기록(판마다 한 번) → 결과로 내려가기 */
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
    addRound(round.winner === ME);
    if (matchOver) addMatch(match.champions.includes(ME));
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
  const begin = () => {
    const players = [ME, ...Array.from({ length: setup.bots }, (_, i) => botIdOf(i + 1))];
    setGameNo((n) => n + 1);
    prevHand.current = [];
    start(oneCardLogic, { winsToChampion: setup.winsToChampion, turnSeconds: 0 }, players);
    toTop();
  };
  const restart = () => {
    setGameNo((n) => n + 1);
    prevHand.current = [];
    send({ type: "restart" });
    toTop();
  };
  const next = () => {
    prevHand.current = [];
    send({ type: "next" });
    toTop();
  };
  const leave = () => {
    const started = match && !matchOver && (!roundOver || match.roundNumber > 1 || Object.values(match.wins).some((w) => w > 0));
    if (started && !roundOver && !window.confirm("지금 나가면 이번 경기는 사라져요. 나갈까요?")) return;
    if (started && roundOver && !window.confirm("지금 나가면 이번 경기의 승수는 사라져요. 나갈까요?")) return;
    stop();
    setRecord(loadRecord());
  };

  /* ---------- 설정 고르기 ---------- */
  if (!room) {
    return (
      <div className={styles.anchor} ref={topRef}>
        <section className={styles.stagesBox} aria-labelledby="onecard-title">
          <h2 id="onecard-title" className={styles.stagesTitle}>
            컴퓨터와 원카드
          </h2>
          <p className={styles.stagesLead}>
            {record.rounds ? `${record.rounds}판 중 ${record.roundWins}판 이겼어요${record.champions ? ` · 우승 ${record.champions}번` : ""}` : "같은 무늬나 숫자를 내서 손의 카드를 먼저 다 내면 이겨요"}
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
            <span className={styles.bnChoiceLabel}>우승 조건</span>
            <div className={styles.bnChips} role="group" aria-label="우승 조건">
              {WINS_OPTIONS.map((n) => (
                <button key={n} type="button" className={`${styles.bnChip} ${setup.winsToChampion === n ? styles.bnChipOn : ""}`} aria-pressed={setup.winsToChampion === n} onClick={() => changeSetup({ winsToChampion: n })}>
                  {n}승
                </button>
              ))}
            </div>
          </div>
          <ul className={styles.ocRuleList}>
            <li>
              <b>공격</b> 2 → 2장 · A → 3장 · 흑백 조커 → 5장 · 컬러 조커 → 7장
            </li>
            <li>
              <b>7</b> 무늬 바꾸기 · <b>J</b> 건너뛰기 · <b>Q</b> 방향 바꾸기 · <b>K</b> 한 번 더
            </li>
            <li>
              카드가 <b>{BUST_SIZE}장</b> 이상이 되면 파산해서 그 판에서 빠져요
            </li>
          </ul>
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
      <span className={styles.slideTitle}>{match ? `ROUND ${match.roundNumber}` : "ONE CARD"}</span>
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
  const hand = sortHand(myHand);
  const playable = (card) => canPlay(card, round.top, round.suit, round.attack);
  const canAny = myTurn && hand.some(playable);
  const iBusted = round.busted.includes(ME);
  const iWon = round.winner === ME;
  const drawCount = round.attack || 1;
  const willBust = hand.length + drawCount >= BUST_SIZE;
  const botsOnly = onlyBotsPlaying(match, isBotId);
  const n = round.order.length;
  const turnAt = round.order.indexOf(round.turn);
  const sequence = turnAt < 0 ? round.order : Array.from({ length: n }, (_, k) => round.order[(((turnAt + k * round.direction) % n) + n) % n]);
  const newest = round.recent[round.recent.length - 1];
  const showResult = roundOver && resultShown;

  const play = (card) => {
    if (!myTurn || !playable(card)) return;
    if (rankOf(card) === "7" && hand.length > 1) {
      setSeven(card);
      return;
    }
    send({ type: "play", card, suit: null });
  };

  let status;
  let hint = "";
  if (roundOver) status = iWon ? "이겼어요! 카드를 다 냈어요" : `${nameOf(round.winner)} 승리!`;
  else if (iBusted) {
    status = "파산했어요";
    hint = botsOnly ? "컴퓨터끼리 남은 판은 건너뛸 수 있어요" : "이번 판은 구경해요";
  } else if (myTurn) {
    status = round.attack > 0 ? `공격! ${round.attack}장` : "내 차례!";
    hint = seven ? "바꿀 무늬를 골라요" : round.attack > 0 ? (canAny ? `공격 카드로 넘기거나 ${round.attack}장 먹어요` : `넘길 카드가 없어요. ${round.attack}장 먹어요`) : canAny ? "낼 카드를 눌러요" : "낼 카드가 없어요. 1장 먹어요";
    if (willBust) hint += " · 먹으면 파산!";
  } else status = `${nameOf(round.turn)} 차례…`;

  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      {top}
      <p className={styles.bnRules}>
        {match.settings.winsToChampion}승 먼저 우승 · 컴퓨터 {match.players.length - 1}명
      </p>

      <div className={styles.ocSeats}>
        {match.players
          .filter((id) => id !== ME)
          .map((id) => {
            const i = match.players.indexOf(id);
            const busted = round.busted.includes(id);
            const cards = round.handCounts[id] ?? 0;
            const drew = round.lastDraw?.id === id ? round.lastDraw : null;
            return (
              <div key={id} className={`${styles.ocSeat} ${!roundOver && round.turn === id ? styles.ocSeatTurn : ""} ${round.winner === id ? styles.ocSeatWon : ""} ${busted ? styles.ocSeatOut : ""}`} style={{ "--pc": PLAYER_COLORS[i % PLAYER_COLORS.length] }}>
                <b>{nameOf(id)}</b>
                <span className={styles.ocSeatCards} aria-label={`${cards}장`}>
                  <CardBack size="tiny" />
                  {busted ? "파산" : `${cards}장`}
                </span>
                <small>{match.wins[id] ?? 0}승</small>
                {drew && drew.count > 0 && (
                  <em key={`${match.roundNumber}-${drew.seq}`} className={styles.ocDrew}>
                    +{drew.count}
                  </em>
                )}
              </div>
            );
          })}
      </div>

      <div className={`${styles.ocTable} ${round.attack > 0 ? styles.ocTableAttack : ""}`}>
        <div className={styles.ocInfo}>
          {round.attack > 0 ? (
            <span className={styles.ocAttack}>
              공격! <b>{round.attack}장</b>
            </span>
          ) : round.suit ? (
            <span className={`${styles.ocSuit} ${isRedSuit(round.suit) ? styles.pcRed : ""}`}>
              지금 무늬 <b>{SUIT_MARKS[round.suit]}</b> {SUIT_NAMES[round.suit]}
            </span>
          ) : (
            <span className={styles.ocSuit}>조커 다음 · 아무 카드나</span>
          )}
        </div>
        <div className={styles.ocPiles}>
          <div className={styles.ocDeck}>
            <CardBack size="table" count={round.poolCount} />
            <small>더미</small>
          </div>
          <div className={styles.ocPile}>
            {round.recent.slice(-3, -1).map((p, i) => (
              <CardFace key={`${match.roundNumber}-${p.seq}`} card={p.card} size="table" className={styles.ocUnder} style={{ transform: `rotate(${(p.seq % 2 ? -1 : 1) * (6 + i * 4)}deg)` }} />
            ))}
            <CardFace key={`${match.roundNumber}-${newest.seq}`} card={newest.card} size="table" className={`${styles.ocTop} ${newest.by === ME ? styles.ocFromMe : newest.by ? styles.ocFromBot : ""}`} />
          </div>
        </div>
        <p className={styles.ocOrder} aria-label="차례 순서">
          {round.direction === 1 ? "↻" : "↺"} {sequence.map(nameOf).join(" → ")}
        </p>
        {notice && (
          <span key={notice.key} className={`${styles.bnFx} ${notice.bad ? styles.bnFxBig : ""}`} role="status">
            {notice.text}
          </span>
        )}
      </div>

      <p className={`${styles.bbStatus} ${roundOver ? (iWon ? styles.bbStatusWin : styles.bbStatusLose) : myTurn ? (round.attack > 0 ? styles.bbStatusLose : "") : styles.bbStatusWait}`} role="status">
        {status}
        {hint && <small className={styles.ocHint}>{hint}</small>}
      </p>

      {!roundOver && !iBusted && (
        <div className={styles.ocHandBox}>
          <div className={styles.ocHandHead}>
            <span>
              내 카드 <b>{hand.length}장</b> · {match.wins[ME] ?? 0}승
            </span>
            <button type="button" className={`${styles.ocDraw} ${willBust ? styles.ocDrawDanger : ""}`} disabled={!myTurn || Boolean(seven)} onClick={() => send({ type: "draw" })}>
              {drawCount}장 먹기
            </button>
          </div>
          {seven ? (
            <div className={styles.ocSevenBox}>
              <p>7을 내면서 바꿀 무늬를 골라요</p>
              <div className={styles.ocSevens}>
                {SUITS.map((s) => (
                  <button key={s} type="button" className={`${styles.ocSevenBtn} ${isRedSuit(s) ? styles.pcRed : ""}`} onClick={() => send({ type: "play", card: seven, suit: s })}>
                    <b>{SUIT_MARKS[s]}</b>
                    {SUIT_NAMES[s]}
                  </button>
                ))}
              </div>
              <button type="button" className={styles.slideBack} onClick={() => setSeven(null)}>
                취소
              </button>
            </div>
          ) : (
            <div className={styles.ocHand}>
              {hand.map((card) => {
                const can = myTurn && playable(card);
                return <CardFace key={card} card={card} size="hand" can={can} dim={myTurn && !can} fresh={fresh.includes(card)} onClick={can ? () => play(card) : undefined} />;
              })}
            </div>
          )}
        </div>
      )}

      {iBusted && botsOnly && (
        <div className={styles.btns}>
          <button type="button" className={styles.primary} onClick={finish}>
            결과 바로 보기
          </button>
        </div>
      )}

      {showResult && (
        <div className={styles.slideResult} role="status" ref={resultRef}>
          <p className={styles.endTitle}>{matchOver ? (match.champions.includes(ME) ? "🏆 우승했어요!" : `${match.champions.map(nameOf).join(", ")} 우승`) : status}</p>
          <p className={styles.endText}>
            {match.settings.winsToChampion}승 먼저 우승 · 내 승수 {match.wins[ME] ?? 0}승
          </p>
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
                다음 판 · {nameOf(round.winner)}부터
              </button>
            )}
          </div>
          {round.finalHands && (
            <div className={styles.ocFinals}>
              {match.players.map((id) => (
                <div key={id} className={styles.ocFinal}>
                  <span>
                    {nameOf(id)} {round.winner === id ? "👑" : round.busted.includes(id) ? "· 파산" : `· ${(round.finalHands[id] ?? []).length}장`}
                  </span>
                  <div>
                    {(round.finalHands[id] ?? []).length === 0 ? <small>{round.winner === id ? "다 냈어요" : "—"}</small> : sortHand(round.finalHands[id]).map((c) => <CardFace key={c} card={c} size="mini" />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {spinning && <FirstPicker people={match.players.map((id) => ({ id, name: nameOf(id) }))} first={round.turn} seed={round.top} onDone={finishSpin} />}
    </div>
  );
}
