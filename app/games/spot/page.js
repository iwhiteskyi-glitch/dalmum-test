import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import SpotGame from "@/components/games/SpotGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "틀린 그림 찾기 | 두 그림에서 다른 곳 5곳, 연승 도전과 오늘의 그림",
  description:
    "설치 없이 바로 하는 무료 틀린 그림 찾기. 두 그림에서 다른 곳 5곳을 시간 안에 찾고 연승에 도전해 보세요. 날마다 바뀌는 오늘의 그림은 시간 제한 없이 즐길 수 있어요.",
  path: "/games/spot",
  image: "games",
});

export default function SpotPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>眼</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>틀린 그림 찾기, 몇 판까지 이어 갈까?</h1>
        <p className={styles.lead}>
          똑같아 보이는 두 그림에서 다른 곳 5곳을 찾아 눌러 보세요. 시간 안에 다 찾으면 다음 판으로 넘어가요.
        </p>
      </section>

      <SpotGame />

      <MoreInfo title="틀린 그림 찾기가 궁금하다면" lead="규칙과 난이도, 찾는 요령, 기록이 남는 방식을 모아 뒀어요.">
        <Fold title="규칙" hint="다른 곳 5곳 · 잘못 누르면 잠깐 멈춤">
          <p className={styles.sectionText}>
            두 그림은 같은 그림이지만 다섯 곳이 달라요. 어떤 곳은 색이 바뀌어 있고, 어떤 곳은 한쪽 그림에서만
            무언가가 지워져 있어요. 다른 곳은 두 그림 중 어느 쪽을 눌러도 돼요. 찾은 곳에는 동그라미가 그려져요.
          </p>
          <p className={styles.sectionText}>
            다른 곳이 아닌 데를 누르면 X 표시와 함께 잠깐 누를 수 없어요. 연달아 잘못 누를수록 1초, 2초, 3초로
            길어지고, 맞히면 다시 1초부터예요. 마구 눌러서 찾는 것을 막기 위한 규칙이에요.
          </p>
        </Fold>
        <Fold title="연승 도전" hint="60초에서 30초로 · 6판째부터 어려움">
          <p className={styles.sectionText}>
            첫 판은 60초이고 판마다 3~4초씩 줄어 10판째부터는 30초예요. 5판까지는 비교적 큰 곳이 바뀌고,
            6판째부터는 더 작은 곳이 바뀌어요. 시간이 다 되거나 한 판에 5번 잘못 누르면 끝나고, 그때까지 깬 판
            수가 연승 기록이 돼요. 끝나면 못 찾은 곳이 빨간 동그라미로 보여요.
          </p>
          <p className={styles.sectionText}>
            그림은 50장이 있고, 50장이 한 번씩 다 나오기 전에는 같은 그림이 다시 나오지 않아요. 같은 그림이 다시
            나와도 다른 곳은 판마다 새로 골라요.
          </p>
        </Fold>
        <Fold title="힌트와 잠깐 멈춤" hint="💡 판마다 1번 · ⏸ 그림 가리기">
          <ul className={styles.sectionText}>
            <li>💡 힌트를 누르면 아직 못 찾은 곳 하나를 잠깐 빨간 동그라미로 보여 줘요. 판마다 한 번 쓸 수 있어요.</li>
            <li>⏸ 잠깐 멈추면 그림이 가려지고 시간도 멈춰요. 다른 탭으로 가면 저절로 멈춰요.</li>
          </ul>
        </Fold>
        <Fold title="찾는 요령" hint="칸 나눠 보기 · 색과 빈자리">
          <ul className={styles.sectionText}>
            <li>그림을 머릿속으로 네 칸쯤 나눠 한 칸씩 두 그림을 번갈아 보세요. 한꺼번에 보는 것보다 빠뜨리는 곳이 적어요.</li>
            <li>색이 바뀐 곳은 눈에 잘 띄지만, 무언가가 지워진 곳은 &lsquo;원래 있어야 할 것&rsquo;을 떠올려야 보여요. 무늬나 점이 줄지어 있는 곳을 눈여겨보세요.</li>
            <li>틀리면 잠깐 못 누르니, 확실할 때만 누르는 편이 결국 빨라요.</li>
          </ul>
          <p className={styles.sectionText}>
            더 자세한 요령과 사람이 차이를 놓치는 이유는{" "}
            <Link href="/reads/spot-the-difference-tips">틀린 그림 찾기 잘하는 법</Link>에 정리했어요.
          </p>
        </Fold>
        <Fold title="오늘의 그림" hint="날마다 바뀌는 한 장 · 시간 제한 없음">
          <p className={styles.sectionText}>
            오늘의 그림은 한국 시간 자정마다 바뀌고, 같은 날에는 누구나 같은 그림에서 같은 다섯 곳을 찾아요. 다른
            곳은 연승 도전의 어려운 판처럼 작은 곳으로 골라요. 시간 제한과 틀린 횟수 제한이 없고, 다섯 곳을 모두
            찾은 시간이 남아요. 날마다 찾으면 연속 일수가 쌓여요.
          </p>
        </Fold>
        <Fold title="그림과 기록" hint="직접 만든 그림 · 이 브라우저에만 저장">
          <p className={styles.sectionText}>
            그림 50장은 슬라이드 퍼즐과 같은 그림으로, 운영자가 이 사이트와 앱을 위해 AI 그림 도구로 만들었어요. 최고 연승, 본 그림 목록,
            오늘의 그림 시간은 지금 쓰는 브라우저에만 저장되고 서버로 보내지 않아요. 브라우저의 사이트 데이터를
            지우면 함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>스도쿠·슬라이드 퍼즐·오목·장기·체스에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
