// 검토용 모아보기: 도시마다 항목(행) × 후보 사진(열)을 한 장으로 붙여 docs/travel/사진검토/<나라>/sheet-<도시>.png 로 저장.
// 사용: node scripts/travel/photos/contact-sheets.mjs japan
// puppeteer-core가 프로젝트 의존성이 아니라서, 설치된 곳(NODE_PATH)을 지정해 실행합니다.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const country = process.argv[2];
const ROOT = path.resolve(import.meta.dirname, "../../..");
const DIR = path.join(ROOT, "docs/travel/사진검토", country);
const cands0 = JSON.parse(fs.readFileSync(path.join(DIR, "candidates.json"), "utf8"));
// 보강 모드: ONLY=<missing.json 경로>를 주면 사진이 없는 항목만 대상으로 하고 파일 이름 끝에 -add를 붙입니다.
const ONLY = process.env.ONLY ? JSON.parse(fs.readFileSync(process.env.ONLY, "utf8")) : null;
const SUF = ONLY ? "-add" : "";
const onlyKeys = (country) => (ONLY ? new Set((ONLY[country] || []).map((k) => `${country}/${k}`)) : null);
const keep = onlyKeys(country);
const cands = keep ? Object.fromEntries(Object.entries(cands0).filter(([k]) => keep.has(k))) : cands0;
const require = createRequire(path.join(process.env.PUPPETEER_DIR || ROOT, "noop.js"));
const puppeteer = require("puppeteer-core");

const byCity = {};
for (const [key, v] of Object.entries(cands)) (byCity[v.city] ||= []).push({ key, ...v });

const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--allow-file-access-from-files"] });
const p = await b.newPage();
await p.setViewport({ width: 1240, height: 800 });
for (const [city, items] of Object.entries(byCity)) {
  const rows = items.map((it, r) => `
    <div class="row"><div class="lab"><b>${r + 1}. ${it.name}</b><span>${it.type === "a" ? "명소" : "음식"} · ${it.cityName}</span></div>
    ${[0, 1, 2].map((c) => { const cd = it.candidates[c]; return cd ? `<div class="cell"><img src="data:image/webp;base64,${fs.readFileSync(path.join(DIR, cd.img)).toString("base64")}"><i>${r + 1}-${c}</i></div>` : `<div class="cell empty">후보 없음</div>`; }).join("")}
    </div>`).join("");
  await p.setContent(`<html><head><style>
    body{margin:0;font-family:"Malgun Gothic",sans-serif;background:#fff}
    .row{display:grid;grid-template-columns:180px repeat(3,340px);gap:8px;padding:8px;border-bottom:2px solid #ddd;align-items:center}
    .lab b{display:block;font-size:20px}.lab span{font-size:14px;color:#666}
    .cell{position:relative;height:230px;background:#eee;display:flex;align-items:center;justify-content:center}
    .cell img{max-width:100%;max-height:100%}
    .cell i{position:absolute;left:4px;top:4px;background:#000;color:#fff;font:bold 18px sans-serif;padding:2px 8px;font-style:normal}
    .empty{color:#999}
  </style></head><body>${rows}</body></html>`, { waitUntil: "load" });
  await p.screenshot({ path: path.join(DIR, `sheet-${city}${SUF}.png`), fullPage: true });
  console.log("sheet", city, items.length);
}
await b.close();
