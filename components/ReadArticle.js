import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";
import { getRead } from "@/lib/reads";

/** 읽을거리 글 공통 껍데기: 제목/날짜 + JSON-LD + 본문(children) + 하단 링크 */
export default function ReadArticle({ slug, children }) {
  const read = getRead(slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: read.title,
    description: read.description,
    datePublished: read.date,
    dateModified: read.date,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: `${SITE.url}/reads/${slug}`,
  };

  return (
    <article className={styles.article}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageIntro kicker="READS" title={read.title} meta={`${read.date} · 읽는 데 3분`} />
      <div className={styles.prose}>{children}</div>

      <div className={styles.callout} style={{ marginTop: 32 }}>
        <strong>바로 해볼까요?</strong> 사진 두 장이면 30초면 끝나요.{" "}
        <Link href="/">닮음 테스트 하러가기 →</Link>
      </div>

      <Link href="/reads" className={styles.backLink}>
        ← 읽을거리 목록
      </Link>
    </article>
  );
}

/** 각 글 page.js 에서 재사용할 메타데이터 생성기 */
export function readMetadata(slug) {
  const read = getRead(slug);
  return {
    title: read.title,
    description: read.description,
    alternates: { canonical: `/reads/${slug}` },
    openGraph: { title: read.title, description: read.description, type: "article" },
  };
}
