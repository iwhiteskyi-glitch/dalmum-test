/**
 * 여행 이름 결과를 인스타 스토리 비율(1080×1920)의 "여행 치트시트" 이미지로 그립니다.
 * 위쪽은 이름 카드, 아래쪽은 인사말·명소·음식 — 사진 한 장만 저장해도 여행 중에 꺼내 볼 수 있게.
 * 전부 브라우저 안에서만 처리됩니다. 반환: { blob, dataUrl }
 */
import { drawAvatar } from "./avatar";

const W = 1080;
const MIN_H = 1920;
const MARGIN = 36;
const PAD = 64;
const X0 = MARGIN + PAD;
const CW = W - 2 * X0;

const C = {
  ink: "#30242C",
  muted: "#776872",
  teal: "#12A4B0",
  tealDeep: "#0A6F78",
  tealSoft: "#DFF4F5",
  mustard: "#F3B54A",
  mustardInk: "#7A5300",
  mustardSoft: "#FDF0D5",
  paper: "#FFFAF6",
  surface: "#FFFFFF",
  border: "#EEE3DA",
};

const SANS = `-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Segoe UI", sans-serif`;
const sans = (size, weight = 700) => `${weight} ${size}px ${SANS}`;
// 한글 글꼴로 일본어를 그리면 글자 사이가 벌어져 보여서 일본어는 일본어 글꼴을 먼저 씁니다.
const JA = `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", ${SANS}`;

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 공백 기준으로 줄을 나누고(한글 단어가 중간에서 끊기지 않게), 한 단어가 너무 길 때만 글자 단위로 자릅니다.
function wrapLines(ctx, text, maxWidth, maxLines) {
  const lines = [];
  let line = "";
  const push = (l) => lines.push(l);
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) push(line);
    line = "";
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
      continue;
    }
    for (const ch of word) {
      if (ctx.measureText(line + ch).width > maxWidth) {
        push(line);
        line = ch;
      } else line += ch;
    }
  }
  if (line) push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

// 너비 안에 들어갈 때까지 글자 크기를 줄입니다.
function fitFont(ctx, text, maxWidth, size, minSize, weight, family = SANS) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (s > minSize && ctx.measureText(text).width > maxWidth) {
    s -= 1;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

function chipWidth(ctx, text, padX) {
  return ctx.measureText(text).width + padX * 2;
}

function drawChip(ctx, text, x, y, h, bg, color, padX) {
  const w = chipWidth(ctx, text, padX);
  ctx.fillStyle = bg;
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 1);
  ctx.textBaseline = "top";
  return w;
}

/** 칩(태그)들을 가운데 정렬로 여러 줄에 걸쳐 배치합니다. 반환: 다음 y */
function drawChipRows(ctx, chips, y, h, gap) {
  ctx.font = sans(27, 800);
  const rows = [[]];
  let rowW = 0;
  for (const chip of chips) {
    const w = chipWidth(ctx, chip.text, 22);
    if (rows[rows.length - 1].length && rowW + gap + w > CW) {
      rows.push([]);
      rowW = 0;
    }
    rows[rows.length - 1].push({ ...chip, w });
    rowW += (rowW ? gap : 0) + w;
  }
  rows.forEach((row, i) => {
    const total = row.reduce((s, c) => s + c.w, 0) + gap * (row.length - 1);
    let x = (W - total) / 2;
    for (const c of row) {
      drawChip(ctx, c.text, x, y + i * (h + gap), h, c.bg, c.color, 22);
      x += c.w + gap;
    }
  });
  return y + rows.length * (h + gap) - gap;
}

function drawCenter(ctx, text, y) {
  const w = ctx.measureText(text).width;
  ctx.fillText(text, (W - w) / 2, y);
}

/**
 * 레이아웃 계산과 그리기를 같은 함수로 처리합니다. draw=false로 한 번 돌려 필요한 높이를
 * 구한 뒤, 그 높이(최소 1920)로 캔버스를 만들어 실제로 그립니다.
 */
