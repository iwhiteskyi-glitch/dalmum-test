import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import ChessGame from "@/components/games/ChessGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "체스 | 10단계 컴퓨터와 두는 무료 체스",
  description:
    "설치 없이 바로 두는 체스. 1단계 병아리부터 10단계 체스의 신까지, 점점 강해지는 컴퓨터에 도전하고 내 등급 카드를 친구에게 자랑해 보세요.",
  path: "/games/chess",
  image: "games",
});

export default function ChessPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/games/chess/wK.svg" alt="" width="78" height="78" />
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>체스, 몇 단계까지 갈 수 있을까?</h1>
        <p className={styles.lead}>
          상대 킹을 피할 곳 없이 몰아넣으면(체크메이트) 이겨요. 1단계 병아리부터 10단계 체스의 신까지 차례로
          도전해 보세요.
        </p>
      </section>

      <ChessGame />

      <MoreInfo title="체스가 궁금하다면" lead="규칙과 이기는 요령, 단계별 상대를 모아 뒀어요.">
        <Fold title="말의 움직임" hint="킹·퀸·룩·비숍·나이트·폰">
          <ul className={styles.sectionText}>
            <li>
              <b>킹</b>: 모든 방향으로 한 칸. 잡히면 지는 가장 중요한 말이에요.
            </li>
            <li>
              <b>퀸</b>: 가로·세로·대각선으로 막힐 때까지 몇 칸이든. 가장 강한 말이에요.
            </li>
            <li>
              <b>룩</b>: 가로·세로로 몇 칸이든 · <b>비숍</b>: 대각선으로 몇 칸이든
            </li>
            <li>
              <b>나이트</b>: 두 칸 가고 옆으로 한 칸(ㄱ자). 다른 말을 넘어갈 수 있는 유일한 말이에요.
            </li>
            <li>
              <b>폰</b>: 앞으로 한 칸(처음에는 두 칸까지), 잡을 때는 앞 대각선으로 한 칸
            </li>
          </ul>
        </Fold>
        <Fold title="체크·체크메이트와 특별한 규칙" hint="캐슬링 · 앙파상 · 프로모션 · 무승부">
          <p className={styles.sectionText}>
            킹이 공격받는 상태를 <b>체크</b>라고 하고, 체크를 피할 방법이 없으면 <b>체크메이트</b>로 져요. 내
            킹이 공격받게 되는 수는 둘 수 없어요.
          </p>
          <ul className={styles.sectionText}>
            <li>
              <b>캐슬링</b>: 킹과 룩이 한 번도 움직이지 않았고 사이가 비어 있으면, 킹을 룩 쪽으로 두 칸 옮기고
              룩을 킹 반대편에 붙여요(킹을 두 칸 움직이면 돼요).
            </li>
            <li>
              <b>앙파상</b>: 상대 폰이 처음에 두 칸 전진해 내 폰 바로 옆에 오면, 바로 다음 수에 한 칸만 온 것처럼
              대각선으로 잡을 수 있어요.
            </li>
            <li>
              <b>프로모션</b>: 폰이 끝 줄에 닿으면 퀸·룩·비숍·나이트 중 하나로 바뀌어요.
            </li>
            <li>
              <b>무승부</b>: 체크가 아닌데 둘 수가 없을 때(스테일메이트), 같은 배치가 세 번 나올 때, 50수 동안
              잡거나 폰을 움직이지 않을 때, 체크메이트할 말이 부족할 때예요.
            </li>
          </ul>
        </Fold>
        <Fold title="이기는 요령" hint="가운데 · 말 꺼내기 · 공짜로 잃지 않기">
          <ul className={styles.sectionText}>
            <li>초반에는 가운데 네 칸을 폰과 말로 차지하면 말들이 움직이기 편해져요.</li>
            <li>나이트와 비숍을 일찍 꺼내고, 캐슬링으로 킹을 구석에 안전하게 두세요.</li>
            <li>말을 옮기기 전에 그 칸을 상대가 공짜로 잡을 수 있는지 꼭 확인하세요. 낮은 단계 컴퓨터가 지는 이유도 대부분 이거예요.</li>
            <li>말의 가치는 대략 폰 1, 나이트·비숍 3, 룩 5, 퀸 9로 셈해요. 바꿀 때는 이 숫자를 떠올려 보세요.</li>
          </ul>
        </Fold>
        <Fold title="단계별 상대" hint="1단계 병아리 ~ 10단계 체스의 신">
          <p className={styles.sectionText}>
            1~3단계 상대는 한 수 앞만 보고 가끔 아무 수나 둬요. 4~6단계는 잡고 잡히는 교환을 끝까지 계산하며 두세
            수 앞을 보고, 7단계부터는 실수 없이 네 수 이상 내다봐요. 10단계는 한 수에 2~3초 생각하며 여러 수 앞을
            살펴요. 흑은 나중에 두는 만큼 더 어려워서, 백으로 10단계를 모두 깨면 흑 도전이 열려요.
          </p>
        </Fold>
        <Fold title="체스는 어디서 왔을까?" hint="차투랑가에서 지금의 체스로">
          <p className={styles.sectionText}>
            체스는 6세기 무렵 인도의 &lsquo;차투랑가&rsquo;에서 시작해 페르시아와 아랍을 거쳐 유럽으로
            전해졌다고 알려져 있어요. 15세기 말 유럽에서 퀸과 비숍이 멀리 움직이게 바뀌면서 지금의 규칙에
            가까워졌어요. 장기와 중국의 샹치도 같은 뿌리에서 갈라져 나온 친척 게임으로 여겨져요.
          </p>
          <p className={styles.sectionText}>
            이 페이지의 체스 말 그림은 Cburnett이 그린 그림(위키미디어 공용, CC BY-SA 3.0)을 썼어요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>오목·오델로·장기에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
