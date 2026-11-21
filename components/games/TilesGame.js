"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./games.module.css";
import FirstPicker, { PLAYER_COLORS, useFirstSpin } from "./FirstPicker";
import { useLocalRoom } from "./useLocalRoom";
import { colorOf, draftProblem, groupSum, handValue, isJoker, isValidGroup, laidTiles, MELD_MIN, numberOf, sortTiles } from "@/lib/games/tiles/tiles";
import { tilesLogic } from "@/lib/games/tiles/logic";
import { isMatchOver, isRoundOver, liveHandCount, WINS_OPTIONS } from "@/lib/games/tiles/match";
import { addMatch, addRound, EMPTY_RECORD, loadRecord, saveSetup } from "@/lib/games/tiles/record";
import { BOT_COUNTS } from "@/lib/games/matchRecord";
import { botIdOf, ME } from "@/lib/games/localRoom";

// 숫자 타일 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요). 컴퓨터 1~3명과 묶음을 만들어 손의 타일을 먼저 다 내려놓기.
// 규칙·컴퓨터는 앱 그대로(lib/games/tiles), 방장 노릇은 lib/games/localRoom.js가 이 브라우저에서 해요.
// 내 차례: 타일을 눌러 고르고(여러 개도 돼요) 놓을 곳(+ 새 묶음 · 묶음 양 끝 + · 판의 타일 앞)을 눌러요.
// 고칠 때마다 방장에게 보내요(차례를 마칠 때 방장이 그 판을 확인해요). 앱의 끌어다 놓기는 웹에서는 빼고 누르기만 써요.

const nameOf = (id) => (id === ME ? "나" : `컴퓨터 ${id.replace("bot-", "")}`);
const COLOR_NAMES = ["빨강", "파랑", "노랑", "검정"];
const tileName = (t) => (isJoker(t) ? "조커" : `${COLOR_NAMES[colorOf(t)]} ${numberOf(t)}`);
const sameBoard = (a, b) => a.length === b.length && a.every((g, i) => g.length === b[i].length && g.every((t, j) => t === b[i][j]));
const sameGroupTiles = (a, b) => a.length === b.length && a.every((t, i) => t === b[i]);
/** 판에서 타일들을 빼요(빈 묶음은 없애요) */
const without = (board, tiles) => board.map((g) => g.filter((t) => !tiles.includes(t))).filter((g) => g.length > 0);
const PROBLEMS = {
  invalidGroup: "규칙에 안 맞는 묶음이 있어요(빨간 테두리)",
  nothingLaid: "내 타일을 하나는 내야 해요",
  touchedBoard: "첫 등록 때는 판의 묶음을 고칠 수 없어요",
};

/** 타일 하나 */
function TileFace({ tile, size = "hand", picked, fresh, onClick }) {
  const cls = `${styles.tl} ${styles[`tl_${size}`]} ${isJoker(tile) ? styles.tlJoker : styles[`tlc${colorOf(tile)}`]} ${picked ? styles.tlPicked : ""} ${fresh ? styles.tlFresh : ""}`;
  const text = isJoker(tile) ? "☺" : numberOf(tile);
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-label={`${tileName(tile)}${picked ? " 고름" : ""}`} aria-pressed={Boolean(picked)}>
      {text}
    </button>
  ) : (
    <span className={cls} role="img" aria-label={tileName(tile)}>
      {text}
    </span>
  );
}

