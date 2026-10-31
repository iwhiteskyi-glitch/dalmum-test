import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import GwansangView from "@/components/gwansang/GwansangView";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "관상 보기 | 사진으로 보는 눈·눈썹·코·입·턱선 인상 풀이",
  description:
    "사진 한 장으로 눈·눈썹·코·입·턱·이목구비 배치를 부위마다 두 가지씩 재서, 전통 관상학 방식으로 인상을 풀어 드려요. 얼굴 전체로 본 18가지 인상도 함께. 사진은 서버로 보내지 않아요.",
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
          사진 한 장으로 눈·눈썹·코·입·턱·이목구비 배치를 부위마다 두 가지씩 재서, 전통 관상학
          방식으로 인상을 풀어 드려요. 정확한 운명 판단이 아니라 재미로 보는 인상 풀이예요.
        </p>
      </section>

      <GwansangView />

      <MoreInfo title="관상이 궁금하다면" lead="무엇을 보는지, 사진은 어떻게 처리되는지 모아 뒀어요.">
        <Fold open title="관상이란?" hint="측정 가능한 여섯 부위만 다뤄요">
          <p className={styles.sectionText}>
            관상은 얼굴의 생김새에서 그 사람의 기질과 분위기를 읽어보려는 오래된 전통이에요. 이
            코너는 눈·눈썹·코·입·턱·이목구비 배치, 사진으로 측정 가능한 여섯 부위만 다뤄요.
            이마나 귀, 광대처럼 사진만으로 정확히 재기 어려운 부위는 다루지 않아요.
          </p>
        </Fold>
        <Fold title="무엇을 어떻게 재나요?" hint="부위마다 두 가지, 얼굴 비율로">
          <p className={styles.sectionText}>
            사진에서 얼굴의 점 68개(눈 끝, 콧볼, 입꼬리, 턱선 등)를 찾은 뒤, 길이를 서로 견준
            비율을 재요. 눈은 눈매 모양과 눈꼬리, 눈썹은 모양과 눈과의 간격, 코는 콧볼 너비와
            길이, 입은 입술 두께와 입꼬리, 턱은 턱선과 얼굴형, 배치는 두 눈 사이와 인중을 봐요.
            사진의 크기나 얼굴이 놓인 위치와는 상관없이 비율만 보기 때문에, 같은 얼굴이면 비슷한
            결과가 나와요.
          </p>
          <p className={styles.sectionText}>
            잰 값은 부위마다 두세 칸으로 나눠요. 칸의 경계는 여러 얼굴을 실제로 재 본 뒤, 칸마다
            비슷한 수의 사람이 들어가도록 정했어요. 어느 칸도 다른 칸보다 낫거나 못하지 않아요.
            각도·표정·조명에 따라 경계 근처의 값은 이웃 칸으로 나올 수 있고, 입꼬리는 특히 그날
            표정을 따라가요. 정면에서 무표정에 가깝게 찍은 사진일수록 결과가 덜 흔들려요.
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
            결과를 공유하면 사진이 아니라, 부위별 칸 번호(예: 눈매 세 칸 중 몇 번째)만 담긴
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
