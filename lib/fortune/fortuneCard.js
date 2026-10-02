/**
 * 운세·궁합 결과를 1080×1920(인스타 스토리 비율) 이미지 카드로 그립니다.
 * 화면에 보이는 결과 카드와 같은 색·순서를 쓰고, 맨 아래에 주소를 적어 둬서 사진만 받은
 * 사람도 어디서 본 결과인지 알 수 있게 합니다. 사진 공유를 지원하는 앱에 결과를 보낼 때
 * 쓰고, 전부 브라우저 안에서 그립니다. 생년월일·성별 같은 입력 정보는 넣지 않습니다.
 * 반환: { blob, dataUrl }
 */
import { SITE, SITE_DOMAIN } from "@/lib/site";

const W = 1080;
const MIN_H = 1920;
const MARGIN = 36;
const PAD = 52;
const X0 = MARGIN + PAD;
const CW = W - 2 * X0;
const RADIUS = 52;

const C = {
  ink: "#30242C",
  muted: "#776872",
  paper: "#FFFCF8",
  border: "#E9E0E4",
};

/** fortune.module.css의 --f-* 값과 같은 색 (화면 결과와 카드 색을 맞추기 위해) */
const THEMES = {
  fortune: {
    accent: "#5A4FCF",
    deep: "#3D3290",
    soft: "#EEECFB",
    gold: "#E8B54A",
    glow: "#6D61DC",
    dark1: "#2A2266",
    dark2: "#3D3290",
    onDark: "#CFC9FF",
    calloutInk: "#3A315F",
  },
  gunghap: {
    accent: "#D9622E",
    deep: "#8A3A16",
    soft: "#FBE8DC",
    gold: "#F0B94F",
    glow: "#F0924F",
    dark1: "#4A1F0C",
    dark2: "#8A3A16",
    onDark: "#FFD9B8",
    calloutInk: "#6B3012",
  },
};

/** 오행 색 (fortune.module.css의 --el0~--el4와 같은 값) */
export const EL_COLORS = ["#2F8F55", "#D0453A", "#A87512", "#6F7584", "#2B4C9B"];

const SANS = `-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Segoe UI", sans-serif`;
const sans = (size, weight = 700) => `${weight} ${size}px ${SANS}`;
const starText = (n) => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 위쪽 두 귀퉁이만 둥근 띠 (카드 헤더) */
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

// 공백 기준으로 줄을 나누고(한글 단어가 중간에서 끊기지 않게), 한 단어가 너무 길 때만 글자 단위로 자릅니다.
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

/** 너비 안에 들어갈 때까지 글자 크기를 줄입니다. */
function fitFont(ctx, text, maxWidth, size, minSize, weight) {
  let s = size;
  ctx.font = sans(s, weight);
  while (s > minSize && ctx.measureText(text).width > maxWidth) {
    s -= 1;
    ctx.font = sans(s, weight);
  }
  return s;
}

/**
 * 글·칩을 그리면서 다음 y를 돌려주는 도구. draw=false로 같은 함수를 돌리면 아무것도
 * 그리지 않고 높이만 재기 때문에, 내용에 따라 길이가 달라지는 상자를 그릴 수 있어요.
 */
