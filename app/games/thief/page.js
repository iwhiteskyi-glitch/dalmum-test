import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import ThiefGame from "@/components/games/ThiefGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "도둑잡기 게임 | 컴퓨터와 카드 뽑아 짝 맞추기, 조커는 남에게",
  description:
    "설치 없이 바로 하는 무료 도둑잡기. 컴퓨터 1~3명과 옆 사람 카드를 한 장씩 뽑아 같은 숫자 짝을 버려요. 조커(도둑)를 마지막까지 들고 있으면 1점을 잃고, 0점이 되면 꼴찌예요.",
  path: "/games/thief",
  image: "games",
});

export default function ThiefPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>盜</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>도둑잡기, 조커는 누구 손에?</h1>
        <p className={styles.lead}>
          다음 사람의 카드를 뒷면만 보고 한 장씩 뽑아요. 같은 숫자 두 장이 모이면 버리고, 카드를 다 버리면 탈출이에요.
          마지막까지 조커를 들고 있는 사람이 도둑이에요.
        </p>
      </section>

      <ThiefGame />

      <MoreInfo title="도둑잡기가 궁금하다면" lead="규칙과 점수, 컴퓨터가 카드를 고르는 방법, 알아 두면 좋은 숫자를 모아 뒀어요.">
        <Fold title="규칙" hint="짝 버리기 · 뽑기 · 탈출">
          <ul className={styles.sectionText}>
            <li>A~K 네 무늬 52장에 조커 한 장을 더한 53장을 모두 나눠 가져요.</li>
            <li>같은 숫자 두 장은 짝이 되어 저절로 버려요. 같은 숫자가 세 장이면 두 장만 버리고 한 장은 남아요.</li>
            <li>차례가 오면 다음 사람의 카드를 뒷면만 보고 한 장 뽑아요. 짝이 맞으면 바로 버려요.</li>
            <li>차례는 내가 카드를 뽑아 온 사람에게 넘어가요. 카드를 다 버린 사람은 탈출해서 그 판은 안전해요.</li>
            <li>조커는 짝이 없어서 끝까지 남아요. 마지막까지 조커를 든 한 사람이 도둑이에요.</li>
          </ul>
        </Fold>
        <Fold title="점수와 꼴찌" hint="시작 3점 · 5점">
          <p className={styles.sectionText}>
            모두 같은 점수(3점 또는 5점)로 시작해요. 도둑이 될 때마다 1점을 잃고, 0점이 되는 사람이 꼴찌예요. 꼴찌가 나오면
            경기가 끝나요. 첫 판은 룰렛으로 먼저 뽑을 사람을 정하고, 다음 판은 지난 판 도둑부터 시작해요.
          </p>
        </Fold>
        <Fold title="뽑는 법" hint="들어 보고 가져오기">
          <p className={styles.sectionText}>
            뽑을 카드를 한 번 누르면 그 카드를 들어 올려요. 든 카드를 한 번 더 누르거나 &lsquo;이 카드 가져오기&rsquo;를 누르면
            가져와요. 다른 카드를 누르면 그 카드로 바꿔 들어요. 든 카드는 모두에게 보여서, 컴퓨터가 내 카드를 들면 내 패에서도
            그 카드가 올라와요. 내 조커를 들면 조커가 두근거려요.
          </p>
          <p className={styles.sectionText}>
            한 장을 뽑을 때마다 뽑힌 사람과 뽑은 사람의 패는 다시 섞여요. 그래서 자리만 보고 조커가 어디 있는지 알 수는
            없어요.
          </p>
        </Fold>
        <Fold title="컴퓨터는 어떻게 고르나요?" hint="뒷면만 보고 아무 자리나">
          <p className={styles.sectionText}>
            컴퓨터도 사람과 똑같이 뒷면만 보고 아무 자리나 골라요. 바로 가져가지 않고 카드를 들어 본 뒤, 가끔 다른 카드로 바꿔
            들고 나서 가져가요. 내가 먼저 탈출하고 컴퓨터끼리만 남으면 &lsquo;결과 바로 보기&rsquo;로 남은 판을 건너뛸 수 있어요.
          </p>
        </Fold>
        <Fold title="알아 두면 좋은 숫자" hint="몇 판 · 누가 도둑">
          <ul className={styles.sectionText}>
            <li>둘이 하면 처음에 조커를 받은 사람이 끝까지 도둑이 되는 판이 56.4%예요. 넷이면 26.1%로 거의 운이에요.</li>
            <li>시작 3점이면 꼴찌가 나올 때까지 둘이 평균 4.1판, 넷이 5.8판이에요. 5점이면 넷이 평균 11.6판이에요.</li>
          </ul>
          <p className={styles.sectionText}>
            더 많은 숫자와 이야기는 <Link href="/reads/thief-tips">도둑잡기, 숫자로 보면</Link>에 정리했어요.
          </p>
        </Fold>
        <Fold title="기록" hint="이 브라우저에만 저장">
          <p className={styles.sectionText}>
            도둑잡기는 운영자가 만든 비행기오락실 앱의 같은 게임을 웹으로 옮긴 것이에요. 앱에서는 옆 사람 폰과 바로 연결해 함께할
            수 있고, 이 사이트에서는 컴퓨터와 해요. 판 수, 도둑이 된 횟수, 꼴찌를 피한 경기 수, 고른 설정은 지금 쓰는 브라우저에만
            저장되고 서버로 보내지 않아요. 브라우저의 사이트 데이터를 지우면 함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>원카드·빙고·숫자 야구·스도쿠·오목·장기에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
