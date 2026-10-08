// 한글 조사(은/는, 이/가, 을/를) 자동 선택. 받침 있으면 앞엣것, 없으면 뒤엣것.
export function hasBatchim(word) {
  const ch = word.charCodeAt(word.length - 1) - 0xac00;
  if (ch < 0 || ch > 11171) return true; // 한글이 아니면(영문·숫자 등) 받침 있는 쪽으로 가정
  return ch % 28 !== 0;
}

export function eunNeun(word) {
  return hasBatchim(word) ? "은" : "는";
}
export function iGa(word) {
  return hasBatchim(word) ? "이" : "가";
}
export function eulReul(word) {
  return hasBatchim(word) ? "을" : "를";
}
export function gwaWa(word) {
  return hasBatchim(word) ? "과" : "와";
}
/** (으)로: 받침이 없거나 ㄹ 받침이면 "로", 그 밖의 받침이면 "으로" */
export function euro(word) {
  const ch = word.charCodeAt(word.length - 1) - 0xac00;
  if (ch < 0 || ch > 11171) return "으로";
  const jong = ch % 28;
  return jong === 0 || jong === 8 ? "로" : "으로";
}
