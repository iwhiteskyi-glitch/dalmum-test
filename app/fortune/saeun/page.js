import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import SaeunView from "@/components/fortune/SaeunView";
import CornerNav from "@/components/fortune/CornerNav";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";
import { currentSajuYear } from "@/lib/fortune/saju";

// 다음 사주해(입춘 기준)를 제목에 넣어 둡니다. 해가 바뀌면 다음 배포 때 자동으로 따라가요.
const nextYear = currentSajuYear() + 1;

export const metadata = fortuneMetadata({
  title: `${nextYear}년 신년운세 | 세운·월운으로 보는 한 해와 열두 달 흐름`,
  description: `생년월일로 내 일간을 찾아 ${nextYear}년 세운(한 해 전체)과 열두 달 월운의 흐름을 보여 드려요. 입력한 정보는 서버로 보내지 않아요.`,
  path: "/fortune/saeun",
});

export default function SaeunPage() {
  return (
    <>
      <CornerNav current="saeun" />
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>歲</span>
          <i style={{ top: 18, right: 26 }}>☾</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>★</i>
        </div>
        <p className={styles.todayStrip}>{nextYear}년 신년운세 · 올해·내년·내후년 모두 가능</p>
        <h1 className={styles.heroTitle}>올해, 내년은 나에게 어떤 해일까?</h1>
        <p className={styles.lead}>
          생년월일로 나를 뜻하는 글자를 찾고, 그해 세운·열두 달 월운과 어떤 관계인지로 한 해 흐름을
          풀어 드려요.
        </p>
      </section>

      <SaeunView />

      <MoreInfo title="신년운세가 궁금하다면" lead="세운·월운이 무엇인지, 오늘의 운세와 무엇이 다른지 모아 뒀어요.">
        <Fold title="세운·월운이란?" hint="한 해 전체의 간지(세운)와 열두 달의 간지(월운)">
          <p className={styles.sectionText}>
            사주에서는 날마다 일진(그날의 간지)이 있듯, 해마다 <strong>세운</strong>(그해 전체의
            간지), 달마다 <strong>월운</strong>(그달의 간지)이 있어요. 신년운세는 내 일간과 그해
            세운·그달 월운의 오행·음양 관계(십신)를 찾아, 오늘의 운세와 같은 방식으로 한 해와 열두
            달의 흐름을 풀어요.
          </p>
          <p className={styles.sectionText}>
            해(세운)는 설날이 아니라 <Link href="/reads/zodiac-ipchun">입춘</Link>을 기준으로
            바뀌고, 달(월운)은 1일이 아니라 그달의{" "}
            <Link href="/reads/solar-terms">절기가 시작되는 시각</Link>에 바뀌어요. 그래서 열두 달의
            시작일이 달력의 1일과 며칠씩 차이가 나요. 세운·월운에 쓰이는 간지는{" "}
            <Link href="/reads/sixty-ganji">60갑자</Link>를 그대로 따르고, 십신을 찾는 방식은{" "}
            <Link href="/reads/ten-gods">십신이란?</Link> 글과 같아요.
          </p>
        </Fold>
        <Fold title="오늘의 운세와 무엇이 다른가요?" hint="같은 원리, 다른 기간">
          <p className={styles.sectionText}>
            <Link href="/fortune">오늘의 운세</Link>는 내 일간과 오늘 하루의 일진을 비교하고, 신년운세는
            같은 방식으로 내 일간과 그해(세운)·그달(월운)의 간지를 비교해요. 기간만 다를 뿐 계산
            원리는 같아요. 매일 바뀌는 오늘의 흐름이 궁금하면 오늘의 운세를, 한 해 전체의 큰 흐름이
            궁금하면 신년운세를 보면 돼요.
          </p>
        </Fold>
      </MoreInfo>

      <CrossCards />
    </>
  );
}
