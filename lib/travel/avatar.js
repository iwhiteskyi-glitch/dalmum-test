// 여행 캐릭터를 "도형 목록"으로 만든 뒤, 화면용 SVG와 공유 이미지용 캔버스가 같은 목록을
// 각자 그립니다. (캔버스에 SVG 이미지를 올리면 일부 아이폰 브라우저에서 저장이 막힐 수 있어
// 이미지 변환 없이 직접 그립니다.) 값은 모두 recommend.js가 정한 내부 값입니다.
const INK = "#2D2A2A";

const FRINGE = {
  short: "M30,62 C28,38 44,30 60,30 C76,30 92,38 90,62 C84,50 74,44 60,44 C46,44 36,50 30,62 Z",
  spiky:
    "M30,60 L32,42 L40,46 L44,32 L52,40 L60,28 L68,40 L76,32 L80,46 L88,42 L90,60 C84,50 74,46 60,46 C46,46 36,50 30,60 Z",
  sidepart:
    "M30,64 C27,40 42,30 62,30 C80,30 93,42 90,62 C86,54 80,50 72,48 C64,46 54,44 44,52 C38,56 33,60 30,64 Z",
  soft: "M31,58 C32,40 46,33 60,33 C74,33 88,40 89,58 C80,50 70,47 60,47 C50,47 40,50 31,58 Z",
};

const BACK_HAIR = {
  bob: "M26,64 C26,38 42,28 60,28 C78,28 94,38 94,64 L94,86 Q94,92 88,92 L32,92 Q26,92 26,86 Z",
  long: "M24,64 C24,36 42,26 60,26 C78,26 96,36 96,64 L98,108 Q98,113 93,113 L27,113 Q22,113 22,108 Z",
};

const CURLS = [
  [34, 56, 9],
  [40, 44, 10],
  [50, 36, 11],
  [62, 33, 12],
  [74, 37, 11],
  [83, 46, 10],
  [87, 58, 8],
];

const stroke = (d) => ({ t: "path", d, stroke: INK, sw: 2.6 });
const dot = (cx, cy) => ({ t: "circle", cx, cy, r: 3.2, fill: INK });

function faceShapes(expression, blush) {
  const cheeks = [
    { t: "circle", cx: 43, cy: 77, r: 5.5, fill: blush, opacity: 0.7 },
    { t: "circle", cx: 77, cy: 77, r: 5.5, fill: blush, opacity: 0.7 },
  ];
  if (expression === "grin")
    return [
      ...cheeks,
      stroke("M45,69 Q49,64 53,69"),
      stroke("M67,69 Q71,64 75,69"),
      { t: "path", d: "M51,79 Q60,91 69,79 Z", fill: "#8A3B3B" },
    ];
  if (expression === "wink")
    return [...cheeks, dot(49, 68), stroke("M67,69 Q71,65 75,69"), stroke("M53,81 Q60,86 67,81")];
  return [...cheeks, dot(49, 68), dot(71, 68), stroke("M52,80 Q60,87 68,80")];
}

function accessoryShapes(type) {
  switch (type) {
    case "sunglasses":
      return [
        { t: "rect", x: 39, y: 62, w: 19, h: 11, rx: 4, fill: INK },
        { t: "rect", x: 62, y: 62, w: 19, h: 11, rx: 4, fill: INK },
        { t: "rect", x: 57, y: 65, w: 6, h: 2.4, fill: INK },
      ];
    case "strawhat":
      return [
        { t: "path", d: "M38,42 C38,18 82,18 82,42 Z", fill: "#E8C77A" },
        { t: "ellipse", cx: 60, cy: 42, rx: 42, ry: 8, fill: "#E8C77A" },
        { t: "rect", x: 38, y: 35, w: 44, h: 5, fill: "#D9694F" },
      ];
    case "cap":
      return [
        { t: "path", d: "M32,50 C32,24 88,24 88,50 Z", fill: "#12A4B0" },
        { t: "path", d: "M60,47 C76,45 96,47 101,53 C90,55 70,54 60,51 Z", fill: "#0B8792" },
        { t: "circle", cx: 60, cy: 27, r: 2.6, fill: "#0B8792" },
      ];
    case "flower":
      return [
        ...[
          [84, 38],
          [90, 43],
          [88, 50],
          [80, 50],
          [78, 43],
        ].map(([cx, cy]) => ({ t: "circle", cx, cy, r: 4.2, fill: "#FF8FAB" })),
        { t: "circle", cx: 84, cy: 45, r: 3.2, fill: "#FFD166" },
      ];
    case "ribbon":
      return [
        { t: "path", d: "M82,40 L70,32 L71,48 Z", fill: "#FF6B8A" },
        { t: "path", d: "M82,40 L94,32 L93,48 Z", fill: "#FF6B8A" },
        { t: "circle", cx: 82, cy: 40, r: 4, fill: "#E04E70" },
      ];
    default:
      return [];
  }
}

