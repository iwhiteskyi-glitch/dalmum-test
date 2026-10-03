import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/fortune/fortune.module.css";
import ds from "@/components/dream/dream.module.css";
import DreamIndex from "@/components/dream/DreamIndex";
import TEXTS from "@/lib/dream/symbols.json";
import { PAGE_IDS, dreamPage, dreamHref, dreamPickHref } from "@/lib/dream/pages";
import { fortuneMetadata, breadcrumbJsonLd } from "@/lib/fortune/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return PAGE_IDS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = dreamPage(slug);
  if (!d) return {};
  return fortuneMetadata({
    title:
      d.page.searchName === d.label
        ? `${d.page.searchName} 해몽 — 의미와 상황별 풀이`
        : `${d.page.searchName} 해몽 — ${d.label}의 의미와 상황별 풀이`,
    description: d.page.metaDescription,
    path: dreamHref(slug),
    image: "dream",
  });
}

export default async function DreamSymbolPage({ params }) {
  const { slug } = await params;
  const d = dreamPage(slug);
  if (!d) notFound();
  const p = d.page;
  const crumbs = [
    { name: "꿈해몽", path: "/dream" },
    { name: `${p.searchName} 해몽`, path: dreamHref(slug) },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <nav className={styles.crumb} aria-label="현재 위치">
        <Link href="/dream">꿈해몽</Link> <span aria-hidden="true">›</span> <span>{p.searchName} 해몽</span>
      </nav>

      <header className={ds.pageHero}>
        <p className={styles.blockKicker}>꿈해몽 · {d.categoryLabel}</p>
        <h1 className={ds.pageTitle}>{p.searchName} 해몽</h1>
        {/* 민감 상징(죽는 꿈 등)은 "좋은 흐름" 같은 길흉 배지를 보이지 않습니다 — 작성규칙 §7 */}
        {(p.searchName !== d.label || !d.sensitive) && (
          <p className={ds.pageSub}>
            {p.searchName !== d.label && d.label}
            {!d.sensitive && <span className={`${ds.luckBadge} ${ds[`luck${d.luck}`]}`}>{d.luckLabel}</span>}
          </p>
        )}
        <p className={ds.pageSummary}>{p.summary}</p>
      </header>

      {/* 가까운 분을 떠나보낸 사람이 가장 먼저 보도록 요약 바로 아래에 둡니다 */}
      {p.care && (
        <aside className={ds.careBox} aria-label="가까운 분을 떠나보냈다면">
          {p.care}
        </aside>
      )}

      <section className={styles.section} aria-labelledby="meaning">
        <h2 id="meaning" className={styles.sectionTitle}>
          {p.meaningTitle || `전통 해몽에서 보는 ${p.searchName}`}
        </h2>
        <p className={styles.sectionText}>{p.meaning}</p>
      </section>

      <section className={styles.section} aria-labelledby="situations">
        <h2 id="situations" className={styles.sectionTitle}>
          상황별로 보면
        </h2>
        <div className={ds.situationList}>
          {p.situations.map((s) => (
            <div key={s.title} className={ds.situationItem}>
              <h3 className={ds.situationTitle}>{s.title}</h3>
              <p className={ds.situationText}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="modern">
        <h2 id="modern" className={styles.sectionTitle}>
          요즘 식으로 보면
        </h2>
        <p className={styles.sectionText}>{p.modern}</p>
      </section>

      <Link href={dreamPickHref(slug)} className={styles.cta} style={{ marginTop: 32, textDecoration: "none" }}>
        이 꿈으로 해몽 보기
      </Link>
      <p className={styles.small} style={{ textAlign: "center", marginTop: 10 }}>
        꿈에 함께 나온 다른 장면도 골라서, 여러 장면을 합친 해몽까지 볼 수 있어요.
      </p>

      {d.related.length > 0 && (
        <section className={styles.section} aria-labelledby="related">
          <h2 id="related" className={styles.sectionTitle}>
            비슷한 꿈
          </h2>
          <ul className={ds.relatedList}>
            {d.related.map((r) => (
              <li key={r.id}>
                <Link href={r.href}>
                  <strong>{r.label}</strong>
                  <span>{r.keyword}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DreamIndex current={slug} title="다른 꿈 해몽 보기" />

      <p className={styles.disclaimer} style={{ marginTop: 24 }}>
        {TEXTS.disclaimer}
      </p>
    </>
  );
}
