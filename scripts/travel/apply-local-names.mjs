// 도시 '현지어로는?' 표기를 여행 데이터(lib/travel/data/<나라>.json)의 city.local_name에 넣어요.
// 원고: docs/travel/현지어/확정.json (초안 → 독립 검토 2명 → 확정). 다시 돌려도 같은 결과예요.
// 실행: node scripts/travel/apply-local-names.mjs
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "docs/travel/현지어/확정.json";
const draft = JSON.parse(readFileSync(SRC, "utf8"));
let count = 0;
const missing = [];

for (const [country, cities] of Object.entries(draft)) {
  if (country.startsWith("_")) continue;
  const path = `lib/travel/data/${country}.json`;
  const before = readFileSync(path, "utf8");
  const data = JSON.parse(before);
  data.cities = data.cities.map((city) => {
    const local = cities[city.city_code];
    if (!local) {
      missing.push(`${country}/${city.city_code}`);
      return city;
    }
    if (!Array.isArray(local.names) || !local.names.every((n) => n.lang && n.text)) {
      throw new Error(`${country}/${city.city_code}: names 모양이 이상해요`);
    }
    count++;
    // city_name 바로 뒤에 두어 데이터 파일에서 찾기 쉽게 해요
    const { local_name: _old, ...rest } = city;
    const out = {};
    for (const [k, v] of Object.entries(rest)) {
      out[k] = v;
      if (k === "city_name") out.local_name = local;
    }
    return out;
  });
  const after = JSON.stringify(data, null, 2) + "\n";
  if (after !== before) writeFileSync(path, after);
}

console.log(`현지어 표기 ${count}곳 반영`);
if (missing.length) {
  console.log(`빠진 도시: ${missing.join(", ")}`);
  process.exitCode = 1;
}
