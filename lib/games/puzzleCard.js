/**
 * 오늘의 문제 공유 카드(1080×1920, 휴대폰 세로 화면 크기).
 * 문제의 처음 판을 그대로 그려 넣어서, 받은 친구가 "이거 풀 수 있어?" 하고 바로 도전해 볼 수 있게 해요.
 * 정답 수는 담기지 않고, 날짜·난이도·몇 번 만에 풀었는지·연속 기록만 담겨요.
 */
import { SITE_DOMAIN } from "@/lib/site";

const W = 1080;
const H = 1920;
const SANS = `-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Segoe UI", sans-serif`;
const SERIF = `"Noto Serif KR", "Batang", "AppleMyungjo", serif`;
const font = (size, weight = 700, family = SANS) => `${weight} ${size}px ${family}`;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, weight, color, align = "center", alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(str, x, y);
  ctx.restore();
}

function shadowBox(ctx, x, y, w, h, r, fill) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

/* ---------- 판 그리기(가로 w 안에 맞춰 그리고, 그린 높이를 돌려줘요) ---------- */

function drawOmok(ctx, x, y, w, moves) {
  const N = 15;
  const m = w * 0.045;
  const step = (w - m * 2) / (N - 1);
  const wood = ctx.createLinearGradient(x, y, x + w, y + w);
  wood.addColorStop(0, "#ebc988");
  wood.addColorStop(1, "#d2a259");
  shadowBox(ctx, x, y, w, w, 28, wood);
  ctx.strokeStyle = "#6b4a1f";
  for (let i = 0; i < N; i++) {
    ctx.lineWidth = i === 0 || i === N - 1 ? 3 : 1.6;
    ctx.beginPath();
    ctx.moveTo(x + m, y + m + i * step);
    ctx.lineTo(x + w - m, y + m + i * step);
    ctx.moveTo(x + m + i * step, y + m);
    ctx.lineTo(x + m + i * step, y + w - m);
    ctx.stroke();
  }
  moves.forEach((cell, i) => {
    const cx = x + m + (cell % N) * step;
    const cy = y + m + Math.floor(cell / N) * step;
    const r = step * 0.45;
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 1, cx, cy, r);
    if (i % 2 === 0) {
      g.addColorStop(0, "#5a5a5a");
      g.addColorStop(1, "#0f0f0f");
    } else {
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, "#d9d6d0");
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  });
  return w;
}

const JG_LABEL = { K: ["楚", "漢"], A: ["士", "士"], E: ["象", "象"], H: ["馬", "馬"], R: ["車", "車"], C: ["包", "包"], P: ["卒", "兵"] };
const JG_SIZE = { K: 0.5, R: 0.43, C: 0.43, H: 0.43, E: 0.43, A: 0.36, P: 0.36 };
const JG_COLOR = ["#0f6b57", "#b3261e"];

