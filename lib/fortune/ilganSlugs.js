// 일간 10종의 주소 조각. 소개 글(ilganPages.json)이 함께 딸려오지 않도록 링크 만들기만 따로 뒀습니다.
export const ILGAN_SLUGS = ["gap", "eul", "byeong", "jeong", "mu", "gi", "gyeong", "sin", "im", "gye"];

export function ilganHref(stem) {
  return `/fortune/ilgan/${ILGAN_SLUGS[stem]}`;
}
