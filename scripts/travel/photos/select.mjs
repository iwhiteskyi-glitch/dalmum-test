// 검토자 두 명(review1.json, review2.json)이 모두 OK한 후보 중 첫 번째를 골라
// public/travel/photos/<나라>/ 에 넣고 lib/travel/photos.json 에 출처·라이선스를 기록합니다.
// 사용: node scripts/travel/photos/select.mjs japan
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const country = process.argv[2];
const ROOT = path.resolve(import.meta.dirname, "../../..");
const DIR = path.join(ROOT, "docs/travel/사진검토", country);
const read = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
// 보강 모드: ONLY=<missing.json 경로>를 주면 사진이 없는 항목만 대상으로 하고 파일 이름 끝에 -add를 붙입니다.
const ONLY = process.env.ONLY ? JSON.parse(fs.readFileSync(process.env.ONLY, "utf8")) : null;
const SUF = ONLY ? "-add" : "";
const cands = read("candidates.json");
const input = read(`review-input${SUF}.json`);
const r1 = read(`review1${SUF}.json`);
const r2 = read(`review2${SUF}.json`);
const PUB = path.join(ROOT, "public/travel/photos", country);
fs.mkdirSync(PUB, { recursive: true });
const DB = path.join(ROOT, "lib/travel/photos.json");
const db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, "utf8")) : {};

// 위키미디어 작가 칸의 자동 문구·사용자 문서 접두어를 걷어 사람 이름만 남깁니다.
function cleanAuthor(s) {
  let a = s.replace(/^No machine-readable author provided\.\s*(.+?)\s+assumed.*$/i, "$1");
  a = a.replace(/\b(w:[a-z-]+:)?(User|利用者|사용자|Benutzer|Utilisateur|Usuario):/gi, "").replace(/^w:[a-z-]+:/i, "");
  a = a.replace(/\s*\(talk\)|\s*\(토론\)/gi, "").trim();
  return a.length > 60 ? a.slice(0, 57) + "…" : a || "작자 미상";
}

if (!ONLY) for (const k of Object.keys(db)) if (k.startsWith(`${country}/`)) delete db[k];
const report = [];
for (const item of input) {
  const c = cands[item.key];
  const pick = item.candidates.findIndex((cd) => r1[item.key]?.[cd.label]?.verdict === "OK" && r2[item.key]?.[cd.label]?.verdict === "OK");
  if (pick < 0) {
    report.push(`- ${item.city} ${item.name}: 사진 없음`);
    continue;
  }
  const cd = c.candidates[pick];
  const idx = cd.img.match(/-([af]\d)-\d+\.webp$/)[1];
  const file = `${c.city}-${idx}.webp`;
  const out = path.join(PUB, file);
  const info = await sharp(path.join(DIR, cd.img)).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 68 }).toFile(out);
  db[item.key] = {
    src: `/travel/photos/${country}/${file}`,
    w: info.width,
    h: info.height,
    author: cleanAuthor(cd.author),
    license: cd.license,
    licenseUrl: cd.licenseUrl,
    page: cd.page,
  };
  report.push(`- ${item.city} ${item.name}: ${item.candidates[pick].label} (${cd.file})`);
}
const sorted = Object.fromEntries(Object.entries(db).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(DB, JSON.stringify(sorted, null, 1) + "\n");
fs.writeFileSync(path.join(DIR, `selected${SUF}.md`), `# ${country} 사진 선택 결과\n\n${report.join("\n")}\n`);
const got = report.filter((l) => !l.endsWith("사진 없음")).length;
console.log(`${country}: ${got}/${input.length}개 항목에 사진`);
console.log(report.filter((l) => l.endsWith("사진 없음")).join("\n"));