function paint(ctx, data, H, draw) {
  const { card, moods, country, city, phrases, urlText, displayFont } = data;
  const gaegu = (size) => `700 ${size}px ${displayFont}, ${SANS}`;
  const localFamily = country.lang_code === "ja" ? JA : SANS;
  let y = MARGIN;

  if (draw) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#A6DFE3");
    g.addColorStop(1, "#FCD9A8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.paper;
    roundRectPath(ctx, MARGIN, MARGIN, W - 2 * MARGIN, H - 2 * MARGIN, 56);
    ctx.fill();

    // 우표 모양 장식
    ctx.save();
    ctx.translate(W - MARGIN - 110, MARGIN + 44);
    ctx.rotate((8 * Math.PI) / 180);
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(18,164,176,0.55)";
    roundRectPath(ctx, 0, 0, 66, 66, 10);
    ctx.stroke();
    ctx.restore();
  }
  ctx.textBaseline = "top";

  // 머리글 + 장소
  y += 62;
  ctx.font = sans(25, 800);
  ctx.fillStyle = C.muted;
  if (draw) drawCenter(ctx, "T R A V E L   N A M E   C A R D", y);
  y += 50;
  ctx.font = sans(30, 800);
  const place = `📍 ${city.city_name}, ${country.name}`;
  const pw = chipWidth(ctx, place, 26);
  if (draw) drawChip(ctx, place, (W - pw) / 2, y, 58, C.tealSoft, C.tealDeep, 26);
  y += 58 + 26;

  // 캐릭터
  const avatarSize = 240;
  if (draw) drawAvatar(ctx, card.avatar, (W - avatarSize) / 2, y, avatarSize, C.tealSoft);
  y += avatarSize + 22;

  // 이름
  const nameSize = fitFont(ctx, card.pronunciation_kr, CW, 116, 64, 700, `${displayFont}, ${SANS}`);
  ctx.font = gaegu(nameSize);
  ctx.fillStyle = C.ink;
  if (draw) drawCenter(ctx, card.pronunciation_kr, y);
  y += nameSize + 14;

  const localText =
    card.name_local !== card.romanized ? `${card.name_local} · ${card.romanized}` : card.romanized;
  ctx.font = `700 30px ${localFamily}`;
  ctx.fillStyle = C.muted;
  if (draw) drawCenter(ctx, localText, y);
  y += 48;

  if (card.meaning_kr) {
    ctx.font = sans(28, 600);
    ctx.fillStyle = C.tealDeep;
    for (const l of wrapLines(ctx, card.meaning_kr, CW, 2)) {
      if (draw) drawCenter(ctx, l, y);
      y += 40;
    }
    y += 6;
  }

  ctx.font = sans(34, 600);
  ctx.fillStyle = C.ink;
  for (const l of wrapLines(ctx, card.blurb, CW, 2)) {
    if (draw) drawCenter(ctx, l, y);
    y += 48;
  }
  y += 20;

  const chips = [
    { text: card.title, bg: C.mustardSoft, color: C.mustardInk },
    ...(moods.length ? moods : [card.vibe]).map((m) => ({
      text: `#${m}`,
      bg: C.tealSoft,
      color: C.tealDeep,
    })),
  ];
  if (draw) y = drawChipRows(ctx, chips, y, 54, 12);
  else {
    // 높이 계산만: 실제 배치와 같은 방식으로 줄 수를 셉니다.
    ctx.font = sans(27, 800);
    let rows = 1;
    let rowW = 0;
    for (const c of chips) {
      const w = chipWidth(ctx, c.text, 22);
      if (rowW && rowW + 12 + w > CW) {
        rows++;
        rowW = 0;
      }
      rowW += (rowW ? 12 : 0) + w;
    }
    y += rows * 66 - 12;
  }
  y += 44;

  // 치트시트 구분선
  if (draw) {
    ctx.save();
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#E3D5C8";
    ctx.beginPath();
    ctx.moveTo(X0, y + 26);
    ctx.lineTo(W - X0, y + 26);
    ctx.stroke();
    ctx.restore();
    ctx.font = gaegu(50);
    const label = "여행 치트시트";
    const lw = ctx.measureText(label).width + 48;
    ctx.fillStyle = C.paper;
    ctx.fillRect((W - lw) / 2, y, lw, 56);
    ctx.fillStyle = C.ink;
    drawCenter(ctx, label, y + 2);
  }
  y += 56 + 26;

  // 인사말
  ctx.font = sans(28, 800);
  ctx.fillStyle = C.ink;
  if (draw) ctx.fillText(`${country.language} 한마디`, X0, y);
  y += 46;
  const rowH = 84;
  for (const p of phrases) {
    if (draw) {
      ctx.fillStyle = C.surface;
      roundRectPath(ctx, X0, y, CW, rowH, 18);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = sans(28, 600);
      ctx.fillStyle = C.muted;
      ctx.textBaseline = "middle";
      ctx.fillText(p.meaning_kr, X0 + 24, y + rowH / 2);
      ctx.textBaseline = "top";

      const right = X0 + CW - 24;
      const maxW = CW - 300;
      fitFont(ctx, p.text_local, maxW, 31, 20, 800, localFamily);
      ctx.fillStyle = C.ink;
      ctx.fillText(p.text_local, right - ctx.measureText(p.text_local).width, y + 10);
      fitFont(ctx, p.pronunciation_kr, maxW, 25, 18, 700);
      ctx.fillStyle = C.tealDeep;
      ctx.fillText(p.pronunciation_kr, right - ctx.measureText(p.pronunciation_kr).width, y + 48);
    }
    y += rowH + 10;
  }
  y += 18;

  // 명소 · 음식 (두 칸)
  const colGap = 20;
  const colW = (CW - colGap) / 2;
  const itemH = 50;
  const boxH = 24 + 44 + itemH * 3 + 12;
  const cols = [
    { label: "대표 명소", items: city.attractions.map((a) => a.name), dot: C.teal },
    { label: "대표 음식", items: city.foods.map((f) => f.name), dot: C.mustard },
  ];
  if (draw) {
    cols.forEach((col, i) => {
      const x = X0 + i * (colW + colGap);
      ctx.fillStyle = C.surface;
      roundRectPath(ctx, x, y, colW, boxH, 20);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = sans(27, 800);
      ctx.fillStyle = C.ink;
      ctx.fillText(col.label, x + 24, y + 24);
      col.items.forEach((name, j) => {
        const iy = y + 24 + 44 + j * itemH;
        ctx.fillStyle = col.dot;
        ctx.beginPath();
        ctx.arc(x + 32, iy + 17, 7, 0, Math.PI * 2);
        ctx.fill();
        fitFont(ctx, name, colW - 70, 28, 19, 700);
        ctx.fillStyle = C.ink;
        ctx.fillText(name, x + 50, iy + 2);
      });
    });
  }
  y += boxH + 34;

  // 바닥글
  ctx.font = sans(26, 700);
  ctx.fillStyle = C.tealDeep;
  if (draw) drawCenter(ctx, urlText, y);
  y += 40;
  ctx.font = sans(23, 600);
  ctx.fillStyle = C.muted;
  if (draw) drawCenter(ctx, "닮았네 · 여행가면 내 이름은?", y);
  y += 34;

  return y + PAD - 20 + MARGIN;
}

export async function buildTravelCard(data) {
  if (document.fonts?.load) {
    try {
      await document.fonts.load(`700 116px ${data.displayFont}`, data.card.pronunciation_kr);
    } catch {
      /* 글꼴을 못 불러오면 기본 글꼴로 그림 */
    }
  }
  const measure = document.createElement("canvas").getContext("2d");
  const H = Math.max(MIN_H, Math.ceil(paint(measure, data, MIN_H, false)));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  paint(ctx, data, H, true);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return { blob, dataUrl: canvas.toDataURL("image/png") };
}
