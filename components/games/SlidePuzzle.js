"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./games.module.css";
import { dailyBoard, EMPTY, formatTime, isSolved, neighborFor, PICTURE_COUNT, pictureUrl, shuffledBoard, SIZES, slideAt } from "@/lib/games/slide/slide";
import { dailyStatus, loadBest, recordKey, saveBest, saveDaily } from "@/lib/games/slide/record";

// 슬라이드 퍼즐 화면(비행기오락실 앱의 혼자 하기를 웹으로 옮겼어요).
// 오늘의 판이나 칸 수 고르기 → 풀기(첫 조각을 누르면 시간이 흘러요) → 다 맞추면 반짝이는 마지막 조각을 끼워야 끝.
// 컴퓨터 상대가 없어서 GameShell을 쓰지 않아요. 클릭·터치와 방향키로 둘 다 풀 수 있어요.

const MODES = [
  { picture: false, numbers: false, label: "숫자", hint: "1, 2, 3… 순서대로 맞춰요" },
  { picture: true, numbers: true, label: "그림+번호", hint: "그림 구석의 번호가 도와줘요" },
  { picture: true, numbers: false, label: "그림", hint: "그림만 보고 맞춰요 (가장 어려움)" },
];

/** 칸 수 목록의 작은 판 그림 */
function MiniGrid({ size }) {
  return (
    <span className={styles.slideMini} style={{ "--n": size }} aria-hidden="true">
      {Array.from({ length: size * size - 1 }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

/** 푸는 동안만 0.1초마다 바뀌는 시계. 판 전체가 다시 그려지지 않게 따로 뒀어요 */
function Clock({ startedAt, stoppedMs }) {
  const [now, setNow] = useState(0);
  const running = Boolean(startedAt) && stoppedMs === null;
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [running]);
  const ms = stoppedMs ?? (startedAt && now ? Math.max(0, now - startedAt) : 0);
  return <p className={styles.slideClock}>⏱ {formatTime(ms)}</p>;
}

/** 조각 얼굴: 숫자, 또는 그림에서 제자리(value-1) 몫 */
function Face({ value, size, picture, numbers, home }) {
  const at = value - 1;
  const style =
    picture === null
      ? undefined
      : {
          backgroundImage: `url(${pictureUrl(picture)})`,
          backgroundSize: `${size * 100}%`,
          backgroundPosition: `${((at % size) / (size - 1)) * 100}% ${(Math.floor(at / size) / (size - 1)) * 100}%`,
        };
  const cls = [styles.slideFace, picture === null ? "" : styles.slideFacePic, home ? styles.slideHome : ""].join(" ");
  return (
    <span className={cls} style={style}>
      {picture === null ? value : numbers ? <small className={styles.slideBadge}>{value}</small> : null}
    </span>
  );
}

function Board({ play, onTile, onLast, peek }) {
  const { board, picture, numbers, done } = play;
  const { size, cells } = board;
  const lastValue = size * size;
  const where = new Map(cells.map((v, i) => [v, i]));
  const at = (i) => ({ transform: `translate(${(i % size) * 100}%, ${Math.floor(i / size) * 100}%)` });
  const lastState = !done ? "waiting" : done.placed ? "placed" : "ready";
  const press = (fn) => ({
    onPointerDown: (e) => {
      if (e.button === 0) fn();
    },
    // 키보드(Tab + Enter)로 누를 때만 click으로 받아요. 마우스·터치는 위에서 벌써 움직였어요
    onClick: (e) => {
      if (e.detail === 0) fn();
    },
  });
  const tiles = [];
  for (let value = 1; value < lastValue; value++) tiles.push(value);
  return (
    <div className={styles.slideBoard} style={{ "--n": size }} onContextMenu={(e) => e.preventDefault()}>
      <div className={styles.slideFrame} />
      {lastState !== "placed" && <div className={styles.slideSlot} style={at(lastValue - 1 + size)} />}
      {tiles.map((value) => {
        const i = where.get(value);
        return (
          <button key={value} type="button" className={styles.slideTile} style={at(i)} disabled={Boolean(done)} aria-label={`${value}번 조각`} {...press(() => onTile(i))}>
            <Face value={value} size={size} picture={picture} numbers={numbers} home={i === value - 1} />
          </button>
        );
      })}
      <button
        type="button"
        className={`${styles.slideTile} ${styles[`slideLast_${lastState}`]}`}
        style={at(lastState === "placed" ? lastValue - 1 : lastValue - 1 + size)}
        disabled={lastState !== "ready"}
        aria-label="마지막 조각 끼우기"
        {...press(onLast)}
      >
        <Face value={lastValue} size={size} picture={picture} numbers={numbers} home={lastState === "placed"} />
      </button>
      {lastState === "placed" && picture !== null && <div className={styles.slideWhole} style={{ backgroundImage: `url(${pictureUrl(picture)})` }} />}
      {peek && !done && (
        <div className={styles.slidePeek} style={picture === null ? undefined : { backgroundImage: `url(${pictureUrl(picture)})` }}>
          {picture === null && Array.from({ length: lastValue }, (_, i) => <span key={i}>{i + 1}</span>)}
        </div>
      )}
    </div>
  );
}

export default function SlidePuzzle() {
  const topRef = useRef(null);
  const roundRef = useRef(0); // 새로 섞을 때마다 1씩(판이 움직임 없이 바로 바뀌게)
  const [modeIndex, setModeIndex] = useState(0);
  const [play, setPlay] = useState(null);
  const [peek, setPeek] = useState(false);
  const [best, setBest] = useState({});
  const [daily, setDaily] = useState(null);
  const mode = MODES[modeIndex];

  const refresh = () => {
    setBest(loadBest());
    setDaily(dailyStatus());
  };
  useEffect(refresh, []);

  const open = (next) => {
    roundRef.current += 1;
    setPlay({ ...next, round: roundRef.current, startedAt: null, done: null });
    setPeek(false);
    if (next.picture !== null) new window.Image().src = pictureUrl(next.picture); // 첫 조각을 누르기 전에 그림을 받아 둬요
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  };
  const pickPicture = (before) => {
    const n = Math.floor(Math.random() * (before === null ? PICTURE_COUNT : PICTURE_COUNT - 1));
    return before !== null && n >= before ? n + 1 : n; // 바로 전 그림은 피해요
  };
  const startSize = (size, m = mode, before = null) =>
    open({ board: shuffledBoard(size), picture: m.picture ? pickPicture(before) : null, numbers: m.numbers, daily: null });
  const startDaily = () => {
    const key = dailyStatus().today;
    open({ ...dailyBoard(key), numbers: true, daily: key }); // 오늘의 판은 늘 그림+번호
  };

  const leave = () => {
    if (play?.startedAt && !play.done?.placed && !window.confirm("지금 나가면 이번 판 시간은 남지 않아요. 나갈까요?")) return;
    setPlay(null);
    refresh();
  };

  const tile = (index) => {
    if (!play || play.done) return;
    const next = slideAt(play.board, index);
    if (!next) return;
    const startedAt = play.startedAt ?? Date.now();
    // 다 맞췄어도 시간은 마지막 조각을 끼울 때 멈춰요
    setPlay({ ...play, board: next, startedAt, done: isSolved(next) ? { placed: false, ms: null, newBest: false } : null });
  };
  const placeLast = () => {
    if (!play?.done || play.done.placed) return;
    const ms = Date.now() - play.startedAt;
    const newBest = play.daily ? saveDaily(play.daily, ms) : saveBest(recordKey(play.board.size, play.picture !== null, play.numbers), ms);
    setPlay({ ...play, done: { placed: true, ms, newBest } });
    refresh();
  };

  // 방향키: 조각이 그 방향으로 빈칸에 들어가요. 다 맞춘 뒤에는 ↑ 또는 Enter로 마지막 조각을 끼워요
  const keys = useRef(null);
  keys.current = (e) => {
    if (!play || play.done?.placed) return;
    if (play.done) {
      if (e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        placeLast();
      }
      return;
    }
    if (!e.key.startsWith("Arrow")) return;
    e.preventDefault();
    tile(neighborFor(play.board, e.key));
  };
  const playing = Boolean(play);
  useEffect(() => {
    if (!playing) return;
    const onKey = (e) => keys.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  if (!play) {
    return (
      <div className={styles.anchor} ref={topRef}>
        <button type="button" className={styles.slideDaily} onClick={startDaily}>
          <span>
            <strong>오늘의 판</strong>
            <small>
              {daily?.done
                ? `오늘 ⏱ ${formatTime(daily.done.ms)}${daily.streak > 1 ? ` · ${daily.streak}일 연속` : ""}`
                : "자정마다 바뀌는 그림 한 장, 모두 같은 판이에요"}
            </small>
          </span>
          <span className={styles.gameGo} aria-hidden="true">
            ›
          </span>
        </button>

        <div className={styles.tabs} role="group" aria-label="조각 종류">
          {MODES.map((m, i) => (
            <button key={m.label} type="button" className={`${styles.tab} ${i === modeIndex ? styles.slideTabOn : ""}`} aria-pressed={i === modeIndex} onClick={() => setModeIndex(i)}>
              {m.label}
            </button>
          ))}
        </div>
        <p className={styles.slideHint}>{mode.hint}</p>

        <ul className={styles.gameList}>
          {SIZES.map(({ size, level }) => {
            const record = best[recordKey(size, mode.picture, mode.numbers)];
            return (
              <li key={size}>
                <button type="button" className={`${styles.gameItem} ${styles.slideSize}`} onClick={() => startSize(size)}>
                  <MiniGrid size={size} />
                  <span className={styles.slideSizeText}>
                    <strong>
                      {size}×{size}
                    </strong>
                    <small>{level}</small>
                  </span>
                  <span className={styles.slideBest}>{record ? `⏱ ${formatTime(record.ms)}` : "기록 없음"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const { done, startedAt, board } = play;
  const record = play.daily ? daily?.done : best[recordKey(board.size, play.picture !== null, play.numbers)];
  const hint = done
    ? done.placed
      ? "완성했어요!"
      : "반짝이는 마지막 조각을 눌러 끼워요"
    : startedAt
      ? record
        ? `최고 기록 ${formatTime(record.ms)}`
        : "기록 없음"
      : "조각을 누르면 시간이 흘러요";

  return (
    <div className={`${styles.anchor} ${styles.slidePlay}`} ref={topRef}>
      <div className={styles.slideTop}>
        <span className={styles.slideTitle}>
          {play.daily ? "오늘의 판" : "슬라이드 퍼즐"} {board.size}×{board.size}
        </span>
        <button type="button" className={styles.slideBack} onClick={leave}>
          {play.daily ? "나가기" : "칸 수 고르기"}
        </button>
      </div>
      <Clock startedAt={startedAt} stoppedMs={done?.placed ? done.ms : null} />
      <p className={styles.slideHint}>{hint}</p>
      <Board key={play.round} play={play} onTile={tile} onLast={placeLast} peek={peek} />
      {!done && (
        <button
          type="button"
          className={`${styles.btn} ${styles.slidePeekBtn}`}
          onPointerDown={() => setPeek(true)}
          onPointerUp={() => setPeek(false)}
          onPointerLeave={() => setPeek(false)}
          onPointerCancel={() => setPeek(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          🔍 꾹 눌러 완성 모습 보기
        </button>
      )}
      {done?.placed && (
        <div className={styles.slideResult}>
          <p className={styles.endTitle}>⏱ {formatTime(done.ms)}</p>
          {done.newBest && <p className={styles.endText}>최고 기록이에요!</p>}
          <div className={styles.btns}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => (play.daily ? startDaily() : startSize(board.size, { picture: play.picture !== null, numbers: play.numbers }, play.picture))}
            >
              다시 하기
            </button>
            <button type="button" className={styles.btn} onClick={leave}>
              {play.daily ? "나가기" : "칸 수 고르기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
