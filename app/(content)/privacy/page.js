import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "개인정보처리방침",
  description:
    "닮았네 개인정보처리방침 — 업로드한 사진은 서버로 전송·저장되지 않고 브라우저에서만 처리됩니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="PRIVACY"
        title="개인정보처리방침"
        meta={`시행일: ${SITE.effectiveDate}`}
      />

      <div className={styles.prose}>
        <p>
          {SITE.name}(이하 "서비스")은 이용자의 개인정보를 중요하게 생각하며, 아래와 같이
          개인정보를 처리합니다. 이 방침은 관련 법령에 따라 수립되었습니다.
        </p>

        <div className={`${styles.callout} ${styles.calloutYellow}`}>
          <strong>핵심 요약</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            <li>업로드한 사진은 서버로 전송되지 않고 이용자의 브라우저에서만 분석됩니다.</li>
            <li>사진은 서버·데이터베이스 어디에도 저장하지 않으며, 창을 닫으면 사라집니다.</li>
            <li>서비스 운영을 위해 접속 기록과 쿠키(광고 포함)가 사용됩니다.</li>
          </ul>
        </div>

        <h2>1. 사진(이미지) 처리</h2>
        <p>
          이용자가 업로드하는 사진은 <strong>이용자의 기기(브라우저) 내부에서만</strong>{" "}
          얼굴 분석에 사용됩니다. 사진 파일 또는 그 분석 데이터는 서비스의 서버로
          전송되지 않고, 저장·기록·공유되지 않습니다. 분석이 끝난 뒤 페이지를 벗어나거나
          브라우저 창을 닫으면 관련 데이터는 메모리에서 삭제됩니다. 결과 이미지를
          "저장"하는 경우, 해당 파일은 이용자 기기에만 저장됩니다.
        </p>

        <h2>2. 자동으로 수집되는 정보</h2>
        <p>
          서비스 접속 시 다음 정보가 자동으로 생성·수집될 수 있습니다.
        </p>
        <ul>
          <li>접속 로그: 접속 일시, 브라우저 종류, 기기 정보, 참조 URL 등</li>
          <li>쿠키 및 유사 기술: 서비스 이용 통계 분석, 광고 제공을 위한 식별자</li>
        </ul>
        <p>
          이 정보는 서비스 안정적 운영, 오류 분석, 이용 통계 파악, 광고 게재의 목적으로만
          이용됩니다.
        </p>

        <h2>3. 광고 및 제3자 서비스</h2>
        <p>
          서비스는 운영비 충당을 위해 <strong>Google AdSense</strong> 광고를 게재합니다.
          Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 이전 방문 기록을
          바탕으로 맞춤형 광고를 제공할 수 있습니다.
        </p>
        <ul>
          <li>
            이용자는{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 광고 설정
            </a>
            에서 맞춤형 광고를 해제할 수 있습니다.
          </li>
          <li>
            제3자 광고 사업자의 광고 및 쿠키 사용을 일괄 해제하려면{" "}
            <a
              href="https://optout.aboutads.info"
              target="_blank"
              rel="noopener noreferrer"
            >
              aboutads.info
            </a>
            를 이용할 수 있습니다.
          </li>
          <li>
            Google의 데이터 처리 방식은{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 개인정보처리방침
            </a>
            을 참고하세요.
          </li>
        </ul>
        <p>
          또한 서비스는 웹사이트 호스팅을 위해 클라우드 호스팅 사업자(예: Vercel)를
          이용하며, 접속 과정에서 IP 주소 등이 해당 사업자의 서버 로그에 기록될 수
          있습니다.
        </p>

        <h2>4. 보유 및 이용 기간</h2>
        <p>
          업로드한 사진은 저장하지 않으므로 보유하지 않습니다. 자동 수집되는 접속 로그
          및 통계·광고용 데이터는 관련 법령 및 각 제3자 서비스의 정책에 따른 기간 동안
          보관된 후 파기됩니다.
        </p>

        <h2>5. 이용자의 권리</h2>
        <p>
          이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만
          쿠키를 차단할 경우 일부 기능 이용이나 광고 제공에 제한이 있을 수 있습니다.
          개인정보와 관련한 문의·이의 제기는 아래 연락처로 접수할 수 있습니다.
        </p>

        <h2>6. 아동의 개인정보</h2>
        <p>
          서비스는 만 14세 미만 아동을 주 대상으로 하지 않으며, 아동의 개인정보를 알면서
          수집하지 않습니다. 보호자는 아동이 본인 동의 없이 사진을 업로드하지 않도록
          지도해 주시기 바랍니다.
        </p>

        <h2>7. 개인정보 보호책임자 및 문의처</h2>
        <ul>
          <li>이메일: {SITE.contactEmail}</li>
          <li>
            문의 방법: <Link href="/contact">문의하기</Link> 페이지 참고
          </li>
        </ul>

        <h2>8. 방침의 변경</h2>
        <p>
          이 개인정보처리방침은 법령·서비스 변경에 따라 수정될 수 있으며, 변경 시 이
          페이지를 통해 공지합니다. 중요한 변경이 있는 경우 시행 전 눈에 띄는 방법으로
          안내합니다.
        </p>

      </div>

      <Link href="/" className={styles.backLink}>
        ← 홈으로
      </Link>
    </article>
  );
}
