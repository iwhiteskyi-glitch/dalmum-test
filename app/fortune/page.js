import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import TodayFortune from "@/components/fortune/TodayFortune";
import TodayStrip from "@/components/fortune/TodayStrip";
import CornerNav from "@/components/fortune/CornerNav";
import CrossCards from "@/components/fortune/CrossCards";
import { fortuneMetadata } from "@/lib/fortune/seo";
import { READS } from "@/lib/reads";

export const metadata = fortuneMetadata({
  title: "오늘의 운세 | 생년월일로 보는 오늘 하루 흐름",
  description:
    "생년월일(양력·음력)로 내 일간을 찾고, 오늘 일진과의 관계로 하루 흐름과 일주일 흐름을 풀어 드려요. 입력한 정보는 서버로 보내지 않아요.",
  path: "/fortune",
});

export default function FortunePage() {
  const reads = READS.filter((r) => r.corner === "fortune");

  return (
    <>
      <CornerNav current="today" />
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>運</span>
          <i style={{ top: 18, right: 26 }}>☾</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>★</i>
        </div>
        <h1 className={styles.heroTitle}>오늘 나의 하루는 어떨까?</h1>
        <p className={styles.lead}>
          생년월일로 나를 뜻하는 글자를 찾고, 오늘 일진과 어떤 관계인지로 하루 흐름을 풀어 드려요.
        </p>
        <TodayStrip />
      </section>

      <TodayFortune />

      <section className={styles.section} aria-labelledby="how">
        <h2 id="how" className={styles.sectionTitle}>
          오늘의 운세는 이렇게 정해져요
        </h2>
        <ol className={styles.steps}>
          <li>
            <strong>1. &lsquo;나&rsquo;를 뜻하는 글자 찾기</strong>
            생년월일로 사주 팔자를 계산해, 그중 태어난 날의 천간(일간)을 찾아요. 사주에서는 이 글자를 나 자신으로 봐요.
          </li>
          <li>
            <strong>2. 오늘의 일진 확인</strong>
            날마다 갑자·을축처럼 정해진 간지가 있고, 이를 일진이라고 해요. 60일마다 한 바퀴 돌아요.
          </li>
          <li>
            <strong>3. 둘의 관계로 풀이</strong>
            오늘 천간이 내 일간과 어떤 오행·음양 관계인지에 따라 비견부터 정인까지 열 가지(십신) 중 하나가 정해지고, 그
            의미에 맞춘 풀이를 보여 드려요. 내 일지와 오늘 일지가 합(合)이나 충(沖)을 이루면 총운 별점을 조금 조정해요.
          </li>
        </ol>
        <p className={styles.callout}>
          같은 날 같은 생년월일이면 언제 봐도 같은 풀이가 나와요. 무작위로 뽑지 않아요. 계산 기준은{" "}
          <Link href="/fortune/saju">내 사주</Link> 페이지에서 자세히 볼 수 있어요.
        </p>
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

      <CrossCards />
    </>
  );
}
