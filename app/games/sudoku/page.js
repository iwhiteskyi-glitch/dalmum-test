import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import Sudoku from "@/components/games/Sudoku";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "스도쿠 | 4×4 연습부터 9×9 최고 난이도까지 10단계, 오늘의 스도쿠",
  description:
    "설치 없이 바로 하는 무료 스도쿠. 4×4 연습부터 9×9 최고 난이도까지 10단계를 차례로 풀고, 날마다 바뀌는 오늘의 스도쿠에도 도전해 보세요. 메모·힌트·되돌리기 기능이 있어요.",
  path: "/games/sudoku",
  image: "games",
});

export default function SudokuPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>數</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>스도쿠, 몇 단계까지 풀 수 있을까?</h1>
        <p className={styles.lead}>
          가로줄·세로줄·굵은 선 상자마다 숫자가 한 번씩 들어가도록 빈칸을 채워 보세요. 4×4 연습부터 시작해서 한
          단계씩 올라가요.
        </p>
      </section>

      <Sudoku />

      <MoreInfo title="스도쿠가 궁금하다면" lead="규칙과 단계, 푸는 요령, 기록이 남는 방식을 모아 뒀어요.">
        <Fold title="규칙" hint="줄·세로줄·상자마다 한 번씩">
          <p className={styles.sectionText}>
            9×9 판에서는 가로줄 9개, 세로줄 9개, 굵은 선으로 나뉜 3×3 상자 9개마다 1부터 9까지의 숫자가 한 번씩만
            들어가요. 처음부터 진하게 적혀 있는 숫자는 바꿀 수 없고, 남은 빈칸을 채우면 돼요. 4×4 판은 1~4, 6×6 판은
            1~6을 같은 방법으로 넣어요.
          </p>
          <p className={styles.sectionText}>
            이 사이트의 문제는 모두 답이 딱 하나뿐인 문제예요. 그래서 찍지 않아도 논리만으로 끝까지 풀 수 있어요.
            숫자를 넣을 때는 맞는지 알려 주지 않고, 판을 다 채웠을 때 채점해요. 같은 줄이나 상자에 같은 숫자가
            두 번 들어가면 빨갛게 보여 주는데, 이 기능은 단계 목록 위에서 끌 수 있어요.
          </p>
        </Fold>
        <Fold title="10단계는 어떻게 나뉘나요?" hint="판 크기 · 필요한 풀이 기술">
          <p className={styles.sectionText}>
            1단계는 4×4, 2~3단계는 6×6, 4단계부터는 9×9예요. 9×9 단계는 처음 숫자가 몇 개인지보다 &lsquo;풀 때
            꼭 필요한 기술&rsquo;로 나눴어요. 4~5단계는 한 칸씩 들어갈 숫자를 찾기만 해도 풀리고, 6단계부터는 줄과
            상자가 겹치는 자리, 두 칸 짝, 세 칸 짝과 X-윙, XY-윙처럼 한 단계 높은 기술이 하나씩 더 필요해져요.
          </p>
          <p className={styles.sectionText}>
            앞 단계를 풀어야 다음 단계가 열리고, 같은 단계도 &lsquo;새 문제&rsquo;를 누를 때마다 다른 문제가 나와요.
            10단계를 깨면 어려움 이상 문제가 계속 나오는 무한 도전이 열려요.
          </p>
        </Fold>
        <Fold title="메모·힌트·되돌리기" hint="✏️ 후보 적기 · 💡 한 판에 3번">
          <ul className={styles.sectionText}>
            <li>✏️ 메모를 켜고 숫자를 누르면 그 칸에 들어갈 수 있는 후보를 작게 적어 둘 수 있어요. 칸에 숫자를 넣으면 같은 줄·상자의 같은 메모는 저절로 지워져요.</li>
            <li>💡 힌트는 한 판에 세 번까지예요. 고른 칸이 비었거나 틀렸으면 그 칸을, 아니면 아무 빈칸 하나를 정답으로 열어 줘요. 힌트 없이 풀면 단계에 ★이 붙어요.</li>
            <li>↶ 되돌리기로 방금 넣은 숫자나 메모를 거꾸로 하나씩 되돌릴 수 있어요.</li>
            <li>⏸ 잠깐 멈추면 판이 가려지고 시계도 멈춰요. 다른 탭으로 가면 저절로 멈춰요.</li>
          </ul>
          <p className={styles.sectionText}>
            PC에서는 방향키로 칸을 옮기고 숫자 키로 넣을 수 있어요. N은 메모 켜고 끄기, Backspace는 지우기,
            Ctrl+Z는 되돌리기예요.
          </p>
        </Fold>
        <Fold title="푸는 요령" hint="한 칸에 하나뿐 · 한 줄에 한 자리뿐">
          <ul className={styles.sectionText}>
            <li>숫자 하나를 정해 판 전체를 훑어보세요. 그 숫자가 이미 있는 줄과 상자를 지우고 나면 들어갈 자리가 하나만 남는 상자가 보여요.</li>
            <li>빈칸이 적은 줄이나 상자부터 보세요. 빠진 숫자가 두세 개뿐이면 자리를 금방 정할 수 있어요.</li>
            <li>막히면 메모로 후보를 적어 보세요. 후보가 하나만 남은 칸이 생겨요.</li>
          </ul>
          <p className={styles.sectionText}>
            단계별로 필요한 기술을 예시와 함께{" "}
            <Link href="/reads/sudoku-tips">스도쿠 푸는 법</Link>에 정리했어요.
          </p>
        </Fold>
        <Fold title="오늘의 스도쿠" hint="날마다 바뀌는 9×9 · 모두 같은 문제">
          <p className={styles.sectionText}>
            오늘의 스도쿠는 한국 시간 자정마다 바뀌고, 같은 날에는 누구나 같은 문제를 풀어요. 오늘의 문제와 같은
            요일표를 써서 월요일부터 목요일까지는 보통(6단계 수준), 금요일부터 일요일까지는 어려움(7단계 수준)이에요.
            다시 풀면 더 빠른 시간이 남고, 이어서 푼 날은 연속 일수로 쌓여요.
          </p>
        </Fold>
        <Fold title="기록은 어디에 저장되나요?" hint="이 브라우저에만, 서버 저장 없음">
          <p className={styles.sectionText}>
            깬 단계와 ★, 단계마다 가장 빠른 시간, 무한 도전 최고 기록, 오늘의 스도쿠를 푼 날은 지금 쓰는 브라우저에만
            저장되고 서버로 보내지 않아요. 다른 기기에서는 1단계부터 시작하고, 브라우저의 사이트 데이터를 지우면
            함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>오목·장기·체스·슬라이드 퍼즐에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
