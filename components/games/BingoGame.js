"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./games.module.css";
import FirstPicker, { PLAYER_COLORS, useFirstSpin } from "./FirstPicker";
import { useLocalRoom } from "./useLocalRoom";
import { BLACKOUT, CELL_COUNT, completedCells, FILL_MODES, isAllowedCombination, LINE_TARGETS, NUMBER_RANGES, WINS_TO_CHAMPION } from "@/lib/games/bingo/bingo";
import { clearCell, emptyDraft, fillRemainingRandom, finishDraft, nextUnused, placeNumber } from "@/lib/games/bingo/fill";
import { bingoLogic, submitBoard } from "@/lib/games/bingo/logic";
import { addMatch, addRound, BOT_COUNTS, DEFAULT_SETUP, EMPTY_RECORD, fastestKey, loadRecord, saveSetup } from "@/lib/games/bingo/record";
import { botIdOf, ME } from "@/lib/games/localRoom";

// 빙고 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요). 컴퓨터 1~3명과 번갈아 숫자를 불러요.
// 규칙·컴퓨터는 앱 그대로(lib/games/bingo), 방장 노릇은 lib/games/localRoom.js가 이 브라우저에서 해요.
// 컴퓨터는 자기 판만 보고 골라요. 판이 끝나면 컴퓨터 판도 보여 줘요.

const nameOf = (id) => (id === ME ? "나" : `컴퓨터 ${id.replace("bot-", "")}`);
const lineLabel = (n) => (n === BLACKOUT ? "블랙빙고" : `${n}줄`);
const summary = (s) => `1~${s.maxNumber} · ${lineLabel(s.lineTarget)} · ${s.winsToChampion}승 우승${s.fillMode === "manual" ? " · 직접 채우기" : ""}`;
const joinNames = (ids) => ids.map(nameOf).join(", ");

