import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import FortuneApp from "@/components/fortune/FortuneApp";
import TodayStrip from "@/components/fortune/TodayStrip";
import { fortuneMetadata } from "@/lib/fortune/seo";
import { READS } from "@/lib/reads";

export const metadata = fortuneMetadata({
  title: "오늘의 운세 | 생년월일로 보는 내 사주와 오늘의 흐름",
  description:
    "생년월일(양력·음력)로 사주 팔자를 계산하고, 오늘 일진과의 관계로 하루 흐름을 풀어 드려요. 입력한 정보는 서버로 보내지 않아요.",
  path: "/fortune",
});

export default function FortunePage() {
  const reads = READS.filter((r) => r.corner === "fortune");

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>運</span>
          <i style={{ top: 18, right: 26 }}>☾</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>★</i>
        </div>
        <h1 className={styles.heroTitle}>오늘 나의 하루는 어떨까?</h1>
        <p className={styles.lead}>
          생년월일로 내 사주 팔자를 계산하고, 오늘 일진과 어떤 관계인지로 하루 흐름을 풀어 드려요.
        </p>
        <TodayStrip />
      </section>

      <FortuneApp />

      <section className={styles.section} aria-labelledby="how">
        <h2 id="how" className={styles.sectionTitle}>
          오늘의 운세는 이렇게 정해져요
        </h2>
        <ol className={styles.steps}>
          <li>
            <strong>1. 내 사주 팔자 계산</strong>
            태어난 해·달·날·시간을 각각 천간과 지지 두 글자로 바꿔 모두 여덟 글자를 만들어요. 해와 달은
            설날이나 1일이 아니라 입춘·경칩 같은 절기가 시작되는 시각에 바뀌어요.
          </li>
          <li>
            <strong>2. &lsquo;나&rsquo;를 뜻하는 글자 찾기</strong>
            여덟 글자 가운데 태어난 날의 천간을 일간이라고 하고, 사주에서는 이 글자를 나 자신으로 봐요.
          </li>
          <li>
            <strong>3. 오늘 일진과의 관계 보기</strong>
            날마다 정해진 간지(일진)가 있어요. 오늘 일진의 천간이 내 일간과 어떤 오행·음양 관계인지에 따라
            비견부터 정인까지 열 가지(십신) 중 하나가 정해지고, 그 의미에 맞춘 풀이를 보여 드려요.
          </li>
        </ol>
        <div className={styles.callout}>
          <strong>계산 기준</strong>
          <ul>
            <li>음력은 한국천문연구원 기준 음력으로 양력으로 바꿔 계산해요.</li>
            <li>태어난 시간은 그 시절 한국의 표준시와 서머타임을 반영하고, 동경 127.5도 기준 지역 시간(지금 표준시보다 30분 늦음)으로 보정해요.</li>
            <li>밤 11시(보정 시간 기준)부터 시작하는 자시에 태어났다면 다음 날로 계산해요.</li>
            <li>같은 날 같은 생년월일이면 언제 봐도 같은 풀이가 나와요. 무작위로 뽑지 않아요.</li>
          </ul>
        </div>
      </section>

      {reads.length > 0 && (
        <section className={styles.section} aria-labelledby="fortune-reads">
          <h2 id="fortune-reads" className={styles.sectionTitle}>
            사주·운세 읽을거리
          </h2>
          <ul className={styles.readList}>
            {reads.map((r) => (
              <li key={r.slug}>
                <Link href={`/reads/${r.slug}`}>{r.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <Link href="/face" className={styles.crossCard} style={{ background: "var(--c-face-soft)" }}>
          <span>
            <strong>우리 얼마나 닮았을까?</strong>
            <span>사진 두 장으로 보는 닮은꼴 테스트도 해보세요</span>
          </span>
          <span className={styles.crossArrow} aria-hidden="true">
            →
          </span>
        </Link>
        <Link href="/travel" className={styles.crossCard} style={{ background: "var(--c-travel-soft)" }}>
          <span>
            <strong>여행 가면 내 이름은?</strong>
            <span>여행지를 고르면 현지 감성 이름 카드를 만들어 드려요</span>
          </span>
          <span className={styles.crossArrow} aria-hidden="true">
            →
          </span>
        </Link>
      </section>
    </>
  );
}
