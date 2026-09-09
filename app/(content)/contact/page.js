import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "문의하기",
  description: "닮음테스트 관련 문의, 오류 제보, 개인정보 관련 요청은 이메일로 받습니다.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="CONTACT"
        title="문의하기"
        lead="서비스 이용 문의, 오류 제보, 개인정보 관련 요청을 아래 이메일로 보내주세요."
      />

      <div className={styles.prose}>
        <h2>이메일</h2>
        <p>
          <a href={`mailto:${SITE.contactEmail}`} style={{ fontSize: 18 }}>
            {SITE.contactEmail}
          </a>
        </p>
        <p>보통 2~3일 이내에 답변드립니다. 문의 시 아래 내용을 적어주시면 빠르게 확인할 수 있어요.</p>
        <ul>
          <li>어떤 상황이었는지 (예: 결과 화면에서 저장 버튼이 안 눌림)</li>
          <li>사용한 기기와 브라우저 (예: 아이폰 사파리, 윈도우 크롬)</li>
          <li>가능하다면 화면 캡처</li>
        </ul>

        <div className={styles.callout}>
          문의 시 <strong>얼굴 사진을 첨부하지 말아 주세요.</strong> 서비스는 사진을
          저장하지 않으며, 문제 확인에도 사진 원본은 필요하지 않습니다.
        </div>

        <h2>자주 묻는 내용</h2>
        <p>
          보내기 전에 <Link href="/faq">자주 묻는 질문</Link>을 먼저 확인해 보세요. 대부분의
          궁금증이 정리되어 있습니다.
        </p>

        <hr />
        <p style={{ fontSize: 13, color: "var(--muted-ink)" }}>
          위 이메일 주소는 임시값입니다. 배포 전에 <code>NEXT_PUBLIC_CONTACT_EMAIL</code>{" "}
          환경 변수 또는 <code>lib/site.js</code>에서 실제 주소로 바꿔주세요.
        </p>
      </div>

      <Link href="/" className={styles.backLink}>
        ← 홈으로
      </Link>
    </article>
  );
}
