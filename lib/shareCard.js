/**
 * 결과를 SNS 공유용 이미지 카드(PNG)로 그립니다. 전부 브라우저에서 처리됩니다.
 * 반환: { blob, dataUrl }
 */

const W = 1080;
const H = 1350;
const ACCENT = "#ff3b5c";
const ACCENT2 = "#ffd23f";
const INK = "#1a1a1a";
const BG = "#fffbf3";

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
  ctx.strokeStyle = INK;
  ctx.stroke();
}

export async function buildShareCard(result, meSrc, targetSrc) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const font = (size, weight = 800) =>
    `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Malgun Gothic", sans-serif`;

  // 상단 브랜드
  ctx.fillStyle = ACCENT;
  ctx.font = font(40);
  ctx.textAlign = "left";
  ctx.fillText("닮음테스트", 72, 110);

  // 아바타 + ×
  const [meImg, tgImg] = await Promise.all([loadImage(meSrc), loadImage(targetSrc)]);
  drawAvatar(ctx, meImg, 330, 360, 130);
  drawAvatar(ctx, tgImg, 750, 360, 130);
  ctx.fillStyle = INK;
  ctx.font = font(60);
  ctx.textAlign = "center";
  ctx.fillText("×", 540, 382);

  // 전체 %
  ctx.fillStyle = ACCENT;
  ctx.font = font(190);
  ctx.fillText(`${result.overall}%`, 540, 660);
  ctx.fillStyle = INK;
  ctx.font = font(34, 700);
  ctx.fillText("전체 닮음도", 540, 715);

  // 코멘트 pill
  ctx.font = font(38);
  const pillText = result.comment;
  const pillW = ctx.measureText(pillText).width + 80;
  roundRect(ctx, 540 - pillW / 2, 760, pillW, 78, 30);
  ctx.fillStyle = ACCENT2;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillText(pillText, 540, 812);

  // 부위별 막대
  const parts = result.parts;
  const startY = 910;
  const rowH = 62;
  const barX = 300;
  const barW = 560;
  ctx.textAlign = "left";
  parts.forEach((p, i) => {
    const y = startY + i * rowH;
    ctx.fillStyle = INK;
    ctx.font = font(30, 800);
    ctx.fillText(p.name.replace(/\(.*\)/, ""), 72, y + 8);
    // 트랙
    roundRect(ctx, barX, y - 14, barW, 22, 11);
    ctx.fillStyle = "rgba(26,26,26,0.10)";
    ctx.fill();
    // 채움
    roundRect(ctx, barX, y - 14, (barW * p.score) / 100, 22, 11);
    ctx.fillStyle = ACCENT;
    ctx.fill();
    // 점수
    ctx.fillStyle = ACCENT;
    ctx.font = font(30, 800);
    ctx.textAlign = "right";
    ctx.fillText(`${p.score}%`, W - 72, y + 8);
    ctx.textAlign = "left";
  });

  // 하단 안내
  ctx.fillStyle = "rgba(26,26,26,0.55)";
  ctx.font = font(26, 700);
  ctx.textAlign = "center";
  ctx.fillText("재미로 보는 닮은꼴 분석 · 사진은 저장되지 않아요", 540, H - 70);

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  return { blob, dataUrl };
}
