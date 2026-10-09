import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import DailyPuzzle from "@/components/games/DailyPuzzle";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "오늘의 체스 문제 | 매일 바뀌는 체크메이트 퍼즐",
  description: "하루 한 문제, 매일 바뀌는 체스 체크메이트 퍼즐. 정해진 수 안에 상대 킹을 체크메이트로 몰아넣어 보세요.",
  path: "/games/puzzle/chess",
  image: "games",
});

export default function ChessPuzzlePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>♚</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>오늘의 체스 문제</h1>
        <p className={styles.lead}>상대가 방금 둔 수(노랗게 표시)부터 시작해요. 정해진 수 안에 상대 킹을 체크메이트로 몰아넣어 보세요.</p>
      </section>

      <DailyPuzzle game="chess" />

      <MoreInfo title="체스 문제가 궁금하다면" lead="푸는 요령과 이 문제의 규칙을 모아 뒀어요.">
        <Fold title="푸는 요령" hint="체크 · 잡기 · 위협 순서로">
          <p className={styles.sectionText}>
            체스 고수들은 후보 수를 체크, 잡는 수, 위협하는 수 순서로 살펴봐요. 체크메이트 문제의 첫 수는 체크인 경우가 많지만, 조용한 수가 정답인 문제도 있어요.
          </p>
          <p className={styles.sectionText}>
            상대 킹 주변 칸 가운데 내 말이 노리는 칸과 상대 말이 막고 있는 칸을 표시해 보세요. 남은 칸이 하나뿐이라면 그 칸을 막는 수가 답일 수 있어요.
          </p>
          <p className={styles.sectionText}>
            퀸을 내주는 희생도 자주 나와요. 상대가 퀸을 잡으면 킹의 길이 막히는지 확인해 보세요.
          </p>
        </Fold>
        <Fold title="문제 출처" hint="리체스 공개 문제(CC0)">
          <p className={styles.sectionText}>
            체스 문제는 세계 최대 무료 체스 사이트 리체스(lichess.org)가 실제 대국에서 뽑아 누구나 쓸 수 있게(CC0) 공개한 문제 가운데, 많은 사람이 풀고 좋은 평을 받은 체크메이트 문제를 골랐어요. 리체스 문제는 상대의 마지막 한 수부터 시작하는 방식이라, 판에 노랗게 표시된 칸이 상대가 방금 움직인 곳이에요.
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
