import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import LinkGame from "@/components/games/LinkGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "짝꿍 잇기 | 같은 그림 두 개를 이어 없애는 퍼즐, 10단계와 오늘의 판",
  description:
    "설치 없이 바로 하는 무료 짝꿍 잇기(사천성 방식 그림 잇기). 같은 그림 두 개를 두 번까지 꺾인 선으로 이어 판을 비워 보세요. 10단계 도전, 무한 도전, 날마다 바뀌는 오늘의 판이 있어요.",
  path: "/games/link",
  image: "games",
});

export default function LinkPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>連</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>짝꿍 잇기, 판을 다 비울 수 있을까?</h1>
        <p className={styles.lead}>
          같은 그림 두 개를 눌러 이으면 사라져요. 선은 두 번까지만 꺾일 수 있어요. 제한 시간 안에 타일을 모두 없애 보세요.
        </p>
      </section>

      <LinkGame />

      <MoreInfo title="짝꿍 잇기가 궁금하다면" lead="규칙과 단계, 콤보와 파워, 찾는 요령, 기록이 남는 방식을 모아 뒀어요.">
        <Fold title="규칙" hint="같은 그림 · 두 번까지 꺾인 선">
          <p className={styles.sectionText}>
            같은 그림 타일 두 개를 차례로 누르면, 둘 사이를 잇는 선을 찾아 둘 다 없애요. 선은 가로·세로로만 가고, 다른
            타일을 지나갈 수 없어요. 빈칸과 판 바깥 테두리 한 줄로는 지나갈 수 있어요. 선이 꺾이는 횟수는 두 번까지예요.
            곧게 이어지거나, 한 번 꺾이거나, 두 번 꺾여 이어지면 돼요.
          </p>
          <p className={styles.sectionText}>
            그림은 한 판에 같은 것이 4장씩 들어 있어요. 이을 수 있는 짝이 하나도 없으면 &ldquo;섞을게요&rdquo;라고 알린 뒤
            남은 타일 자리를 섞어 줘요. 섞는 동안은 시간이 멈춰요.
          </p>
        </Fold>
        <Fold title="10단계와 무한 도전" hint="6×6에서 8×12까지 · 미끄러지는 판">
          <p className={styles.sectionText}>
            1단계는 그림 9가지가 깔린 6×6 판이고, 단계가 오를수록 판이 커져 10단계는 그림 24가지가 깔린 8×12 판이에요.
            4단계와 6~10단계는 타일을 없앨 때마다 남은 타일이 아래·왼쪽·가운데처럼 한쪽으로 미끄러져서 판 모양이
            계속 바뀌어요. 제한 시간은 3~5분이고, 앞 단계를 깨야 다음 단계가 열려요.
          </p>
          <p className={styles.sectionText}>
            깬 시간에 따라 ★을 1~3개 받아요. 제한 시간이 절반 넘게 남았을 때 다 없애면 ★3, 4분의 1 넘게 남았으면 ★2예요.
            시간 막대의 두 금색 선이 그 경계예요. 10단계를 깨면 무한 도전이 열려요. 8×12 판이 계속 나오고, 3분에서
            시작해 판마다 10초씩 줄어 2분까지 짧아져요.
          </p>
        </Fold>
        <Fold title="콤보·파워·힌트" hint="3초 안에 이어서 · 5콤보마다 파워">
          <ul className={styles.sectionText}>
            <li>한 쌍을 없앤 뒤 3초 안에 다음 쌍을 없애면 콤보가 이어져요.</li>
            <li>5콤보마다 ⚡ 파워가 5초 동안 켜져요. 그동안 아무 타일이나 누르면 선과 상관없이 가장 가까운 같은 그림과 함께 깨져요.</li>
            <li>💡 힌트를 누르면 지금 이을 수 있는 짝 하나를 빨갛게 보여 줘요. 한 판에 세 번까지 쓸 수 있어요.</li>
            <li>⏸ 잠깐 멈추면 판이 가려지고 시간도 멈춰요. 다른 탭으로 가면 저절로 멈춰요.</li>
          </ul>
        </Fold>
        <Fold title="잘하는 요령" hint="가장자리부터 · 막힌 짝은 나중에">
          <ul className={styles.sectionText}>
            <li>판 가장자리 타일은 바깥 테두리로 선이 지나갈 수 있어서 잇기 쉬워요. 바깥쪽부터 비워 가면 안쪽 길이 열려요.</li>
            <li>같은 그림이 4장이라, 두 쌍 중 어느 둘을 짝지을지에 따라 남는 길이 달라져요. 다른 타일을 가로막고 있는 쪽부터 없애요.</li>
            <li>미끄러지는 단계에서는 없앤 뒤 타일이 어느 쪽으로 몰릴지 생각해서, 이미 이을 수 있는 짝이 흩어지지 않게 해요.</li>
          </ul>
          <p className={styles.sectionText}>
            더 자세한 요령과 판을 실제로 풀어 본 숫자는 <Link href="/reads/link-tips">짝꿍 잇기 잘하는 법</Link>에 정리했어요.
          </p>
        </Fold>
        <Fold title="오늘의 짝꿍 잇기" hint="날마다 바뀌는 한 판 · 시간 제한 없음">
          <p className={styles.sectionText}>
            오늘의 짝꿍 잇기는 한국 시간 자정마다 바뀌고, 같은 날에는 누구나 같은 판을 풀어요. 월~목은 그림 20가지가 깔린
            8×10 판(미끄러짐 없음), 금~일은 그림 24가지에 미끄러짐이 있는 8×12 판이에요. 시간 제한 없이 다 없앤 시간이
            남고, 날마다 풀면 연속 일수가 쌓여요.
          </p>
        </Fold>
        <Fold title="그림과 기록" hint="앱과 같은 그림 · 이 브라우저에만 저장">
          <p className={styles.sectionText}>
            짝꿍 잇기는 운영자가 만든 비행기오락실 앱의 같은 게임을 웹으로 옮긴 것이에요. 타일 그림 36가지도 앱과 같은
            그림이에요. 깬 단계, ★, 가장 빠른 시간, 무한 도전 기록, 오늘의 판 시간은 지금 쓰는 브라우저에만 저장되고
            서버로 보내지 않아요. 브라우저의 사이트 데이터를 지우면 함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>스도쿠·틀린 그림 찾기·슬라이드 퍼즐·오목·장기·체스에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
