import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/travel/travel.module.css";
import Phrases from "@/components/travel/Phrases";
import TravelTest from "@/components/travel/TravelTest";
import { COUNTRIES, getCity, cityPath, mapLink } from "@/lib/travel/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return COUNTRIES.flatMap((c) =>
    c.cities.map((city) => ({ country: c.code, city: city.city_code }))
  );
}

export async function generateMetadata({ params }) {
  const { country: countryCode, city: cityCode } = await params;
  const found = getCity(countryCode, cityCode);
  if (!found) return {};
  const { country, city } = found;
  const sights = city.attractions.map((a) => a.short || a.name).join("·");
  const foods = city.foods.map((f) => f.name).join("·");
  return {
    title: `${city.city_name} 여행 가면 내 이름은? | ${country.language} 인사말·명소·음식`,
    description: `${city.city_name} 여행에서 쓸 나만의 ${country.name} 이름을 추천받아 보세요. ${sights} 등 대표 명소와 ${foods} 같은 대표 음식, ${country.language} 기본 인사말까지 한 번에 정리했어요.`,
    alternates: { canonical: cityPath(country.code, city.city_code) },
  };
}

export default async function CityPage({ params }) {
  const { country: countryCode, city: cityCode } = await params;
  const found = getCity(countryCode, cityCode);
  if (!found) notFound();
  const { country, city } = found;
  const siblings = country.cities.filter((c) => c.city_code !== city.city_code);

  // 테스트(브라우저에서 실행)에는 필요한 데이터만 넘깁니다.
  const testCountry = {
    code: country.code,
    name: country.name,
    lang_code: country.lang_code,
    name_pool: country.name_pool,
  };
  const testCity = {
    city_code: city.city_code,
    city_name: city.city_name,
    attractions: city.attractions,
    foods: city.foods,
  };

  return (
    <article>
      <nav className={styles.breadcrumb} aria-label="현재 위치">
        <Link href="/travel">여행 이름</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/travel/${country.code}`}>{country.name}</Link>
        <span aria-hidden="true">›</span>
        <span>{city.city_name}</span>
      </nav>

      <h1 className={`${styles.display} ${styles.pageTitle}`}>
        {city.city_name} 여행 가면 내 이름은?
      </h1>
      <p className={styles.lead}>{city.intro}</p>

      <TravelTest country={testCountry} city={testCity} />

      <section className={styles.section} aria-labelledby="phrases">
        <h2 id="phrases" className={styles.sectionTitle}>
          {city.city_name}에서 바로 쓰는 {country.language} 표현
        </h2>
        <p className={styles.sectionLead}>한글 발음은 실제 소리에 가깝게 적었어요.</p>
        <Phrases country={country} />
      </section>

      <section className={styles.section} aria-labelledby="sights">
        <h2 id="sights" className={styles.sectionTitle}>
          {city.city_name} 대표 명소
        </h2>
        <ul className={styles.infoList}>
          {city.attractions.map((a) => (
            <li key={a.name} className={styles.infoRow}>
              <span className={styles.dot} aria-hidden="true" />
              <div className={styles.infoBody}>
                <p className={styles.infoName}>{a.name}</p>
                <p className={styles.infoDesc}>{a.one_line_desc}</p>
              </div>
              <a
                className={styles.mapLink}
                href={mapLink(a.map_query)}
                target="_blank"
                rel="noopener noreferrer"
              >
                지도 ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="foods">
        <h2 id="foods" className={styles.sectionTitle}>
          {city.city_name} 대표 음식
        </h2>
        <ul className={styles.infoList}>
          {city.foods.map((f) => (
            <li key={f.name} className={styles.infoRow}>
              <span className={`${styles.dot} ${styles.dotFood}`} aria-hidden="true" />
              <div className={styles.infoBody}>
                <p className={styles.infoName}>{f.name}</p>
                <p className={styles.infoDesc}>{f.one_line_desc}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className={styles.phraseNote}>
          영업시간·가격은 자주 바뀌어서 따로 적지 않았어요. 방문 전 지도 앱에서 확인해주세요.
        </p>
      </section>

      {siblings.length > 0 && (
        <section className={styles.section} aria-labelledby="more-cities">
          <h2 id="more-cities" className={styles.sectionTitle}>
            {country.name}의 다른 도시
          </h2>
          <div className={styles.linkRow}>
            {siblings.map((c) => (
              <Link key={c.city_code} href={cityPath(country.code, c.city_code)} className={styles.chipLink}>
                {c.city_name}
              </Link>
            ))}
            <Link href="/travel" className={styles.chipLink}>
              다른 나라 보기
            </Link>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <Link href="/" className={styles.crossCard}>
          <span>
            <strong>여행 메이트랑 얼마나 닮았을까?</strong>
            <span>사진 두 장으로 보는 닮은꼴 테스트도 해보세요</span>
          </span>
          <span className={styles.crossArrow} aria-hidden="true">
            →
          </span>
        </Link>
      </section>
    </article>
  );
}
