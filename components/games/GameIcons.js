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
