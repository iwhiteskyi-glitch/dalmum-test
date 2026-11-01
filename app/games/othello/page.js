import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import OthelloGame from "@/components/games/OthelloGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "오델로 | 10단계 컴퓨터와 두는 무료 오델로(리버시)",
  description:
    "설치 없이 바로 두는 오델로. 1단계 햄스터부터 10단계 오델로의 신까지, 점점 강해지는 컴퓨터에 도전하고 내 등급 카드를 친구에게 자랑해 보세요.",
  path: "/games/othello",
  image: "games",
});

export default function OthelloPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>反</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>오델로, 몇 단계까지 갈 수 있을까?</h1>
        <p className={styles.lead}>
          상대 돌을 내 돌 사이에 끼워 뒤집는 게임이에요. 1단계 햄스터부터 10단계 오델로의 신까지 차례로
          도전해 보세요.
        </p>
      </section>

      <OthelloGame />

      <MoreInfo title="오델로가 궁금하다면" lead="규칙과 이기는 요령, 단계별 상대를 모아 뒀어요.">
        <Fold title="오델로 규칙" hint="끼우면 뒤집기 · 패스 · 많은 쪽 승리">
          <p className={styles.sectionText}>
            가로세로 8칸 판의 가운데 네 칸에 흑 두 개, 백 두 개를 엇갈려 놓고 흑부터 시작해요. 내 돌을 놓았을
            때 가로·세로·대각선으로 상대 돌이 내 돌 사이에 끼면, 끼인 상대 돌이 모두 내 색으로 뒤집혀요.
          </p>
          <p className={styles.sectionText}>
            상대 돌을 하나도 뒤집을 수 없는 칸에는 둘 수 없고, 둘 곳이 아예 없으면 한 번 쉬고(패스) 차례가
            넘어가요. 두 사람 모두 둘 곳이 없어지면 끝나고, 판 위에 돌이 더 많은 쪽이 이겨요.
          </p>
        </Fold>
        <Fold title="이기는 요령" hint="모서리 · 위험한 칸 · 적게 뒤집기">
          <ul className={styles.sectionText}>
            <li>네 귀퉁이(모서리)에 놓은 돌은 끝까지 뒤집히지 않아요. 모서리를 먼저 차지하는 쪽이 유리해요.</li>
            <li>모서리 바로 옆 칸, 특히 대각선 옆 칸에 먼저 두면 상대에게 모서리를 내주기 쉬워요.</li>
            <li>초반에 많이 뒤집는 게 꼭 좋은 건 아니에요. 내 돌이 적을수록 상대가 둘 곳이 줄어들기도 해요.</li>
            <li>상대가 둘 수 있는 곳을 줄이고 내가 둘 곳을 늘리는 게 중반의 핵심이에요.</li>
          </ul>
        </Fold>
        <Fold title="단계별 상대" hint="1단계 햄스터 ~ 10단계 오델로의 신">
          <p className={styles.sectionText}>
            1단계 상대는 아무 곳에나 두고, 2단계는 그 자리에서 가장 많이 뒤집는 곳만 노려요. 3단계부터는
            칸마다 가치를 따지며 한 수씩 더 멀리 내다보고, 6단계부터는 빈칸이 얼마 남지 않으면 끝까지 정확히
            계산해요. 10단계는 한 수에 2초 남짓 생각하며 여러 수 앞을 살펴요. 막히면 한 판에 세 번까지 무를 수
            있어요.
          </p>
        </Fold>
        <Fold title="오델로는 어디서 왔을까?" hint="리버시에서 오델로로">
          <p className={styles.sectionText}>
            돌을 끼워 뒤집는 놀이는 19세기 말 영국에서 &lsquo;리버시(Reversi)&rsquo;라는 이름으로 즐겼어요.
            지금의 오델로는 1970년대 일본에서 가운데 네 칸에서 시작하는 규칙으로 다듬어 내놓은 게임으로,
            흑과 백이 엎치락뒤치락하는 모습이 셰익스피어의 희곡 &lsquo;오셀로&rsquo;를 떠올리게 해 이런
            이름이 붙었다고 알려져 있어요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>오목·장기·체스에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
