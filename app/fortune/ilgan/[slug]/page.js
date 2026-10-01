import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/fortune/fortune.module.css";
import CornerNav from "@/components/fortune/CornerNav";
import TEXTS from "@/lib/fortune/texts.json";
import { ILGAN_SLUGS, ilganBySlug, ilganInfo, ilganHref } from "@/lib/fortune/ilgan";
import { tenGod, ELEMENTS_HANJA } from "@/lib/fortune/saju";
import { fortuneMetadata, breadcrumbJsonLd } from "@/lib/fortune/seo";
import { eunNeun } from "@/lib/korean";

export const dynamicParams = false;

export function generateStaticParams() {
  return ILGAN_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const g = ilganBySlug(slug);
  if (!g) return {};
  return fortuneMetadata({
    title: `${g.name}(${g.hanja}${ELEMENTS_HANJA[g.elementIndex]}) 일간 성격 — ${g.alias} | 사주 일간 풀이`,
    description: g.page.metaDescription,
    path: ilganHref(g.stem),
  });
}

export default async function IlganPage({ params }) {
  const { slug } = await params;
  const g = ilganBySlug(slug);
  if (!g) notFound();
  const p = g.page;
  const others = ILGAN_SLUGS.map((_, i) => ilganInfo(i));
  const crumbs = [
    { name: "오늘의 운세", path: "/fortune" },
    { name: "내 사주", path: "/fortune/saju" },
    { name: `${g.name} 일간`, path: ilganHref(g.stem) },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <CornerNav current="saju" />
      <nav className={styles.crumb} aria-label="현재 위치">
        <Link href="/fortune">오늘의 운세</Link> <span aria-hidden="true">›</span>{" "}
        <Link href="/fortune/saju">내 사주</Link> <span aria-hidden="true">›</span> <span>{g.name} 일간</span>
      </nav>

      <section className={styles.ilganHero}>
        <span className={`${styles.ilganBadge} ${styles[`el${g.elementIndex}`]}`} aria-hidden="true">
          {g.hanja}
        </span>
        <div>
          <p className={styles.blockKicker}>
            사주 일간 풀이 · {g.yinyang}의 {g.element}
          </p>
          <h1 className={styles.ilganTitle}>
            {g.name}({g.hanja}
            {ELEMENTS_HANJA[g.elementIndex]}) 일간
          </h1>
          <p className={styles.ilganAlias}>{g.alias}</p>
        </div>
      </section>
      <p className={styles.para}>{p.intro}</p>
      <ul className={styles.keywords}>
        {g.keywords.map((k) => (
          <li key={k}>#{k}</li>
        ))}
      </ul>

      <section className={styles.section} aria-labelledby="symbol">
        <h2 id="symbol" className={styles.sectionTitle}>
          {g.name}
          {eunNeun(g.name)} 어떤 글자일까
        </h2>
        <p className={styles.sectionText}>{p.symbol}</p>
      </section>

      <section className={styles.section} aria-labelledby="personality">
        <h2 id="personality" className={styles.sectionTitle}>
          성격과 기질
        </h2>
        <p className={styles.sectionText}>{p.personality}</p>
        <div className={`${styles.block} ${styles.twoCol}`}>
          <div>
            <h3>이런 점이 빛나요</h3>
            <ul>
              {g.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>이런 점은 살펴봐요</h3>
            <ul>
              {g.cautions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="people">
        <h2 id="people" className={styles.sectionTitle}>
          사람 사이에서는
        </h2>
        <p className={styles.sectionText}>{p.relationships}</p>
      </section>

      <section className={styles.section} aria-labelledby="work">
        <h2 id="work" className={styles.sectionTitle}>
          일과 공부에서는
        </h2>
        <p className={styles.sectionText}>{p.workStudy}</p>
      </section>

      <section className={styles.section} aria-labelledby="balance">
        <h2 id="balance" className={styles.sectionTitle}>
          오행으로 보는 균형
        </h2>
        <p className={styles.sectionText}>{p.balance}</p>
      </section>

      <section className={styles.section} aria-labelledby="gods">
        <h2 id="gods" className={styles.sectionTitle}>
          {g.name} 일간에게 다른 글자는 어떤 의미일까
        </h2>
        <p className={styles.sectionText}>
          사주에서는 일간을 기준으로 다른 천간을 열 가지 관계(십신)로 불러요. 오늘 일진의 천간이 아래 글자라면 그날이
          바로 그 십신의 날이에요.
        </p>
        <table className={styles.godTable}>
          <thead>
            <tr>
              <th scope="col">천간</th>
              <th scope="col">십신</th>
              <th scope="col">뜻</th>
            </tr>
          </thead>
          <tbody>
            {others.map((o) => {
              const t = TEXTS.tenGods[tenGod(g.stem, o.stem)];
              return (
                <tr key={o.stem}>
                  <td>
                    <Link href={ilganHref(o.stem)}>
                      {o.name}({o.hanja})
                    </Link>
                  </td>
                  <td>
                    <b>{t.god}</b>
                  </td>
                  <td>{t.keyword}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <Link href="/fortune" className={styles.nextCard}>
        <span>
          <small>오늘의 운세와 함께 보기</small>
          <strong>{p.dailyTip}</strong>
          <span>내 일간과 오늘 일진의 관계로 하루 흐름을 풀어 드려요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <section className={styles.section} aria-labelledby="all">
        <h2 id="all" className={styles.sectionTitle}>
          열 가지 일간 모두 보기
        </h2>
        <ul className={styles.stemGrid}>
          {others.map((o) => (
            <li key={o.stem}>
              <Link
                href={ilganHref(o.stem)}
                className={styles[`el${o.elementIndex}`]}
                aria-current={o.stem === g.stem ? "page" : undefined}
              >
                <span>{o.hanja}</span>
                {o.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.disclaimer} style={{ marginTop: 18 }}>
          사주의 전통적인 해석을 바탕으로 재미로 보는 풀이예요. 사람의 성격은 한 글자보다 훨씬 다양해요.
        </p>
      </section>
    </>
  );
}