export default function TilesGame() {
  const topRef = useRef(null);
  const resultRef = useRef(null);
  const { room, start, send, stop } = useLocalRoom();
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [setup, setSetup] = useState(EMPTY_RECORD.setup);
  const [gameNo, setGameNo] = useState(0);
  const [draft, setDraft] = useState([]);
  const [picks, setPicks] = useState([]);
  const [history, setHistory] = useState([]);
  const [handOrder, setHandOrder] = useState([]);
  const [notice, setNotice] = useState(null);
  const counted = useRef("");
  const prevTurn = useRef(null);

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
  const { spinning, finishSpin } = useFirstSpin(Boolean(round) && round.opening && !roundOver);
  const myTurn = Boolean(round) && !roundOver && !spinning && round.turn === ME;
  const myHand = view?.myHand ?? [];

  /* 내 차례가 시작되면 확정된 판에서 출발해요 */
  const turnKey = round ? `${gameNo}-${match.roundNumber}-${round.turn}-${round.board.length}-${round.handCounts[round.turn]}` : "";
  useEffect(() => {
    setDraft(round?.board ?? []);
    setPicks([]);
    setHistory([]);
  }, [turnKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 내 손 순서는 이 화면에서만 정해요. 새로 받은 타일은 뒤에 붙어요 */
  const handKey = myHand.join(",");
  useEffect(() => {
    setHandOrder((prev) => [...prev.filter((t) => myHand.includes(t)), ...myHand.filter((t) => !prev.includes(t))]);
  }, [handKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 차례가 넘어가면 방금 한 일을 잠깐 알려 줘요(내려놓은 장수 · 가져감) */
  useEffect(() => {
    if (!round) return;
    const before = prevTurn.current;
    prevTurn.current = { key: `${gameNo}-${match.roundNumber}`, turn: round.turn, counts: round.handCounts, pool: round.poolCount };
    if (!before || before.key !== `${gameNo}-${match.roundNumber}` || before.turn === round.turn || roundOver) return;
    const who = before.turn;
    const diff = before.counts[who] - round.handCounts[who];
    const text = diff > 0 ? `${nameOf(who)} 타일 ${diff}장 내려놓음` : round.poolCount < before.pool ? `${nameOf(who)} 1장 가져감` : `${nameOf(who)} 넘김`;
    setNotice({ key: `${match.roundNumber}-${round.turn}-${Date.now()}`, text, good: diff > 0 && who === ME });
  }, [round?.turn, roundOver]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 1600);
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
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 500);
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
    setHandOrder([]);
    start(tilesLogic, { winsToChampion: setup.winsToChampion, meld30: setup.meld30, turnSeconds: 0 }, players);
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
        <section className={styles.stagesBox} aria-labelledby="tiles-title">
          <h2 id="tiles-title" className={styles.stagesTitle}>
            컴퓨터와 숫자 타일
          </h2>
          <p className={styles.stagesLead}>
            {record.rounds ? `${record.rounds}판 중 ${record.roundWins}판 이겼어요${record.champions ? ` · 우승 ${record.champions}번` : ""}` : "묶음을 만들어 손의 타일을 먼저 다 내려놓으면 이겨요"}
          </p>
          {chips("함께할 컴퓨터", "bots", BOT_COUNTS, (n) => `${n}명`)}
          {chips("우승 조건", "winsToChampion", WINS_OPTIONS, (n) => `${n}승`)}
          {chips("첫 등록", "meld30", [true, false], (v) => (v ? `${MELD_MIN}점 이상` : "제한 없음"))}
          <p className={styles.bnHint}>{setup.meld30 ? `처음 내려놓을 때는 내 타일만으로 숫자 합이 ${MELD_MIN} 이상이어야 해요.` : "처음부터 묶음 하나면 내려놓을 수 있어요. 처음 해 보거나 아이와 할 때 좋아요."}</p>
          <ul className={styles.ocRuleList}>
            <li>
              <b>같은 숫자</b> 색이 다른 같은 숫자 3~4개 · 예) <span className={styles.tlc0}>7</span> <span className={styles.tlc1}>7</span> <span className={styles.tlc2}>7</span>
            </li>
            <li>
              <b>이어진 숫자</b> 같은 색으로 1씩 이어지는 3개 이상 · 예) <span className={styles.tlc1}>4 5 6</span>
            </li>
            <li>
              <b>조커 ☺</b>는 아무 타일 대신 쓸 수 있어요
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
      <span className={styles.slideTitle}>{match ? `ROUND ${match.roundNumber}` : "숫자 타일"}</span>
      <button type="button" className={styles.slideBack} onClick={leave}>
        {matchOver ? "설정 바꾸기" : "나가기"}
      </button>
    </div>
  );
  if (!match) {
    return (
      <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
        {top}
        <p className={styles.bbStatus}>타일을 나눠 주는 중이에요</p>
      </div>
    );
  }

  /* ---------- 판 ---------- */
  const shown = myTurn ? draft : round.draft;
  const fresh = new Set(laidTiles(round.board, shown));
  const handShown = handOrder.filter((t) => !fresh.has(t));
  const melded = round.melded.includes(ME);
  const changed = myTurn && !sameBoard(draft, round.board);
  const problem = myTurn ? draftProblem(round.board, draft, melded, match.settings.meld30) : null;
  const picking = picks.length > 0;
  const isPicked = (tile) => picks.some((p) => p.tile === tile);
  const pickedFresh = picks.filter((p) => p.from === "board" && fresh.has(p.tile)).map((p) => p.tile);

  const showDraft = (next) => {
    setDraft(next);
    setPicks([]);
    send({ type: "edit", draft: next });
  };
  const changeDraft = (next) => {
    setHistory((h) => [...h, draft]);
    showDraft(next);
  };
  const togglePick = (tile, from) => {
    if (!myTurn) return;
    setPicks(isPicked(tile) ? picks.filter((p) => p.tile !== tile) : [...picks, { tile, from }]);
  };
  /** 고른 타일들을 묶음(index)에 넣어요. before 타일 앞에, 없으면 맨 뒤에. index가 -1이면 새 묶음 */
  const insert = (index, before) => {
    if (!picking) return;
    const tiles = picks.map((p) => p.tile);
    const base = without(draft, tiles);
    const target = index < 0 ? null : draft[index].filter((t) => !tiles.includes(t));
    let next;
    if (!target || target.length === 0) next = [...base, tiles];
    else
      next = base.map((g) => {
        if (!sameGroupTiles(g, target)) return g;
        const at = before === undefined ? g.length : g.indexOf(before);
        return [...g.slice(0, at), ...tiles, ...g.slice(at)];
      });
    changeDraft(next);
  };
  const pressBoardTile = (tile, index) => {
    if (!picking || isPicked(tile)) togglePick(tile, "board");
    else insert(index, tile);
  };
  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setHistory(history.slice(0, -1));
    showDraft(last);
  };

  let problemText = null;
  if (myTurn && changed && problem) {
    if (problem === "meldTooSmall") {
      const sum = draft.filter((g) => !round.board.some((b) => sameGroupTiles(b, g))).reduce((s, g) => s + groupSum(g), 0);
      problemText = `첫 등록은 숫자 합 ${MELD_MIN} 이상이어야 해요(지금 ${sum})`;
    } else problemText = PROBLEMS[problem];
  }

  const iWon = round.winners.includes(ME);
  const stalemate = roundOver && round.passes >= round.order.length;
  const status = roundOver
    ? iWon
      ? round.winners.length > 1
        ? "공동 승리!"
        : "이겼어요! 다 내려놓았어요"
      : `${round.winners.map(nameOf).join(", ")} 승리!`
    : myTurn
      ? melded || !match.settings.meld30
        ? "내 차례! 묶음을 내려놓거나 판을 고쳐요"
        : `내 차례! 첫 등록은 내 타일만으로 ${MELD_MIN}점 이상`
      : !sameBoard(round.draft, round.board)
        ? `${nameOf(round.turn)}, 판을 고치는 중…`
        : `${nameOf(round.turn)} 차례…`;

  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      {top}
      <p className={styles.bnRules}>
        더미 {round.poolCount}장 · {match.settings.winsToChampion}승 우승 · 첫 등록 {match.settings.meld30 ? `${MELD_MIN}점` : "자유"}
      </p>
      <p className={`${styles.bbStatus} ${roundOver ? (iWon ? styles.bbStatusWin : styles.bbStatusLose) : myTurn ? "" : styles.bbStatusWait}`} role="status">
        {status}
      </p>
      <div className={styles.bnPlayers}>
        {round.order.map((id) => {
          const i = match.players.indexOf(id);
          const count = id === ME && myTurn ? handShown.length : liveHandCount(round, id);
          return (
            <div key={id} className={`${styles.bnPlayer} ${!roundOver && round.turn === id ? styles.bnPlayerTurn : ""} ${round.winners.includes(id) ? styles.bnPlayerWon : ""}`} style={{ "--pc": PLAYER_COLORS[i % PLAYER_COLORS.length] }}>
              <b>{nameOf(id)}</b>
              <small>
                {count}장{round.melded.includes(id) ? " ✓" : ""}
                {match.settings.winsToChampion > 1 && (
                  <>
                    {" "}
                    · <em>{match.wins[id] ?? 0}승</em>
                  </>
                )}
              </small>
            </div>
          );
        })}
      </div>

      <div className={`${styles.tlBoard} ${picking ? styles.tlBoardPicking : ""}`} aria-label="판">
        {shown.length === 0 && !roundOver && <p className={styles.tlEmpty}>아직 판에 묶음이 없어요. {myTurn ? "첫 묶음을 내려놓아 보세요" : ""}</p>}
        {shown.map((group, i) => {
          const ok = isValidGroup(group);
          return (
            <div key={`${i}-${group[0]}`} className={`${styles.tlGroup} ${ok ? "" : styles.tlGroupBad}`}>
              {myTurn && picking && (
                <button type="button" className={styles.tlSlot} onClick={() => insert(i, group[0])} aria-label={`${i + 1}번째 묶음 맨 앞에 놓기`}>
                  +
                </button>
              )}
              {group.map((tile) => (
                <TileFace key={tile} tile={tile} size="board" picked={isPicked(tile)} fresh={fresh.has(tile)} onClick={myTurn ? () => pressBoardTile(tile, i) : undefined} />
              ))}
              {myTurn && picking && (
                <button type="button" className={styles.tlSlot} onClick={() => insert(i)} aria-label={`${i + 1}번째 묶음 맨 뒤에 놓기`}>
                  +
                </button>
              )}
            </div>
          );
        })}
        {notice && (
          <span key={notice.key} className={`${styles.bnFx} ${styles.tfNotice} ${notice.good ? styles.bnFxWin : ""}`} role="status">
            {notice.text}
          </span>
        )}
      </div>

      {myTurn && (
        <div className={styles.tlActions}>
          {picking ? (
            <div className={styles.tlPickRow}>
              <span className={styles.tlPickInfo}>{picks.length}개 고름 · 놓을 곳을 눌러요</span>
              <button type="button" className={`${styles.bnChip} ${styles.bnChipOn}`} onClick={() => insert(-1)}>
                + 새 묶음
              </button>
              {pickedFresh.length > 0 && (
                <button type="button" className={styles.bnChip} onClick={() => changeDraft(without(draft, pickedFresh))}>
                  손으로
                </button>
              )}
              <button type="button" className={styles.bnChip} onClick={() => setPicks([])}>
                취소
              </button>
            </div>
          ) : (
            <p className={`${styles.tlHint} ${problemText ? styles.tlHintBad : ""}`}>{problemText ?? "타일을 눌러 고른 뒤 놓을 곳(+ 새 묶음 · 묶음 양 끝 + · 판의 타일 앞)을 눌러요"}</p>
          )}
          <div className={styles.btns}>
            <button type="button" className={styles.btn} disabled={!history.length} onClick={undo}>
              되돌리기
            </button>
            <button type="button" className={styles.btn} onClick={() => send({ type: "draw" })}>
              {round.poolCount > 0 ? "가져가기" : "넘기기"}
            </button>
            <button type="button" className={styles.primary} disabled={!changed || Boolean(problem)} onClick={() => send({ type: "done" })}>
              완료
            </button>
          </div>
        </div>
      )}

      {!roundOver && (
        <div className={styles.ocHandBox}>
          <div className={styles.ocHandHead}>
            <span>
              내 타일 <b>{handShown.length}장</b>
              {melded ? " · 등록 ✓" : ""}
            </span>
            <span className={styles.tlSorts}>
              <button type="button" className={styles.slideBack} onClick={() => setHandOrder(sortTiles(handOrder, "color"))}>
                색순
              </button>
              <button type="button" className={styles.slideBack} onClick={() => setHandOrder(sortTiles(handOrder, "number"))}>
                숫자순
              </button>
            </span>
          </div>
          <div className={styles.tlHand}>
            {handShown.map((tile) => (
              <TileFace key={tile} tile={tile} size="hand" picked={isPicked(tile)} onClick={myTurn ? () => togglePick(tile, "hand") : undefined} />
            ))}
          </div>
        </div>
      )}

      {roundOver && (
        <div className={styles.slideResult} role="status" ref={resultRef}>
          <p className={styles.endTitle}>{matchOver ? (match.champions.includes(ME) ? "🏆 우승했어요!" : `${match.champions.map(nameOf).join(", ")} 우승`) : status}</p>
          {stalemate && <p className={styles.endText}>더미가 떨어지고 모두 못 내서 판이 막혔어요. 남은 값이 가장 적은 사람이 이겨요(조커는 30).</p>}
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
              <button type="button" className={styles.primary} onClick={() => send({ type: "next" })}>
                다음 판 · {nameOf(round.winners[0])}부터
              </button>
            )}
          </div>
          <div className={styles.ocFinals}>
            {round.order.map((id) => {
              const left = round.finalHands?.[id] ?? [];
              return (
                <div key={id} className={styles.ocFinal}>
                  <span>
                    {nameOf(id)} {round.winners.includes(id) ? "👑" : ""} · 남은 값 {handValue(left)}
                  </span>
                  <div>
                    {left.length === 0 ? <small>다 내려놓았어요</small> : sortTiles(left, "color").map((t) => <TileFace key={t} tile={t} size="mini" />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {spinning && <FirstPicker people={match.players.map((id) => ({ id, name: nameOf(id) }))} first={round.turn} seed={`${round.turn}-${gameNo}`} onDone={finishSpin} />}
    </div>
  );
}
