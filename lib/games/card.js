/**
 * 미니게임 기록 공유 카드(1080×1920, 휴대폰 세로 화면 크기). 깬 단계에 따라 등급이 바뀌고,
 * 등급마다 바탕색·메달 색·장식이 달라요: 동(1~3) · 은(4~6) · 금(7~9) · 완주(흑돌 10) · 전설(백돌 10).
 * 개인정보는 들어가지 않고, 진행 기록만 담깁니다.
 */
import { SITE_DOMAIN } from "@/lib/site";
import { STAGES, STAGE_COUNT, TIERS, tierOf } from "@/lib/games/omok/stages";

const W = 1080;
const H = 1920;
const SANS = `-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Segoe UI", sans-serif`;
const font = (size, weight = 700) => `${weight} ${size}px ${SANS}`;

const LOOKS = {
  bronze: {
    bg: ["#b77a4a", "#5a3416"],
    disc: ["#f0b98a", "#a8642f", "#6d3c16"],
    ribbon: ["#7a4a24", "#c98a55"],
    dot: "#e9a46b",
    ink: "#4a2a10",
  },
  silver: {
    bg: ["#8d9bb0", "#36414f"],
    disc: ["#ffffff", "#c4ccd8", "#7f8a99"],
    ribbon: ["#3d5a8a", "#6f8fc2"],
    dot: "#e6ebf2",
    ink: "#2d3646",
  },
  gold: {
    bg: ["#4fa443", "#174a14"],
    disc: ["#fff3b8", "#f0c53f", "#b8860b"],
    ribbon: ["#b3261e", "#e0483e"],
    dot: "#f2c94c",
    ink: "#6b4b00",
  },
  master: {
    bg: ["#6a3fc8", "#1e1350"],
    rainbow: ["#ffd76a", "#ff8fb1", "#9fd4ff", "#a6f0c6", "#ffd76a"],
    ribbon: ["#5b2ea8", "#9d6bff"],
    dot: "#ffd76a",
    ink: "#3a1d7a",
    crown: true,
  },
  legend: {
    bg: ["#3a3220", "#0d0b07"],
    disc: ["#2b2b2b", "#111111", "#000000"],
    ribbon: ["#8a6d1f", "#e8c25a"],
    dot: "#e8c25a",
    ink: "#e8c25a",
    crown: true,
    goldRim: true,
  },
};

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

