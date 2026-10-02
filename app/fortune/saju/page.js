import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import SajuView from "@/components/fortune/SajuView";
import CornerNav from "@/components/fortune/CornerNav";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";
import { ILGAN_SLUGS, ilganInfo, ilganHref } from "@/lib/fortune/ilgan";
import { READS } from "@/lib/reads";

export const metadata = fortuneMetadata({
  title: "내 사주 팔자 보기 · 무료 만세력 | 생년월일로 보는 여덟 글자와 오행",
  description:
    "무료 만세력으로 생년월일과 태어난 시간(선택)의 사주 팔자 여덟 글자, 오행 분포, 나를 뜻하는 일간의 성격 풀이를 보여 드려요. 입력한 정보는 서버로 보내지 않아요.",
  path: "/fortune/saju",
});

export default function SajuPage() {
  const reads = READS.filter((r) => r.corner === "fortune");

  return (
    <>
      <CornerNav current="saju" />
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>命</span>
          <i style={{ top: 18, right: 26 }}>☾</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>★</i>
        </div>
        <p className={styles.todayStrip}>무료 만세력 · 양력·음력 모두 가능</p>
        <h1 className={styles.heroTitle}>내 사주 팔자 보기</h1>
        <p className={styles.lead}>
          태어난 해·달·날·시간을 여덟 글자로 바꿔, 오행 분포와 나를 뜻하는 글자의 성격을 풀어 드려요.
        </p>
      </section>

      <SajuView />

      <MoreInfo title="사주가 처음이라면" lead="사주 팔자의 기본과 이 사이트의 계산 기준을 모아 뒀어요. 궁금한 항목을 눌러 보세요.">
        <Fold title="사주 팔자란?" hint="네 기둥, 여덟 글자, 오행이 뜻하는 것">
          <p className={styles.sectionText}>
            사주(四柱)는 &lsquo;네 기둥&rsquo;이라는 뜻으로, 태어난 해·달·날·시간을 각각 하나의 기둥으로 봐요. 기둥마다
            위에는 천간(갑·을·병·정·무·기·경·신·임·계 중 하나), 아래에는 지지(자·축·인·묘·진·사·오·미·신·유·술·해 중
            하나)가 놓여서 모두 여덟 글자가 되는데, 이를 팔자(八字)라고 해요.
          </p>
          <p className={styles.sectionText}>
            여덟 글자는 저마다 목·화·토·금·수 다섯 가지 오행 중 하나에 속해요. 그중 태어난 날의 천간(일간)을
            &lsquo;나&rsquo;로 보고, 나머지 글자들과의 관계로 성향을 풀이하는 것이 사주의 기본이에요.
          </p>
        </Fold>

        <Fold title="열 가지 일간 알아보기" hint="갑목부터 계수까지, 글자마다 소개 페이지가 있어요">
          <p className={styles.sectionText}>
            일간은 갑·을·병·정·무·기·경·신·임·계 열 가지예요. 글자를 누르면 그 일간의 상징과 성격, 다른 글자와의 관계를 볼 수
            있어요.
          </p>
          <ul className={styles.stemGrid}>
            {ILGAN_SLUGS.map((_, i) => {
              const o = ilganInfo(i);
              return (
                <li key={i}>
                  <Link href={ilganHref(i)} className={styles[`el${o.elementIndex}`]}>
                    <span>{o.hanja}</span>
                    {o.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Fold>

        <Fold title="공유 링크에는 무엇이 담겨요?" hint="여덟 글자와 풀이가 담겨요">
          <p className={styles.sectionText}>
            결과를 공유하면 여덟 글자와 일간 풀이가 담긴 사진·링크가 전해져서, 받은 사람이 생년월일을
            넣지 않아도 같은 화면을 볼 수 있어요. 사진에는 &lsquo;더 자세히 알아보기&rsquo;에 있는 성격·관계·
            일과 공부·오행 균형 이야기까지 함께 담겨요. 생년월일을 그대로 담지는 않지만, 팔자는 태어난 날과
            시간으로 정해지는 글자라서 받는 사람이 태어난 날을 짐작할 수도 있어요. 공유는 직접 버튼을
            누를 때만 이뤄지고, 주소의 &lsquo;#&rsquo; 뒷부분은 서버로 전송되지 않아요.
          </p>
        </Fold>

        <Fold title="계산 기준" hint="입춘·절기, 음력, 옛 표준시·서머타임 보정, 자시">
          <div className={styles.callout}>
            <ul>
              <li>해(연주)는 설날이 아니라 입춘, 달(월주)은 1일이 아니라 그달의 절기가 시작되는 시각에 바뀌어요.</li>
              <li>음력 생일은 한국천문연구원 기준 음력으로 양력으로 바꿔 계산해요.</li>
              <li>
                태어난 시간은 그 시절 한국의 표준시와 서머타임을 반영하고, 동경 127.5도 기준 지역 시간(지금 표준시보다
                30분 늦음)으로 보정해요. 계절에 따라 달라지는 균시차까지는 반영하지 않아요.
              </li>
              <li>밤 11시(보정한 시간 기준)부터 시작하는 자시에 태어났다면 다음 날로 계산해요.</li>
              <li>태어난 시간을 모르면 시주를 빼고 여섯 글자로 계산해요.</li>
            </ul>
            <p style={{ margin: "8px 0 0" }}>
              사주를 보는 곳마다 시간 보정이나 자시를 다루는 방식이 조금씩 달라서, 다른 곳과 결과가 다를 수 있어요.
            </p>
          </div>
          <p className={styles.sectionText} style={{ marginTop: 14 }}>
            매일 바뀌는 하루 흐름은 <Link href="/fortune">오늘의 운세</Link>에서 볼 수 있어요.
          </p>
        </Fold>

        {reads.length > 0 && (
          <Fold title={`사주·운세 읽을거리 ${reads.length}편`} hint="십신, 오행, 띠와 입춘, 윤달, 태어난 시간 이야기">
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

      <CrossCards />
    </>
  );
}
