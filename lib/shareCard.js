/**
 * 결과를 SNS 공유용 이미지 카드(PNG)로 그립니다. 전부 브라우저에서 처리됩니다.
 * variant: "summary"(부위별 점수만, 짧게) | "detailed"(부위별 사진+설명까지 전부)
 * 반환: { blob, dataUrl }
 */
import { SITE } from "@/lib/site";
import { splitClauses } from "@/lib/faceAnalysis";

const W = 1080;
const ACCENT = "#ce2857";
const ACCENT_SOFT = "#ffe7ee";
const FOCUS = "#7b65ca"; // "대상" 쪽 강조색 (앱 결과 화면과 동일한 색 구분)
const INK = "#30242c";
const MUTED = "#776872";
const BG = "#faf7f3";
const SURFACE = "#ffffff";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawAvatar(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    const s = Math.max((2 * r) / img.width, (2 * r) / img.height);
    ctx.drawImage(img, cx - (img.width * s) / 2, cy - (img.height * s) / 2, img.width * s, img.height * s);
  } else {
    ctx.fillStyle = "#eee";
    ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = SURFACE;
  ctx.stroke();
}

/** 정사각형 썸네일을 object-fit:cover처럼 잘라서 둥근 모서리로 그립니다. */
function drawCoverImage(ctx, img, x, y, w, h, radius) {
  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  if (img) {
    const s = Math.max(w / img.width, h / img.height);
    const iw = img.width * s;
    const ih = img.height * s;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  } else {
    ctx.fillStyle = ACCENT_SOFT;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

const font = (size, weight = 800) =>
  `${weight} ${size}px -apple-system, "Apple SD Gothic Neo", BlinkMacSystemFont, "Segoe UI", Roboto, "Malgun Gothic", sans-serif`;

export async function buildShareCard(result, meSrc, targetSrc, variant = "summary") {
  const detailed = variant === "detailed";

  // ---- 부위별 블록 크기를 먼저 계산해서 캔버스 전체 높이를 정합니다 ----
  const rowX = 88;
  const rowW = W - 176;
  const topSectionEndY = 1050; // 브랜드~코멘트까지 고정 섹션이 끝나는 지점

  let compactRowH = 58;
  let compactRowGap = 14;

  let detailBlocks = null;
  let bottomY; // 부위 섹션이 끝나는 y좌표 (그 아래 CTA/주소가 옴)

  if (detailed) {
    const thumbSize = 130;
    const thumbGap = 16;
    const colW = (rowW - 48 - thumbGap) / 2;
    const lineH = 25;
    let y = topSectionEndY;
    detailBlocks = result.parts.map((p) => {
      const meClauses = splitClauses(p.meDesc);
      const targetClauses = splitClauses(p.targetDesc);
      const lines = Math.max(meClauses.length, targetClauses.length, 1);
      const cardH = 24 + 34 + 12 + 14 + 16 + thumbSize + 8 + 26 + 6 + lines * lineH + 24;
      const block = { p, meClauses, targetClauses, cardH, y, thumbSize, thumbGap, colW, lineH };
      y += cardH + 16;
      return block;
    });
    bottomY = y;
  } else {
    bottomY = topSectionEndY + result.parts.length * (compactRowH + compactRowGap);
  }

  const H = bottomY + 130; // CTA + 서비스 주소 + 여백

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  // 카드 느낌을 주는 옅은 분홍 배경 패널
  roundRect(ctx, 40, 40, W - 80, H - 80, 40);
  ctx.fillStyle = ACCENT_SOFT;
  ctx.fill();

  ctx.textAlign = "center";

  // 브랜드 + 제목
  ctx.fillStyle = ACCENT;
  ctx.font = font(34);
  ctx.fillText(SITE.name, 540, 148);
  ctx.fillStyle = INK;
  ctx.font = font(52);
  ctx.fillText("우리 이 정도로", 540, 230);
  ctx.fillText("닮았다고?", 540, 296);

  // 아바타 + ×
  const [meImg, tgImg] = await Promise.all([loadImage(meSrc), loadImage(targetSrc)]);
  drawAvatar(ctx, meImg, 350, 440, 110);
  drawAvatar(ctx, tgImg, 730, 440, 110);
  ctx.fillStyle = INK;
  ctx.font = font(52);
  ctx.fillText("×", 540, 460);

  // 전체 %
  ctx.fillStyle = ACCENT;
  ctx.font = font(170);
  ctx.fillText(`${result.overall}%`, 540, 760);
  ctx.fillStyle = MUTED;
  ctx.font = font(30, 700);
  ctx.fillText("전체 닮음도", 540, 806);

  // 가장 닮은 부위 (흰색 알약)
  const bestPart = result.parts.find((p) => p.isBest) || result.parts[0];
  ctx.font = font(32, 700);
  const bestText = `가장 닮은 부위 ${bestPart.name} · ${bestPart.score}%`;
  const pillW = ctx.measureText(bestText).width + 76;
  roundRect(ctx, 540 - pillW / 2, 856, pillW, 72, 36);
  ctx.fillStyle = SURFACE;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillText(bestText, 540, 902);

  // 코멘트
  ctx.fillStyle = INK;
  ctx.font = font(38, 800);
  ctx.fillText(result.comment, 540, 990);

  if (detailed) {
    // ---- 상세: 부위별 사진 + 나/대상 설명 전부 ----
    const partImages = await Promise.all(
      result.parts.map(async (p) => ({
        me: await loadImage(p.meCrop),
        target: await loadImage(p.targetCrop),
      }))
    );

    detailBlocks.forEach((block, i) => {
      const { p, meClauses, targetClauses, cardH, y, thumbSize, thumbGap, colW, lineH } = block;
      const img = partImages[i];

      roundRect(ctx, rowX, y, rowW, cardH, 20);
      ctx.fillStyle = SURFACE;
      ctx.fill();

      let cy = y + 24;
      ctx.textAlign = "left";
      ctx.fillStyle = INK;
      ctx.font = font(30, 800);
      ctx.fillText(p.name.replace(/\(.*\)/, ""), rowX + 24, cy + 24);
      ctx.textAlign = "right";
      ctx.fillStyle = ACCENT;
      ctx.fillText(`${p.score}%`, rowX + rowW - 24, cy + 24);
      ctx.textAlign = "left";
      cy += 34 + 12;

      const barX = rowX + 24;
      const barW = rowW - 48;
      roundRect(ctx, barX, cy, barW, 14, 7);
      ctx.fillStyle = "rgba(48,36,44,0.08)";
      ctx.fill();
      roundRect(ctx, barX, cy, (barW * p.score) / 100, 14, 7);
      ctx.fillStyle = ACCENT;
      ctx.fill();
      cy += 14 + 16;

      const col1X = rowX + 24;
      const col2X = col1X + colW + thumbGap;
      drawCoverImage(ctx, img.me, col1X, cy, thumbSize, thumbSize, 16);
      drawCoverImage(ctx, img.target, col2X, cy, thumbSize, thumbSize, 16);

      const labelY = cy + thumbSize + 26;
      ctx.textAlign = "center";
      ctx.font = font(20, 800);
      ctx.fillStyle = ACCENT;
      ctx.fillText("나", col1X + thumbSize / 2, labelY);
      ctx.fillStyle = FOCUS;
      ctx.fillText("대상", col2X + thumbSize / 2, labelY);

      const textY = labelY + 6 + lineH;
      ctx.font = font(20, 600);
      ctx.fillStyle = INK;
      meClauses.forEach((line, li) => {
        ctx.fillText(line, col1X + thumbSize / 2, textY + li * lineH, colW);
      });
      targetClauses.forEach((line, li) => {
        ctx.fillText(line, col2X + thumbSize / 2, textY + li * lineH, colW);
      });
      ctx.textAlign = "left";
    });
  } else {
    // ---- 요약: 부위별 점수 막대만 (흰색 행 카드) ----
    let y = topSectionEndY;
    ctx.textAlign = "left";
    result.parts.forEach((p) => {
      roundRect(ctx, rowX, y, rowW, compactRowH, 18);
      ctx.fillStyle = SURFACE;
      ctx.fill();

      ctx.fillStyle = INK;
      ctx.font = font(27, 800);
      // "이목구비 배치 비율" 같은 긴 이름은 좁은 행에서 막대와 겹치니 첫 단어만 씁니다.
      const shortName = p.name.replace(/\(.*\)/, "").split(" ")[0];
      ctx.fillText(shortName, rowX + 24, y + compactRowH / 2 + 9);

      const barX = rowX + 250;
      const barW = rowW - 250 - 140;
      const barY = y + compactRowH / 2 - 8;
      roundRect(ctx, barX, barY, barW, 16, 8);
      ctx.fillStyle = "rgba(48,36,44,0.08)";
      ctx.fill();
      roundRect(ctx, barX, barY, (barW * p.score) / 100, 16, 8);
      ctx.fillStyle = ACCENT;
      ctx.fill();

      ctx.textAlign = "right";
      ctx.fillStyle = ACCENT;
      ctx.font = font(27, 800);
      ctx.fillText(`${p.score}%`, rowX + rowW - 24, y + compactRowH / 2 + 9);
      ctx.textAlign = "left";

      y += compactRowH + compactRowGap;
    });
  }

  // 하단 CTA + 서비스 주소
  ctx.textAlign = "center";
  ctx.fillStyle = ACCENT;
  ctx.font = font(30, 800);
  ctx.fillText("너랑 나도 비교해 볼까?", 540, bottomY + 46);
  ctx.fillStyle = MUTED;
  ctx.font = font(24, 600);
  const domain = SITE.url.replace(/^https?:\/\//, "");
  ctx.fillText(`${domain} · 재미로 보는 닮음 비교`, 540, bottomY + 90);

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  return { blob, dataUrl };
}
