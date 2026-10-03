/**
 * 꿈해몽 결과를 1080×1920 이미지 카드로 그립니다. 운세·궁합·관상 카드와 같은 틀
 * (측정→그리기 2패스, 남는 높이 분배)을 쓰지만, 코너마다 카드를 독립적으로 관리하는
 * 기존 방식을 따라 이 파일도 따로 둡니다. 사진이나 생년월일을 쓰지 않는 코너라
 * 카드에도 고른 상징 글과 종합 흐름만 들어갑니다 — 개인정보가 전혀 들어가지 않아요.
 */
import { SITE, SITE_DOMAIN } from "@/lib/site";

const W = 1080;
const MIN_H = 1920;
const MARGIN = 36;
const PAD = 52;
const X0 = MARGIN + PAD;
const CW = W - 2 * X0;
const RADIUS = 52;

const C = { ink: "#211F33", muted: "#6E6B85", paper: "#FDFCFF", border: "#E3E1F0" };
const T = {
  accent: "#3A56A8",
  deep: "#223872",
  soft: "#E3E8F7",
  gold: "#F2C14E",
  dark1: "#131B3A",
  dark2: "#223872",
  onDark: "#D6E0FA",
};

const SANS = `-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Segoe UI", sans-serif`;
const sans = (size, weight = 700) => `${weight} ${size}px ${SANS}`;

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function bandPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}
function wrapLines(ctx, text, maxWidth, maxLines) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
      continue;
    }
    for (const ch of word) {
      if (ctx.measureText(line + ch).width > maxWidth) {
        lines.push(line);
        line = ch;
      } else line += ch;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

function painter(ctx, draw) {
  return {
    ctx,
    draw,
    para(text, y, o = {}) {
      const { size = 26, weight = 500, color = C.ink, lh = 1.6, x = X0, width = CW, maxLines = 40 } = o;
      ctx.font = sans(size, weight);
      const lines = wrapLines(ctx, text, width, maxLines);
      const step = Math.round(size * lh);
      if (draw) {
        ctx.fillStyle = color;
        lines.forEach((line, i) => ctx.fillText(line, x, y + i * step));
      }
      return y + lines.length * step;
    },
    line(text, y, o = {}) {
      const { size = 27, weight = 700, color = C.ink, x = X0, width = CW, align = "left", gap = 10 } = o;
      ctx.font = sans(size, weight);
      if (draw) {
        ctx.fillStyle = color;
        const lx = align === "center" ? x + (width - ctx.measureText(text).width) / 2 : x;
        ctx.fillText(text, lx, y);
      }
      return y + size + gap;
    },
    rule(y, color) {
      if (draw) {
        ctx.fillStyle = color;
        ctx.fillRect(X0, y, CW, 2);
      }
      return y + 2;
    },
    box(y, fn, o = {}) {
      const { bg, border, padX = 26, padY = 24, radius = 24 } = o;
      const inner = (pp, yy) => fn(pp, yy, { x: X0 + padX, width: CW - padX * 2 });
      const h = inner(painter(ctx, false), y + padY) - (y + padY) + padY * 2;
      if (draw) {
        roundRectPath(ctx, X0, y, CW, h, radius);
        if (bg) {
          ctx.fillStyle = bg;
          ctx.fill();
        }
        if (border) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = border;
          ctx.stroke();
        }
        inner(this, y + padY);
      }
      return y + h;
    },
  };
}

function drawBackdrop(ctx, H) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, T.dark1);
  g.addColorStop(1, T.deep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.paper;
  roundRectPath(ctx, MARGIN, MARGIN, W - 2 * MARGIN, H - 2 * MARGIN, RADIUS);
  ctx.fill();
}

function footer(p, y) {
  let fy = y + 10;
  fy = p.line(`${SITE_DOMAIN}/dream`, fy, { size: 28, weight: 800, color: T.deep, align: "center", gap: 8 });
  fy = p.line(`${SITE.name} · 꿈해몽`, fy, { size: 23, weight: 600, color: C.muted, align: "center", gap: 0 });
  return fy;
}

function paintDream(ctx, d, H, draw, slack = 0) {
  const p = painter(ctx, draw);
  const gapTop = 36 + Math.round(slack * 0.3);
  const gapFooter = 36 + (slack - Math.round(slack * 0.3));
  if (draw) drawBackdrop(ctx, H);
  ctx.textBaseline = "top";

  const headerH = 300;
  if (draw) {
    const g = ctx.createLinearGradient(MARGIN, MARGIN, W - MARGIN, MARGIN + headerH);
    g.addColorStop(0, T.dark1);
    g.addColorStop(1, T.dark2);
    ctx.fillStyle = g;
    bandPath(ctx, MARGIN, MARGIN, W - 2 * MARGIN, headerH, RADIUS);
    ctx.fill();
  }
  let hy = MARGIN + 44;
  const hp = painter(ctx, draw);
  hy = hp.line(`${SITE.name} · 꿈해몽`, hy, { size: 25, weight: 800, color: T.onDark, align: "center", gap: 18 });
  hy = hp.line("내 꿈 해몽", hy, { size: 44, weight: 900, color: "#FFFFFF", align: "center", gap: 10 });
  hy = hp.line(d.keywordsLine, hy, { size: 22, weight: 700, color: T.onDark, align: "center", gap: 0 });

  let y = MARGIN + headerH + gapTop;

  // 종합 흐름을 맨 위에, 상징별 해석보다 먼저 크게 보여줍니다(관상 "종합 보기"와 같은 배치).
  y = p.box(
    y,
    (bp, by, o) => {
      let yy = bp.line("종합 흐름", by, { size: 21, weight: 800, color: T.deep, gap: 10, ...o });
      yy = bp.line(d.synthesis.title, yy, { size: 30, weight: 900, color: T.deep, gap: 12, ...o });
      return bp.para(d.synthesis.text, yy, { size: 26, weight: 500, color: C.ink, lh: 1.6, ...o });
    },
    { bg: T.soft, border: T.accent, padY: 28 }
  );
  y += 28;

  y = p.para(d.intro, y, { size: 22, weight: 500, color: C.muted });

  y += 10;
  y = p.line("고른 상징별로 자세히 보면", y, { size: 22, weight: 800, color: T.deep, gap: 16 });
  d.symbols.forEach((sym, i) => {
    if (i > 0) {
      y += 14;
      y = p.rule(y, C.border);
      y += 18;
    }
    y = p.line(sym.label, y, { size: 26, weight: 800, color: T.deep, gap: 8 });
    y = p.para(sym.text, y, { size: 24, weight: 500, color: C.ink, lh: 1.55 });
    y += 4;
  });

  y += gapFooter;
  y = footer(p, y);
  return y + PAD - 10 + MARGIN;
}

async function render(data) {
  const measure = document.createElement("canvas").getContext("2d");
  const need = Math.ceil(paintDream(measure, data, MIN_H, false, 0));
  const H = Math.max(MIN_H, need);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  paintDream(ctx, data, H, true, H - need);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return { blob, dataUrl: canvas.toDataURL("image/png") };
}

export const buildDreamCard = (data) => render(data);
