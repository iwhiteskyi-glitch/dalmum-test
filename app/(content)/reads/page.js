import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { READS } from "@/lib/reads";

export const metadata = {
  title: "읽을거리",
  description:
    "닮음 테스트를 더 재밌게 즐기는 법, 얼굴 유사도 분석의 원리, 좋은 사진 고르는 법 등 짧은 안내 글 모음.",
  alternates: { canonical: "/reads" },
};

export default function ReadsIndexPage() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="READS"
        title="읽을거리"
        lead="닮음 테스트를 더 잘, 더 재밌게 쓰는 데 도움이 되는 짧은 글들이에요."
      />

      <div className={styles.cardList}>
        {READS.map((r) => (
          <Link
            key={r.slug}
            href={`/reads/${r.slug}`}
            className={styles.readCard}
          >
            <p className={styles.readCardTitle}>{r.title}</p>
            <p className={styles.readCardDesc}>{r.description}</p>
          </Link>
        ))}
      </div>

      <Link href="/" className={styles.backLink}>
        ← 홈으로
      </Link>
    </article>
  );
}