function painter(ctx, draw) {
  const self = {
    ctx,
    draw,
    /** 여러 줄 글. 반환: 다음 y */
    para(text, y, o = {}) {
      const { size = 27, weight = 500, color = C.ink, lh = 1.62, x = X0, width = CW, maxLines = 60, align = "left" } = o;
      ctx.font = sans(size, weight);
      const lines = wrapLines(ctx, text, width, maxLines);
      const step = Math.round(size * lh);
      if (draw) {
        ctx.fillStyle = color;
        lines.forEach((line, i) => {
          const lx = align === "center" ? x + (width - ctx.measureText(line).width) / 2 : x;
          ctx.fillText(line, lx, y + i * step);
        });
      }
      return y + lines.length * step;
    },
    /** 한 줄 글(너무 길면 글자를 줄여서 한 줄에 맞춤). 반환: 다음 y */
    line(text, y, o = {}) {
      const { size = 27, weight = 700, color = C.ink, x = X0, width = CW, minSize = 18, align = "left", gap = 10 } = o;
      const s = fitFont(ctx, text, width, size, minSize, weight);
      if (draw) {
        ctx.fillStyle = color;
        const lx = align === "center" ? x + (width - ctx.measureText(text).width) / 2 : x;
        ctx.fillText(text, lx, y);
      }
      return y + s + gap;
    },
    /** 왼쪽 제목 + 오른쪽 별점 한 줄. 반환: 다음 y */
    labelStars(label, n, y, o = {}) {
      const { color, gold, size = 26, x = X0, width = CW } = o;
      ctx.font = sans(size, 800);
      if (draw) {
        ctx.fillStyle = color;
        ctx.fillText(label, x, y);
      }
      if (typeof n === "number") {
        ctx.font = sans(size, 700);
        const s = starText(n);
        if (draw) {
          ctx.fillStyle = gold;
          ctx.fillText(s, x + width - ctx.measureText(s).width, y);
        }
      }
      return y + size + 8;
    },
    /** 내용 길이에 맞춰 배경 상자를 먼저 깔고 그 안에 그립니다. 반환: 다음 y */
    box(y, fn, o = {}) {
      const { bg, padX = 28, padY = 26, radius = 26, border, x: bx = X0, width: bw = CW } = o;
      const inner = (p, yy) => fn(p, yy, { x: bx + padX, width: bw - padX * 2 });
      const h = inner(painter(ctx, false), y + padY) - (y + padY) + padY * 2;
      if (draw) {
        roundRectPath(ctx, bx, y, bw, h, radius);
        if (bg) {
          ctx.fillStyle = bg;
          ctx.fill();
        }
        if (border) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = border;
          ctx.stroke();
        }
        inner(self, y + padY);
      }
      return y + h;
    },
    /** 가운데 정렬 알약 칩. 반환: 다음 y */
    chip(text, y, o = {}) {
      const { bg, color, size = 27, h = 54, padX = 24 } = o;
      ctx.font = sans(size, 800);
      const w = ctx.measureText(text).width + padX * 2;
      if (draw) {
        ctx.fillStyle = bg;
        roundRectPath(ctx, (W - w) / 2, y, w, h, h / 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.textBaseline = "middle";
        ctx.fillText(text, (W - w) / 2 + padX, y + h / 2 + 1);
        ctx.textBaseline = "top";
      }
      return y + h;
    },
    /** 옅은 선 */
    rule(y, color) {
      if (draw) {
        ctx.fillStyle = color;
        ctx.fillRect(X0, y, CW, 2);
      }
      return y + 2;
    },
  };
  return self;
}

function drawBackdrop(ctx, H, t) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, t.dark1);
  g.addColorStop(1, t.glow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.paper;
  roundRectPath(ctx, MARGIN, MARGIN, W - 2 * MARGIN, H - 2 * MARGIN, RADIUS);
  ctx.fill();
}

/** 어두운 헤더 띠: 안쪽 내용을 fn으로 받아 길이에 맞춰 띠를 깔고 그립니다. */
function headerBand(ctx, draw, y, t, fn) {
  const w = W - 2 * MARGIN;
  const h = fn(painter(ctx, false), y + 54) - (y + 54) + 54 + 44;
  if (draw) {
    const g = ctx.createLinearGradient(MARGIN, y, W - MARGIN, y + h);
    g.addColorStop(0, t.dark1);
    g.addColorStop(1, t.dark2);
    ctx.fillStyle = g;
    bandPath(ctx, MARGIN, y, w, h, RADIUS);
    ctx.fill();
    fn(painter(ctx, true), y + 54);
  }
  return y + h;
}

/** 맨 아래 주소 + 코너 이름 */
function footer(p, y, t, cornerName, path) {
  let fy = y + 10;
  fy = p.line(`${SITE_DOMAIN}${path}`, fy, { size: 28, weight: 800, color: t.deep, align: "center", gap: 8 });
  fy = p.line(`${SITE.name} · ${cornerName}`, fy, { size: 23, weight: 600, color: C.muted, align: "center", gap: 0 });
  return fy;
}

