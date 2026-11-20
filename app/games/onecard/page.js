import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import OneCardGame from "@/components/games/OneCardGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "원카드 게임 | 컴퓨터와 공격 카드 넘기며 먼저 다 내기",
  description:
    "설치 없이 바로 하는 무료 원카드. 컴퓨터 1~3명과 같은 무늬·숫자를 내며 2·A·조커 공격을 넘기고, 7·J·Q·K 특수 카드로 판을 흔들어 손의 카드를 먼저 다 내 보세요.",
  path: "/games/onecard",
  image: "games",
});

export default function OneCardPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>牌</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>원카드, 마지막 한 장까지</h1>
        <p className={styles.lead}>
          맨 위 카드와 무늬나 숫자가 같은 카드를 한 장씩 내요. 2·A·조커로 공격하고, 공격을 받으면 더 센 카드로 넘겨요. 손의
          카드를 가장 먼저 다 내면 이겨요.
        </p>
      </section>

      <OneCardGame />

      <MoreInfo title="원카드가 궁금하다면" lead="규칙과 특수 카드, 컴퓨터가 카드를 고르는 방법, 이기는 요령을 모아 뒀어요.">
        <Fold title="기본 규칙" hint="같은 무늬나 숫자 · 먹기">
          <p className={styles.sectionText}>
            카드는 조커 2장을 포함해 54장이고, 처음에 7장씩 받아요. 내 차례에 맨 위 카드와 무늬나 숫자가 같은 카드를 1장
            내요. A·J·Q·K도 숫자처럼 같은 글자끼리 낼 수 있어요. 낼 카드가 없거나 내고 싶지 않으면 &lsquo;먹기&rsquo;로 1장을
            받고 차례가 끝나요.
          </p>
          <p className={styles.sectionText}>
            첫 판은 룰렛으로 먼저 할 사람을 정하고, 다음 판은 지난 판에 이긴 사람부터 시작해요. 손의 카드가 20장 이상이 되면
            파산해서 그 판에서 빠지고, 혼자 남으면 그 사람이 이겨요. 정한 승수(1·2·3승)를 먼저 채우면 우승이에요.
          </p>
        </Fold>
        <Fold title="공격 카드" hint="2 · A · 조커">
          <ul className={styles.sectionText}>
            <li>2는 2장, A는 3장, 흑백 조커는 5장, 컬러 조커는 7장을 다음 사람에게 먹여요.</li>
            <li>공격을 받으면 같거나 더 센 공격 카드로 넘길 수 있고, 먹을 장수는 더해져요. 이때 일반 카드는 못 내요.</li>
            <li>2 위에 A를 낼 때는 무늬가 같아야 해요. 2 위의 2, A 위의 A, 조커는 무늬가 달라도 돼요.</li>
            <li>조커는 언제든 낼 수 있고, 조커 다음 사람은 아무 카드나 낼 수 있어요.</li>
          </ul>
        </Fold>
        <Fold title="특수 카드" hint="7 · J · Q · K">
          <ul className={styles.sectionText}>
            <li>7: 바꿀 무늬를 골라요. 다음 사람은 그 무늬를 내야 해요.</li>
            <li>J: 다음 사람을 건너뛰어요.</li>
            <li>Q: 도는 방향이 바뀌어요.</li>
            <li>K: 한 번 더 내요.</li>
            <li>둘이 할 때는 J와 Q도 한 번 더 내는 것과 같아요.</li>
          </ul>
        </Fold>
        <Fold title="컴퓨터는 어떻게 고르나요?" hint="자기 패와 공개된 것만">
          <p className={styles.sectionText}>
            컴퓨터는 자기 패와 맨 위 카드, 사람마다 남은 장수만 보고 골라요. 공격 카드와 조커는 아껴 두었다가 누군가 카드가 2장
            이하로 줄면 써요. K는 한 번 더 낼 수 있어서 먼저 쓰고, 7은 무늬를 바꿀 수 있어서 아껴 두고, 낼 때는 자기 패에 가장
            많은 무늬로 바꿔요. 공격을 받으면 넘길 수 있는 카드 중 가장 약한 것으로 넘겨요.
          </p>
          <p className={styles.sectionText}>
            앱에는 카드가 1장 남았을 때 먼저 누르는 &lsquo;원카드!&rsquo; 버튼이 있지만, 사람끼리 겨룰 때만 쓰는 규칙이라 컴퓨터와 하는
            이곳에는 없어요.
          </p>
        </Fold>
        <Fold title="이기는 요령" hint="공격 카드 아끼기 · 무늬 지키기">
          <ul className={styles.sectionText}>
            <li>공격 카드는 바로 쓰기보다 상대 카드가 거의 떨어졌을 때나 공격을 넘길 때를 위해 아껴 두세요.</li>
            <li>7은 내 패에 가장 많은 무늬로 바꾸는 카드예요. 낼 카드가 없을 때를 위해 남겨 두면 좋아요.</li>
            <li>카드가 많아졌다면 파산 20장까지 몇 장 남았는지 보고, 공격을 넘길 카드를 지켜요.</li>
          </ul>
          <p className={styles.sectionText}>
            숫자로 본 승률과 요령은 <Link href="/reads/onecard-tips">원카드 잘하는 법</Link>에 정리했어요.
          </p>
        </Fold>
        <Fold title="기록" hint="이 브라우저에만 저장">
          <p className={styles.sectionText}>
            원카드는 운영자가 만든 비행기오락실 앱의 같은 게임을 웹으로 옮긴 것이에요. 앱에서는 옆 사람 폰과 바로 연결해 함께할
            수 있고, 이 사이트에서는 컴퓨터와 해요. 이긴 판 수, 우승 횟수, 고른 설정은 지금 쓰는 브라우저에만 저장되고 서버로
            보내지 않아요. 브라우저의 사이트 데이터를 지우면 함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>빙고·숫자 야구·스도쿠·오목·장기·체스에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
