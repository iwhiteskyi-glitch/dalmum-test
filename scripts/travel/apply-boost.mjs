// 보강 초안(docs/adsense/보강초안/travel.json)을 나라 데이터에 넣습니다.
// extra는 country.extras에 같은 key가 있으면 바꾸고 없으면 뒤에 붙이고, name_note가 있으면 바꿉니다.
// 실행: node scripts/travel/apply-boost.mjs [초안 경로]
import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2] || "docs/adsense/보강초안/travel.json";
const BOOST = JSON.parse(readFileSync(src, "utf8"));
for (const [code, b] of Object.entries(BOOST)) {
  const file = `lib/travel/data/${code}.json`;
  const data = JSON.parse(readFileSync(file, "utf8"));
  const c = data.country;
  if (b.name_note) c.name_note = b.name_note;
  if (b.extra) {
    const extras = (c.extras ||= []);
    const i = extras.findIndex((e) => e.key === b.extra.key);
    if (i >= 0) extras[i] = b.extra;
    else extras.push(b.extra);
  }
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}
console.log(`보강 ${Object.keys(BOOST).length}개 나라 반영`);