/** 색·숫자·방향 세 칸 (오늘의 운세·신년운세 카드가 같이 씁니다) */
function luckyRow(bp, by, o, d, labels) {
  const gap = 20;
  const col = (o.width - gap * 2) / 3;
  const xs = [o.x, o.x + col + gap, o.x + (col + gap) * 2];
  labels.forEach((label, i) => {
    bp.line(label, by, { size: 22, weight: 700, color: C.muted, x: xs[i], width: col, gap: 0 });
  });
  const vy = by + 34;
  if (bp.draw) {
    bp.ctx.fillStyle = EL_COLORS[d.luckyElement];
    bp.ctx.beginPath();
    bp.ctx.arc(xs[0] + 12, vy + 16, 12, 0, Math.PI * 2);
    bp.ctx.fill();
  }
  bp.line(d.luckyColor, vy, { size: 28, weight: 800, color: C.ink, x: xs[0] + 32, width: col - 32, gap: 0 });
  bp.line(d.luckyNumbers, vy, { size: 28, weight: 800, color: C.ink, x: xs[1], width: col, gap: 0 });
  return bp.line(d.luckyDirection, vy, { size: 28, weight: 800, color: C.ink, x: xs[2], width: col, gap: 0 });
}

/* ───────────────────────── 오늘의 운세 카드 ───────────────────────── */

function paintToday(ctx, d, H, draw, slack = 0) {
  const t = THEMES.fortune;
  const p = painter(ctx, draw);
  const gapTop = 40 + Math.round(slack * 0.45);
  const gapFooter = 40 + (slack - Math.round(slack * 0.45));
  if (draw) drawBackdrop(ctx, H, t);
  ctx.textBaseline = "top";

  let y = headerBand(ctx, draw, MARGIN, t, (hp, hy) => {
    let yy = hp.line(`${SITE.name} · ${d.dayLabel}의 운세`, hy, { size: 25, weight: 800, color: t.onDark, align: "center", gap: 18 });
    yy = hp.line(d.dateText, yy, { size: 29, weight: 700, color: "#FFFFFF", align: "center", gap: 20 });
    yy = hp.chip(d.godLine, yy, { bg: "rgba(255,255,255,0.14)", color: t.gold, size: 26, h: 52 });
    yy += 22;
    yy = hp.para(d.title, yy, { size: 54, weight: 900, color: "#FFFFFF", lh: 1.22, align: "center", maxLines: 2 });
    yy += 14;
    yy = hp.line(starText(d.stars), yy, { size: 40, weight: 700, color: t.gold, align: "center", gap: 6 });
    return hp.line("총운", yy, { size: 23, weight: 700, color: t.onDark, align: "center", gap: 0 });
  });

  y += gapTop;
  y = p.para(d.summary, y, { size: 27, weight: 500, color: C.ink });

  y += 30;
  y = p.box(
    y,
    (bp, by, o) => {
      let yy = bp.line(`${d.dayLabel}의 한마디`, by, { size: 23, weight: 800, color: t.deep, gap: 10, ...o });
      return bp.para(d.advice, yy, { size: 29, weight: 800, color: t.calloutInk, lh: 1.5, ...o });
    },
    { bg: t.soft }
  );

  y += 34;
  d.areas.forEach((a, i) => {
    if (i > 0) {
      y += 18;
      y = p.rule(y, C.border);
      y += 18;
    }
    y = p.labelStars(a.label, a.stars, y, { color: t.deep, gold: t.gold });
    y = p.para(a.text, y, { size: 25, weight: 500, color: C.ink, lh: 1.6 });
  });

  y += 34;
  y = p.box(y, (bp, by, o) => luckyRow(bp, by, o, d, ["행운의 색", "행운의 숫자", "행운의 방향"]), {
    bg: "#FFFFFF",
    border: C.border,
  });

  if (d.hours) {
    y += 16;
    y = p.box(
      y,
      (bp, by, o) => {
        const gap = 20;
        const col = (o.width - gap) / 2;
        const xs = [o.x, o.x + col + gap];
        d.hours.forEach((h, i) => {
          bp.line(h.label, by, { size: 22, weight: 700, color: C.muted, x: xs[i], width: col, gap: 0 });
          bp.line(h.time, by + 34, { size: 26, weight: 800, color: C.ink, x: xs[i], width: col, gap: 0 });
          bp.line(h.sub, by + 70, { size: 22, weight: 600, color: C.muted, x: xs[i], width: col, gap: 0 });
        });
        return by + 70 + 26;
      },
      { bg: "#FFFFFF", border: C.border }
    );
  }

  y += gapFooter;
  y = footer(p, y, t, `${d.dayLabel}의 운세`, "/fortune");
  return y + PAD - 10 + MARGIN;
}

