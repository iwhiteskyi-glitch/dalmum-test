/**
 * 꿈해몽 결과를 주소의 "#" 뒤에 담아, 링크를 받은 사람이 다시 고르지 않아도 같은 결과를
 * 바로 보게 합니다. "#" 뒷부분은 서버로 전송되지 않아 어디에도 기록되지 않습니다.
 *
 * 담는 것은 고른 상징의 id뿐입니다(예: `#d1.snake-water-teeth`). 사진이나 생년월일처럼
 * 민감하지는 않지만, 다른 코너와 같은 원칙으로 서버에는 저장하지 않습니다.
 *
 * id는 배열 순서(숫자)가 아니라 문자열 이름으로 저장합니다 — 나중에 상징이 추가되거나
 * symbols.json의 순서가 바뀌어도 예전에 공유된 링크가 깨지지 않도록 하기 위해서입니다.
 */
import { isValidSelection } from "./select.js";

const DREAM_KEY = "d1";

/** 고른 상징 id 배열을 짧은 링크로 바꿉니다. */
export function encodeDreamLink(ids) {
  return `#${DREAM_KEY}.${ids.join("-")}`;
}

/** 링크를 상징 id 배열로 되돌립니다. 형식이 조금이라도 어긋나면 null(= 무시하고 보통 화면). */
export function decodeDreamLink(hash) {
  if (!hash || !hash.startsWith(`#${DREAM_KEY}.`)) return null;
  const ids = hash.slice(DREAM_KEY.length + 2).split("-");
  return isValidSelection(ids) ? ids : null;
}
