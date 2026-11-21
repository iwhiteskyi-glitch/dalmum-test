import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import DingDongGame from "@/components/games/DingDongGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "띵동 다섯 | 같은 간식이 딱 5개면 버튼을 먼저, 컴퓨터와 반응 속도 대결",
  description:
    "설치 없이 바로 하는 무료 반응 속도 카드 게임 띵동 다섯. 컴퓨터 1~3명과 카드를 차례로 펼치고, 같은 간식이 딱 5개가 보이면 '띵동!' 버튼을 가장 먼저 눌러 카드를 모아 보세요.",
  path: "/games/dingdong",
  image: "games",
});

export default function DingDongPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>五</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>띵동 다섯, 누가 먼저 누를까?</h1>
        <p className={styles.lead}>
          차례대로 카드를 펼쳐요. 보이는 카드를 합쳐 같은 간식이 딱 5개가 되면 &lsquo;띵동!&rsquo;을 가장 먼저 눌러요. 맞히면
          펼친 카드를 모두 가져가고, 틀리면 한 장씩 나눠 줘요.
        </p>
      </section>

      <DingDongGame />

      <MoreInfo title="띵동 다섯이 궁금하다면" lead="카드와 규칙, 누가 먼저인지 정하는 방법, 컴퓨터 빠르기를 모아 뒀어요.">
        <Fold title="카드" hint="간식 4가지 · 56장">
          <p className={styles.sectionText}>
            프레첼·주스·컵케이크·탄산음료 4가지 간식이 1~5개 그려진 카드 56장이에요. 간식마다 1개짜리 5장, 2개짜리 3장, 3개짜리
            3장, 4개짜리 2장, 5개짜리 1장이 있어요. 모두에게 똑같이 나눠 뒤집힌 더미로 가지고, 남는 카드는 빼 둬요.
          </p>
        </Fold>
        <Fold title="진행" hint="펼치기 · 띵동 · 땡">
          <ul className={styles.sectionText}>
            <li>차례가 오면 &lsquo;펼치기&rsquo;로 내 더미 맨 위 카드를 펼쳐요. 펼친 카드는 내 자리에 쌓이고 맨 위 카드만 보여요.</li>
            <li>모두의 맨 위 카드를 합쳐 같은 간식이 딱 5개면 누구든 &lsquo;띵동!&rsquo;을 눌러요. 내 차례가 아니어도 돼요.</li>
            <li>가장 빨리 맞게 누른 사람이 펼친 카드를 모두 가져가 더미 밑에 넣고, 다음 카드를 펼쳐요.</li>
            <li>5개가 아닐 때 누르면 땡! 남은 사람들에게 내 카드를 한 장씩 줘요.</li>
            <li>내 차례에 정한 시간(3초·5초) 안에 안 펼치면 저절로 펼쳐져요.</li>
          </ul>
        </Fold>
        <Fold title="이기기" hint="탈락 · 3분 · 승수">
          <p className={styles.sectionText}>
            내 더미가 다 떨어지면 바로 탈락이에요. 탈락하면 펼쳐 둔 카드도 치워서, 남은 사람 카드만 세면 돼요. 한 사람만 남으면 그
            사람이 판에서 이겨요. 판마다 3분 제한이 있어서, 시간이 다 되면 더미 카드가 가장 많은 사람이 이기고 동점이면 모두 1승이에요.
            정한 승수를 먼저 채우면 우승이에요.
          </p>
        </Fold>
        <Fold title="누가 먼저인지 정하는 법" hint="반응 시간">
          <p className={styles.sectionText}>
            누가 먼저 눌렀는지는 &lsquo;카드가 화면에 뜬 뒤 누르기까지 걸린 시간&rsquo;으로 정해요. 앱에서 여러 폰을 이어서 할 때 폰마다
            연결 속도가 달라도 공평하게 하려고 만든 방법이고, 이곳에서도 같은 방법을 써요. 판정이 끝나면 누가 몇 초 만에 눌렀는지
            보여 줘요. PC에서는 Space 키로 띵동, Enter 키로 펼칠 수 있어요.
          </p>
        </Fold>
        <Fold title="컴퓨터 빠르기" hint="느림 · 보통 · 빠름">
          <ul className={styles.sectionText}>
            <li>느림: 1.6~2.6초 만에 누르고, 15%는 놓쳐요.</li>
            <li>보통: 1.0~1.8초 만에 누르고, 10%는 놓쳐요.</li>
            <li>빠름: 0.7~1.2초 만에 누르고, 5%는 놓쳐요.</li>
          </ul>
          <p className={styles.sectionText}>
            컴퓨터는 5개가 아닐 때는 누르지 않아요. 반응 속도로 본 승률은{" "}
            <Link href="/reads/dingdong-tips">띵동 다섯, 몇 초면 이길까</Link>에 정리했어요.
          </p>
        </Fold>
        <Fold title="기록" hint="이 브라우저에만 저장">
          <p className={styles.sectionText}>
            띵동 다섯은 운영자가 만든 비행기오락실 앱의 같은 게임을 웹으로 옮긴 것이에요. 앱에서는 옆 사람 폰과 바로 연결해 함께할
            수 있고, 이 사이트에서는 컴퓨터와 해요. 이긴 판 수, 우승 횟수, 가장 빠르게 맞힌 반응 시간, 고른 설정은 지금 쓰는
            브라우저에만 저장되고 서버로 보내지 않아요. 브라우저의 사이트 데이터를 지우면 함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>숫자 타일·원카드·도둑잡기·빙고·숫자 야구에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
