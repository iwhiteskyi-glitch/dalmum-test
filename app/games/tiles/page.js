import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import TilesGame from "@/components/games/TilesGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "숫자 타일 게임 | 컴퓨터와 같은 숫자·이어진 숫자 묶음 만들기",
  description:
    "설치 없이 바로 하는 무료 숫자 타일 게임. 컴퓨터 1~3명과 4가지 색 숫자 타일로 같은 숫자·이어진 숫자 묶음을 만들고, 판의 묶음을 고쳐 가며 손의 타일을 먼저 다 내려놓아 보세요.",
  path: "/games/tiles",
  image: "games",
});

export default function TilesPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>數</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>숫자 타일, 먼저 다 내려놓기</h1>
        <p className={styles.lead}>
          같은 숫자 묶음과 이어진 숫자 묶음을 만들어 판에 내려놓아요. 판에 놓인 묶음을 나누고 합쳐서 내 타일을 끼워 넣을 수도
          있어요. 손의 타일을 가장 먼저 다 내려놓으면 이겨요.
        </p>
      </section>

      <TilesGame />

      <MoreInfo title="숫자 타일이 궁금하다면" lead="타일과 묶음, 첫 등록, 판 고치는 법, 컴퓨터가 두는 방법을 모아 뒀어요.">
        <Fold title="타일과 묶음" hint="같은 숫자 · 이어진 숫자">
          <p className={styles.sectionText}>
            타일은 빨강·파랑·노랑·검정 4가지 색에 숫자 1~13이 두 벌씩 있고, 조커가 2개 있어 모두 106개예요. 처음에 14개씩
            받아요. 묶음은 타일 3개 이상으로 만들어요.
          </p>
          <ul className={styles.sectionText}>
            <li>같은 숫자 묶음: 색이 서로 다른 같은 숫자 3~4개. 예) 빨강 7 · 파랑 7 · 노랑 7</li>
            <li>이어진 숫자 묶음: 같은 색으로 숫자가 1씩 이어지는 3개 이상. 예) 파랑 4 · 5 · 6 · 7. 13 다음에 1로 이어지지는 않아요.</li>
            <li>조커(☺)는 아무 타일 대신 쓸 수 있어요.</li>
          </ul>
        </Fold>
        <Fold title="내 차례" hint="고르고 놓기 · 완료 · 가져가기">
          <ul className={styles.sectionText}>
            <li>타일을 눌러 고르고(여러 개도 돼요) 놓을 곳을 눌러요. &lsquo;+ 새 묶음&rsquo;은 새 묶음, 묶음 양 끝의 +는 맨 앞이나 맨 뒤, 판의 타일은 그 타일 앞이에요.</li>
            <li>다 놓았으면 &lsquo;완료&rsquo;를 눌러요. 판의 모든 묶음이 맞고, 내 타일을 1개 이상 냈어야 해요.</li>
            <li>판에 있는 묶음을 나누고 합치고 옮겨서 새 묶음을 만들어도 돼요. 차례를 마칠 때 모두 맞으면 돼요.</li>
            <li>이번 차례에 낸 타일은 &lsquo;손으로&rsquo;로 다시 가져올 수 있어요. &lsquo;되돌리기&rsquo;는 누를 때마다 한 단계씩 취소해요.</li>
            <li>낼 게 없으면 &lsquo;가져가기&rsquo;로 타일 1개를 받고 차례가 끝나요.</li>
          </ul>
        </Fold>
        <Fold title="첫 등록과 끝" hint="30점 · 막히면 남은 값">
          <p className={styles.sectionText}>
            처음 내려놓을 때는 내 타일만으로 묶음을 만들고, 숫자 합이 30 이상이어야 해요. 이때는 판의 묶음을 건드릴 수 없어요.
            설정에서 &lsquo;제한 없음&rsquo;을 고르면 처음부터 묶음 하나면 돼요.
          </p>
          <p className={styles.sectionText}>
            손의 타일을 먼저 다 내려놓으면 그 판을 이겨요. 가져갈 타일이 다 떨어지고 모두 한 바퀴 연달아 못 내면, 손에 남은
            숫자 합이 가장 적은 사람이 이겨요. 이때 조커는 30으로 쳐요. 정한 승수를 먼저 채우면 우승이에요.
          </p>
        </Fold>
        <Fold title="컴퓨터는 어떻게 두나요?" hint="자기 손과 판만">
          <p className={styles.sectionText}>
            컴퓨터는 자기 손과 판만 보고 둬요. 손으로 만들 수 있는 묶음을 숫자 합이 큰 것부터 내려놓고, 남은 타일 중 판의 묶음
            끝에 붙일 수 있는 것을 붙여요. 판의 묶음을 크게 다시 짜지는 않아요. 무엇을 냈는지 보이도록 판을 고친 뒤 잠깐 있다가
            완료해요.
          </p>
          <p className={styles.sectionText}>
            판을 나누고 합쳐 다시 짜는 건 사람만 할 수 있는 무기예요. 숫자로 본 요령은{" "}
            <Link href="/reads/tiles-tips">숫자 타일 잘하는 법</Link>에 정리했어요.
          </p>
        </Fold>
        <Fold title="기록" hint="이 브라우저에만 저장">
          <p className={styles.sectionText}>
            숫자 타일은 운영자가 만든 비행기오락실 앱의 같은 게임을 웹으로 옮긴 것이에요. 앱에서는 옆 사람 폰과 바로 연결해 함께할
            수 있고, 이 사이트에서는 컴퓨터와 해요. 이긴 판 수, 우승 횟수, 고른 설정은 지금 쓰는 브라우저에만 저장되고 서버로
            보내지 않아요. 브라우저의 사이트 데이터를 지우면 함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>원카드·도둑잡기·빙고·숫자 야구·스도쿠·오목에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
