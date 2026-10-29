import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/fortune/fortune.module.css";
import ds from "@/components/dream/dream.module.css";
import DreamIndex from "@/components/dream/DreamIndex";
import DreamArt from "@/components/dream/DreamArt";
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

  // 차례 칩 — 긴 페이지에서 원하는 부분으로 바로 내려가게
  const toc = [
    { id: "meaning", label: "전통 해몽" },
    { id: "situations", label: `상황별 풀이 ${p.situations.length}` },
    { id: "modern", label: "요즘 식으로" },
    p.reading && { id: "reading", label: "풀이가 갈리는 지점" },
    p.faq && { id: "faq", label: "자주 묻는 질문" },
    d.related.length > 0 && { id: "related", label: "비슷한 꿈" },
  ].filter(Boolean);

  return (
    <div className={ds.detail}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <nav className={styles.crumb} aria-label="현재 위치">
        <Link href="/dream">꿈해몽</Link> <span aria-hidden="true">›</span> <span>{p.searchName} 해몽</span>
      </nav>

      {/* 밤하늘 머리 카드: 상징 그림 + 제목 + 요약 */}
      <header className={ds.pageHero}>
        <div className={ds.pageHeroTop}>
          <DreamArt id={slug} eager alt={`${d.label} 상징 그림`} className={ds.pageArt} />
          <div className={ds.pageHeroText}>
            <p className={ds.heroKicker}>꿈해몽 · {d.categoryLabel}</p>
            <h1 className={ds.pageTitle}>{p.searchName} 해몽</h1>
            {/* 민감 상징(죽는 꿈 등)은 "좋은 흐름" 같은 길흉 배지를 보이지 않습니다 — 작성규칙 §7 */}
            {(p.searchName !== d.label || !d.sensitive) && (
              <p className={ds.pageSub}>
                {p.searchName !== d.label && <span>{d.label}</span>}
                {!d.sensitive && <span className={`${ds.luckBadge} ${ds[`luck${d.luck}`]}`}>{d.luckLabel}</span>}
              </p>
            )}
          </div>
        </div>
        <p className={ds.pageSummary}>{p.summary}</p>
      </header>

      {/* 가까운 분을 떠나보낸 사람이 가장 먼저 보도록 요약 바로 아래에 둡니다 */}
      {p.care && (
        <aside className={ds.careBox} aria-label="가까운 분을 떠나보냈다면">
          {p.care}
        </aside>
      )}

      <nav className={ds.pageToc} aria-label="이 페이지 차례">
        {toc.map((t) => (
          <a key={t.id} href={`#${t.id}`}>
            {t.label}
          </a>
        ))}
      </nav>

      <section className={ds.secBlock} aria-labelledby="meaning">
        <h2 id="meaning" className={ds.secTitle}>
          {p.meaningTitle || `전통 해몽에서 보는 ${p.searchName}`}
        </h2>
        <div className={ds.secCard}>
          <p className={ds.secText}>{p.meaning}</p>
        </div>
      </section>

      <section className={ds.secBlock} aria-labelledby="situations">
        <h2 id="situations" className={ds.secTitle}>
          상황별로 보면
        </h2>
        <ol className={ds.situationList}>
          {/* id(s1, s2…)는 첫 화면 검색 결과의 "이 장면이 가장 비슷해요" 링크가 바로 찾아오는 자리 */}
          {p.situations.map((s, i) => (
            <li key={s.title} id={`s${i + 1}`} className={ds.situationItem}>
              <span className={ds.situationNum} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className={ds.situationTitle}>{s.title}</h3>
              <p className={ds.situationText}>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={ds.secBlock} aria-labelledby="modern">
        <h2 id="modern" className={ds.secTitle}>
          요즘 식으로 보면
        </h2>
        <div className={ds.secCard}>
          <p className={ds.secText}>{p.modern}</p>
          {p.helpline && <p className={ds.helplineNote}>{p.helpline}</p>}
        </div>
      </section>

      {/* 노출이 많은 페이지에만 있는 보강 글 — 풀이가 갈리는 지점과 자주 묻는 질문 */}
      {p.reading && (
        <section className={ds.secBlock} aria-labelledby="reading">
          <h2 id="reading" className={ds.secTitle}>
            {p.readingTitle}
          </h2>
          <div className={ds.secCard}>
            {p.reading.map((text) => (
              <p key={text} className={ds.secText}>
                {text}
              </p>
            ))}
          </div>
        </section>
      )}

      {p.faq && (
        <section className={ds.secBlock} aria-labelledby="faq">
          <h2 id="faq" className={ds.secTitle}>
            자주 묻는 질문
          </h2>
          <div className={ds.faqList}>
            {p.faq.map((f) => (
              <div key={f.q} className={ds.faqItem}>
                <h3 className={ds.faqQ}>{f.q}</h3>
                <p className={ds.faqA}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 종합 해몽으로 이어지는 밤하늘 띠 */}
      <aside className={ds.pickBand} aria-label="다른 장면과 합쳐서 해몽하기">
        <span className={ds.synthesisStars} aria-hidden="true" />
        <p className={ds.pickBandTitle}>꿈에 다른 장면도 나왔나요?</p>
        <p className={ds.pickBandText}>
          이 꿈이 골라진 채로 해몽 화면이 열려요. 함께 나온 장면(최대 6개)을 더 고르면 한데 묶어
          종합 풀이를 해 드려요.
        </p>
        <Link href={dreamPickHref(slug)} className={ds.pickBandBtn}>
          다른 장면과 합쳐서 해몽하기 →
        </Link>
      </aside>

      {d.related.length > 0 && (
        <section className={ds.secBlock} aria-labelledby="related">
          <h2 id="related" className={ds.secTitle}>
            비슷한 꿈
          </h2>
          <ul className={ds.relatedGrid} style={{ "--n": d.related.length }}>
            {d.related.map((r) => (
              <li key={r.id}>
                <Link href={r.href} className={ds.popularCard}>
                  <DreamArt id={r.id} alt="" className={ds.popularArt} />
                  <span className={ds.popularCaption}>
                    <strong>{r.label}</strong>
                    <span>{r.keyword}</span>
                  </span>
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
    </div>
  );
}