function crown(ctx, cx, cy, w) {
  const h = w * 0.62;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy - h / 6);
  ctx.lineTo(cx - w / 4, cy + h / 8);
  ctx.lineTo(cx, cy - h / 2);
  ctx.lineTo(cx + w / 4, cy + h / 8);
  ctx.lineTo(cx + w / 2, cy - h / 6);
  ctx.lineTo(cx + w / 2, cy + h / 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
  g.addColorStop(0, "#fff1a8");
  g.addColorStop(1, "#e0a92a");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;
  for (const [dx, color] of [
    [-w / 4, "#ff5d7a"],
    [0, "#5ab0ff"],
    [w / 4, "#5ddc9a"],
  ]) {
    ctx.beginPath();
    ctx.arc(cx + dx, cy + h / 4, w * 0.055, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function sparkle(ctx, x, y, s, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
  ctx.restore();
}

/** 진행 기록으로 카드에 들어갈 내용 */
export function cardContent(progress) {
  const tier = tierOf(progress);
  if (!tier) return null;
  const b = Math.min(progress.black || 0, STAGE_COUNT);
  const w = Math.min(progress.white || 0, STAGE_COUNT);
  const sub =
    tier === "legend" ? "흑·백 모두 완주했어요!" : tier === "master" ? "오목의 신을 이겼어요!" : `${b}단계까지 깼어요!`;
  const lastStone = tier === "master" && w > 0 ? "백돌" : "흑돌";
  const lastIndex = tier === "legend" ? STAGE_COUNT - 1 : tier === "master" && w > 0 ? w - 1 : b - 1;
  const rows = [["흑돌 기록", `${b} / ${STAGE_COUNT}단계`]];
  if (tier === "legend" || (tier === "master" && w > 0)) rows.push(["백돌 기록", `${w} / ${STAGE_COUNT}단계`]);
  else if (tier === "master") rows.push(["다음 도전", "백돌로 1단계부터"]);
  else rows.push(["다음 상대", STAGES[b].name]);
  return {
    tier,
    title: TIERS[tier].title,
    cap: TIERS[tier].cap,
    number: tier === "legend" ? "∞" : String(b),
    sub,
    filled: tier === "legend" ? STAGE_COUNT : b,
    lastLabel: `마지막으로 이긴 상대${lastStone === "백돌" ? " (백돌)" : ""}`,
    lastName: STAGES[lastIndex].name,
    rows,
  };
}

/** 반환: { blob, dataUrl } — 그릴 등급이 없으면(아직 한 단계도 못 깸) null */
export async function buildGameCard(progress) {
  const c = cardContent(progress);
  if (!c) return null;
  const look = LOOKS[c.tier];
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 바탕
  const bg =
    c.tier === "legend" ? ctx.createRadialGradient(W / 2, 380, 40, W / 2, 380, 1500) : ctx.createLinearGradient(0, 0, W * 0.55, H);
  bg.addColorStop(0, look.bg[0]);
  bg.addColorStop(c.tier === "legend" ? 0.7 : 1, look.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (look.crown) {
    [
      [180, 520, 26, 0.8],
      [905, 430, 22, 0.75],
      [215, 800, 18, 0.6],
      [880, 760, 26, 0.7],
      [140, 1180, 14, 0.45],
      [950, 1240, 16, 0.5],
    ].forEach(([x, y, s, a]) => sparkle(ctx, x, y, s, a));
  }

  text(ctx, "재미로봄 · 미니게임 오목", W / 2, 150, 40, 800, "#ffffff", "center", 0.88);

  // 메달: 리본 두 줄 + 원판
  const cx = W / 2;
  const cy = 640;
  const R = 200;
  const ribbon = (x, skew, color) => {
    ctx.save();
    ctx.translate(x, 330);
    ctx.transform(1, 0, skew, 1, 0, 0);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 120, 250);
    ctx.restore();
  };
  ribbon(cx - 170, 0.25, look.ribbon[0]);
  ribbon(cx + 50, -0.25, look.ribbon[1]);

  ctx.save();
  ctx.shadowColor = look.goldRim ? "rgba(232,194,90,0.65)" : "rgba(0,0,0,0.35)";
  ctx.shadowBlur = look.goldRim ? 60 : 30;
  ctx.shadowOffsetY = look.goldRim ? 0 : 12;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  let discFill;
  if (look.rainbow && ctx.createConicGradient) {
    discFill = ctx.createConicGradient(0.5, cx, cy);
    look.rainbow.forEach((color, i) => discFill.addColorStop(i / (look.rainbow.length - 1), color));
  } else {
    const stops = look.disc || ["#fff3b8", "#f0c53f", "#b8860b"];
    discFill = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, 10, cx, cy, R);
    discFill.addColorStop(0, stops[0]);
    discFill.addColorStop(0.55, stops[1]);
    discFill.addColorStop(1, stops[2]);
  }
  ctx.fillStyle = discFill;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 6, 0, Math.PI * 2);
  ctx.lineWidth = look.goldRim ? 16 : 11;
  ctx.strokeStyle = look.goldRim ? "#e8c25a" : "rgba(255,255,255,0.55)";
  ctx.stroke();
  if (look.rainbow) {
    // 무지개 원판 위 글자가 잘 보이게 가운데를 살짝 밝게
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
    glow.addColorStop(0, "rgba(255,255,255,0.75)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 12, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, c.number, cx, cy - 22, c.number === "∞" ? 170 : 150, 900, look.ink);
  text(ctx, c.cap, cx, cy + 105, 38, 800, look.ink);
  if (look.crown) crown(ctx, cx, cy - R - 20, 170);

  // 등급 이름과 한 줄
  text(ctx, c.title, cx, 950, 96, 900, "#ffffff");
  text(ctx, c.sub, cx, 1052, 52, 800, "#ffffff", "center", 0.94);

  // 깬 단계 점 10개
  const dot = 26;
  const gap = 18;
  const total = STAGE_COUNT * dot * 2 + (STAGE_COUNT - 1) * gap;
  for (let i = 0; i < STAGE_COUNT; i++) {
    ctx.beginPath();
    ctx.arc((W - total) / 2 + dot + i * (dot * 2 + gap), 1150, dot, 0, Math.PI * 2);
    ctx.fillStyle = i < c.filled ? look.dot : "rgba(255,255,255,0.22)";
    ctx.fill();
  }

  // 마지막으로 이긴 상대
  const X = 110;
  const BW = W - X * 2;
  roundRect(ctx, X, 1240, BW, 190, 40);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fill();
  text(ctx, c.lastLabel, cx, 1295, 38, 700, "#ffffff", "center", 0.85);
  text(ctx, c.lastName, cx, 1370, 54, 900, "#ffffff");

  // 기록 줄
  c.rows.forEach(([label, value], i) => {
    const y = 1470 + i * 116;
    roundRect(ctx, X, y, BW, 96, 30);
    ctx.fillStyle = c.tier === "legend" ? "rgba(232,194,90,0.14)" : "rgba(0,0,0,0.16)";
    ctx.fill();
    text(ctx, label, X + 44, y + 48, 38, 700, "#ffffff", "left", 0.9);
    text(ctx, value, X + BW - 44, y + 48, 40, 900, "#ffffff", "right");
  });

  text(ctx, "나보다 높이 갈 수 있을까?", cx, 1770, 40, 700, "#ffffff", "center", 0.85);
  text(ctx, `${SITE_DOMAIN}/games/omok`, cx, 1830, 40, 800, "#ffffff", "center", 0.85);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return { blob, dataUrl: canvas.toDataURL("image/png") };
}
