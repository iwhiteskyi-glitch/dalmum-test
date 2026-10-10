import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import CornerNav from "@/components/fortune/CornerNav";
import TtiGrid from "@/components/fortune/TtiGrid";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";
import { koreaToday, ANIMALS } from "@/lib/fortune/saju";
import { ttiYears, sajuYearOf, TTI_SLUGS } from "@/lib/fortune/tti";
import { READS } from "@/lib/reads";

// 오늘 날짜로 미리 그려 두고 한 시간마다 다시 만들어요(날짜가 바뀌면 브라우저에서도 다시 계산).
export const revalidate = 3600;

export const metadata = fortuneMetadata({
  title: "오늘의 띠별 운세 | 쥐띠부터 돼지띠까지 12띠 오늘 하루",
  description:
    "쥐띠·소띠·호랑이띠부터 돼지띠까지, 오늘 일진과 내 띠의 관계로 보는 12띠 오늘의 운세와 년생별 한마디. 매일 바뀌어요.",
  path: "/fortune/tti",
});

export default function TtiHubPage() {
  const today = koreaToday();
  const reads = READS.filter((r) => ["zodiac-animals", "zodiac-ipchun", "hap-chung", "ten-gods", "five-elements"].includes(r.slug));

  return (
    <>
      <CornerNav current="tti" />
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>支</span>
          <i style={{ top: 18, right: 26 }}>☾</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>★</i>
        </div>
        <h1 className={styles.heroTitle}>오늘의 띠별 운세</h1>
        <p className={styles.lead}>
          생년월일을 몰라도 괜찮아요. 내 띠와 오늘 일진의 관계로 열두 띠의 하루 흐름을 풀어 드려요.
        </p>
      </section>

      <TtiGrid initialDate={today} />

      <MoreInfo title="띠별 운세가 궁금하다면" lead="풀이가 어떻게 정해지는지, 내 띠는 어떻게 찾는지 모아 뒀어요.">
        <Fold title="띠별 운세는 이렇게 정해져요" hint="띠 글자의 본기 천간과 오늘 일진의 관계">
          <ol className={styles.steps}>
            <li>
              <strong>1. 띠를 글자로 바꾸기</strong>
              띠는 태어난 해의 지지예요. 쥐띠는 자(子), 소띠는 축(丑)처럼 열두 글자 중 하나이고, 지지마다 대표로 품은
              천간(본기)이 있어요. 띠별 운세에서는 이 천간을 &lsquo;나&rsquo;로 봐요.
            </li>
            <li>
              <strong>2. 오늘 일진과 견주기</strong>
              오늘 일진의 천간이 내 띠의 천간과 어떤 오행·음양 관계인지에 따라 비견부터 정인까지 열 가지(십신) 중 하나가
              정해지고, 그 의미에 맞춘 풀이를 보여 드려요.
            </li>
            <li>
              <strong>3. 띠끼리의 관계 더하기</strong>
              오늘 날짜의 지지(일지)와 내 띠가 육합·삼합을 이루면 총운 별점을 하나 올리고, 정반대 자리(충)면 하나 내려요.
              소띠와 양띠, 용띠와 개띠는 품은 천간이 같아서 이 관계까지 같은 날엔 풀이도 같아요.
            </li>
          </ol>
          <p className={styles.callout}>
            같은 날 같은 띠라면 언제 봐도 같은 풀이가 나와요. 무작위로 뽑지 않아요. 사주에서 &lsquo;나&rsquo;는 원래
            태어난 날의 천간(일간)인데, 띠별 운세는 띠 글자 속 대표 기운을 &lsquo;나&rsquo;로 삼은 재미용 간이 풀이예요.
            그래서 생년월일로 보는 <Link href="/fortune">오늘의 운세</Link>와는 결과가 다를 수 있어요.
          </p>
        </Fold>
        <Fold title="내 띠 찾기" hint="태어난 해로 찾는 열두 띠">
          <table className={styles.godTable}>
            <thead>
              <tr>
                <th scope="col">띠</th>
                <th scope="col">태어난 해(최근)</th>
              </tr>
            </thead>
            <tbody>
              {ANIMALS.map((a, b) => (
                <tr key={a}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/fortune/tti/${TTI_SLUGS[b]}`}>
                      {a}띠
                    </Link>
                  </td>
                  <td>
                    {ttiYears(b, sajuYearOf(today), 72).reverse().join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>
            띠는 설날이 아니라 입춘(양력 2월 4일 무렵)에 바뀌어요. 1월이나 2월 초에 태어났다면 앞 해의 띠일 수 있어요.
          </p>
        </Fold>
        {reads.length > 0 && (
          <Fold title="띠와 사주 읽을거리" hint="열두 띠 이야기, 입춘, 합과 충, 십신, 오행">
            <ul className={styles.readList}>
              {reads.map((r) => (
                <li key={r.slug}>
                  <Link href={`/reads/${r.slug}`}>{r.title}</Link>
                </li>
              ))}
            </ul>
          </Fold>
        )}
      </MoreInfo>
    </>
  );
}
