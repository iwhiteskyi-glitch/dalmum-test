import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import BingoGame from "@/components/games/BingoGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "빙고 게임 | 컴퓨터와 번갈아 숫자 부르기, 3줄 빙고·블랙빙고",
  description:
    "설치 없이 바로 하는 무료 빙고 게임. 컴퓨터 1~3명과 번갈아 숫자를 부르고 내 판에서 줄을 먼저 완성해 보세요. 숫자 범위 1~25부터 1~100, 1줄부터 블랙빙고까지, 판을 직접 채울 수도 있어요.",
  path: "/games/bingo",
  image: "games",
});

export default function BingoPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>線</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>빙고, 누가 먼저 3줄?</h1>
        <p className={styles.lead}>
          컴퓨터와 번갈아 숫자를 하나씩 불러요. 불린 숫자는 모두의 판에서 지워지고, 정한 줄 수를 먼저 만들면 이겨요.
          어떤 숫자를 부르느냐에 따라 승부가 갈려요.
        </p>
      </section>

      <BingoGame />

      <MoreInfo title="빙고가 궁금하다면" lead="규칙과 설정, 컴퓨터가 숫자를 고르는 방법, 이기는 요령을 모아 뒀어요.">
        <Fold title="규칙" hint="번갈아 부르기 · 줄 완성">
          <p className={styles.sectionText}>
            모두 5×5칸 판을 하나씩 가져요. 차례가 오면 내 판에 있는 숫자 중 아직 안 불린 것 하나를 불러요. 불린 숫자는
            그 숫자가 있는 모든 사람의 판에서 함께 지워져요. 가로·세로·대각선으로 다섯 칸이 모두 지워지면 한 줄이에요.
          </p>
          <ul className={styles.sectionText}>
            <li>판 하나에 줄은 모두 12개예요(가로 5 · 세로 5 · 대각선 2).</li>
            <li>정한 줄 수를 가장 먼저 만든 사람이 그 판을 이겨요. 같은 숫자로 동시에 만들면 공동 승리예요.</li>
            <li>첫 판은 룰렛으로 먼저 할 사람을 정하고, 다음 판은 지난 판에 이긴 사람부터 시작해요.</li>
            <li>정한 승수(1승·3승·5승)를 먼저 채우면 우승이에요.</li>
          </ul>
        </Fold>
        <Fold title="설정" hint="숫자 범위 · 줄 수 · 판 채우기">
          <p className={styles.sectionText}>
            숫자 범위가 1~25면 모두의 판에 같은 숫자 25개가 자리만 다르게 놓여요. 그래서 내가 부른 숫자가 상대 판에서도
            늘 지워져요. 1~50·1~75·1~100이면 그중 25개만 판에 놓여서, 내 판에는 없는 숫자가 불리기도 해요. 범위가 넓을수록
            판이 서로 덜 겹쳐요.
          </p>
          <p className={styles.sectionText}>
            1줄부터 5줄까지 고를 수 있고, 블랙빙고는 판 25칸을 모두 지워야 이겨요. 1~25에서 블랙빙고를 하면 모두 마지막
            숫자에 동시에 끝나서, 블랙빙고는 1~50부터 할 수 있어요. 판 채우기를 &lsquo;직접&rsquo;으로 고르면 판마다 원하는
            자리에 숫자를 놓아요. 남은 칸만 랜덤으로 채울 수도 있어요.
          </p>
        </Fold>
        <Fold title="컴퓨터는 어떻게 고르나요?" hint="자기 판만 봐요">
          <p className={styles.sectionText}>
            컴퓨터는 내 판을 보지 않고 자기 판만 보고 골라요. 자기 판에서 이미 많이 지워진 줄을 채우는 숫자일수록 점수를
            높게 매기고, 점수가 비슷하면 조금씩 섞어서 매번 똑같이 고르지는 않아요. 판이 끝나면 컴퓨터 판도 보여 줘서
            어떻게 줄을 만들었는지 볼 수 있어요.
          </p>
          <p className={styles.sectionText}>
            1~25 3줄에서 이 방법으로 고르는 쪽과 아무 숫자나 고르는 쪽을 2만 판 겨뤄 보면, 고르는 쪽이 99% 넘게 이겨요.
            빙고는 운만이 아니라는 뜻이에요.
          </p>
        </Fold>
        <Fold title="이기는 요령" hint="많이 찬 줄 · 겹치는 칸">
          <ul className={styles.sectionText}>
            <li>이미 많이 지워진 줄을 마저 채우는 숫자를 먼저 불러요. 한 칸 남은 줄이 있으면 그 숫자가 가장 좋아요.</li>
            <li>점수가 같다면 가로·세로·대각선 여러 줄에 함께 걸친 칸이 좋아요. 가운데 칸은 네 줄에 걸쳐 있어요.</li>
            <li>상대가 부른 숫자로도 내 줄이 차요. 내 차례가 오면 방금 지워진 칸 때문에 한 칸만 남은 줄이 생기지 않았는지 먼저 봐요.</li>
          </ul>
          <p className={styles.sectionText}>
            숫자로 본 승률과 요령은 <Link href="/reads/bingo-tips">빙고 잘하는 법</Link>에 정리했어요.
          </p>
        </Fold>
        <Fold title="기록" hint="이 브라우저에만 저장">
          <p className={styles.sectionText}>
            빙고는 운영자가 만든 비행기오락실 앱의 같은 게임을 웹으로 옮긴 것이에요. 앱에서는 옆 사람 폰과 바로 연결해 함께할
            수 있고, 이 사이트에서는 컴퓨터와 해요. 이긴 판 수, 우승 횟수, 설정마다 가장 빨리 빙고를 만든 기록, 고른 설정은
            지금 쓰는 브라우저에만 저장되고 서버로 보내지 않아요. 브라우저의 사이트 데이터를 지우면 함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>숫자 야구·스도쿠·짝꿍 잇기·오목·장기·체스에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
