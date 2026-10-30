import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import BrandLogo from "@/components/BrandLogo";
import InstallPrompt from "@/components/InstallPrompt";
import Avatar from "@/components/travel/Avatar";
import site from "@/components/site.module.css";
import styles from "./hub.module.css";
import { CORNERS, SITE } from "@/lib/site";
import { READS } from "@/lib/reads";
import { COUNTRIES } from "@/lib/travel/data";

// 재미로봄 첫 화면(허브). 코너 카드 → 여행지 바로가기 → 읽을거리 → 사이트 소개 순서입니다.
// 새 코너(예: 오늘의 운세)를 만들면 lib/site.js의 CORNERS에 추가하고, 아래 CornerIcon에
// 아이콘을 하나 넣으면 됩니다. 매일 바뀌는 코너라면 코너 카드 위에 따로 두는 걸 권장해요.

export const metadata = {
  title: { absolute: `${SITE.name} — ${SITE.shortDesc}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

// 카드 아이콘. 닮은꼴·여행은 여행 섹션의 캐릭터 그림체를, 운세·궁합·관상·꿈해몽은 밤하늘 원판에 한자 한 글자를 씁니다.
// 휴대폰·PC 모두 한눈에 고르도록 카드는 코너 색 배경 + 작은 아이콘 + 이름·제목만 둡니다(2026-10-30).
const FACE_A = { skin: "#F6D2B5", hairColor: "#3B2A20", blush: "#FFB3C6", hair: "short", expression: "grin" };
const FACE_B = { skin: "#FFE1C4", hairColor: "#3B2A20", blush: "#FFB3C6", hair: "bob", expression: "smile", accessory: "ribbon" };
const TRAVELER = { skin: "#FFE1C4", hairColor: "#5A3E2B", blush: "#FFB3C6", hair: "bob", expression: "smile", accessory: "strawhat" };

const ORB = { fortune: "運", gunghap: "緣", gwansang: "相", dream: "夢" };

function CornerIcon({ k }) {
  if (k === "face") {
    return (
      <span className={styles.iconFace}>
        <Avatar avatar={FACE_A} size={38} bg="#ffffff" />
        <Avatar avatar={FACE_B} size={38} bg="#ffffff" />
      </span>
    );
  }
  if (k === "travel") {
    return (
      <span className={styles.iconTravel}>
        <Avatar avatar={TRAVELER} size={50} bg="#ffffff" />
        <span className={styles.stamp}>✈</span>
      </span>
    );
  }
  return (
    <span className={`${styles.iconOrb} ${styles[`orb_${k}`]}`}>
      <span className={styles.orbChar}>{ORB[k]}</span>
    </span>
  );
}

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
            꿈해몽·운세·궁합부터 관상, 닮은꼴, 여행 이름까지.
            <br className={styles.brWide} /> 가볍게 해보고 친구와 나눠 보세요.
          </p>
        </section>

        <InstallPrompt />

        <section className={styles.corners} aria-label="코너">
          {CORNERS.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className={styles.corner}
              style={{ "--cc": `var(--c-${c.key})`, "--cc-soft": `var(--c-${c.key}-soft)` }}
            >
              <span className={styles.cornerIcon} aria-hidden="true">
                <CornerIcon k={c.key} />
              </span>
              <span className={styles.cornerBody}>
                <span className={styles.cornerLabel}>{c.name}</span>
                <h2 className={styles.cornerTitle}>{c.title}</h2>
              </span>
              <span className={styles.cornerArrow} aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </section>

        {/* 대부분은 위 코너 카드만 쓰므로 아래는 접어 둡니다. 접힌 내용도 HTML에 그대로 있어
            검색엔진·심사에서는 다 읽힙니다. */}
        <div className={styles.folds}>
          <details className={styles.fold}>
            <summary>
              <h2 className={styles.foldTitle}>여행지별 현지 이름 · 인사말 보기</h2>
              <span className={styles.foldHint}>{COUNTRIES.length}개국</span>
            </summary>
            <div className={styles.foldBody}>
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
              <Link href="/travel" className={`${styles.more} ${styles.moreTravel} ${styles.foldMore}`}>
                {COUNTRIES.length}개국 전체 보기 →
              </Link>
            </div>
          </details>

          <details className={styles.fold}>
            <summary>
              <h2 className={styles.foldTitle}>읽을거리</h2>
              <span className={styles.foldHint}>{READS.length}편</span>
            </summary>
            <div className={styles.foldBody}>
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
              <Link href="/reads" className={`${styles.more} ${styles.foldMore}`}>
                읽을거리 전체 보기 →
              </Link>
            </div>
          </details>

          <details className={styles.fold}>
            <summary>
              <h2 className={styles.foldTitle}>{SITE.name}은 이런 곳이에요</h2>
              <span className={styles.foldHint}>무료 · 저장 안 함</span>
            </summary>
            <div className={styles.foldBody}>
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
            </div>
          </details>
        </div>
      </main>
      <AdSlot slot="content-bottom" />
      <SiteFooter />
    </div>
  );
}
