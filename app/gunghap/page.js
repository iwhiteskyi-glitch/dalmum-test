import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import GunghapView from "@/components/gunghap/GunghapView";
import CrossCards from "@/components/fortune/CrossCards";
import { MoreInfo, Fold } from "@/components/fortune/MoreInfo";
import { fortuneMetadata } from "@/lib/fortune/seo";

export const metadata = fortuneMetadata({
  title: "궁합 보기 | 두 사람의 사주로 보는 궁합 점수와 오행 궁합",
  description:
    "두 사람의 생년월일로 사주 궁합 점수와 일간 조합 100가지 맞춤 풀이, 연인·친구·가족·일로 만난 사이별 궁합, 일지 궁합을 보여 드려요. 입력한 정보는 서버로 보내지 않아요.",
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
          두 사람의 생년월일로 각자를 나타내는 글자(일간)를 찾아, 두 글자의 관계와 태어난 날 아랫글자(일지)의
          어울림으로 궁합을 풀어 드려요. 연인·친구·가족·일로 만난 사이 누구나 볼 수 있어요.
        </p>
      </section>

      <GunghapView />

      <MoreInfo title="궁합이 궁금하다면" lead="궁합 점수는 어떻게 나오는지, 무엇을 기준으로 풀이하는지 모아 뒀어요.">
        <Fold open title="궁합 점수는 어떻게 정해져요?" hint="오행 관계 · 음양 · 일지 합충 · 오행 보완을 더한 점수">
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
            결과 화면의 &lsquo;점수는 이렇게 나왔어요&rsquo;에서 기본 53점에 무엇이 몇 점씩 더해지고 빠졌는지 항목별로 볼 수
            있어요. 이 점수는 전통 사주의 오행·음양·합충 개념을 바탕으로 이 사이트가 정한 계산식이에요.
            "맞다/틀리다"가 있는 공식도, 관계의 좋고 나쁨을 판정하는 결과도 아니에요. 재미로 보는
            참고 점수로만 받아들여 주세요.
          </p>
        </Fold>
        <Fold title="맞춤 풀이는 어떻게 골라요?" hint="두 사람 일간 조합 100가지 · 관계 10가지 · 일지 조합">
          <p className={styles.sectionText}>
            맨 위 풀이는 내 일간과 상대 일간 조합(10×10=100가지)마다 따로 썼어요. 큰 나무(갑목)·촛불(정화)처럼 일간을
            자연의 모습에 빗대어 두 사람이 만나는 장면으로 풀었어요. 같은 두 사람이라도 내 쪽에서 볼 때와 상대 쪽에서 볼
            때 풀이가 달라요.
          </p>
          <p className={styles.sectionText}>
            사이별 궁합과 잘 맞는 점·조심할 점은 상대 일간이 나에게 어떤 관계(십신 10가지)인지로 고르고, 아랫글자 궁합은
            두 사람의 일지 조합(같은 글자·육합·반합·충)마다 따로 쓴 풀이를 보여 드려요.
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
        <Fold title="성별은 왜 묻지 않나요?" hint="어떤 두 사람이든 같은 기준으로 풀어요">
          <p className={styles.sectionText}>
            궁합 풀이는 두 사람이 태어난 날의 글자만으로 정해져서, 성별에 따라 달라지지 않아요. 그래서 성별 대신 두
            사람이 어떤 사이인지(연인·썸, 친구, 가족, 일로 만난 사이)를 고르면 그 사이의 풀이를 맨 앞에 보여 드려요.
            &lsquo;전부 보기&rsquo;를 고르면 네 가지를 모두 보여 드려요.
          </p>
        </Fold>
        <Fold title="상대방 정보도 저장되나요?" hint="아니요, 저장하지 않아요">
          <p className={styles.sectionText}>
            나의 생년월일은 "이 기기에 기억하기"를 선택한 경우에만 이 브라우저에 저장돼요.
            상대방의 생년월일은 어떤 경우에도 저장하지 않고, 이 화면에서 계산한 뒤 창을 닫으면
            사라져요.
          </p>
          <p className={styles.sectionText}>
            결과를 공유하면 받은 사람이 바로 같은 결과를 볼 수 있는데, 링크에는 생년월일이 들어가지
            않아요. 풀이를 다시 계산하는 데 쓰는 번호(두 사람의 일주, 오행 개수, 고른 사이)만 주소
            뒤에 담기고, 이 부분은 서버로 전송되지 않아요.
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
