import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import DailyPuzzle from "@/components/games/DailyPuzzle";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "오늘의 장기 문제 | 매일 바뀌는 장기 묘수풀이",
  description: "하루 한 문제, 매일 바뀌는 장기 묘수풀이. 장군을 계속 불러 정해진 수 안에 외통을 만드는 길을 찾아보세요.",
  path: "/games/puzzle/janggi",
  image: "games",
});

export default function JanggiPuzzlePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>將</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>오늘의 장기 문제</h1>
        <p className={styles.lead}>장군을 계속 불러서 상대 궁이 피할 곳 없게(외통) 만들어 보세요. 문제는 매일 바뀌어요.</p>
      </section>

      <DailyPuzzle game="janggi" />

      <MoreInfo title="장기 문제가 궁금하다면" lead="푸는 요령과 이 문제의 규칙을 모아 뒀어요.">
        <Fold title="푸는 요령" hint="장군 · 길목 막기 · 희생">
          <p className={styles.sectionText}>
            먼저 상대 궁이 피할 수 있는 자리를 세어 보세요. 그 자리를 내 말이 이미 노리고 있거나, 상대 말이 막고 있으면 궁은 그쪽으로 못 가요.
          </p>
          <p className={styles.sectionText}>
            포는 다리(넘을 말)가 있어야 장군을 부를 수 있어요. 내 말을 움직여 포의 다리를 만들거나, 상대가 막으러 온 말을 다리로 삼는 수가 자주 나와요.
          </p>
          <p className={styles.sectionText}>
            때로는 차나 마를 내주는 수(희생)가 정답이에요. 상대가 그 말을 잡는 동안 궁의 길이 막히기도 해요.
          </p>
        </Fold>
        <Fold title="이 문제에서의 규칙" hint="장군 중엔 한수쉼 불가">
          <p className={styles.sectionText}>
            내가 두는 수는 모두 장군이어야 해요. 장군을 받는 쪽은 한수쉼을 할 수 없어서, 상대는 장군을 피하는 수 가운데 가장 오래 버티는 수로 막아요.
          </p>
        </Fold>
        <Fold title="요일마다 난이도가 달라요" hint="월·화 쉬움 · 수·목·금 보통 · 주말 어려움">
          <p className={styles.sectionText}>
            월요일과 화요일은 쉬운 문제, 수요일부터 금요일은 보통 문제, 토요일과 일요일은 어려운 문제가 나와요.
            날짜는 한국 시간 자정에 바뀌고, 지난 문제는 아래 목록에서 다시 풀 수 있어요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games/puzzle" className={styles.nextCard}>
        <span>
          <small>다른 게임 문제도 있어요</small>
          <strong>오늘의 문제 모아 보기</strong>
          <span>오목·장기·체스 문제가 매일 바뀌어요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
