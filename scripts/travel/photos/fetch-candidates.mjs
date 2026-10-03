// 도시 페이지 명소·음식 사진 후보 모으기 (나라 하나씩).
// 사용: node scripts/travel/photos/fetch-candidates.mjs japan
// 위키백과 문서의 대표 사진 + 위키미디어 공용 검색 결과에서, 공용에 올라 있고 자유 이용 라이선스
// (CC0·퍼블릭 도메인·CC BY·CC BY-SA)인 사진만 후보로 받아 작게 줄여 둡니다.
// 결과: docs/travel/사진검토/<나라>/candidates.json + 후보 이미지(검토용, git 미포함)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const country = process.argv[2];
if (!country) throw new Error("나라 코드를 넣어 주세요. 예: japan");
const ROOT = path.resolve(import.meta.dirname, "../../..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/travel/data", `${country}.json`), "utf8"));
const OUT = path.join(ROOT, "docs/travel/사진검토", country);
fs.mkdirSync(OUT, { recursive: true });

const UA = "jaemirobom-travel-photos/1.0 (https://www.jaemirobom.com; iwhiteskyi@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res.json();
    await sleep(1500 * (i + 1));
  }
  throw new Error("API 실패: " + url);
}

const OK_LICENSE = /^(cc0|public domain|pd\b|pd-|cc[ -]by(-sa)?([ -]\d(\.\d)?)?\b)/i;
const stripHtml = (s = "") => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function pageImages(host, search, limit = 2) {
  const j = await api(host, { action: "query", generator: "search", gsrsearch: search, gsrlimit: String(limit), gsrnamespace: "0", prop: "pageimages|langlinks", piprop: "name", lllang: "en" });
  const pages = (j.query?.pages || []).sort((a, b) => a.index - b.index);
  return pages.map((p) => ({ title: p.title, image: p.pageimage, en: p.langlinks?.[0]?.title }));
}
async function enImageOf(title) {
  const j = await api("en.wikipedia.org", { action: "query", titles: title, prop: "pageimages", piprop: "name" });
  return j.query?.pages?.[0]?.pageimage;
}
async function commonsSearch(search, limit = 3) {
  const j = await api("commons.wikimedia.org", { action: "query", list: "search", srsearch: `${search} filetype:bitmap`, srnamespace: "6", srlimit: String(limit) });
  return (j.query?.search || []).map((s) => s.title.replace(/^File:/, ""));
}
async function fileInfo(name) {
  const j = await api("commons.wikimedia.org", { action: "query", titles: `File:${name}`, prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiurlwidth: "960" });
  const p = j.query?.pages?.[0];
  if (!p || p.missing) return null; // 공용에 없음 = 위키백과 자체 비자유 사진 → 제외
  const ii = p.imageinfo?.[0];
  if (!ii || !/image\/(jpeg|png|webp)/.test(ii.mime)) return null;
  const m = ii.extmetadata || {};
  const license = m.LicenseShortName?.value || "";
  if (!OK_LICENSE.test(license) || /non-free|fair use/i.test(m.UsageTerms?.value || "")) return { rejected: `license:${license}` };
  return {
    file: name,
    page: ii.descriptionurl,
    thumb: ii.thumburl,
    author: stripHtml(m.Artist?.value) || "작자 미상",
    license,
    licenseUrl: m.LicenseUrl?.value || "",
    desc: stripHtml(m.ImageDescription?.value).slice(0, 200),
  };
}

const prev = fs.existsSync(path.join(OUT, "candidates.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "candidates.json"), "utf8")) : {};
// 자동 검색이 엉뚱한 문서로 가는 항목은 queries.json에 { "<키>": "정확한 영어 검색어" }로 적어 두면
// 그 검색어로 다시 찾습니다(기존 후보는 버림).
const QFILE = path.join(OUT, "queries.json");
const overrides = fs.existsSync(QFILE) ? JSON.parse(fs.readFileSync(QFILE, "utf8")) : {};
const result = { ...prev };
for (const k of Object.keys(overrides)) if (result[k] && result[k].query !== overrides[k]) delete result[k];
for (const city of data.cities) {
  const items = [
    ...city.attractions.map((a, i) => ({ type: "a", i, name: a.name, desc: a.one_line_desc, q: a.map_query })),
    ...city.foods.map((f, i) => ({ type: "f", i, name: f.name, desc: f.one_line_desc })),
  ];
  for (const it of items) {
    const key = `${country}/${city.city_code}/${it.type}/${it.name}`;
    if (result[key]?.candidates?.length) continue;
    const names = [];
    const seen = new Set();
    const add = (n, via) => { if (n && !seen.has(n)) { seen.add(n); names.push({ n, via }); } };
    const override = overrides[key];
    try {
      if (override) {
        for (const p of await pageImages("en.wikipedia.org", override, 1)) add(p.image, `en:${p.title}`);
        for (const n of await commonsSearch(override, 3)) add(n, "commons");
      } else if (it.type === "a") {
        for (const p of await pageImages("en.wikipedia.org", it.q, 1)) add(p.image, `en:${p.title}`);
        for (const n of await commonsSearch(it.q, 3)) add(n, "commons");
      } else {
        const ko = await pageImages("ko.wikipedia.org", it.name, 1);
        for (const p of ko) {
          add(p.image, `ko:${p.title}`);
          if (p.en) add(await enImageOf(p.en), `en:${p.en}`);
        }
        const q = ko[0]?.en || `${it.name} ${city.city_name}`;
        for (const n of await commonsSearch(q, 3)) add(n, "commons");
      }
    } catch (e) {
      console.log("검색 실패", key, e.message);
    }
    const candidates = [];
    for (const { n, via } of names) {
      const info = await fileInfo(n).catch(() => null);
      if (!info || info.rejected) continue;
      const img = `${city.city_code}-${it.type}${it.i}-${candidates.length}.webp`;
      try {
        const buf = Buffer.from(await (await fetch(info.thumb, { headers: { "User-Agent": UA } })).arrayBuffer());
        const meta = await sharp(buf).metadata();
        await sharp(buf).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 70 }).toFile(path.join(OUT, img));
        candidates.push({ ...info, via, img, w: meta.width, h: meta.height });
      } catch (e) {
        console.log("다운로드 실패", n, e.message);
      }
      if (candidates.length >= 3) break;
      await sleep(200);
    }
    result[key] = { country, city: city.city_code, cityName: city.city_name, type: it.type, name: it.name, desc: it.desc, query: override, candidates };
    console.log(key, "후보", candidates.length, candidates.map((c) => c.via).join(" | "));
    fs.writeFileSync(path.join(OUT, "candidates.json"), JSON.stringify(result, null, 1));
  }
}
console.log("완료", Object.keys(result).length);
