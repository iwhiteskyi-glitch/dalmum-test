import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";

export const metadata = {
  title: "사용법",
  description:
    "닮음테스트 사용법과 정확도를 높이는 사진 고르는 법. 사진 두 장 업로드 → 얼굴 위치 맞추기 → 결과 확인 → SNS 공유까지 3단계로 끝납니다.",
  alternates: { canonical: "/guide" },
};

export default function GuidePage() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="GUIDE"
        title="닮음테스트 사용법"
        lead="사진 두 장만 준비하면 30초면 끝나요. 순서대로 따라 해보세요."
      />

      <div className={styles.prose}>
        <h2>1. 사진 두 장 올리기</h2>
        <p>
          첫 화면에서 <strong>내 사진</strong>과 <strong>비교 대상 사진</strong>을 각각
          올립니다. 네모 칸을 눌러 파일을 선택하거나, 사진 파일을 칸 위로 끌어다
          놓으면(드래그 앤 드롭) 됩니다. 두 장이 모두 올라오면 <strong>다음</strong>{" "}
          버튼이 활성화됩니다.
        </p>

        <h2>2. 얼굴 위치 맞추기</h2>
        <p>
          두 번째 화면에는 노란 점선 동그라미가 표시됩니다. 얼굴이 동그라미 안에 대체로
          들어오면 충분합니다. 위치가 많이 어긋났다면 사진 칸을 다시 눌러 다른 사진으로
          바꿀 수 있어요. 준비가 되면 <strong>분석 시작</strong>을 누릅니다.
        </p>

        <h2>3. 결과 확인하기</h2>
        <p>
          잠깐의 분석이 끝나면 <strong>전체 닮음도 %</strong>와 함께 눈·눈썹·코·입·얼굴형·
          이목구비 배치 6개 항목의 점수, 그리고 각 부위를 잘라 나란히 놓은 비교 이미지가
          나옵니다. 가장 많이 닮은 부위에는 🏆 표시가 붙습니다.
        </p>

        <h2>4. 저장하거나 공유하기</h2>
        <p>
          결과 아래 <strong>저장</strong> 버튼을 누르면 결과가 한 장의 이미지로
          만들어져 내려받아집니다. <strong>공유하기</strong>를 누르면 메신저나 SNS로 바로
          보낼 수 있어요(일부 브라우저에서는 이미지 저장 + 링크 복사로 대체됩니다).
        </p>

        <hr />

        <h2>정확도를 높이는 사진 고르는 법</h2>
        <ul>
          <li>
            <strong>정면 사진</strong>을 쓰세요. 고개가 많이 돌아가 있거나 옆모습이면
            부위를 제대로 못 찾을 수 있습니다.
          </li>
          <li>
            <strong>얼굴이 충분히 크게</strong> 나온 사진이 좋습니다. 전신 사진처럼 얼굴이
            작으면 인식률이 떨어집니다.
          </li>
          <li>
            <strong>밝고 선명한</strong> 사진을 쓰세요. 너무 어둡거나 흔들린 사진은 결과가
            들쭉날쭉합니다.
          </li>
          <li>
            <strong>선글라스·마스크</strong>는 벗은 사진이 좋습니다. 눈·코·입이 가려지면
            해당 부위 점수의 의미가 없어집니다.
          </li>
          <li>
            두 사진의 <strong>표정을 비슷하게</strong> 맞추면(둘 다 무표정 또는 둘 다
            미소) 입·눈 점수가 더 안정적으로 나옵니다.
          </li>
        </ul>

        <div className={styles.callout}>
          "얼굴을 찾지 못했어요"라는 안내가 나오면, 위 조건에 맞는 다른 사진으로 다시
          시도해 주세요. 얼굴이 뚜렷한 사진일수록 결과가 잘 나옵니다.
        </div>

        <Link href="/" className={styles.primaryBtn}>
          지금 해보기
        </Link>
      </div>

      <Link href="/" className={styles.backLink}>
        ← 홈으로
      </Link>
    </article>
  );
}