/* ─────────────────────────── 궁합 카드 ─────────────────────────── */

function paintGunghap(ctx, d, H, draw, slack = 0) {
  const t = THEMES.gunghap;
  const p = painter(ctx, draw);
  const gapTop = 40 + Math.round(slack * 0.45);
  const gapFooter = 40 + (slack - Math.round(slack * 0.45));
  if (draw) drawBackdrop(ctx, H, t);
  ctx.textBaseline = "top";

  let y = headerBand(ctx, draw, MARGIN, t, (hp, hy) => {
    let yy = hp.line(`${SITE.name} · 궁합`, hy, { size: 25, weight: 800, color: t.onDark, align: "center", gap: 18 });
    yy = hp.line(d.pairText, yy, { size: 30, weight: 700, color: "#FFFFFF", align: "center", gap: 22 });
    yy = hp.para(d.title, yy, { size: 52, weight: 900, color: "#FFFFFF", lh: 1.22, align: "center", maxLines: 2 });
    yy += 18;
    yy = hp.line(`${d.score}점`, yy, { size: 64, weight: 900, color: t.gold, align: "center", gap: 8 });
    return hp.line(starText(d.stars), yy, { size: 34, weight: 700, color: t.gold, align: "center", gap: 0 });
  });

  y += gapTop;
  y = p.para(d.summary, y, { size: 27, weight: 500, color: C.ink });

  y += 30;
  d.relations.forEach((r, i) => {
    if (i > 0) y += 20;
    y = p.box(
      y,
      (bp, by, o) => {
        const yy = bp.line(r.label, by, { size: 24, weight: 800, color: t.deep, gap: 10, ...o });
        return bp.para(r.text, yy, { size: 25, weight: 500, color: C.ink, lh: 1.6, ...o });
      },
      { bg: t.soft, padY: 22, radius: 22 }
    );
  });

  if (d.areas.length) {
    y += 36;
    d.areas.forEach((a, i) => {
      if (i > 0) {
        y += 18;
        y = p.rule(y, C.border);
        y += 18;
      }
      y = p.labelStars(a.label, null, y, { color: t.deep, gold: t.gold });
      y = p.para(a.text, y, { size: 25, weight: 500, color: C.ink, lh: 1.6 });
    });
  }

  y += gapFooter;
  y = footer(p, y, t, "궁합", "/gunghap");
  return y + PAD - 10 + MARGIN;
}

/* ───────────────────────── 신년운세 카드 ───────────────────────── */

