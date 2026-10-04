import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import GunghapView from "@/components/gunghap/GunghapView";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "궁합 보기 | 두 사람의 사주로 보는 궁합 점수와 오행 궁합",
  description:
    "두 사람의 생년월일로 사주 궁합 점수, 오행 궁합, 연애·우정·업무 영역별 풀이를 보여 드려요. 입력한 정보는 서버로 보내지 않아요.",
  path: "/gunghap",
  image: "gunghap",
});

export default function GunghapPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>緣</span>
          <i style={{ top: 18, right: 26 }}>☾</i>
          <i style={{ bottom: 24, left: 22, fontSize: 11 }}>★</i>
        </div>
        <h1 className={styles.heroTitle}>우리 둘은 어떤 사이일까?</h1>
        <p className={styles.lead}>
          두 사람의 생년월일로 각자의 일간을 찾고, 오행·음양 관계(십신)와 일지 관계로 궁합을 풀어
          드려요. 연인·친구·가족 누구나 볼 수 있어요.
        </p>
      </section>

      <GunghapView />

      <MoreInfo title="궁합이 궁금하다면" lead="궁합 점수는 어떻게 나오는지, 무엇을 기준으로 풀이하는지 모아 뒀어요.">
        <Fold title="궁합 점수는 어떻게 정해져요?" hint="오행 관계 · 음양 · 일지 합충 · 오행 보완을 더한 점수">
          <p className={styles.sectionText}>
            두 사람의 일간(태어난 날의 천간)이 오행으로 어떤 관계인지(같음·상생·상극), 음양이
            같은지 다른지, 그리고 일지(태어난 날의 지지)가 합(合)을 이루는지 충(沖)을 이루는지를
            더해 0~100점 사이의 점수를 매겨요.
          </p>
          <p className={styles.sectionText}>
            여기에 &lsquo;서로 채워 주는 기운&rsquo;도 더해요. 한 사람에게 하나도 없는 오행을 상대가 두 개
            이상 가지고 있으면 빈자리를 채워 준다고 보고 점수를 조금 올려요. 오행은 태어난 시간까지 넣으면
            여덟 글자, 모르면 여섯 글자로 세서, 시간을 넣으면 이 부분과 점수가 달라질 수 있어요.
          </p>
          <p className={styles.sectionText}>
            이 점수는 전통 사주의 오행·음양·합충 개념을 바탕으로 이 사이트가 정한 계산식이에요.
            "맞다/틀리다"가 있는 공식도, 관계의 좋고 나쁨을 판정하는 결과도 아니에요. 재미로 보는
            참고 점수로만 받아들여 주세요.
          </p>
        </Fold>
        <Fold title="십신(오행 관계)이란?" hint="내가 보는 상대, 상대가 보는 나">
          <p className={styles.sectionText}>
            내 일간과 상대 일간을 비교하면 비겁(같음)·식상(내가 상대를 생함)·재성(내가 상대를
            극함)·관성(상대가 나를 극함)·인성(상대가 나를 생함), 다섯 범주 중 하나로 나뉘어요.
            이 틀은 <Link href="/reads/ten-gods">십신이란?</Link> 글에서 다룬 것과 같은 체계예요.
            방향에 따라 "내가 보는 상대"와 "상대가 보는 나"가 다르게 나올 수 있어요.
          </p>
        </Fold>
        <Fold title="상대방 정보도 저장되나요?" hint="아니요, 저장하지 않아요">
          <p className={styles.sectionText}>
            나의 생년월일은 "이 기기에 기억하기"를 선택한 경우에만 이 브라우저에 저장돼요.
            상대방의 생년월일은 어떤 경우에도 저장하지 않고, 이 화면에서 계산한 뒤 창을 닫으면
            사라져요.
          </p>
          <p className={styles.sectionText}>
            결과를 공유하면 받은 사람이 바로 같은 결과를 볼 수 있는데, 링크에는 생년월일과 성별이
            들어가지 않아요. 풀이를 다시 계산하는 데 쓰는 번호(두 사람의 일주, 오행 개수, 고른
            영역)만 주소 뒤에 담기고, 이 부분은 서버로 전송되지 않아요.
          </p>
        </Fold>
      </MoreInfo>

      <Link href="/fortune" className={styles.nextCard}>
        <span>
          <small>같은 사주 엔진으로 만들었어요</small>
          <strong>오늘 나의 운세도 보기</strong>
          <span>생년월일로 내 일간을 찾아 오늘 하루 흐름을 풀어 드려요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>

      <CrossCards />
    </>
  );
}
