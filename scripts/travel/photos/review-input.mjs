// candidates.json → review-input.json (검토자에게 줄 목록). 사용: node scripts/travel/photos/review-input.mjs <나라>
import fs from "node:fs";
import path from "node:path";

const country = process.argv[2];
const ROOT = path.resolve(import.meta.dirname, "../../..");
const DIR = path.join(ROOT, "docs/travel/사진검토", country);
const c = JSON.parse(fs.readFileSync(path.join(DIR, "candidates.json"), "utf8"));

const byCity = {};
for (const [k, v] of Object.entries(c)) (byCity[v.city] ||= []).push([k, v]);

const out = [];
for (const [city, items] of Object.entries(byCity)) {
  items.forEach(([k, v], r) => {
    out.push({
      key: k,
      sheet: `sheet-${city}.png`,
      row: r + 1,
      name: v.name,
      kind: v.type === "a" ? "명소" : "음식",
      city: v.cityName,
      desc: v.desc,
      candidates: v.candidates.map((cd, i) => ({ label: `${r + 1}-${i}`, file: cd.file, commonsDesc: cd.desc })),
    });
  });
}
fs.writeFileSync(path.join(DIR, "review-input.json"), JSON.stringify(out, null, 1));
console.log(country, out.length, "항목,", out.reduce((n, o) => n + o.candidates.length, 0), "후보");