function paintSaeun(ctx, d, H, draw, slack = 0) {
  const t = THEMES.fortune;
  const p = painter(ctx, draw);
  const gapTop = 36 + Math.round(slack * 0.22);
  const gapFooter = 36 + (slack - Math.round(slack * 0.22));
  if (draw) drawBackdrop(ctx, H, t);
  ctx.textBaseline = "top";

  let y = headerBand(ctx, draw, MARGIN, t, (hp, hy) => {
    let yy = hp.line(`${SITE.name} · 신년운세`, hy, { size: 25, weight: 800, color: t.onDark, align: "center", gap: 18 });
    yy = hp.line(d.yearText, yy, { size: 29, weight: 700, color: "#FFFFFF", align: "center", gap: 20 });
    yy = hp.chip(d.godLine, yy, { bg: "rgba(255,255,255,0.14)", color: t.gold, size: 26, h: 52 });
    yy += 22;
    yy = hp.para(d.title, yy, { size: 50, weight: 900, color: "#FFFFFF", lh: 1.22, align: "center", maxLines: 2 });
    yy += 14;
    yy = hp.line(starText(d.stars), yy, { size: 38, weight: 700, color: t.gold, align: "center", gap: 6 });
    return hp.line("연간 총운", yy, { size: 23, weight: 700, color: t.onDark, align: "center", gap: 0 });
  });

  y += gapTop;
  y = p.para(d.summary, y, { size: 26, weight: 500, color: C.ink });

  y += 26;
  y = p.box(
    y,
    (bp, by, o) => {
      const yy = bp.line("한 해의 한마디", by, { size: 23, weight: 800, color: t.deep, gap: 10, ...o });
      return bp.para(d.advice, yy, { size: 28, weight: 800, color: t.calloutInk, lh: 1.5, ...o });
    },
    { bg: t.soft }
  );

  y += 24;
  y = p.box(y, (bp, by, o) => luckyRow(bp, by, o, d, ["이 해의 색", "이 해의 숫자", "이 해의 방향"]), {
    bg: "#FFFFFF",
    border: C.border,
  });

  y += 30;
  y = p.line("열두 달 흐름", y, { size: 27, weight: 800, color: t.deep, gap: 14 });
  // 두 칸씩 여섯 줄로 넣어 카드가 너무 길어지지 않게 합니다.
  const colW = (CW - 20) / 2;
  const rowH = 56;
  d.months.forEach((m, i) => {
    const x = X0 + (i % 2) * (colW + 20);
    const ry = y + Math.floor(i / 2) * rowH;
    if (draw) {
      ctx.fillStyle = Math.floor(i / 2) % 2 === 0 ? t.soft : "#FFFFFF";
      roundRectPath(ctx, x, ry, colW, rowH - 8, 12);
      ctx.fill();
    }
    p.line(m.date, ry + 10, { size: 22, weight: 800, color: C.ink, x: x + 14, width: colW - 200, gap: 0 });
    p.line(m.god, ry + 11, { size: 21, weight: 700, color: C.muted, x: x + colW - 186, width: 66, gap: 0 });
    ctx.font = sans(20, 700);
    if (draw) {
      ctx.fillStyle = t.gold;
      ctx.fillText(starText(m.stars), x + colW - 112, ry + 12);
    }
  });
  y += Math.ceil(d.months.length / 2) * rowH;

  y += gapFooter;
  y = footer(p, y, t, "신년운세", "/fortune/saeun");
  return y + PAD - 10 + MARGIN;
}

/* ──────────────────────── 내 사주 팔자 카드 ──────────────────────── */

