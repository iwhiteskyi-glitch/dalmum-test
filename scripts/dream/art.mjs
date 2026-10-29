// 꿈해몽 그림 원본(docs/dream/그림원본/*.png)을 사이트용 webp로 줄입니다.
// 파일 이름 앞의 번호("1-snake.png")는 떼고 상징 id로 저장합니다 → public/dream/art/<id>.webp
// 실행: node scripts/dream/art.mjs
import { readdirSync, mkdirSync, readFileSync, statSync } from "node:fs";
import sharp from "sharp";

const SRC = "docs/dream/그림원본";
const OUT = "public/dream/art";
const SIZE = 512;
const ids = new Set(JSON.parse(readFileSync("lib/dream/symbols.json", "utf8")).symbols.map((s) => s.id));

mkdirSync(OUT, { recursive: true });
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
  await sharp(`${SRC}/${f}`).resize(SIZE, SIZE, { fit: "cover" }).webp({ quality: 80 }).toFile(out);
  done++;
  console.log(`${f} → ${out} (${Math.round(statSync(out).size / 1024)}KB)`);
}
console.log(`변환 ${done}장 / 상징 ${ids.size}개`);
