// 보강 초안(docs/adsense/보강초안/dream.json)의 readingTitle·reading·faq를 pages.json에 넣습니다.
// 실행: node scripts/dream/apply-boost.mjs [초안 경로]
import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2] || "docs/adsense/보강초안/dream.json";
const BOOST = JSON.parse(readFileSync(src, "utf8"));
const PAGES = JSON.parse(readFileSync("lib/dream/pages.json", "utf8"));
for (const [id, b] of Object.entries(BOOST)) {
  if (!PAGES[id]) throw new Error(`pages.json에 없는 id: ${id}`);
  // related 앞에 두어 화면 순서와 같게 맞춥니다
  const { related, ...rest } = PAGES[id];
  PAGES[id] = { ...rest, readingTitle: b.readingTitle, reading: b.reading, faq: b.faq, related };
}
writeFileSync("lib/dream/pages.json", JSON.stringify(PAGES, null, 2) + "\n");
console.log(`보강 ${Object.keys(BOOST).length}개 페이지 반영`);
