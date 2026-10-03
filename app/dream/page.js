import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import DreamView from "@/components/dream/DreamView";
import DreamIndex from "@/components/dream/DreamIndex";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "꿈해몽 | 기억나는 꿈속 장면으로 보는 상징별 의미",
  description:
    "기억나는 꿈속 장면을 고르면, 전통 해몽 방식으로 상징별 의미와 종합 흐름을 풀어 드려요. 사진이나 생년월일 없이 바로 볼 수 있어요.",
  path: "/dream",
  image: "dream",
});

export default function DreamPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>夢</span>
          <i style={{ top: 18, right: 26 }}>☾</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>✦</i>
        </div>
        <h1 className={styles.heroTitle}>지난밤 꿈, 무슨 뜻이었을까?</h1>
        <p className={styles.lead}>
          기억나는 꿈속 장면을 고르면, 전통 해몽 방식으로 상징별 의미와 종합 흐름을 풀어
          드려요. 운명을 점치는 게 아니라 재미로 가볍게 보는 풀이예요.
        </p>
      </section>

      <DreamView />

      <DreamIndex />

      <MoreInfo title="꿈해몽이 궁금하다면" lead="무엇을 다루는지, 결과는 어떻게 만들어지는지 모아 뒀어요.">
        <Fold title="꿈해몽이란?" hint="99가지 상징, 전통 해몽 방식">
          <p className={styles.sectionText}>
            꿈해몽은 꿈에 나온 상징으로 그 사람의 상태나 기운을 읽어보려는 오래된 전통이에요. 이
            코너는 동물·자연현상·사람·신체·사물·행동 6개 카테고리, 99가지 상징을 다뤄요. 민담 중
            지나치게 불길하거나 무서운 통설은 담지 않고, 재미로 가볍게 볼 수 있는 해석만 골랐어요.
          </p>
        </Fold>
        <Fold title="입력한 내용은 어떻게 처리되나요?" hint="브라우저 안에서만, 저장 안 해요">
          <p className={styles.sectionText}>
            고른 상징은 이 브라우저 안에서만 쓰이고 서버로 전송되거나 저장되지 않아요. 사진이나
            생년월일처럼 민감한 정보도 전혀 입력하지 않아요.
          </p>
        </Fold>
        <Fold title="공유 링크에는 무엇이 담겨요?" hint="고른 상징의 이름만">
          <p className={styles.sectionText}>
            결과를 공유하면, 고른 상징의 이름만 담긴 링크가 전달돼요(예: 뱀·물·이가 빠지는 꿈).
            개인정보가 들어가지 않아서 누구나 안심하고 주고받을 수 있어요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/fortune" className={styles.nextCard}>
        <span>
          <small>재미로 보는 또 다른 코너</small>
          <strong>오늘의 운세도 보러 가기</strong>
          <span>생년월일로 내 사주와 오늘의 흐름을 풀어 드려요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
