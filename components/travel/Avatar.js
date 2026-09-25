// 실사진 대신 쓰는 단순한 SVG 캐릭터. 모든 값은 lib/travel/recommend.js의 randomAvatar()가 정합니다.
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

function Face({ expression, blush }) {
  const eye = { stroke: INK, strokeWidth: 2.6, fill: "none", strokeLinecap: "round" };
  return (
    <>
      <circle cx="43" cy="77" r="5.5" fill={blush} opacity="0.7" />
      <circle cx="77" cy="77" r="5.5" fill={blush} opacity="0.7" />
      {expression === "grin" ? (
        <>
          <path d="M45,69 Q49,64 53,69" {...eye} />
          <path d="M67,69 Q71,64 75,69" {...eye} />
          <path d="M51,79 Q60,91 69,79 Z" fill="#8A3B3B" />
        </>
      ) : expression === "wink" ? (
        <>
          <circle cx="49" cy="68" r="3.2" fill={INK} />
          <path d="M67,69 Q71,65 75,69" {...eye} />
          <path d="M53,81 Q60,86 67,81" {...eye} />
        </>
      ) : (
        <>
          <circle cx="49" cy="68" r="3.2" fill={INK} />
          <circle cx="71" cy="68" r="3.2" fill={INK} />
          <path d="M52,80 Q60,87 68,80" {...eye} />
        </>
      )}
    </>
  );
}

function Accessory({ type }) {
  switch (type) {
    case "sunglasses":
      return (
        <g fill={INK}>
          <rect x="39" y="62" width="19" height="11" rx="4" />
          <rect x="62" y="62" width="19" height="11" rx="4" />
          <rect x="57" y="65" width="6" height="2.4" />
        </g>
      );
    case "strawhat":
      return (
        <g>
          <path d="M38,42 C38,18 82,18 82,42 Z" fill="#E8C77A" />
          <ellipse cx="60" cy="42" rx="42" ry="8" fill="#E8C77A" />
          <rect x="38" y="35" width="44" height="5" fill="#D9694F" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M32,50 C32,24 88,24 88,50 Z" fill="#12A4B0" />
          <path d="M60,47 C76,45 96,47 101,53 C90,55 70,54 60,51 Z" fill="#0B8792" />
          <circle cx="60" cy="27" r="2.6" fill="#0B8792" />
        </g>
      );
    case "flower":
      return (
        <g>
          {[
            [84, 38],
            [90, 43],
            [88, 50],
            [80, 50],
            [78, 43],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.2" fill="#FF8FAB" />
          ))}
          <circle cx="84" cy="45" r="3.2" fill="#FFD166" />
        </g>
      );
    default:
      return null;
  }
}

export default function Avatar({ avatar, size = 64, bg = "#DFF4F5", title }) {
  const { skin, hairColor, blush, hair, expression, accessory } = avatar;
  const hatHidesHair = accessory === "strawhat" || accessory === "cap";
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {bg && <circle cx="60" cy="60" r="60" fill={bg} />}
      {BACK_HAIR[hair] && <path d={BACK_HAIR[hair]} fill={hairColor} />}
      {hair === "bun" && !hatHidesHair && <circle cx="60" cy="28" r="11" fill={hairColor} />}
      <circle cx="60" cy="66" r="30" fill={skin} />
      <path d={FRINGE[hair] || FRINGE.soft} fill={hairColor} />
      <Face expression={expression} blush={blush} />
      <Accessory type={accessory} />
    </svg>
  );
}
