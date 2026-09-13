/**
 * 결과를 SNS 공유용 이미지 카드(PNG)로 그립니다. 전부 브라우저에서 처리됩니다.
 * 반환: { blob, dataUrl }
 */
import { SITE } from "@/lib/site";

const W = 1080;
const H = 1350;
const ACCENT = "#ce2857";
const ACCENT_SOFT = "#ffe7ee";
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

export async function buildShareCard(result, meSrc, targetSrc) {
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

  const font = (size, weight = 800) =>
    `${weight} ${size}px -apple-system, "Apple SD Gothic Neo", BlinkMacSystemFont, "Segoe UI", Roboto, "Malgun Gothic", sans-serif`;

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
  drawAvatar(ctx, meImg, 350, 470, 118);
  drawAvatar(ctx, tgImg, 730, 470, 118);
  ctx.fillStyle = INK;
  ctx.font = font(56);
  ctx.fillText("×", 540, 492);

  // 전체 %
  ctx.fillStyle = ACCENT;
  ctx.font = font(180);
  ctx.fillText(`${result.overall}%`, 540, 800);
  ctx.fillStyle = MUTED;
  ctx.font = font(32, 700);
  ctx.fillText("전체 닮음도", 540, 848);

  // 가장 닮은 부위 (흰색 알약)
  const bestPart = result.parts.find((p) => p.isBest) || result.parts[0];
  ctx.font = font(34, 700);
  const bestText = `가장 닮은 부위 ${bestPart.name} · ${bestPart.score}%`;
  const pillW = ctx.measureText(bestText).width + 76;
  roundRect(ctx, 540 - pillW / 2, 900, pillW, 76, 38);
  ctx.fillStyle = SURFACE;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillText(bestText, 540, 950);

  // 코멘트
  ctx.fillStyle = INK;
  ctx.font = font(40, 800);
  ctx.fillText(result.comment, 540, 1050);

  // 하단 CTA + 서비스 주소
  ctx.fillStyle = ACCENT;
  ctx.font = font(30, 800);
  ctx.fillText("너랑 나도 비교해 볼까?", 540, 1160);
  ctx.fillStyle = MUTED;
  ctx.font = font(24, 600);
  const domain = SITE.url.replace(/^https?:\/\//, "");
  ctx.fillText(`${domain} · 재미로 보는 닮음 비교`, 540, 1205);

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  return { blob, dataUrl };
}
