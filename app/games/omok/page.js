import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import OmokGame from "@/components/games/OmokGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "오목 | 10단계 컴퓨터와 두는 무료 오목 게임",
  description:
    "설치 없이 바로 두는 오목. 1단계 병아리부터 10단계 오목의 신까지, 점점 강해지는 컴퓨터에 도전하고 내 등급 카드를 친구에게 자랑해 보세요.",
  path: "/games/omok",
  image: "games",
});

export default function OmokPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>五</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>오목, 몇 단계까지 갈 수 있을까?</h1>
        <p className={styles.lead}>
          1단계 병아리부터 10단계 오목의 신까지, 점점 강해지는 컴퓨터에 도전해 보세요. 다섯 개를 먼저
          이으면 이겨요.
        </p>
      </section>

      <OmokGame />

      <MoreInfo title="오목이 궁금하다면" lead="규칙과 이기는 요령, 단계별 상대를 모아 뒀어요.">
        <Fold title="오목 규칙" hint="5목 · 쌍삼 금지 · 장목 승리">
          <p className={styles.sectionText}>
            흑과 백이 번갈아 가로세로 15줄 판의 교차점에 돌을 하나씩 놓아요. 가로·세로·대각선 중 한 방향으로
            내 돌 다섯 개를 먼저 이으면 이겨요. 여섯 개 이상 이어도(장목) 이긴 것으로 쳐요.
          </p>
          <p className={styles.sectionText}>
            이 게임은 우리나라에서 흔히 쓰는 &lsquo;쌍삼 금지&rsquo; 규칙을 써요. 한 수로 열린 3을 두 개
            동시에 만드는 자리에는 흑과 백 모두 둘 수 없어요. 다만 그 수로 바로 다섯 개가 완성되면 둘 수 있고,
            4와 3을 함께 만드는 수(4·3)나 4를 두 개 만드는 수(4·4)는 둘 수 있어요.
          </p>
        </Fold>
        <Fold title="열린 3, 4·3이 뭐예요?" hint="오목에서 자주 쓰는 말">
          <p className={styles.sectionText}>
            <b>열린 3</b>은 양쪽 끝이 비어 있는 세 개짜리 줄이에요. 한 수만 더 두면 양쪽 끝이 빈 4(열린 4)가
            되고, 열린 4는 상대가 한쪽을 막아도 다른 쪽으로 다섯을 완성할 수 있어서 사실상 승리예요.
            그래서 상대가 열린 3을 만들면 바로 막는 게 기본이에요.
          </p>
          <p className={styles.sectionText}>
            <b>4·3</b>은 한 수로 4와 열린 3을 동시에 만드는 수예요. 상대가 4를 막는 동안 3이 열린 4가 되어
            이기게 돼요. 오목에서 가장 많이 쓰는 승리 공식이에요.
          </p>
        </Fold>
        <Fold title="이기는 요령" hint="막기 · 두 갈래 공격 · 가운데">
          <ul className={styles.sectionText}>
            <li>상대가 3을 만들면 바로 막아요. 낮은 단계의 컴퓨터가 지는 이유도 대부분 이걸 놓쳐서예요.</li>
            <li>한 줄만 키우면 쉽게 막혀요. 두 방향으로 동시에 뻗을 수 있는 자리에 두면 4·3을 만들기 쉬워요.</li>
            <li>판 가장자리보다 가운데 쪽이 뻗어 나갈 방향이 많아서 유리해요.</li>
            <li>먼저 두는 흑이 유리해서, 백으로 이기는 게 훨씬 어려워요. 그래서 2회차는 백돌 도전이에요.</li>
          </ul>
        </Fold>
        <Fold title="단계별 상대" hint="1단계 병아리 ~ 10단계 오목의 신">
          <p className={styles.sectionText}>
            1~3단계 상대는 내가 만든 3을 자주 못 보고 지나쳐요. 4~6단계부터는 3을 대부분 막고, 7단계부터는 4를
            연달아 두어 이기는 수순까지 찾아요. 9~10단계는 3과 4로 몰아붙이는 수순과, 내가 그런 수순을 노리는
            자리까지 미리 막아요. 막히면 한 판에 세 번까지 &lsquo;한 수 무르기&rsquo;를 쓸 수 있어요.
          </p>
        </Fold>
        <Fold title="오목은 어디서 왔을까?" hint="바둑판에서 시작된 놀이">
          <p className={styles.sectionText}>
            오목은 바둑판과 바둑돌로 두던 놀이에서 시작됐어요. 일본에서는 고모쿠나라베(五目並べ), 서양에서는
            고모쿠(Gomoku)라는 이름으로 알려져 있고, 먼저 두는 쪽이 지나치게 유리하지 않도록 나라마다 금지 수를
            두는 규칙이 발전했어요. 우리나라에서는 쌍삼 금지 규칙으로 두는 경우가 많아요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 준비 중이에요</small>
          <strong>미니게임 목록 보기</strong>
          <span>오델로와 장기가 곧 나와요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