function drawJanggi(ctx, x, y, w, squares, flip) {
  const m = w * 0.07;
  const step = (w - m * 2) / 8;
  const h = m * 2 + step * 9;
  shadowBox(ctx, x, y, w, h, 28, "#e4bf7d");
  const P = (r, c) => [x + m + c * step, y + m + r * step];
  ctx.strokeStyle = "#6b4a1f";
  ctx.lineWidth = 2;
  const line = (r1, c1, r2, c2) => {
    const [a, b] = P(r1, c1);
    const [c, d] = P(r2, c2);
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
  };
  for (let r = 0; r < 10; r++) line(r, 0, r, 8);
  for (let c = 0; c < 9; c++) line(0, c, 9, c);
  line(0, 3, 2, 5);
  line(0, 5, 2, 3);
  line(7, 3, 9, 5);
  line(7, 5, 9, 3);
  for (let p = 0; p < 90; p++) {
    const ch = squares[p];
    if (ch === ".") continue;
    const v = flip ? 89 - p : p;
    const [cx, cy] = P(Math.floor(v / 9), v % 9);
    const t = ch.toUpperCase();
    const side = ch === t ? 0 : 1;
    const r = step * JG_SIZE[t];
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      ctx[i ? "lineTo" : "moveTo"](cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.fillStyle = "#fbf4e6";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = JG_COLOR[side];
    ctx.stroke();
    ctx.font = font(r * 1.05, 700, SERIF);
    ctx.fillStyle = JG_COLOR[side];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(JG_LABEL[t][side], cx, cy + r * 0.05);
  }
  return h;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function drawChess(ctx, x, y, w, squares, flip) {
  const step = w / 8;
  shadowBox(ctx, x, y, w, w, 20, "#b58863");
  ctx.save();
  roundRect(ctx, x, y, w, w, 20);
  ctx.clip();
  for (let v = 0; v < 64; v++) {
    const r = Math.floor(v / 8);
    const c = v % 8;
    ctx.fillStyle = (r + c) % 2 ? "#b58863" : "#f0d9b5";
    ctx.fillRect(x + c * step, y + r * step, step, step);
  }
  ctx.restore();
  const kinds = [...new Set(squares.replace(/\./g, ""))];
  const imgs = {};
  await Promise.all(
    kinds.map(async (p) => {
      imgs[p] = await loadImage(`/games/chess/${p === p.toUpperCase() ? "w" : "b"}${p.toUpperCase()}.svg`);
    }),
  );
  for (let s = 0; s < 64; s++) {
    const p = squares[s];
    if (p === ".") continue;
    const v = flip ? 63 - s : s;
    ctx.drawImage(imgs[p], x + (v % 8) * step + step * 0.04, y + Math.floor(v / 8) * step + step * 0.04, step * 0.92, step * 0.92);
  }
  return w;
}

/**
 * info: { game: PUZZLE_GAMES 항목, date: "10월 9일 (목)", level: "보통", n: 몇 수 문제, goal, sideName,
 *         tries, hint, streak, board: { kind, moves | squares, flip } }
 * 반환: { blob, dataUrl }
 */
export async function buildPuzzleCard(info) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W * 0.5, H);
  bg.addColorStop(0, "#4fa443");
  bg.addColorStop(1, "#153f12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  text(ctx, `재미로봄 · 오늘의 ${info.game.name} 문제`, W / 2, 120, 42, 800, "#ffffff", "center", 0.9);
  text(ctx, `${info.date} · ${info.level}`, W / 2, 184, 40, 700, "#ffffff", "center", 0.8);

  // 성공 도장
  ctx.save();
  ctx.translate(W / 2, 300);
  roundRect(ctx, -250, -62, 500, 124, 62);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
  text(ctx, "✓ 풀었어요!", W / 2, 302, 66, 900, "#2f7a2a");

  // 문제 판
  const bw = info.board.kind === "janggi" ? 760 : 840;
  const bx = (W - bw) / 2;
  const by = 420;
  let bh;
  if (info.board.kind === "omok") bh = drawOmok(ctx, bx, by, bw, info.board.moves);
  else if (info.board.kind === "janggi") bh = drawJanggi(ctx, bx, by, bw, info.board.squares, info.board.flip);
  else bh = await drawChess(ctx, bx, by, bw, info.board.squares, info.board.flip);

  // 문제 한 줄
  let y = by + bh + 70;
  text(ctx, `${info.sideName} 차례 · ${info.goal}`, W / 2, y, info.goal.length > 22 ? 36 : 40, 800, "#ffffff", "center", 0.95);

  // 기록
  y += 90;
  const rows = [
    ["난이도", `${info.level} · ${info.n}수 문제`],
    [info.hint ? "힌트 보고" : "힌트 없이", `${info.tries === 1 ? "한 번에" : `${info.tries}번 만에`} 성공`],
  ];
  if (info.streak >= 2) rows.push(["연속 기록", `${info.streak}일째 풀었어요`]);
  rows.forEach(([label, value], i) => {
    const ry = y + i * 112;
    roundRect(ctx, 110, ry - 46, W - 220, 92, 30);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fill();
    text(ctx, label, 154, ry, 38, 700, "#ffffff", "left", 0.88);
    text(ctx, value, W - 154, ry, 42, 900, "#ffffff", "right");
  });

  text(ctx, "이 문제, 풀 수 있을까?", W / 2, 1770, 44, 800, "#ffffff", "center", 0.92);
  text(ctx, `${SITE_DOMAIN}${info.game.path}`, W / 2, 1832, 38, 800, "#ffffff", "center", 0.8);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return { blob, dataUrl: canvas.toDataURL("image/png") };
}
