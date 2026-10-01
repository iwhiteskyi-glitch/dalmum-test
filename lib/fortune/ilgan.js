// 일간 10종 소개 페이지(/fortune/ilgan/[slug])에 쓰는 목록과 도우미
import TEXTS from "./texts.json";
import PAGES from "./ilganPages.json";
import { STEMS, STEMS_HANJA, ELEMENTS, STEM_ELEMENT } from "./saju";

export const ILGAN_SLUGS = ["gap", "eul", "byeong", "jeong", "mu", "gi", "gyeong", "sin", "im", "gye"];

/** stem 번호(0 갑 … 9 계) → 페이지에 필요한 내용 한 묶음 */
export function ilganInfo(stem) {
  // texts.json의 ilgan 항목에도 stem 필드(글자, 예: "갑")가 있어서, 숫자 번호를 덮어쓰지 않도록
  // 글자 쪽은 꺼내 쓰지 않고 뺍니다.
  const { stem: _ignore, ...t } = TEXTS.ilgan[stem];
  const page = PAGES.pages[stem];
  return {
    stem,
    slug: ILGAN_SLUGS[stem],
    ko: STEMS[stem],
    hanja: STEMS_HANJA[stem],
    element: ELEMENTS[STEM_ELEMENT[stem]],
    elementIndex: STEM_ELEMENT[stem],
    yinyang: stem % 2 === 0 ? "양" : "음",
    name: `${STEMS[stem]}${ELEMENTS[STEM_ELEMENT[stem]]}`, // 예: 갑목
    ...t,
    page,
  };
}

export function ilganBySlug(slug) {
  const i = ILGAN_SLUGS.indexOf(slug);
  return i < 0 ? null : ilganInfo(i);
}

export function ilganHref(stem) {
  return `/fortune/ilgan/${ILGAN_SLUGS[stem]}`;
}
