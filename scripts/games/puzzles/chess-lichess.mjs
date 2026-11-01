// 체스 "오늘의 문제" 후보 모으기(시험): 리체스 공개 문제 모음(CC0, database.lichess.org)에서
// "N수 안에 체크메이트"(mateIn1~5) 문제만 골라 개수를 세고, 많이 풀리고 평이 좋은 문제를 남겨요.
// 먼저 https://database.lichess.org/lichess_db_puzzle.csv.zst 를 내려받아 두세요(약 300MB).
// 실행: node scripts/games/puzzles/chess-lichess.mjs <받은 .zst 파일> [출력 파일]
//
// 리체스 파일은 중간중간 "건너뛰는 칸"(zstd skippable frame, 위치 안내용)이 끼어 있어 Node가 한 번에 못 풀어요.
// 그래서 압축 덩어리(frame)를 하나씩 잘라 건너뛰는 칸은 버리고 나머지만 풀어요.
import { zstdDecompressSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";
import { play } from "../../../lib/games/chess/rules.js";

const [, , zstFile, outFile] = process.argv;
const KEEP_PER_N = 3000;
const buf = readFileSync(zstFile);

/** pos에서 시작하는 덩어리의 길이(바이트) */
function frameLength(pos) {
  const magic = buf.readUInt32LE(pos);
  if (magic >>> 4 === 0x184d2a5) return 8 + buf.readUInt32LE(pos + 4); // 건너뛰는 칸
  if (magic !== 0xfd2fb528) throw new Error(`모르는 덩어리 @${pos}`);
  const fhd = buf[pos + 4];
  const fcsFlag = fhd >> 6;
  const single = (fhd >> 5) & 1;
  const checksum = (fhd >> 2) & 1;
  const dictSize = [0, 1, 2, 4][fhd & 3];
  const fcsSize = [single ? 1 : 0, 2, 4, 8][fcsFlag];
  let p = pos + 5 + (single ? 0 : 1) + dictSize + fcsSize;
  for (;;) {
    const h = buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16);
    const last = h & 1;
    const type = (h >> 1) & 3;
    const size = h >> 3;
    p += 3 + (type === 1 ? 1 : size);
    if (last) break;
  }
  return p + (checksum ? 4 : 0) - pos;
}

const total = {};
const good = {};
const kept = {};
let rows = 0;
let rest = "";
function onLine(line) {
  if (!rows++) return; // 머리줄
  const [id, fen, moves, rating, , popularity, plays, themes] = line.split(",");
  const m = themes && themes.match(/\bmateIn(\d)\b/);
  if (!m) return;
  const n = Number(m[1]);
  total[n] = (total[n] || 0) + 1;
  // 평이 좋고(인기 90 이상) 많이 풀린(1000번 이상) 문제
  if (Number(popularity) < 90 || Number(plays) < 1000) return;
  good[n] = (good[n] || 0) + 1;
  kept[n] ||= [];
  if (kept[n].length < KEEP_PER_N) kept[n].push({ id, fen, moves, rating: Number(rating), n });
}

for (let pos = 0; pos < buf.length; ) {
  const len = frameLength(pos);
  if (buf.readUInt32LE(pos) === 0xfd2fb528) {
    const text = rest + zstdDecompressSync(buf.subarray(pos, pos + len)).toString("utf8");
    const parts = text.split("\n");
    rest = parts.pop();
    parts.forEach(onLine);
  }
  pos += len;
}
if (rest) onLine(rest);

/** FEN 글자를 우리 체스 규칙의 판 상태로 */
function fromFen(fen) {
  const [placement, turn, castling, ep, half] = fen.split(" ");
  const squares = placement.replace(/\d/g, (d) => ".".repeat(Number(d))).replace(/\//g, "");
  const sq = (s) => (8 - Number(s[1])) * 8 + (s.charCodeAt(0) - 97);
  return { squares, turn, castling: castling === "-" ? "" : castling, enPassant: ep === "-" ? null : sq(ep), halfmove: Number(half) || 0, history: [], lastMove: null, captured: { w: "", b: "" } };
}
const uci = (u) => {
  const sq = (s) => (8 - Number(s[1])) * 8 + (s.charCodeAt(0) - 97);
  return { from: sq(u.slice(0, 2)), to: sq(u.slice(2, 4)), promotion: u[4] ? u[4].toUpperCase() : undefined };
};
// 남긴 문제를 우리 체스 규칙으로 끝까지 둬 보고, 마지막 수에서 체크메이트가 되는지 확인
let ok = 0;
let bad = 0;
for (const p of Object.values(kept).flat()) {
  let state = fromFen(p.fen);
  let end = null;
  for (const u of p.moves.split(" ")) {
    const r = play(state, uci(u));
    if (!r) {
      end = "bad";
      break;
    }
    state = r.state;
    end = r.end;
  }
  if (end && end !== "bad" && end.reason === "체크메이트") ok++;
  else bad++;
}
console.log(`우리 체스 규칙으로 확인: 체크메이트로 끝남 ${ok} · 안 맞음 ${bad}`);
console.log(`끝: ${rows - 1}문제 중 체크메이트 문제 ${JSON.stringify(total)} · 평 좋고 많이 풀린 것 ${JSON.stringify(good)}`);
if (outFile) writeFileSync(outFile, JSON.stringify(Object.values(kept).flat()));
