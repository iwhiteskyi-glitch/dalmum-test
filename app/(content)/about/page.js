import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";
import { COUNTRIES } from "@/lib/travel/data";

export const metadata = pageMetadata({
  title: "서비스 소개",
  description:
    "재미로봄은 닮은꼴 테스트, 여행지 현지 이름 추천, 오늘의 운세·내 사주 등 '나와 우리'를 재미로 알아보는 무료 테스트 모음입니다. 사진과 입력한 정보는 저장되지 않아요.",
  path: "/about",
});

export default function AboutPage() {
  const cityCount = COUNTRIES.reduce((n, c) => n + c.cities.length, 0);

  return (
    <article className={styles.article}>
      <PageIntro
        kicker="ABOUT"
        title={`${SITE.name}은 어떤 곳인가요?`}
        lead="나와 우리를 재미로 알아보는 곳. 가볍게 해보고, 친구와 나누는 테스트 모음이에요."
      />

      <div className={styles.prose}>
        <p>
          <strong>{SITE.name}</strong>은 &lsquo;나&rsquo;와 &lsquo;우리&rsquo;를 가볍게 들여다보는
          재미용 웹서비스예요. 사진 두 장으로 얼마나 닮았는지 비교해 보고, 여행 갈 나라에서
          불릴 만한 현지 이름을 받아보는 식으로, 혼자 해도 재밌고 친구·연인·가족과 결과를
          나누면 더 재밌는 테스트를 모았어요.
        </p>
        <p>
          이름은 &ldquo;재미로 봄&rdquo;에서 왔어요. 진지한 진단이 아니라 재미로 보는 결과라는
          뜻이고, 새싹 두 잎 로고는 &lsquo;나와 우리&rsquo; 두 사람, 그리고 봄을 뜻해요.
        </p>

        <h2>어떤 코너가 있나요?</h2>

        <h3>닮았네 — 닮은꼴 테스트</h3>
        <p>
          내 사진과 비교하고 싶은 사진(가족, 친구, 연인, 연예인, 반려동물 등 무엇이든)을 나란히
          올리면, 얼굴을 부위별로 나눠 얼마나 닮았는지 알려줘요. 결과로는{" "}
          <strong>전체 닮음도 %</strong>와 함께{" "}
          <strong>눈·눈썹·코·입·얼굴형(윤곽)·이목구비 배치 비율</strong> 6개 항목의 세부 점수를
          보여줘요.
        </p>
        <p>
          기존 닮은꼴 서비스는 대부분 정해진 연예인 데이터베이스와 매칭하거나 유사도 숫자
          하나만 보여주고 끝나요. 닮았네는 <strong>두 장을 직접 비교</strong>하면서 어느 부위가
          닮았고 어느 부위가 다른지까지 나눠 보여줘서, &ldquo;우리 눈은 87% 닮았는데 코는
          별로네&rdquo; 같은 이야깃거리를 만드는 데 초점을 맞췄어요.{" "}
          <Link href="/face">닮은꼴 테스트 해보기</Link>
        </p>

        <h3>여행가면 내 이름은? — 여행지 현지 이름 추천</h3>
        <p>
          여행 갈 나라와 도시를 고르고 원하는 분위기를 알려주면, 그 나라 감성의 이름 3개를
          캐릭터 카드와 함께 추천해 줘요. 지금은 <strong>{COUNTRIES.length}개 나라{" "}
          {cityCount}개 도시</strong>를 고를 수 있고, 이름마다 현지 발음과 뜻을 함께 알려줘요.
          동행자를 최대 4명까지 추가하면 일행 모두의 이름 카드와 단체 카드도 만들 수 있어요.
        </p>
        <p>
          나라·도시 페이지에는 꼭 알아둘 현지 인사말과 발음, 도시별 대표 명소와 음식도
          정리해 두어서, 이름 추천을 하지 않아도 여행 준비용으로 읽어볼 수 있어요.{" "}
          <Link href="/travel">여행 이름 받아보기</Link>
        </p>

        <h3>오늘의 운세·내 사주 — 생년월일로 보는 사주 팔자</h3>
        <p>
          생년월일(양력·음력 모두 가능)과 태어난 시간(선택)을 넣으면, 사주 팔자 여덟
          글자와 나를 뜻하는 일간을 찾아 오늘의 운세와 내 사주를 풀어 줘요.{" "}
          <strong>오늘의 운세</strong>는 내 일간과 오늘 일진의 관계로 날마다 새로 나오고,{" "}
          <strong>내 사주</strong>에서는 여덟 글자와 오행 분포, 일간의 성격 풀이를 더 자세히
          볼 수 있어요.
        </p>
        <p>
          절기(입춘 등) 기준의 연·월주 전환, 한국천문연구원 기준 음력 변환, 시대별 표준시와
          서머타임 보정 같은 전통 만세력 계산 원리를 그대로 구현했고, 사주·운세 관련
          읽을거리도 함께 제공해요.{" "}
          <Link href="/fortune">오늘의 운세 보기</Link>
        </p>

        <h2>결과는 어떻게 만들어지나요?</h2>
        <p>
          <strong>닮은꼴 테스트</strong>는 사진에서 얼굴의 특징점(눈꼬리, 콧방울, 입꼬리, 턱선
          등 68개 지점)을 찾아, 두 얼굴의 크기·각도를 맞춘 뒤 부위별로 생김새를 비교해요. 더
          자세한 원리는{" "}
          <Link href="/reads/how-similarity-works">&ldquo;닮은꼴은 어떻게 판단할까?&rdquo;</Link>{" "}
          글에서 설명해요.
        </p>
        <p>
          <strong>여행 이름</strong>의 뜻과 발음, 인사말, 명소·음식 정보는 실제 정보를 바탕으로
          정리했고, 여러 차례 교차 확인을 거쳐 확실하지 않은 내용은 넣지 않았어요. 다만
          &lsquo;멋짐&rsquo;, &lsquo;귀여움&rsquo; 같은 분위기 설명과 어떤 이름이 추천되는지는
          재미로 붙인 해석이에요.
        </p>
        <p>
          <strong>오늘의 운세·내 사주</strong>는 생년월일로 계산한 사주 팔자(천간·지지
          여덟 글자)를 바탕으로, 내 일간과 오늘 일진의 오행·음양 관계(십신)에 맞춘 풀이를
          보여줘요. 절기·음력 변환·시대별 표준시 같은 계산 과정은 여러 차례 교차 검증을
          거쳤지만, 풀이 자체는 전통 명리학의 해석을 바탕으로 한 재미 콘텐츠예요.
        </p>

        <div className={`${styles.callout} ${styles.calloutYellow}`}>
          <strong>재미로만 봐주세요.</strong> {SITE.name}의 모든 점수와 추천은 재미용 결과이며,
          정밀한 얼굴 인식·신원 확인·친자 판별이나 실제 작명 등 어떤 공식적인 용도로도 쓸 수
          없어요.
        </div>

        <h2>내 사진과 정보는 안전한가요?</h2>
        <p>
          네. 얼굴 분석, 이름 추천, 사주 계산 모두 <strong>여러분의 브라우저 안에서만</strong>{" "}
          실행돼요. 업로드한 사진이나 입력한 닉네임, 생년월일은 서버로 전송되지 않고,
          어디에도 저장되지 않아요. 창을 닫으면 함께 사라져요. 운세 기능의 "이 기기에
          기억하기"처럼 직접 켠 경우에만 이 브라우저에 정보가 남아요. 자세한 내용은{" "}
          <Link href="/privacy">개인정보처리방침</Link>을 확인하세요.
        </p>

        <h2>이용 요금이 있나요?</h2>
        <p>
          없어요. {SITE.name}은 전부 무료이며, 별도의 결제 기능이 없어요. 서비스 운영비는
          페이지에 표시되는 광고로 충당해요.
        </p>

        <h2>궁금한 점이 있다면</h2>
        <p>
          자주 받는 질문은 <Link href="/faq">자주 묻는 질문</Link>에 모아 두었어요. 그 밖의
          문의나 오류 제보는 <Link href="/contact">문의하기</Link>로 보내주세요. 재미로봄을 만든
          사람이 궁금하다면 <Link href="/maker">만든 사람</Link> 페이지도 있어요.
        </p>

        <Link href="/" className={styles.primaryBtn}>
          {SITE.name} 둘러보기
        </Link>
      </div>

      <Link href="/" className={styles.backLink}>
        ← 홈으로
      </Link>
    </article>
  );
}
