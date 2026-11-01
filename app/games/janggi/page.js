import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import JanggiGame from "@/components/games/JanggiGame";
import TodayPuzzles from "@/components/games/TodayPuzzles";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "장기 | 10단계 컴퓨터와 두는 무료 장기",
  description:
    "설치 없이 바로 두는 장기. 상차림을 고르고, 1단계 병아리부터 10단계 장기의 신까지 점점 강해지는 컴퓨터에 도전해 보세요.",
  path: "/games/janggi",
  image: "games",
});

export default function JanggiPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>將</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>장기, 몇 단계까지 갈 수 있을까?</h1>
        <p className={styles.lead}>
          상대 궁이 피할 곳 없게 장군을 부르면(외통) 이겨요. 상차림을 고르고 1단계 병아리부터 10단계 장기의
          신까지 차례로 도전해 보세요.
        </p>
      </section>

      <JanggiGame />

      <MoreInfo title="장기가 궁금하다면" lead="말의 움직임과 규칙, 이기는 요령을 모아 뒀어요.">
        <Fold title="말의 움직임" hint="궁·사·차·포·마·상·졸">
          <ul className={styles.sectionText}>
            <li>
              <b>궁(楚·漢)·사(士)</b>: 궁성(가운데 아래·위의 아홉 점) 안에서 선을 따라 한 칸. 궁성의 대각선 선으로도
              움직여요.
            </li>
            <li>
              <b>차(車)</b>: 가로·세로로 막힐 때까지 몇 칸이든. 궁성 안에서는 대각선 선을 따라서도 가요. 가장
              강한 말이에요.
            </li>
            <li>
              <b>포(包)</b>: 가로·세로로 말 하나를 꼭 넘어서 가요. 포는 포를 넘을 수도, 잡을 수도 없어요.
            </li>
            <li>
              <b>마(馬)</b>: 앞으로 한 칸, 이어서 대각선으로 한 칸(日자). 처음 한 칸이 막히면(멱) 못 가요.
            </li>
            <li>
              <b>상(象)</b>: 앞으로 한 칸, 이어서 대각선으로 두 칸(用자). 지나가는 곳이 막히면 못 가요.
            </li>
            <li>
              <b>졸(卒)·병(兵)</b>: 앞이나 옆으로 한 칸. 뒤로는 못 가고, 상대 궁성 안에서는 앞쪽 대각선 선으로도
              가요.
            </li>
          </ul>
        </Fold>
        <Fold title="장군·외통과 특별한 규칙" hint="상차림 · 한수쉼 · 빅장 · 점수">
          <p className={styles.sectionText}>
            상대 궁을 잡을 수 있는 상태가 <b>장군</b>이고, 장군을 피할 방법이 없으면 <b>외통</b>으로 이겨요. 내 궁이
            공격받게 되는 수는 둘 수 없어요. 먼저 두는 쪽은 초(楚)예요.
          </p>
          <ul className={styles.sectionText}>
            <li>
              <b>상차림</b>: 시작 전에 마와 상의 자리를 마상마상·상마상마·마상상마·상마마상 중에서 골라요.
            </li>
            <li>
              <b>빅장</b>: 두 궁이 같은 세로줄에서 사이에 아무 말 없이 마주 보는 걸 빅장이라고 해요. 규칙에 따라 무승부나
              점수 판정으로 끝내기도 하지만, 이 게임에서는 따로 인정하지 않고 그대로 계속 둬요.
            </li>
            <li>
              <b>한수쉼</b>: 장군을 받고 있지 않으면 한 번 쉴 수 있어요. 두 사람이 연달아 쉬면 무승부예요.
            </li>
            <li>
              <b>점수 판정</b>: 이 게임에서는 한 판이 너무 길어지지 않게 200수가 지나면 남은 말의 점수로 승부를
              정해요. 차 13, 포 7, 마 5, 상 3, 사 3, 졸·병 2점이고, 나중에 두는 한(漢)에 1.5점을 더해 줘요(덤).
            </li>
          </ul>
        </Fold>
        <Fold title="이기는 요령" hint="차 지키기 · 포 다리 · 멱 조심">
          <ul className={styles.sectionText}>
            <li>차는 가장 강한 말이라 일찍 잃으면 크게 불리해요. 차가 공짜로 잡히는 자리는 피하세요.</li>
            <li>포는 넘을 말(다리)이 있어야 움직여요. 내 말을 다리로 삼아 상대 진영을 노려 보세요.</li>
            <li>마와 상은 길이 막히면(멱) 못 움직여요. 상대 말이 내 마·상의 길을 막고 있는지 살펴보세요.</li>
            <li>사는 궁 곁에 두어 궁성을 지키게 하면, 장군을 받았을 때 막아 줄 말이 생겨요.</li>
          </ul>
        </Fold>
        <Fold title="단계별 상대" hint="1단계 병아리 ~ 10단계 장기의 신">
          <p className={styles.sectionText}>
            1~3단계 상대는 한 수 앞만 보고 가끔 아무 수나 둬요. 4~6단계는 잡고 잡히는 교환을 끝까지 계산하며 두세
            수 앞을 보고, 7단계부터는 실수 없이 서너 수 이상 내다봐요. 10단계는 한 수에 2~3초 생각해요. 초로
            10단계를 모두 깨면, 나중에 두는 한 도전이 열려요.
          </p>
        </Fold>
        <Fold title="장기는 어디서 왔을까?" hint="초나라와 한나라의 싸움">
          <p className={styles.sectionText}>
            장기는 중국의 샹치(象棋)와 뿌리가 같은 놀이로, 체스와도 먼 친척으로 여겨져요. 양쪽 궁에 쓰인 초(楚)와
            한(漢)은 옛 중국에서 천하를 두고 다툰 초나라와 한나라에서 따왔어요. 우리나라 장기는 궁이 궁성 가운데에서
            시작하고, 판 가운데에 강이 없으며, 상차림을 고를 수 있다는 점이 샹치와 달라요.
          </p>
        </Fold>
      </MoreInfo>

      <TodayPuzzles only="janggi" />

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>오목·오델로·체스에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
