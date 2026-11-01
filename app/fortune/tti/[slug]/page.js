import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/fortune/fortune.module.css";
import CornerNav from "@/components/fortune/CornerNav";
import TtiToday from "@/components/fortune/TtiToday";
import TtiGrid from "@/components/fortune/TtiGrid";
import TTI_TEXTS from "@/lib/fortune/ttiTexts.json";
import { koreaToday, ANIMALS, ELEMENTS, ELEMENTS_HANJA } from "@/lib/fortune/saju";
import { TTI_SLUGS, ttiBySlug, ttiMatches, ttiYears, sajuYearOf } from "@/lib/fortune/tti";
import { fortuneMetadata, breadcrumbJsonLd } from "@/lib/fortune/seo";

// 오늘 날짜로 미리 그려 두고 한 시간마다 다시 만들어요(날짜가 바뀌면 브라우저에서도 다시 계산).
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return TTI_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const t = ttiBySlug(slug);
  if (!t) return {};
  const years = ttiYears(t.branch, sajuYearOf(koreaToday()), 72)
    .slice(0, 4)
    .map((y) => `${String(y).slice(2)}년생`)
    .join("·");
  return fortuneMetadata({
    title: `${t.name} 오늘의 운세 | ${years} 년생별 한마디`,
    description: `${t.name}(${t.ko}·${t.hanja}) 오늘의 운세. 오늘 일진과 ${t.name}의 관계로 보는 총운·연애·일·금전·건강 풀이와 년생별 한마디, 행운의 색·숫자·방향까지 매일 바뀌어요.`,
    path: `/fortune/tti/${slug}`,
  });
}

export default async function TtiPage({ params }) {
  const { slug } = await params;
  const t = ttiBySlug(slug);
  if (!t) notFound();
  const today = koreaToday();
  const m = ttiMatches(t.branch);
  const years = ttiYears(t.branch, sajuYearOf(today), 96).reverse();
  const crumbs = [
    { name: "오늘의 운세", path: "/fortune" },
    { name: "띠별 운세", path: "/fortune/tti" },
    { name: t.name, path: `/fortune/tti/${slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <CornerNav current="tti" />
      <nav className={styles.crumb} aria-label="현재 위치">
        <Link href="/fortune">오늘의 운세</Link> <span aria-hidden="true">›</span>{" "}
        <Link href="/fortune/tti">띠별 운세</Link> <span aria-hidden="true">›</span> <span>{t.name}</span>
      </nav>

      <section className={styles.ilganHero}>
        <span className={`${styles.ilganBadge} ${styles[`el${t.element}`]}`} aria-hidden="true">
          {t.hanja}
        </span>
        <div>
          <p className={styles.blockKicker}>
            띠별 운세 · {t.ko}({t.hanja}) · {ELEMENTS[t.element]}({ELEMENTS_HANJA[t.element]})
          </p>
          <h1 className={styles.ilganTitle}>{t.name} 오늘의 운세</h1>
        </div>
      </section>

      <TtiToday branch={t.branch} initialDate={today} />

      <section className={styles.section} aria-labelledby="about">
        <h2 id="about" className={styles.sectionTitle}>
          {t.name} 이야기
        </h2>
        <p className={styles.sectionText}>{TTI_TEXTS.animals[t.branch].intro}</p>
        <dl className={styles.ttiMatches}>
          <dt>태어난 해</dt>
          <dd>{years.join(" · ")}</dd>
          <dt>삼합 띠</dt>
          <dd>
            {m.three.map((b) => `${ANIMALS[b]}띠`).join(" · ")} — 같은 무리로 묶여 힘을 모은다고 봐요
          </dd>
          <dt>육합 띠</dt>
          <dd>{ANIMALS[m.six]}띠 — 짝을 이뤄 잘 어우러진다고 봐요</dd>
          <dt>충 띠</dt>
          <dd>{ANIMALS[m.clash]}띠 — 열두 지지에서 정반대 자리라 기운이 엇갈린다고 봐요</dd>
        </dl>
        <p className={styles.note}>
          띠 사이의 합과 충은 옛 해석일 뿐, 실제 사람 사이의 궁합을 정하지 않아요. 더 알고 싶다면{" "}
          <Link href="/reads/hap-chung">합과 충</Link> 글을 읽어 보세요.
        </p>
      </section>

      <Link href="/fortune" className={styles.nextCard}>
        <span>
          <small>생년월일로 더 자세히</small>
          <strong>나만의 오늘의 운세 보기</strong>
          <span>태어난 날의 글자(일간)와 오늘 일진의 관계로 풀어 드려요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <section className={styles.section} aria-labelledby="all">
        <h2 id="all" className={styles.sectionTitle}>
          다른 띠 오늘의 운세
        </h2>
        <TtiGrid initialDate={today} current={t.branch} />
      </section>
    </>
  );
}
