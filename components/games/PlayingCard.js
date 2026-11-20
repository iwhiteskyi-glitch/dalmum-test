"use client";

import styles from "./games.module.css";
import { BLACK_JOKER, COLOR_JOKER, isJoker, rankOf, suitOf } from "@/lib/games/onecard/cards";

// 카드 한 장(원카드·도둑잡기 같이 써요): 밝은 바탕에 숫자와 무늬. 조커는 그림이고, 흑백 조커는 바탕도 어두워요.
// 무늬 글자 끝의 FE0E는 폰이 이모지로 바꿔 그리지 않게 하는 표시예요.

export const SUIT_MARKS = { S: "♠︎", H: "♥︎", D: "♦︎", C: "♣︎" };
export const SUIT_NAMES = { S: "스페이드", H: "하트", D: "다이아", C: "클로버" };
export const isRedSuit = (suit) => suit === "H" || suit === "D";
const JOKER_IMAGES = { [COLOR_JOKER]: "/games/cards/joker-color.webp", [BLACK_JOKER]: "/games/cards/joker-black.webp" };
const RANK_NAMES = { A: "에이스", J: "잭", Q: "퀸", K: "킹" };

/** 읽어 주는 이름: "하트 7", "컬러 조커" */
export const cardName = (card) =>
  card === COLOR_JOKER ? "컬러 조커" : card === BLACK_JOKER ? "흑백 조커" : `${SUIT_NAMES[suitOf(card)]} ${RANK_NAMES[rankOf(card)] ?? rankOf(card)}`;

/**
 * size: "hand"(내 패) · "table"(탁자) · "mini"(결과에 늘어놓기)
 * can: 지금 낼 수 있음(노란 테두리) · dim: 지금 못 냄(흐리게) · fresh: 방금 받은 카드 · onClick이 있으면 단추
 */
export function CardFace({ card, size = "hand", can = false, dim = false, fresh = false, onClick, className = "", style }) {
  const joker = isJoker(card);
  const cls = `${styles.pc} ${styles[`pc_${size}`]} ${card === BLACK_JOKER ? styles.pcDark : ""} ${!joker && isRedSuit(suitOf(card)) ? styles.pcRed : ""} ${can ? styles.pcCan : ""} ${dim ? styles.pcDim : ""} ${fresh ? styles.pcFresh : ""} ${className}`;
  const inner = joker ? (
    <img src={JOKER_IMAGES[card]} alt="" className={styles.pcJoker} draggable="false" />
  ) : (
    <>
      <b>{rankOf(card)}</b>
      <i>{SUIT_MARKS[suitOf(card)]}</i>
    </>
  );
  if (onClick)
    return (
      <button type="button" className={cls} style={style} onClick={onClick} aria-label={cardName(card)}>
        {inner}
      </button>
    );
  return (
    <span className={cls} style={style} role="img" aria-label={cardName(card)}>
      {inner}
    </span>
  );
}

/** 뒷면. count가 있으면 가운데에 남은 장수 */
export function CardBack({ size = "table", count, className = "" }) {
  return (
    <span className={`${styles.pc} ${styles[`pc_${size}`]} ${styles.pcBack} ${className}`} aria-hidden="true">
      {count !== undefined && <b>{count}</b>}
    </span>
  );
}
