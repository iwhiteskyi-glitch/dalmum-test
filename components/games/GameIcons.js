// 미니게임 아이콘(게임 목록·오늘의 문제에서 같이 써요)
export const OmokIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#e3bd7a" />
    <g stroke="#6b4a1f" strokeWidth="1">
      {[8, 16, 24, 32].map((p) => (
        <g key={p}>
          <line x1="4" y1={p} x2="36" y2={p} />
          <line x1={p} y1="4" x2={p} y2="36" />
        </g>
      ))}
    </g>
    <circle cx="16" cy="16" r="5" fill="#151515" />
    <circle cx="24" cy="24" r="5" fill="#151515" />
    <circle cx="24" cy="16" r="5" fill="#fff" stroke="#bbb" />
  </svg>
);

export const OthelloIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#2f7a4a" />
    <circle cx="14" cy="14" r="7" fill="#151515" />
    <circle cx="26" cy="26" r="7" fill="#151515" />
    <circle cx="26" cy="14" r="7" fill="#fff" />
    <circle cx="14" cy="26" r="7" fill="#fff" />
  </svg>
);

export const JanggiIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <polygon points="13,3 27,3 37,13 37,27 27,37 13,37 3,27 3,13" fill="#fbf4e6" stroke="#b3261e" strokeWidth="2" />
    <text x="20" y="26" textAnchor="middle" fontSize="15" fill="#b3261e" fontFamily="Batang, serif">
      車
    </text>
  </svg>
);

export const ChessIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#b58863" />
    <rect x="1" y="1" width="19" height="19" rx="0" fill="#f0d9b5" />
    <rect x="20" y="20" width="19" height="19" fill="#f0d9b5" />
    <image href="/games/chess/wN.svg" x="4" y="4" width="32" height="32" />
  </svg>
);

export const SlideIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#3d8b37" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <rect key={i} x={5 + (i % 3) * 10.5} y={5 + Math.floor(i / 3) * 10.5} width="9" height="9" rx="2" fill={i === 4 ? "#f5c84b" : "#fff"} />
    ))}
  </svg>
);

export const SudokuIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#fff" stroke="#3d8b37" strokeWidth="2" />
    <path d="M14 3v34M26 3v34M3 14h34M3 26h34" stroke="#3d8b37" strokeWidth="1.6" />
    <text x="8.5" y="11.5" fontSize="8.5" fontWeight="800" textAnchor="middle" fill="#2b2b2b">5</text>
    <text x="20" y="23.5" fontSize="8.5" fontWeight="800" textAnchor="middle" fill="#2b2b2b">3</text>
    <text x="31.5" y="35" fontSize="8.5" fontWeight="800" textAnchor="middle" fill="#3d8b37">9</text>
    <text x="31.5" y="11.5" fontSize="8.5" fontWeight="800" textAnchor="middle" fill="#3d8b37">7</text>
  </svg>
);

export const SpotIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#3d8b37" />
    <rect x="5" y="7" width="13" height="26" rx="3" fill="#fff" />
    <rect x="22" y="7" width="13" height="26" rx="3" fill="#fff" />
    <circle cx="11.5" cy="15" r="3" fill="#f5c84b" />
    <circle cx="28.5" cy="15" r="3" fill="#e57373" />
    <path d="M7 30l4-6 3 4 2-2 1 4zM24 30l4-6 3 4 2-2 1 4z" fill="#8bc34a" />
    <circle cx="28.5" cy="15" r="6" fill="none" stroke="#f5c84b" strokeWidth="1.6" />
  </svg>
);

export const LinkIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#fff" stroke="#3d8b37" strokeWidth="2" />
    <rect x="5" y="5" width="11" height="11" rx="3" fill="#ffe08a" stroke="#d9a400" strokeWidth="1.2" />
    <rect x="24" y="24" width="11" height="11" rx="3" fill="#ffe08a" stroke="#d9a400" strokeWidth="1.2" />
    <rect x="24" y="5" width="11" height="11" rx="3" fill="#cfe8ff" stroke="#6aa6d8" strokeWidth="1.2" />
    <rect x="5" y="24" width="11" height="11" rx="3" fill="#cfe8ff" stroke="#6aa6d8" strokeWidth="1.2" />
    <path d="M10.5 16v4.5h19V24" fill="none" stroke="#3d8b37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BaseballIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#1d2a3a" />
    <text x="20" y="18" fontSize="11" fontWeight="900" textAnchor="middle" fill="#ffd54f" letterSpacing="1.5">307</text>
    <circle cx="11" cy="28" r="3" fill="#4cd964" />
    <circle cx="19" cy="28" r="3" fill="none" stroke="#4a5a6e" strokeWidth="1.2" />
    <circle cx="29" cy="28" r="3" fill="#ffb300" />
    <text x="11" y="36.5" fontSize="5.5" fontWeight="800" textAnchor="middle" fill="#4cd964">S</text>
    <text x="29" y="36.5" fontSize="5.5" fontWeight="800" textAnchor="middle" fill="#ffb300">B</text>
  </svg>
);

export const BingoIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#faf6ef" stroke="#e6ddd0" />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={5 + c * 10.5} y={5 + r * 10.5} width="9" height="9" rx="2" fill={r === c ? "#3d8b37" : (r + c) % 3 === 1 ? "#ffe9a8" : "#fff"} stroke="#e6ddd0" strokeWidth="0.8" />
      )),
    )}
    <line x1="7" y1="7" x2="33" y2="33" stroke="#f2994a" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const OneCardIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#3d8b37" />
    <rect x="6" y="9" width="15" height="21" rx="2.5" fill="#fffdf8" stroke="#2f6b2b" transform="rotate(-12 13 19)" />
    <rect x="18" y="8" width="15" height="21" rx="2.5" fill="#fffdf8" stroke="#2f6b2b" transform="rotate(8 25 18)" />
    <text x="25.5" y="18.5" fontSize="8" fontWeight="900" textAnchor="middle" fill="#d32f2f" transform="rotate(8 25 18)">7</text>
    <text x="25.5" y="26" fontSize="8" textAnchor="middle" fill="#d32f2f" transform="rotate(8 25 18)">♥</text>
    <circle cx="31" cy="31" r="5.5" fill="#ffd54f" stroke="#7d2a22" strokeWidth="1" />
    <text x="31" y="33.6" fontSize="7" fontWeight="900" textAnchor="middle" fill="#7d2a22">1</text>
  </svg>
);

export const ThiefIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#2f6b2b" />
    <rect x="5" y="10" width="13" height="19" rx="2.5" fill="#fffdf8" stroke="#1f4a1c" transform="rotate(-14 11 19)" />
    <rect x="13" y="8" width="13" height="19" rx="2.5" fill="#fffdf8" stroke="#1f4a1c" />
    <rect x="22" y="10" width="13" height="19" rx="2.5" fill="#fff3c4" stroke="#1f4a1c" transform="rotate(14 28 19)" />
    <text x="19.5" y="21" fontSize="9" fontWeight="900" textAnchor="middle" fill="#1d1d1d">K</text>
    <text x="28.5" y="23" fontSize="11" fontWeight="900" textAnchor="middle" fill="#d32f2f" transform="rotate(14 28 19)">★</text>
    <path d="M9 33 q11 -5 22 0" stroke="#ffd54f" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);
