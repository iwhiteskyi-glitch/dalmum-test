import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import g from "@/components/games/games.module.css";
import GameProgress from "@/components/games/GameProgress";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "미니게임 | 단계마다 강해지는 컴퓨터와 두는 오목",
  description:
    "설치 없이 바로 하는 미니게임. 10단계로 점점 강해지는 컴퓨터와 오목을 두고, 몇 단계까지 깼는지 친구에게 자랑해 보세요.",
  path: "/games",
  image: "games",
});

// 게임을 늘릴 때는 여기에 한 줄 추가하고 app/games/<게임>/page.js 를 만들면 돼요.
const OmokIcon = (
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

const OthelloIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#2f7a4a" />
    <circle cx="14" cy="14" r="7" fill="#151515" />
    <circle cx="26" cy="26" r="7" fill="#151515" />
    <circle cx="26" cy="14" r="7" fill="#fff" />
    <circle cx="14" cy="26" r="7" fill="#fff" />
  </svg>
);

const JanggiIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <polygon points="13,3 27,3 37,13 37,27 27,37 13,37 3,27 3,13" fill="#fbf4e6" stroke="#b3261e" strokeWidth="2" />
    <text x="20" y="26" textAnchor="middle" fontSize="15" fill="#b3261e" fontFamily="Batang, serif">
      車
    </text>
  </svg>
);

const ChessIcon = (
  <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="1" y="1" width="38" height="38" rx="7" fill="#b58863" />
    <rect x="1" y="1" width="19" height="19" rx="0" fill="#f0d9b5" />
    <rect x="20" y="20" width="19" height="19" fill="#f0d9b5" />
    <image href="/games/chess/wN.svg" x="4" y="4" width="32" height="32" />
  </svg>
);

export default function GamesPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>棋</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>컴퓨터를 이겨 볼까?</h1>
        <p className={styles.lead}>
          오목·오델로·장기·체스, 단계마다 조금씩 강해지는 컴퓨터와 한 판. 설치나 회원가입 없이 바로 시작하고,
          몇 단계까지 깼는지 친구에게 자랑해 보세요.
        </p>
      </section>

      <ul className={g.gameList}>
        <li>
          <Link href="/games/omok" className={g.gameItem}>
            <span className={g.gameIcon} style={{ background: "#f6ead3" }}>
              {OmokIcon}
            </span>
            <div>
              <h2>오목</h2>
              <p>가로·세로·대각선으로 다섯 개를 먼저 이으면 승리</p>
              <GameProgress game="omok" className={g.gameProg} />
            </div>
            <span className={g.gameGo} aria-hidden="true">
              ›
            </span>
          </Link>
        </li>
        <li>
          <Link href="/games/othello" className={g.gameItem}>
            <span className={g.gameIcon} style={{ background: "#e4f1e8" }}>
              {OthelloIcon}
            </span>
            <div>
              <h2>오델로</h2>
              <p>상대 돌을 사이에 끼워 내 색으로 뒤집어요</p>
              <GameProgress game="othello" className={g.gameProg} />
            </div>
            <span className={g.gameGo} aria-hidden="true">
              ›
            </span>
          </Link>
        </li>
        <li>
          <Link href="/games/janggi" className={g.gameItem}>
            <span className={g.gameIcon} style={{ background: "#fbf1e3" }}>
              {JanggiIcon}
            </span>
            <div>
              <h2>장기</h2>
              <p>궁을 지키며 상대 궁을 외통으로 몰아요</p>
              <GameProgress game="janggi" className={g.gameProg} />
            </div>
            <span className={g.gameGo} aria-hidden="true">
              ›
            </span>
          </Link>
        </li>
        <li>
          <Link href="/games/chess" className={g.gameItem}>
            <span className={g.gameIcon} style={{ background: "#f2e6d4" }}>
              {ChessIcon}
            </span>
            <div>
              <h2>체스</h2>
              <p>상대 킹을 체크메이트로 몰아넣으면 승리</p>
              <GameProgress game="chess" className={g.gameProg} />
            </div>
            <span className={g.gameGo} aria-hidden="true">
              ›
            </span>
          </Link>
        </li>
      </ul>

      <MoreInfo title="미니게임이 궁금하다면" lead="어떻게 즐기는지, 기록은 어떻게 남는지 모아 뒀어요.">
        <Fold title="어떻게 즐기나요?" hint="10단계 도전 · 2회차">
          <p className={styles.sectionText}>
            게임마다 10명의 컴퓨터 상대가 있어요. 1단계 상대는 실수가 많아서 처음 해 보는 사람도 금방
            이길 수 있고, 단계가 오를수록 수를 더 멀리 내다봐요. 앞 단계를 이겨야 다음 단계가 열리고, 10단계를
            모두 깨면 더 어려운 2회차 도전이 열려요.
          </p>
        </Fold>
        <Fold title="기록은 어디에 저장되나요?" hint="이 브라우저에만, 서버 저장 없음">
          <p className={styles.sectionText}>
            깬 단계는 지금 쓰는 브라우저에만 저장되고 서버로 보내지 않아요. 회원가입이 필요 없는 대신, 다른
            기기나 브라우저에서는 1단계부터 다시 시작해요. 브라우저의 방문 기록(사이트 데이터)을 지우면 기록도
            함께 지워져요.
          </p>
        </Fold>
        <Fold title="컴퓨터는 어떻게 두나요?" hint="내 기기 안에서 계산">
          <p className={styles.sectionText}>
            컴퓨터의 수는 서버가 아니라 지금 보고 있는 기기 안에서 계산해요. 그래서 인터넷이 느려도 바로
            두고, 어떤 수를 뒀는지도 어디에 기록되지 않아요. 높은 단계는 한 수에 1~2초쯤 생각하기도 해요.
          </p>
        </Fold>
        <Fold title="자랑하기에는 무엇이 담겨요?" hint="등급 카드와 깬 단계">
          <p className={styles.sectionText}>
            지금까지 깬 단계에 따라 동·은·금 메달, 완주, 전설 등급 카드가 만들어져요. 카드에는 등급과 깬 단계,
            마지막으로 이긴 상대만 담기고 개인정보는 들어가지 않아요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/dream" className={styles.nextCard}>
        <span>
          <small>재미로 보는 또 다른 코너</small>
          <strong>꿈해몽도 보러 가기</strong>
          <span>기억나는 꿈속 장면으로 상징별 의미를 풀어 드려요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
