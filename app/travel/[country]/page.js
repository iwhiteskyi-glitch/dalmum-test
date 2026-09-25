import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/travel/travel.module.css";
import Phrases from "@/components/travel/Phrases";
import { COUNTRIES, getCountry, cityPath } from "@/lib/travel/data";
import { nameLocalLine } from "@/lib/travel/texts";
import { travelMetadata, breadcrumbJsonLd } from "@/lib/travel/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.code }));
}

export async function generateMetadata({ params }) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) return {};
  const cityNames = country.cities.map((c) => c.city_name).join("·");
  return travelMetadata({
    title: `${country.name} 여행 가면 내 이름은? | ${country.language} 인사말·${country.name} 이름 추천`,
    description: `${country.name} 여행에서 쓸 나만의 현지식 이름을 추천받아 보세요. ${cityNames} 도시별 명소·음식과 ${country.language} 기본 인사말도 정리했어요.`,
    path: `/travel/${country.code}`,
  });
}

// 이름 스타일별로 몇 개씩만 미리 보여줍니다. (결과의 재미를 해치지 않을 정도)
function sampleNames(pool) {
  return ["female", "male", "neutral"].flatMap((g) =>
    pool.filter((n) => n.gender_style === g && n.meaning_kr).slice(0, 2)
  );
}

export default async function CountryPage({ params }) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  const jsonLd = breadcrumbJsonLd([
    { name: "여행 이름", path: "/travel" },
    { name: country.name, path: `/travel/${country.code}` },
  ]);

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className={styles.breadcrumb} aria-label="현재 위치">
        <Link href="/travel">여행 이름</Link>
        <span aria-hidden="true">›</span>
        <span>{country.name}</span>
      </nav>

      <h1 className={`${styles.display} ${styles.pageTitle}`}>
        {country.name} 여행 가면 내 이름은?
      </h1>
      <p className={styles.lead}>{country.intro}</p>

      <section className={styles.section} aria-labelledby="cities">
        <h2 id="cities" className={styles.sectionTitle}>
          어느 도시로 가세요?
        </h2>
        <p className={styles.sectionLead}>
          도시를 고르면 그 도시의 명소·음식 정보와 함께 이름 추천을 받을 수 있어요.
        </p>
        <div className={styles.cityGrid}>
          {country.cities.map((city) => (
            <Link
              key={city.city_code}
              href={cityPath(country.code, city.city_code)}
              className={styles.cityCard}
            >
              <p className={styles.cityName}>{city.city_name} →</p>
              <p className={styles.cityMeta}>
                {city.attractions.map((a) => a.short || a.name).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="phrases">
        <h2 id="phrases" className={styles.sectionTitle}>
          여행에서 바로 쓰는 {country.language} 표현
        </h2>
        <p className={styles.sectionLead}>한글 발음은 실제 소리에 가깝게 적었어요.</p>
        <Phrases country={country} />
      </section>

      <section className={styles.section} aria-labelledby="names">
        <h2 id="names" className={styles.sectionTitle}>
          {country.name} 여행 이름 미리보기
        </h2>
        <p className={styles.sectionLead}>{country.name_note}</p>
        <ul className={styles.nameSamples}>
          {sampleNames(country.name_pool).map((n) => (
            <li key={n.name_local} className={styles.nameSample}>
              <strong>{n.pronunciation_kr}</strong>
              <span lang={country.lang_code}>{nameLocalLine(n)}</span>
              <p>{n.meaning_kr}</p>
            </li>
          ))}
        </ul>
        <p className={styles.callout}>
          준비된 {country.name} 이름은 {country.name_pool.length}개예요. 도시를 고르고 테스트를
          시작하면 내 분위기에 맞는 이름 3개를 뽑아드려요.
        </p>
      </section>
    </article>
  );
}
