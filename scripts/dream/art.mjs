// 꿈해몽 그림 원본(docs/dream/그림원본/*.png)을 사이트용 webp로 줄입니다.
// 파일 이름 앞의 번호("1-snake.png")는 떼고 상징 id로 저장합니다 → public/dream/art/<id>.webp
// 장면 고르기 칸에 쓰는 작은 그림도 함께 만듭니다 → public/dream/art/s/<id>.webp
// 실행: node scripts/dream/art.mjs          → 큰 그림 + 작은 그림
//       node scripts/dream/art.mjs --thumbs → 작은 그림만(큰 그림은 그대로 둠)
import { readdirSync, mkdirSync, readFileSync, statSync } from "node:fs";
import sharp from "sharp";

const SRC = "docs/dream/그림원본";
const OUT = "public/dream/art";
const OUT_THUMB = "public/dream/art/s";
const SIZE = 512;
const THUMB = 160; // 화면에선 64~80px — 고해상도 화면(2배)까지 또렷하게
const thumbsOnly = process.argv.includes("--thumbs");
const ids = new Set(JSON.parse(readFileSync("lib/dream/symbols.json", "utf8")).symbols.map((s) => s.id));

// 색을 칠한 그림으로 나와 다른 그림과 안 어울리는 것 — 밝기만 남겨 남색→금색으로 다시 칠합니다.
// 금빛 선화로 다시 그려 넣으면 여기서 빼면 됩니다.
const RECOLOR = new Set(["whale", "lion", "fox", "wolf", "rice", "bath", "church"]);
const STOPS = [[0, [18, 26, 56]], [90, [40, 50, 90]], [170, [190, 150, 80]], [255, [250, 225, 160]]];
const LUT = Array.from({ length: 256 }, (_, v) => {
  for (let i = 1; i < STOPS.length; i++) {
    const [a, ca] = STOPS[i - 1];
    const [b, cb] = STOPS[i];
    if (v <= b) return ca.map((x, k) => Math.round(x + ((cb[k] - x) * (v - a)) / (b - a)));
  }
});
async function recolor(img) {
  const { data, info } = await img.grayscale().linear(1.15, -10).raw().toBuffer({ resolveWithObject: true });
  const rgb = Buffer.alloc(info.width * info.height * 3);
  for (let p = 0; p < data.length; p++) rgb.set(LUT[data[p]], p * 3);
  return sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } });
}

mkdirSync(OUT_THUMB, { recursive: true });
let done = 0;
for (const f of readdirSync(SRC)) {
  const m = f.match(/^(?:\d+[-_ .]*)?([a-z]+)\.(png|jpe?g|webp)$/i);
  if (!m) {
    console.log(`건너뜀(이름 형식 아님): ${f}`);
    continue;
  }
  const id = m[1].toLowerCase();
  if (!ids.has(id)) {
    console.log(`건너뜀(없는 상징 id): ${f}`);
    continue;
  }
  const out = `${OUT}/${id}.webp`;
  const fix = RECOLOR.has(id) ? recolor : (img) => img;
  if (!thumbsOnly) await (await fix(sharp(`${SRC}/${f}`).resize(SIZE, SIZE, { fit: "cover" }))).webp({ quality: 80 }).toFile(out);
  const thumb = `${OUT_THUMB}/${id}.webp`;
  await (await fix(sharp(`${SRC}/${f}`).resize(THUMB, THUMB, { fit: "cover" }))).webp({ quality: 78 }).toFile(thumb);
  done++;
  console.log(`${f} → ${thumbsOnly ? "" : `${out}(${Math.round(statSync(out).size / 1024)}KB) `}${thumb}(${Math.round(statSync(thumb).size / 1024)}KB)`);
}
console.log(`변환 ${done}장 / 상징 ${ids.size}개`);
