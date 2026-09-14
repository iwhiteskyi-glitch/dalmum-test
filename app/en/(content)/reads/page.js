import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { READS_EN } from "@/lib/readsEn";

export const metadata = {
  title: "Reads",
  description:
    "Short reads to help you enjoy Dalmum more — the science behind face similarity, how to pick a good photo, and more.",
  alternates: { canonical: "/en/reads" },
};

export default function ReadsIndexPageEn() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="READS"
        title="Reads"
        lead="Short articles to help you get more out of Dalmum."
      />

      <div className={styles.cardList}>
        {READS_EN.map((r) => (
          <Link key={r.slug} href={`/en/reads/${r.slug}`} className={styles.readCard}>
            <p className={styles.readCardTitle}>{r.title}</p>
            <p className={styles.readCardDesc}>{r.description}</p>
          </Link>
        ))}
      </div>

      <Link href="/en" className={styles.backLink}>
        ← Home
      </Link>
    </article>
  );
}
