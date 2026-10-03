import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import GwansangView from "@/components/gwansang/GwansangView";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "관상 보기 | 사진으로 보는 눈·눈썹·코·입·턱선 인상 풀이",
  description:
    "사진 한 장으로 눈·눈썹·코·입·턱선·이목구비 배치를 짚어, 전통 관상학 방식으로 인상을 풀어 드려요. 사진은 서버로 보내지 않아요.",
  path: "/gwansang",
  image: "gwansang",
});

export default function GwansangPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>相</span>
          <i style={{ top: 18, right: 26 }}>☾</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>★</i>
        </div>
        <h1 className={styles.heroTitle}>내 얼굴은 어떤 인상일까?</h1>
        <p className={styles.lead}>
          사진 한 장으로 눈·눈썹·코·입·턱선·이목구비 배치를 짚어, 전통 관상학 방식으로 인상을 풀어
          드려요. 정확한 운명 판단이 아니라 재미로 보는 인상 풀이예요.
        </p>
      </section>

      <GwansangView />

      <MoreInfo title="관상이 궁금하다면" lead="무엇을 보는지, 사진은 어떻게 처리되는지 모아 뒀어요.">
        <Fold title="관상이란?" hint="측정 가능한 여섯 부위만 다뤄요">
          <p className={styles.sectionText}>
            관상은 얼굴의 생김새에서 그 사람의 기질과 분위기를 읽어보려는 오래된 전통이에요. 이
            코너는 눈·눈썹·코·입·턱선·이목구비 배치, 사진으로 측정 가능한 여섯 부위만 다뤄요.
            이마나 귀처럼 사진만으로 정확히 재기 어려운 부위는 다루지 않아요.
          </p>
        </Fold>
        <Fold title="사진은 어떻게 처리되나요?" hint="브라우저 안에서만 분석, 저장 안 해요">
          <p className={styles.sectionText}>
            업로드한 사진은 브라우저 안에서만 분석되고 서버로 전송되거나 저장되지 않아요. 결과
            화면을 벗어나거나 창을 닫으면 사진 데이터도 함께 사라져요. 닮은꼴 테스트와 같은
            원칙이에요.
          </p>
        </Fold>
        <Fold title="공유 링크에는 무엇이 담겨요?" hint="사진이 아니라 카테고리 번호만">
          <p className={styles.sectionText}>
            결과를 공유하면 사진이 아니라, 부위별 카테고리 번호(예: 눈매 3종 중 몇 번)만 담긴
            링크가 전달돼요. 이 번호만으로는 원래 사진을 다시 만들어낼 수 없어요. 다만 공유
            버튼으로 만드는 이미지 카드에는 분석에 쓴 사진이 그대로 들어갈 수 있으니, 이미지를
            공유할 때는 그 점을 참고해 주세요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/face" className={styles.nextCard}>
        <span>
          <small>같은 얼굴 인식 엔진으로 만들었어요</small>
          <strong>닮은꼴 테스트도 해보기</strong>
          <span>사진 두 장으로 가족·친구·연예인과 얼마나 닮았는지 비교해 드려요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
