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
        <Fold open title="세운·월운이란?" hint="한 해 전체의 간지(세운)와 열두 달의 간지(월운)">
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

        <Fold title="한 해 점수와 달 점수는 어떻게 매겨요?" hint="별점을 100점으로 바꾼 것">
          <p className={styles.sectionText}>
            한 해 점수는 그해 총운 별점(내 일지와 그해 지지의 관계까지 반영)을 60%, 연애·일·금전·건강
            네 영역 별점의 평균을 25%, 열두 달 별점의 평균을 15% 반영해 100점으로 바꾼 거예요. 달 점수는
            그 달 총운 별점 75%와 영역 별점 평균 25%로 냈어요. 같은 사람이 같은 해를 보면 늘 같은 점수가
            나와요.
          </p>
          <p className={styles.sectionText}>
            점수가 낮은 달은 나쁜 달이 아니라 속도를 늦추고 쉬어 가면 좋은 달이라는 뜻이에요. 그래서
            결과에서도 &lsquo;쉬어 가는 달&rsquo;이라고 불러요.
          </p>
        </Fold>

        <Fold title="맞춤 풀이는 무엇이 다른가요?" hint="일간 10가지 × 십신 10가지">
          <p className={styles.sectionText}>
            같은 해라도 태어난 날의 천간(일간)이 다르면 그해가 나에게 갖는 의미가 달라요. 그래서 일간 열
            가지(큰 나무·들풀·태양·촛불·큰 산·기름진 밭·무쇠·보석·큰 강·맑은 샘물)와 그해 십신 열 가지를
            짝지어 100가지 풀이를 따로 썼어요. 예를 들어 촛불(정화)의 해에 큰 나무인 사람은 나무가 불꽃으로
            번지듯 재주가 밖으로 드러나는 해로, 큰 산인 사람은 산속 등불처럼 배움과 도움이 마음을 채우는
            해로 풀어요.
          </p>
        </Fold>

        <Fold title="이 해의 색·숫자·방향은 어떻게 정해져요?" hint="오행마다 정해진 전통 색·숫자·방위">
          <p className={styles.sectionText}>
            그해 기운을 부드럽게 이어 주는 오행을 찾아서, 그 오행에 해당하는 전통적인 색과 숫자,
            방위를 보여 드려요. 방위는 목이 동쪽, 화가 남쪽, 토가 중앙, 금이 서쪽, 수가 북쪽이에요.
            토가 나오면 중앙이라서, 멀리 떠나기보다 가까운 곳에서 풀어가는 해로 봐요.
          </p>
        </Fold>
      </MoreInfo>

      <CrossCards />
    </>
  );
}
