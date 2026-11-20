import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import BaseballGame from "@/components/games/BaseballGame";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "숫자 야구 | 스트라이크·볼로 숨긴 숫자 맞히기, 컴퓨터와 대결과 오늘의 숫자",
  description:
    "설치 없이 바로 하는 무료 숫자 야구. 숨긴 숫자 3·4자리를 스트라이크·볼 힌트로 맞혀 보세요. 10단계 맞히기, 서로 숨기고 겨루는 컴퓨터와 대결, 하루 한 번 오늘의 숫자가 있어요.",
  path: "/games/baseball",
  image: "games",
});

export default function BaseballPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>球</span>
          <i style={{ top: 18, right: 26 }}>●</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>숫자 야구, 몇 번 만에 맞힐까?</h1>
        <p className={styles.lead}>
          숨긴 숫자를 불러 보고 스트라이크·볼 힌트로 좁혀 가요. 적게 부를수록 잘한 거예요. 컴퓨터와 서로 숨기고 겨룰 수도 있어요.
        </p>
      </section>

      <BaseballGame />

      <MoreInfo title="숫자 야구가 궁금하다면" lead="규칙과 두 가지 놀이 방식, 오늘의 숫자, 맞히는 요령을 모아 뒀어요.">
        <Fold title="규칙" hint="스트라이크 · 볼 · 아웃">
          <p className={styles.sectionText}>
            숨긴 숫자는 0~9 중 서로 다른 숫자 3개 또는 4개예요. 맨 앞에 0이 와도 되고, 같은 숫자가 두 번 들어가지는 않아요.
            숫자를 부르면 이렇게 알려 줘요.
          </p>
          <ul className={styles.sectionText}>
            <li>스트라이크(S): 숫자와 자리가 모두 맞은 개수</li>
            <li>볼(B): 숫자는 들어 있는데 자리가 다른 개수</li>
            <li>아웃(OUT): 부른 숫자가 하나도 없음</li>
          </ul>
          <p className={styles.sectionText}>
            예를 들어 숨긴 숫자가 123일 때 132를 부르면 1은 자리까지 맞고 3·2는 자리가 달라서 1S 2B예요. 모두 스트라이크가
            되면 맞힌 거예요.
          </p>
        </Fold>
        <Fold title="숫자 맞히기 10단계" hint="3자리 1~5단계 · 4자리 6~10단계">
          <p className={styles.sectionText}>
            컴퓨터가 숨긴 숫자를 정해진 기회 안에 맞혀요. 1~5단계는 3자리로 기회가 13번에서 8번까지 줄고, 6~10단계는
            4자리로 기회가 15번에서 9번까지 줄어요. 앞 단계를 깨야 다음 단계가 열려요.
          </p>
          <p className={styles.sectionText}>
            적게 부를수록 ★을 더 받아요. 3자리는 5번 안에 맞히면 ★3, 7번 안이면 ★2, 4자리는 6번 안에 ★3, 8번 안이면 ★2예요.
            10단계를 깨면 무한 도전이 열려요. 4자리 숫자가 계속 나오고, 기회가 12번에서 판마다 1번씩 줄어 7번까지 줄어요.
          </p>
        </Fold>
        <Fold title="컴퓨터와 대결" hint="서로 숨기고 번갈아 · 먼저 맞히면 승">
          <p className={styles.sectionText}>
            나와 컴퓨터가 각자 숫자를 숨기고 번갈아 상대 숫자를 불러요. 누가 먼저 부를지는 판마다 무작위예요. 먼저 부른 쪽이
            맞히면 나중 쪽에게 한 번 더 기회가 있고, 그때 같이 맞히면 무승부예요. 둘 다 20번씩 불러도 못 맞히면 승자 없이
            끝나요.
          </p>
          <p className={styles.sectionText}>
            컴퓨터는 내 숫자를 보지 않고, 지금까지 받은 힌트만 보고 다음 숫자를 골라요. 낮은 단계 컴퓨터는 지난 힌트를 자주
            잊어버리고, 단계가 오를수록 힌트를 더 잘 기억해요. 1~5단계는 3자리, 6~10단계는 4자리로 겨뤄요. 10단계를 이기면
            가장 센 컴퓨터와 몇 판 연속으로 이기는지 도전하는 무한 연승이 열려요.
          </p>
        </Fold>
        <Fold title="오늘의 숫자" hint="하루 한 번 · 4자리">
          <p className={styles.sectionText}>
            오늘의 숫자는 한국 시간 자정마다 바뀌고, 같은 날에는 누구나 같은 숫자를 맞혀요. 월~목은 4자리에 기회 12번,
            금~일은 4자리에 기회 10번이에요. 하루 한 번만 도전할 수 있어요. 중간에 나갔다 와도 부른 기록은 그대로 이어지고,
            기회를 다 쓰면 숫자를 보여 주고 그날은 끝나요.
          </p>
        </Fold>
        <Fold title="맞히는 요령" hint="메모판 · 후보 좁히기">
          <ul className={styles.sectionText}>
            <li>아웃이 나오면 부른 숫자가 모두 없다는 뜻이라 오히려 반가운 힌트예요. 메모판에서 ✕로 지워 두세요.</li>
            <li>지금까지 받은 힌트를 모두 만족하는 숫자만 부르면, 3자리도 4자리도 평균 5~6번이면 맞힐 수 있어요.</li>
            <li>볼이 나온 숫자는 자리를 바꿔 가며 불러 보면 어느 자리인지 좁혀져요.</li>
          </ul>
          <p className={styles.sectionText}>
            더 자세한 요령과 숫자로 본 확률은 <Link href="/reads/number-baseball-tips">숫자 야구 잘하는 법</Link>에
            정리했어요.
          </p>
        </Fold>
        <Fold title="기록" hint="이 브라우저에만 저장">
          <p className={styles.sectionText}>
            숫자 야구는 운영자가 만든 비행기오락실 앱의 같은 게임을 웹으로 옮긴 것이에요. 깬 단계, ★, 가장 적게 부른 횟수,
            대결에서 이긴 단계, 연승 기록, 오늘의 숫자에 부른 숫자는 지금 쓰는 브라우저에만 저장되고 서버로 보내지 않아요.
            브라우저의 사이트 데이터를 지우면 함께 지워져요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/games" className={styles.nextCard}>
        <span>
          <small>다른 게임도 있어요</small>
          <strong>미니게임 목록 보기</strong>
          <span>스도쿠·짝꿍 잇기·틀린 그림 찾기·오목·장기·체스에도 도전해 보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
