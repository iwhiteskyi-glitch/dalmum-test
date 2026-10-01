import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import BrandLogo from "@/components/BrandLogo";
import Avatar from "@/components/travel/Avatar";
import site from "@/components/site.module.css";
import styles from "./hub.module.css";
import { CORNERS, SITE } from "@/lib/site";
import { READS } from "@/lib/reads";
import { COUNTRIES } from "@/lib/travel/data";

// 재미로봄 첫 화면(허브). 코너 카드 → 여행지 바로가기 → 읽을거리 → 사이트 소개 순서입니다.
// 새 코너(예: 오늘의 운세)를 만들면 lib/site.js의 CORNERS에 추가하고, 아래 ART에
// 카드 그림을 하나 넣으면 됩니다. 매일 바뀌는 코너라면 코너 카드 위에 따로 두는 걸 권장해요.

export const metadata = {
  title: { absolute: `${SITE.name} — ${SITE.shortDesc}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

// 카드 그림. 닮은꼴·여행은 여행 섹션의 캐릭터 그림체를, 운세는 밤하늘 원판을 씁니다.
const FACE_A = { skin: "#F6D2B5", hairColor: "#3B2A20", blush: "#FFB3C6", hair: "short", expression: "grin" };
const FACE_B = { skin: "#FFE1C4", hairColor: "#3B2A20", blush: "#FFB3C6", hair: "bob", expression: "smile", accessory: "ribbon" };
const TRAVELER = { skin: "#FFE1C4", hairColor: "#5A3E2B", blush: "#FFB3C6", hair: "bob", expression: "smile", accessory: "strawhat" };

const ART = {
  face: (
    <div className={styles.artFace}>
      <Avatar avatar={FACE_A} size={92} bg="#ffffff" />
      <span className={styles.matchBadge}>87%</span>
      <Avatar avatar={FACE_B} size={92} bg="#ffffff" />
    </div>
  ),
  travel: (
    <div className={styles.artTravel}>
      <span className={styles.stamp} aria-hidden="true">
        ✈
      </span>
      <Avatar avatar={TRAVELER} size={92} bg="#ffffff" />
      <span className={styles.nameTag}>사쿠라 · さくら</span>
    </div>
  ),
  fortune: (
    <div className={styles.artFortune} aria-hidden="true">
      <span className={styles.fortuneMoon}>☾</span>
      <span className={styles.fortuneChar}>運</span>
      <span className={styles.fortuneStars}>
        ★★★★<span>★</span>
      </span>
    </div>
  ),
  gunghap: (
    <div className={styles.artFortune} aria-hidden="true">
      <span className={styles.fortuneMoon}>☾</span>
      <span className={styles.fortuneChar}>緣</span>
      <span className={styles.fortuneStars}>
        ★★★<span>★★</span>
      </span>
    </div>
  ),
};

// 여행지 바로가기: 한국인이 많이 가는 순서로 몇 곳만 보여주고 나머지는 여행 첫 화면에서 고르게 합니다.
const QUICK_TRAVEL = ["japan", "vietnam", "thailand", "taiwan", "china", "philippines", "usa", "france", "italy", "uk", "spain", "australia"];

export default function Home() {
  const quickCountries = QUICK_TRAVEL.map((code) => COUNTRIES.find((c) => c.code === code)).filter(Boolean);
  const reads = READS.slice(0, 3);

  return (
    <div className={site.shell}>
      <SiteHeader />
      <main className={styles.main}>
        <section className={styles.hero}>
          <BrandLogo size={52} className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>
            재미로 알아보는
            <br />
            <span className={styles.heroMark}>나와 우리</span>
          </h1>
          <p className={styles.heroLead}>
            사진 두 장으로 닮은 정도를, 여행지 하나로 새 이름을.
            <br className={styles.brWide} /> 가볍게 해보고 친구와 나눠 보세요.
          </p>
        </section>

        <section className={styles.corners} aria-label="코너">
          {CORNERS.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className={styles.corner}
              style={{ "--cc": `var(--c-${c.key})`, "--cc-soft": `var(--c-${c.key}-soft)` }}
            >
              <div className={styles.cornerArt}>{ART[c.key]}</div>
              <div className={styles.cornerBody}>
                <p className={styles.cornerLabel}>{c.name}</p>
                <h2 className={styles.cornerTitle}>{c.title}</h2>
                <p className={styles.cornerDesc}>{c.desc}</p>
                <ul className={styles.chips}>
                  {c.chips.map((chip) => (
                    <li key={chip}>{chip}</li>
                  ))}
                </ul>
                <span className={styles.cornerCta}>
                  {c.cta} <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className={styles.section} aria-labelledby="quick-travel">
          <div className={styles.sectionHead}>
            <h2 id="quick-travel" className={styles.sectionTitle}>
              여행지별 현지 이름 · 인사말 보기
            </h2>
            <Link href="/travel" className={`${styles.more} ${styles.moreTravel}`}>
              {COUNTRIES.length}개국 전체 보기 →
            </Link>
          </div>
          <p className={styles.sectionLead}>
            나라를 고르면 그 나라 감성 이름과 꼭 알아둘 현지 인사말, 도시별 명소·음식을 볼 수 있어요.
          </p>
          <ul className={styles.countryChips}>
            {quickCountries.map((c) => (
              <li key={c.code}>
                <Link href={`/travel/${c.code}`}>
                  <strong>{c.name}</strong>
                  <span>{c.cities.length}개 도시</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="reads">
          <div className={styles.sectionHead}>
            <h2 id="reads" className={styles.sectionTitle}>
              읽을거리
            </h2>
            <Link href="/reads" className={styles.more}>
              전체 보기 →
            </Link>
          </div>
          <div className={styles.readGrid}>
            {reads.map((r) => (
              <Link key={r.slug} href={`/reads/${r.slug}`} className={site.readCard}>
                {r.corner ? (
                  <p className={site.readCardCorner}>
                    {CORNERS.find((c) => c.key === r.corner)?.name}
                  </p>
                ) : null}
                <p className={site.readCardTitle}>{r.title}</p>
                <p className={site.readCardDesc}>{r.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.about}`} aria-labelledby="about">
          <h2 id="about" className={styles.sectionTitle}>
            {SITE.name}은 이런 곳이에요
          </h2>
          <p className={styles.aboutLead}>
            {SITE.name}은 &lsquo;나&rsquo;와 &lsquo;우리&rsquo;를 가볍게 들여다보는 재미용 테스트
            모음이에요. 친구·연인·가족과 결과를 나누며 이야깃거리를 만드는 걸 목표로 해요.
          </p>
          <ul className={styles.principles}>
            <li>
              <strong>재미로 봐요</strong>
              모든 점수와 이름 추천은 재미를 위한 결과예요. 정확한 분석이나 공식적인 판단의 근거로 쓸
              수 없어요.
            </li>
            <li>
              <strong>저장하지 않아요</strong>
              사진과 입력한 정보는 서버로 보내지 않고 내 브라우저 안에서만 처리돼요. 창을 닫으면
              사라져요.
            </li>
            <li>
              <strong>모두 무료예요</strong>
              결제 기능이 없어요. 운영비는 페이지에 보이는 광고로 충당해요.
            </li>
          </ul>
          <Link href="/about" className={styles.more}>
            {SITE.name} 소개 더 보기 →
          </Link>
        </section>
      </main>
      <AdSlot slot="content-bottom" />
      <SiteFooter />
    </div>
  );
}
