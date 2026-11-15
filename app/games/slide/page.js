import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import SlidePuzzle from "@/components/games/SlidePuzzle";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "슬라이드 퍼즐 | 4×4부터 8×8까지, 숫자와 그림 조각 맞추기",
  description:
    "설치 없이 바로 하는 슬라이드 퍼즐. 조각을 밀어 숫자나 그림을 맞추고 최고 기록에 도전해 보세요. 날마다 바뀌는 오늘의 판은 그림 50장이 차례로 나와요.",
  path: "/games/slide",
  image: "games",
});

export default function SlidePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>滑</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>슬라이드 퍼즐, 몇 초 만에 맞출까?</h1>
        <p className={styles.lead}>
          빈칸 하나를 이용해 조각을 밀어서 차례대로 맞춰 보세요. 첫 조각을 누르는 순간부터 시간이 흘러요.
        </p>
      </section>

      <SlidePuzzle />

      <MoreInfo title="슬라이드 퍼즐이 궁금하다면" lead="규칙과 푸는 요령, 기록이 남는 방식을 모아 뒀어요.">
        <Fold title="규칙" hint="빈칸 쪽으로 밀기 · 마지막 조각 끼우기">
          <p className={styles.sectionText}>
            판에는 조각과 빈칸 하나가 있어요. 빈칸과 같은 가로줄이나 세로줄에 있는 조각을 누르면 그 조각부터 빈칸
            쪽으로 한꺼번에 밀려요. PC에서는 방향키로도 움직일 수 있어요.
          </p>
          <p className={styles.sectionText}>
            1번부터 차례대로 왼쪽 위에서 오른쪽으로 맞추고, 오른쪽 아래 칸은 비워 둬요. 제자리에 들어간 조각은
            테두리가 금빛으로 바뀌어요. 다 맞추면 판 아래의 마지막 조각이 반짝이는데, 이 조각을 눌러 끼워야
            시간이 멈춰요. 그림 판은 조각 하나하나가 그림의 제 몫을 담고 있어서 다 맞추면 그림이 완성돼요.
          </p>
        </Fold>
        <Fold title="푸는 요령" hint="위 줄부터 · 줄 끝은 두 조각 함께">
          <ul className={styles.sectionText}>
            <li>맨 윗줄부터 한 줄씩 맞추고, 맞춘 줄은 건드리지 않아요. 판이 점점 작아지는 셈이에요.</li>
            <li>줄의 마지막 두 조각은 따로 넣기 어려워요. 두 조각을 나란히 이어서 함께 밀어 넣어요.</li>
            <li>아래쪽 두 줄이 남으면 왼쪽 세로줄부터 한 칸씩 맞춰요. 조각 둘을 위아래로 이어서 넣으면 돼요.</li>
            <li>막히면 &lsquo;꾹 눌러 완성 모습 보기&rsquo; 버튼으로 완성된 모습을 확인해 보세요.</li>
          </ul>
          <p className={styles.sectionText}>
            더 자세한 순서는{" "}
            <Link href="/reads/slide-puzzle-tips">슬라이드 퍼즐 푸는 법</Link>에 정리했어요.
          </p>
        </Fold>
        <Fold title="오늘의 판" hint="날마다 바뀌는 그림 · 모두 같은 판">
          <p className={styles.sectionText}>
            오늘의 판은 한국 시간 자정마다 바뀌고, 같은 날에는 누구나 같은 그림과 같은 판을 풀어요. 월요일부터
            목요일까지는 4×4, 금요일부터 일요일까지는 5×5이고, 그림 구석에 번호가 함께 나와요. 다시 풀면 더 빠른
            시간이 남고, 그날 판을 푼 날이 이어지면 연속 일수가 쌓여요. 지난 판은 다시 풀 수 없어요.
          </p>
        </Fold>
        <Fold title="기록은 어디에 저장되나요?" hint="이 브라우저에만, 서버 저장 없음">
          <p className={styles.sectionText}>
            가장 빠른 시간은 칸 수마다, 조각 종류(숫자·그림+번호·그림)마다 따로 남아요. 기록은 지금 쓰는
            브라우저에만 저장되고 서버로 보내지 않아서, 다른 기기에서는 처음부터 시작하고 브라우저의 사이트
            데이터를 지우면 함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>오목·돌 뒤집기·장기·체스에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