/** 고르기 단추 한 줄 */
function Choice({ label, options, value, onPick, text, disabledOf = () => false }) {
  return (
    <div className={styles.bnChoice}>
      <span className={styles.bnChoiceLabel}>{label}</span>
      <div className={styles.bnChips} role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o} type="button" className={`${styles.bnChip} ${value === o ? styles.bnChipOn : ""}`} aria-pressed={value === o} disabled={disabledOf(o)} onClick={() => onPick(o)}>
            {text(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 내 빙고판. onPick이 있으면 내 차례(안 불린 칸을 눌러 불러요) */
function BingoBoard({ board, called, onPick, finished }) {
  const calledSet = new Set(called);
  const lines = completedCells(board, called);
  const last = called[called.length - 1];
  return (
    <div className={`${styles.bnBoard} ${onPick ? styles.bnBoardMine : ""}`} role="grid" aria-label="내 빙고판">
      {board.map((n, cell) => {
        const isCalled = calledSet.has(n);
        const inLine = lines.has(cell);
        const can = Boolean(onPick) && !isCalled;
        return (
          <button
            key={cell}
            type="button"
            className={`${styles.bnCell} ${isCalled ? styles.bnCalled : ""} ${inLine ? styles.bnLine : ""} ${n === last ? styles.bnLast : ""} ${can ? styles.bnCan : ""} ${finished && !inLine ? styles.bnDim : ""}`}
            style={inLine ? { animationDelay: `${(cell % 5) * 60}ms` } : undefined}
            disabled={!can}
            onClick={() => onPick(n)}
            aria-label={`${n}${isCalled ? " 불림" : ""}${inLine ? " 줄 완성" : ""}`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

/** 판이 끝난 뒤 컴퓨터 판(작게) */
function MiniBoard({ id, board, called, winner }) {
  const calledSet = new Set(called);
  const lines = completedCells(board, called);
  return (
    <figure className={`${styles.bnMini} ${winner ? styles.bnMiniWin : ""}`}>
      <figcaption>{nameOf(id)}{winner ? " 🏅" : ""}</figcaption>
      <div className={styles.bnMiniGrid} aria-hidden="true">
        {board.map((n, cell) => (
          <span key={cell} className={`${calledSet.has(n) ? styles.bnMiniCalled : ""} ${lines.has(cell) ? styles.bnMiniLine : ""}`}>
            {n}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** 판 직접 채우기: 아래에서 숫자를 고르고 위 빈칸을 눌러 놓아요. 채운 칸을 누르면 비워져요 */
function FillBoard({ maxNumber, onSubmit }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [selected, setSelected] = useState(1);
  const used = new Set(draft);
  const filled = draft.filter((v) => v !== null).length;
  const board = finishDraft(draft);
  const pressCell = (cell) => {
    const value = draft[cell];
    if (value !== null) {
      setDraft(clearCell(draft, cell));
      setSelected(value);
      return;
    }
    if (selected === null) return;
    const next = placeNumber(draft, cell, selected);
    setDraft(next);
    setSelected(nextUnused(next, maxNumber));
  };
  return (
    <div className={styles.bnFill}>
      <p className={styles.bnFillTitle}>판을 채워 주세요</p>
      <p className={styles.bnFillGuide}>
        {filled}/{CELL_COUNT}칸 · 아래에서 숫자를 고르고 빈칸을 눌러요. 채운 칸을 누르면 비워져요.
      </p>
      <div className={styles.bnBoard} aria-label="채우는 판">
        {draft.map((v, cell) => (
          <button key={cell} type="button" className={`${styles.bnCell} ${v === null ? styles.bnEmpty : styles.bnFilled}`} onClick={() => pressCell(cell)} aria-label={v === null ? `${cell + 1}번째 빈칸` : `${v} (누르면 비워요)`}>
            {v ?? ""}
          </button>
        ))}
      </div>
      <p className={styles.bnSelected} role="status">
        {board ? "다 채웠어요!" : selected === null ? "놓을 숫자를 골라 주세요" : `놓을 숫자: ${selected}`}
      </p>
      <div className={styles.bnPalette}>
        {Array.from({ length: maxNumber }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className={`${styles.bnPal} ${n === selected ? styles.bnPalOn : ""}`} disabled={used.has(n) || Boolean(board)} onClick={() => setSelected(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className={styles.btns}>
        <button type="button" className={styles.btn} onClick={() => { setDraft(fillRemainingRandom(draft, maxNumber)); setSelected(null); }} disabled={Boolean(board)}>
          남은 칸 랜덤
        </button>
        <button type="button" className={styles.btn} onClick={() => { setDraft(emptyDraft()); setSelected(1); }} disabled={filled === 0}>
          모두 지우기
        </button>
      </div>
      <button type="button" className={`${styles.primary} ${styles.endlessStart}`} disabled={!board} onClick={() => board && onSubmit(board)}>
        완료
      </button>
    </div>
  );
}

/** "2줄!" · "BINGO!" 잠깐 띄우기 */
function useLineFx(view) {
  const [fx, setFx] = useState(null);
  const round = view?.match?.round;
  const roundNo = view?.match?.roundNumber ?? 0;
  const myLines = round?.lines[ME] ?? 0;
  const over = Boolean(round?.winners.length);
  const iWon = Boolean(round?.winners.includes(ME));
  const seen = useRef({ roundNo, myLines, over });
  useEffect(() => {
    const before = seen.current;
    seen.current = { roundNo, myLines, over };
    if (before.roundNo !== roundNo || view?.phase !== "playing") return;
    if (over && !before.over) setFx({ key: Date.now(), text: iWon ? "BINGO!" : "ROUND OVER", big: true, win: iWon });
    else if (myLines > before.myLines) setFx({ key: Date.now(), text: `${myLines}줄!`, big: false });
  }, [roundNo, myLines, over, iWon, view?.phase]);
  useEffect(() => {
    if (!fx) return;
    const t = setTimeout(() => setFx(null), fx.big ? 1600 : 1000);
    return () => clearTimeout(t);
  }, [fx]);
  return fx;
}

export default function BingoGame() {
  const topRef = useRef(null);
  const resultRef = useRef(null);
  const { room, start, send, act, stop } = useLocalRoom();
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [setup, setSetup] = useState(DEFAULT_SETUP);
  const [gameNo, setGameNo] = useState(0);
  const [roundNote, setRoundNote] = useState(null);
  const counted = useRef("");

  useEffect(() => {
    const r = loadRecord();
    setRecord(r);
    setSetup(r.setup);
  }, []);
  const toTop = () => requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));

  const view = room?.view;
  const match = view?.match;
  const round = match?.round;
  const playing = view?.phase === "playing" && Boolean(match) && Boolean(view?.myBoard);
  const roundOver = playing && round.winners.length > 0;
  const matchOver = roundOver && match.champions.length > 0;
  const { spinning, finishSpin } = useFirstSpin(playing && round.opening);
  const fx = useLineFx(view);

  /* 판·경기가 끝나면 기록(판마다 한 번) */
  useEffect(() => {
    if (!roundOver) return;
    const key = `${gameNo}-${match.roundNumber}`;
    if (counted.current === key) return;
    counted.current = key;
    const won = round.winners.includes(ME);
    const { newBest } = addRound(match.settings, won, round.called.length);
    setRoundNote({ key, newBest });
    if (matchOver) addMatch(match.champions.includes(ME));
    setRecord(loadRecord());
  }, [roundOver]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 끝나면 결과와 다음 버튼 쪽으로 내려가요(줄 완성 움직임을 본 뒤) */
  useEffect(() => {
    if (!roundOver) return;
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 900);
    return () => clearTimeout(t);
  }, [roundOver]);

  const changeSetup = (next) => {
    let merged = { ...setup, ...next };
    // 블랙빙고는 1~25로는 모두 동시에 끝나서 1~50으로 넓혀요(앱과 같아요)
    if (!isAllowedCombination(merged.maxNumber, merged.lineTarget)) merged = { ...merged, maxNumber: 50 };
    setSetup(merged);
    saveSetup(merged);
  };
  const begin = () => {
    const { bots, ...settings } = setup;
    const players = [ME, ...Array.from({ length: bots }, (_, i) => botIdOf(i + 1))];
    setGameNo((n) => n + 1);
    setRoundNote(null);
    start(bingoLogic, { ...settings, turnSeconds: 0 }, players);
    toTop();
  };
  const restart = () => {
    setGameNo((n) => n + 1);
    setRoundNote(null);
    send({ type: "restart" });
    toTop();
  };
  const next = () => {
    send({ type: "next" });
    toTop();
  };
  const leave = () => {
    const started = match && !matchOver && (round.called.length > 0 || Object.values(match.wins).some((w) => w > 0));
    if (started && !window.confirm("지금 나가면 이번 경기는 사라져요. 나갈까요?")) return;
    stop();
    setRecord(loadRecord());
  };

  /* ---------- 설정 고르기 ---------- */
  if (!room) {
    const best = record.fastest[fastestKey(setup)];
    return (
      <div className={styles.anchor} ref={topRef}>
        <section className={styles.stagesBox} aria-labelledby="bingo-title">
          <h2 id="bingo-title" className={styles.stagesTitle}>
            컴퓨터와 빙고
          </h2>
          <p className={styles.stagesLead}>
            {record.rounds ? `${record.rounds}판 중 ${record.roundWins}판 이겼어요${record.champions ? ` · 우승 ${record.champions}번` : ""}` : "번갈아 숫자를 부르고, 내 판에서 줄을 먼저 완성하면 이겨요"}
          </p>
          <Choice label="함께할 컴퓨터" options={BOT_COUNTS} value={setup.bots} onPick={(bots) => changeSetup({ bots })} text={(n) => `${n}명`} />
          <Choice label="숫자 범위" options={NUMBER_RANGES} value={setup.maxNumber} onPick={(maxNumber) => changeSetup({ maxNumber })} text={(n) => `1~${n}`} disabledOf={(n) => !isAllowedCombination(n, setup.lineTarget)} />
          <Choice label="빙고" options={LINE_TARGETS} value={setup.lineTarget} onPick={(lineTarget) => changeSetup({ lineTarget })} text={lineLabel} />
          <Choice label="우승 조건" options={WINS_TO_CHAMPION} value={setup.winsToChampion} onPick={(winsToChampion) => changeSetup({ winsToChampion })} text={(n) => `${n}승`} />
          <Choice label="판 채우기" options={FILL_MODES} value={setup.fillMode} onPick={(fillMode) => changeSetup({ fillMode })} text={(m) => (m === "manual" ? "직접" : "랜덤")} />
          <p className={styles.bnHint}>
            {setup.lineTarget === BLACKOUT
              ? "블랙빙고는 판 25칸을 모두 지우면 이겨요. 1~50부터 할 수 있어요."
              : setup.maxNumber === 25
                ? "1~25는 모두의 판에 같은 숫자가 있어서, 내가 부른 숫자가 컴퓨터 판에서도 지워져요."
                : `1~${setup.maxNumber} 중 25개만 판에 놓여서, 내 판에 없는 숫자가 불리기도 해요.`}
            {setup.fillMode === "manual" && " 판마다 원하는 자리에 숫자를 직접 놓아요."}
          </p>
          <button type="button" className={`${styles.primary} ${styles.endlessStart}`} onClick={begin}>
            시작하기
          </button>
          <p className={styles.starNote}>{best ? `이 설정 최단 빙고: 숫자 ${best}개 만에` : `${summary(setup)} · 컴퓨터 ${setup.bots}명`}</p>
        </section>
        <p className={styles.saveNote}>기록과 고른 설정은 이 기기의 브라우저에만 저장돼요.</p>
      </div>
    );
  }

  /* ---------- 판 준비(직접 채우기 / 컴퓨터가 판을 내는 중) ---------- */
  const top = (
    <div className={styles.slideTop}>
      <span className={styles.slideTitle}>{playing ? `ROUND ${match.roundNumber}` : "BINGO"}</span>
      <button type="button" className={styles.slideBack} onClick={leave}>
        {matchOver ? "설정 바꾸기" : "나가기"}
      </button>
    </div>
  );
  if (!playing) {
    const manual = view.settings.fillMode === "manual" && !view.myBoard;
    return (
      <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
        {top}
        <p className={styles.bnRules}>{summary(view.settings)}</p>
        {manual ? (
          <FillBoard key={view.dealId} maxNumber={view.settings.maxNumber} onSubmit={(board) => act((v) => submitBoard(v, board))} />
        ) : (
          <p className={styles.bbStatus} role="status">
            {view.settings.fillMode === "manual" ? "컴퓨터가 판을 채우는 중…" : "새 판을 준비하는 중이에요"}
          </p>
        )}
      </div>
    );
  }

  /* ---------- 판 ---------- */
  const myTurn = !roundOver && round.turn === ME;
  const iWon = round.winners.includes(ME);
  const status = roundOver
    ? iWon
      ? round.winners.length > 1
        ? "공동 승리!"
        : "이겼어요!"
      : `${joinNames(round.winners)} 승리!`
    : myTurn
      ? "내 차례! 부를 숫자를 골라요"
      : `${nameOf(round.turn)} 차례…`;
  const champTitle = matchOver ? (match.champions.includes(ME) ? (match.champions.length > 1 ? "🏆 공동 우승!" : "🏆 우승했어요!") : `${joinNames(match.champions)} 우승`) : null;
  const boards = room.game.boards || {};
  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      {top}
      <p className={styles.bnRules}>{summary(match.settings)}</p>
      <p className={`${styles.bbStatus} ${roundOver ? (iWon ? styles.bbStatusWin : styles.bbStatusLose) : myTurn ? "" : styles.bbStatusWait}`} role="status">
        {status}
      </p>
      <div className={styles.bnPlayers}>
        {match.players.map((id, i) => (
          <div key={id} className={`${styles.bnPlayer} ${!roundOver && round.turn === id ? styles.bnPlayerTurn : ""} ${round.winners.includes(id) ? styles.bnPlayerWon : ""}`} style={{ "--pc": PLAYER_COLORS[i % PLAYER_COLORS.length] }}>
            <b>{nameOf(id)}</b>
            <small>
              {round.lines[id] ?? 0}줄 · <em>{match.wins[id] ?? 0}승</em>
            </small>
          </div>
        ))}
      </div>
      <div className={styles.bnStage}>
        <BingoBoard board={view.myBoard} called={round.called} onPick={myTurn && !spinning ? (number) => send({ type: "pick", number }) : undefined} finished={roundOver} />
        {fx && (
          <span key={fx.key} className={`${styles.bnFx} ${fx.big ? styles.bnFxBig : ""} ${fx.win ? styles.bnFxWin : ""}`} aria-hidden="true">
            {fx.text}
          </span>
        )}
      </div>

      {roundOver ? (
        <div className={styles.slideResult} role="status" ref={resultRef}>
          <p className={styles.endTitle}>{champTitle ?? status}</p>
          <p className={styles.endText}>
            {matchOver ? `${match.roundNumber}판 · 내 승수 ${match.wins[ME] ?? 0}승` : `${match.settings.winsToChampion}승 먼저 우승 · 내 승수 ${match.wins[ME] ?? 0}승`}
            {iWon && ` · 숫자 ${round.called.length}개 만에 빙고`}
          </p>
          {iWon && roundNote?.newBest && <p className={styles.bnBest}>🎉 이 설정 최단 기록이에요!</p>}
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
                다음 판 · {nameOf(round.winners[0])}부터
              </button>
            )}
          </div>
          <div className={styles.bnMinis}>
            {match.players
              .filter((id) => id !== ME && boards[id])
              .map((id) => (
                <MiniBoard key={id} id={id} board={boards[id]} called={round.called} winner={round.winners.includes(id)} />
              ))}
          </div>
        </div>
      ) : (
        <div className={styles.bnCalledBox}>
          <span className={styles.bnCalledTitle}>불린 숫자 {round.called.length}개</span>
          <div className={styles.bnCalledList}>
            {round.called.length === 0 && <span className={styles.bnCalledEmpty}>아직 없어요</span>}
            {[...round.called].reverse().map((n, i) => (
              <span key={n} className={i === 0 ? styles.bnCalledNew : ""}>
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
      {spinning && <FirstPicker people={match.players.map((id) => ({ id, name: nameOf(id) }))} first={round.turn} seed={`${round.turn}-${view.dealId}`} onDone={finishSpin} />}
    </div>
  );
}
