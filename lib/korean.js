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
