import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import DailyPuzzle from "@/components/games/DailyPuzzle";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "오늘의 오목 문제 | 매일 바뀌는 오목 묘수풀이",
  description: "하루 한 문제, 매일 바뀌는 오목 묘수풀이. 4를 연달아 만들어 정해진 수 안에 5목을 만드는 길을 찾아보세요.",
  path: "/games/puzzle/omok",
  image: "games",
});

export default function OmokPuzzlePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>五</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>오늘의 오목 문제</h1>
        <p className={styles.lead}>4를 연달아 만들어 상대가 막기만 하게 몰아붙이고, 정해진 수 안에 5목을 만들어 보세요. 문제는 매일 바뀌어요.</p>
      </section>

      <DailyPuzzle game="omok" />

      <MoreInfo title="오목 문제가 궁금하다면" lead="푸는 요령과 이 문제의 규칙을 모아 뒀어요.">
        <Fold title="푸는 요령" hint="4 · 4·4 · 4·3">
          <p className={styles.sectionText}>
            4는 한 수만 더 두면 5목이 되는 모양이라 상대가 반드시 막아야 해요. 4를 두는 동안에는 내가 주도권을 쥐고 있어요.
          </p>
          <p className={styles.sectionText}>
            끝내는 모양은 두 곳을 동시에 노리는 수예요. 4를 두 개 만들거나(4·4), 4와 열린 3을 함께 만들면(4·3) 상대는 한 곳만 막을 수 있어요.
          </p>
          <p className={styles.sectionText}>
            상대가 막는 자리에 놓인 돌이 내 다음 4를 방해하지 않는지 미리 살펴보세요. 막는 돌로 상대가 4를 만들면 그것부터 막아야 해요.
          </p>
        </Fold>
        <Fold title="쌍삼 금지도 적용돼요" hint="양쪽 모두">
          <p className={styles.sectionText}>
            이 사이트 오목은 흑과 백 모두 쌍삼(열린 3을 두 개 동시에 만드는 수)을 둘 수 없어요. 그래서 상대가 막아야 할 자리가 상대에게 쌍삼이면, 상대는 그 자리를 막지 못해요. 이런 장면이 숨어 있는 문제도 있어요.
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
