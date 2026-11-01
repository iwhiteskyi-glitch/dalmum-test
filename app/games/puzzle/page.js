import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import TodayPuzzles from "@/components/games/TodayPuzzles";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "오늘의 문제 | 매일 바뀌는 오목·장기·체스 묘수풀이",
  description:
    "하루 한 문제, 매일 바뀌는 오목·장기·체스 묘수풀이. 몇 수 안에 이기는 길을 찾아보고, 푼 문제를 친구에게 내 보세요.",
  path: "/games/puzzle",
  image: "games",
});

export default function PuzzleHubPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>題</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>오늘의 문제, 풀 수 있을까?</h1>
        <p className={styles.lead}>
          매일 한 문제씩 바뀌는 오목·장기·체스 묘수풀이예요. 대국 중간의 한 장면에서 몇 수 안에 이기는 길을
          찾아보세요. 오늘 들어온 사람은 모두 같은 문제를 풀어요.
        </p>
      </section>

      <TodayPuzzles />

      <MoreInfo title="오늘의 문제가 궁금하다면" lead="어떻게 푸는지, 난이도와 문제는 어떻게 정해지는지 모아 뒀어요.">
        <Fold title="어떻게 푸나요?" hint="정해진 수 안에 이기기">
          <p className={styles.sectionText}>
            대국이 한창 진행된 판에서 시작해요. 내 차례에 수를 두면 상대는 가장 오래 버틸 수 있는 수로 막고, 나는
            정해진 수 안에 이겨야 해요. 틀린 수를 두면 처음 판으로 돌아가 다시 풀 수 있고, 막히면 힌트로 다음 수의
            위치를 볼 수 있어요.
          </p>
          <ul className={styles.sectionText}>
            <li>
              <b>오목</b>: 4(한 수만 더 두면 5목이 되는 모양)를 연달아 만들어 상대가 막기만 하게 몰아붙이고, 끝내
              두 곳을 동시에 노려 5목을 만들어요.
            </li>
            <li>
              <b>장기</b>: 장군을 계속 불러서 상대 궁이 피할 곳 없게(외통) 만들어요.
            </li>
            <li>
              <b>체스</b>: 정해진 수 안에 상대 킹을 체크메이트로 몰아넣어요.
            </li>
          </ul>
        </Fold>
        <Fold title="요일마다 난이도가 달라요" hint="월·화 쉬움 · 수·목·금 보통 · 주말 어려움">
          <p className={styles.sectionText}>
            월요일과 화요일은 쉬운 문제, 수요일부터 금요일은 보통 문제, 토요일과 일요일은 어려운 문제가 나와요.
            쉬운 문제는 한두 수, 어려운 문제는 서너 수 이상 내다봐야 풀 수 있어요. 날짜는 한국 시간 자정에 바뀌어요.
          </p>
        </Fold>
        <Fold title="문제는 어디서 오나요?" hint="컴퓨터 분석 · 리체스 공개 문제">
          <p className={styles.sectionText}>
            오목과 장기 문제는 컴퓨터끼리 둔 수천 판의 대국에서, 정해진 수 안에 이기는 길이 있고 그 첫 수가 딱
            하나뿐인 장면만 골라 만들었어요. 체스 문제는 세계 최대 무료 체스 사이트인 리체스(lichess.org)가
            누구나 쓸 수 있게(CC0) 공개한 문제 가운데, 많은 사람이 풀고 좋은 평을 받은 체크메이트 문제를 골랐어요.
          </p>
        </Fold>
        <Fold title="지난 문제와 기록" hint="이 브라우저에만 저장">
          <p className={styles.sectionText}>
            문제 화면 아래 &lsquo;지난 문제&rsquo;에서 어제 이전의 문제도 풀 수 있어요. 푼 문제와 연속으로 푼 날짜는
            지금 쓰는 브라우저에만 저장되고 서버로 보내지 않아요. 다른 기기에서는 기록이 보이지 않아요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>문제를 풀었다면</small>
          <strong>컴퓨터와 한 판 두기</strong>
          <span>10단계로 점점 강해지는 컴퓨터에 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
