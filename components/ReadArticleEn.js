import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { getReadEn } from "@/lib/readsEn";

/** ReadArticle.js의 영문판. */
export default function ReadArticleEn({ slug, children }) {
  const read = getReadEn(slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: read.title,
    description: read.description,
    datePublished: read.date,
    dateModified: read.date,
    author: { "@type": "Organization", name: "Dalmum" },
    publisher: { "@type": "Organization", name: "Dalmum" },
    mainEntityOfPage: `https://dalmum.com/en/reads/${slug}`,
  };

  return (
    <article className={styles.article}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageIntro kicker="READS" title={read.title} meta={`${read.date} · 3 min read`} />
      <div className={styles.prose}>{children}</div>

      <div className={styles.callout} style={{ marginTop: 32 }}>
        <strong>Want to try it now?</strong> Two photos, 30 seconds.{" "}
        <Link href="/en">Try Dalmum →</Link>
      </div>

      <Link href="/en/reads" className={styles.backLink}>
        ← Back to Reads
      </Link>
    </article>
  );
}

export function readMetadataEn(slug) {
  const read = getReadEn(slug);
  return {
    title: read.title,
    description: read.description,
    alternates: { canonical: `/en/reads/${slug}` },
    openGraph: { title: read.title, description: read.description, type: "article" },
  };
}