function paintSaju(ctx, d, H, draw, slack = 0) {
  const t = THEMES.fortune;
  const p = painter(ctx, draw);
  const gapTop = 36 + Math.round(slack * 0.22);
  const gapFooter = 36 + (slack - Math.round(slack * 0.22));
  if (draw) drawBackdrop(ctx, H, t);
  ctx.textBaseline = "top";

  let y = headerBand(ctx, draw, MARGIN, t, (hp, hy) => {
    let yy = hp.line(`${SITE.name} · 내 사주 팔자`, hy, { size: 25, weight: 800, color: t.onDark, align: "center", gap: 18 });
    yy = hp.line(d.ilganLine, yy, { size: 30, weight: 700, color: "#FFFFFF", align: "center", gap: 18 });
    yy = hp.para(d.alias, yy, { size: 46, weight: 900, color: "#FFFFFF", lh: 1.24, align: "center", maxLines: 2 });
    yy += 16;
    return hp.line(d.keywords, yy, { size: 24, weight: 700, color: t.onDark, align: "center", gap: 0 });
  });

  // 네 기둥 (연주·월주·일주·시주)
  y += gapTop;
  const pw = (CW - 24) / 4;
  d.pillars.forEach((col, i) => {
    const x = X0 + i * (pw + 8);
    p.line(col.name, y, { size: 22, weight: 800, color: col.me ? t.deep : C.muted, x, width: pw, align: "center", gap: 0 });
    [col.stem, col.branch].forEach((ch, k) => {
      const by = y + 32 + k * 96;
      if (draw) {
        ctx.fillStyle = "#FFFFFF";
        roundRectPath(ctx, x, by, pw, 88, 14);
        ctx.fill();
        ctx.lineWidth = ch ? 3 : 2;
        ctx.strokeStyle = ch ? EL_COLORS[ch.el] : C.border;
        ctx.stroke();
      }
      if (!ch) {
        if (k === 0) p.para("시간 모름", by + 32, { size: 19, weight: 700, color: C.muted, x, width: pw, align: "center" });
        return;
      }
      p.line(ch.hanja, by + 12, { size: 44, weight: 800, color: EL_COLORS[ch.el], x, width: pw, align: "center", gap: 0 });
      p.line(ch.ko, by + 62, { size: 20, weight: 700, color: C.muted, x, width: pw, align: "center", gap: 0 });
    });
  });
  y += 32 + 96 + 88;

  // 오행 분포
  y += 30;
  y = p.line("오행 분포", y, { size: 26, weight: 800, color: t.deep, gap: 14 });
  const max = Math.max(...d.elements.map((e) => e.count), 1);
  d.elements.forEach((el, i) => {
    const ry = y + i * 48;
    p.line(el.name, ry + 2, { size: 23, weight: 700, color: C.ink, x: X0, width: 120, gap: 0 });
    if (draw) {
      const barX = X0 + 130;
      const barW = CW - 130 - 56;
      ctx.fillStyle = "#EFE9E3";
      roundRectPath(ctx, barX, ry + 4, barW, 24, 12);
      ctx.fill();
      if (el.count > 0) {
        ctx.fillStyle = EL_COLORS[i];
        roundRectPath(ctx, barX, ry + 4, Math.max(26, (barW * el.count) / max), 24, 12);
        ctx.fill();
      }
    }
    p.line(String(el.count), ry + 2, { size: 23, weight: 800, color: C.muted, x: W - X0 - 44, width: 44, align: "center", gap: 0 });
  });
  y += d.elements.length * 48;

  y += 16;
  y = p.para(d.summary, y, { size: 25, weight: 500, color: C.ink });

  y += 26;
  const halfW = (CW - 20) / 2;
  const sideBox = (items, label, x) =>
    p.box(
      y,
      (bp, by, o) => {
        let yy = bp.line(label, by, { size: 22, weight: 800, color: t.deep, gap: 10, ...o });
        items.forEach((it) => {
          yy = bp.para(`· ${it}`, yy, { size: 21, weight: 500, color: C.ink, lh: 1.5, ...o });
          yy += 6;
        });
        return yy;
      },
      { bg: t.soft, padX: 18, padY: 18, radius: 18, x, width: halfW }
    );
  y = Math.max(sideBox(d.strengths, "이런 점이 빛나요", X0), sideBox(d.cautions, "이런 점은 살펴봐요", X0 + halfW + 20));

  y += gapFooter;
  y = footer(p, y, t, "내 사주 팔자", "/fortune/saju");
  return y + PAD - 10 + MARGIN;
}

/**
 * 높이를 먼저 재서(최소 1920) 캔버스를 만들고, 내용이 짧아 남는 높이는 헤더 아래와 주소 위에
 * 나눠 넣습니다. 헤더 띠는 항상 카드 맨 위에 붙습니다.
 */
async function render(paint, data) {
  const measure = document.createElement("canvas").getContext("2d");
  const need = Math.ceil(paint(measure, data, MIN_H, false, 0));
  const H = Math.max(MIN_H, need);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  paint(ctx, data, H, true, H - need);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return { blob, dataUrl: canvas.toDataURL("image/png") };
}

export const buildTodayCard = (data) => render(paintToday, data);
export const buildGunghapCard = (data) => render(paintGunghap, data);
export const buildSaeunCard = (data) => render(paintSaeun, data);
export const buildSajuCard = (data) => render(paintSaju, data);
