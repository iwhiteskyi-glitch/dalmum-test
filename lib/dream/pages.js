// 꿈해몽 상세 페이지(/dream/[id])와 꿈 해몽 목록에 쓰는 도우미 — 서버에서만 씁니다.
import TEXTS from "./symbols.json";
import PAGES from "./pages.json";
import { PAGE_IDS, dreamHref, dreamPickHref } from "./pageIds";

export { PAGE_IDS, dreamHref, dreamPickHref };

const SYMBOL_BY_ID = Object.fromEntries(TEXTS.symbols.map((s) => [s.id, s]));
const CATEGORY_LABEL = Object.fromEntries(TEXTS.categories.map((c) => [c.id, c.label]));

/** 상세 페이지가 있으면 그 주소, 아직 없으면 선택 화면에 골라 둔 채로 여는 주소 */
export function symbolLink(id) {
  return PAGE_IDS.includes(id) ? dreamHref(id) : dreamPickHref(id);
}

export function dreamPage(id) {
  const page = PAGES[id];
  const symbol = SYMBOL_BY_ID[id];
  if (!page || !symbol) return null;
  return {
    ...symbol,
    categoryLabel: CATEGORY_LABEL[symbol.category],
    luckLabel: TEXTS.luckLabels[symbol.luck],
    page,
    related: page.related
      .map((rid) => SYMBOL_BY_ID[rid])
      .filter(Boolean)
      .map((s) => ({ id: s.id, label: s.label, keyword: s.keyword, href: symbolLink(s.id) })),
  };
}

/** 카테고리별로 묶은, 상세 페이지가 있는 상징 목록 */
export function dreamIndex() {
  return TEXTS.categories
    .map((c) => ({
      ...c,
      items: TEXTS.symbols
        .filter((s) => s.category === c.id && PAGE_IDS.includes(s.id))
        .map((s) => ({ id: s.id, name: PAGES[s.id].searchName, href: dreamHref(s.id) })),
    }))
    .filter((c) => c.items.length > 0);
}
