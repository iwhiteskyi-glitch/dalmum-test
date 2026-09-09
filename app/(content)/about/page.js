import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";

export const metadata = {
  title: "서비스 소개",
  description:
    "닮음테스트는 사진 두 장을 올려 눈·코·입·얼굴형까지 부위별 닮음도와 전체 닮음 %를 보여주는 재미용 웹서비스입니다. 사진은 서버로 전송되지 않습니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="ABOUT"
        title="닮음테스트는 어떤 서비스인가요?"
        lead="사진 두 장만 있으면 누구랑 얼마나 닮았는지, 부위별로 뜯어볼 수 있어요."
      />

      <div className={styles.prose}>
        <p>
          <strong>닮음테스트</strong>는 내 사진과 비교하고 싶은 사진(가족, 친구, 연인,
          연예인, 반려동물 등 무엇이든)을 나란히 올리면, 얼굴을 부위별로 나눠 얼마나
          닮았는지 분석해 주는 재미용 웹서비스입니다. 결과로는 <strong>전체 닮음도
          %</strong>와 함께 <strong>눈·눈썹·코·입·얼굴형(윤곽)·이목구비 배치 비율</strong>{" "}
          6개 항목의 세부 점수를 보여줍니다.
        </p>

        <h2>다른 닮은꼴 서비스와 뭐가 다른가요?</h2>
        <p>
          기존 서비스는 대부분 내 사진 한 장을 올려 정해진 연예인 데이터베이스와
          매칭하거나, 두 장을 비교하더라도 최종 유사도 숫자 하나만 보여주고 끝납니다.
          닮음테스트는 <strong>두 장을 직접 비교</strong>하면서, 결과 화면에서 어느
          부위가 닮았고 어느 부위가 다른지까지 나눠서 보여주는 데 초점을 맞췄습니다.
          "우리 눈은 87% 닮았는데 코는 별로네" 같은 이야깃거리를 만드는 게 목적이에요.
        </p>

        <h2>어떻게 분석하나요?</h2>
        <p>
          업로드한 사진에서 얼굴의 특징점(눈꼬리, 콧방울, 입꼬리, 턱선 등 68개 지점)을
          찾아, 두 얼굴의 크기·각도를 맞춘 뒤 부위별로 생김새를 비교합니다. 전체
          닮음도는 얼굴 전체의 특징을 요약한 값과 부위별 점수를 함께 반영해 계산합니다.
          더 자세한 원리는{" "}
          <Link href="/reads/how-similarity-works">
            "닮은꼴은 어떻게 판단할까?"
          </Link>{" "}
          글에서 설명합니다.
        </p>

        <div className={`${styles.callout} ${styles.calloutYellow}`}>
          <strong>재미로만 봐주세요.</strong> 부위별 수치는 특징점 위치를 비교한 재미용
          결과이며, 정밀한 얼굴 인식·신원 확인·친자 판별 등 어떤 공식적인 용도로도 쓸 수
          없습니다.
        </div>

        <h2>내 사진은 안전한가요?</h2>
        <p>
          네. 얼굴 분석은 <strong>여러분의 브라우저 안에서만</strong> 실행됩니다.
          업로드한 사진은 우리 서버로 전송되지 않고, 어디에도 저장되지 않습니다. 창을
          닫으면 사진 데이터도 함께 사라집니다. 자세한 내용은{" "}
          <Link href="/privacy">개인정보처리방침</Link>을 확인하세요.
        </p>

        <h2>이용 요금이 있나요?</h2>
        <p>
          없습니다. 닮음테스트는 전부 무료이며, 별도의 결제 기능이 없습니다. 서비스
          운영비는 페이지에 표시되는 광고로 충당합니다.
        </p>

        <Link href="/" className={styles.primaryBtn}>
          닮음 테스트 해보기
        </Link>
      </div>

      <Link href="/" className={styles.backLink}>
        ← 홈으로
      </Link>
    </article>
  );
}