export function avatarShapes(avatar, bg = "#DFF4F5") {
  const { skin, hairColor, blush, hair, expression, accessory } = avatar;
  const hatOn = accessory === "strawhat" || accessory === "cap";
  const shapes = [];
  if (bg) shapes.push({ t: "circle", cx: 60, cy: 60, r: 60, fill: bg });

  if (BACK_HAIR[hair]) shapes.push({ t: "path", d: BACK_HAIR[hair], fill: hairColor });
  else if (hair === "bun" && !hatOn) shapes.push({ t: "circle", cx: 60, cy: 28, r: 11, fill: hairColor });
  else if (hair === "ponytail")
    shapes.push({ t: "ellipse", cx: 93, cy: 74, rx: 10, ry: 21, rot: -18, fill: hairColor });

  shapes.push({ t: "circle", cx: 60, cy: 66, r: 30, fill: skin });

  if (hair === "curly")
    CURLS.forEach(([cx, cy, r]) => shapes.push({ t: "circle", cx, cy, r, fill: hairColor }));
  else shapes.push({ t: "path", d: FRINGE[hair] || FRINGE.soft, fill: hairColor });

  return [...shapes, ...faceShapes(expression, blush), ...accessoryShapes(accessory)];
}

function shapeToSvg(s) {
  const paint = `fill="${s.fill || "none"}"${s.opacity ? ` opacity="${s.opacity}"` : ""}${
    s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.sw}" stroke-linecap="round"` : ""
  }`;
  switch (s.t) {
    case "circle":
      return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" ${paint}/>`;
    case "ellipse":
      return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"${
        s.rot ? ` transform="rotate(${s.rot} ${s.cx} ${s.cy})"` : ""
      } ${paint}/>`;
    case "rect":
      return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"${s.rx ? ` rx="${s.rx}"` : ""} ${paint}/>`;
    default:
      return `<path d="${s.d}" ${paint}/>`;
  }
}

export function avatarSvg(avatar, { size = 64, bg } = {}) {
  const body = avatarShapes(avatar, bg).map(shapeToSvg).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">${body}</svg>`;
}

/** 캔버스의 (x, y) 위치에 size 크기로 캐릭터를 그립니다. */
export function drawAvatar(ctx, avatar, x, y, size, bg) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 120, size / 120);
  for (const s of avatarShapes(avatar, bg)) {
    ctx.globalAlpha = s.opacity ?? 1;
    ctx.beginPath();
    if (s.t === "circle") ctx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
    else if (s.t === "ellipse")
      ctx.ellipse(s.cx, s.cy, s.rx, s.ry, ((s.rot || 0) * Math.PI) / 180, 0, Math.PI * 2);
    else if (s.t === "rect") {
      if (s.rx && ctx.roundRect) ctx.roundRect(s.x, s.y, s.w, s.h, s.rx);
      else ctx.rect(s.x, s.y, s.w, s.h);
    }
    if (s.t === "path") {
      const p = new Path2D(s.d);
      if (s.fill) {
        ctx.fillStyle = s.fill;
        ctx.fill(p);
      }
      if (s.stroke) {
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = s.sw;
        ctx.lineCap = "round";
        ctx.stroke(p);
      }
    } else {
      ctx.fillStyle = s.fill;
      ctx.fill();
    }
  }
  ctx.restore();
}
