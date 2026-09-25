import Link from "next/link";
import styles from "@/components/travel/travel.module.css";
import Avatar from "@/components/travel/Avatar";
import CountryPicker from "@/components/travel/CountryPicker";
import { COUNTRIES } from "@/lib/travel/data";
import { travelMetadata } from "@/lib/travel/seo";

export const metadata = travelMetadata({
  title: "여행가면 내 이름은? | 여행지별 현지식 이름 추천",
  description:
    "여행 갈 나라와 도시를 고르고 내 분위기를 알려주면, 그 나라 감성 이름 3개를 캐릭터와 함께 추천해드려요. 현지 인사말·명소·음식 정보도 함께 확인하세요.",
  path: "/travel",
});

const HERO_AVATAR = {
  skin: "#FFE1C4",
  hairColor: "#5A3E2B",
  blush: "#FFB3C6",
  hair: "bob",
  expression: "smile",
  accessory: "strawhat",
};

export default function TravelHome() {
  const countries = COUNTRIES.map((c) => ({
    code: c.code,
    name: c.name,
    cities: c.cities.map(({ city_code, city_name }) => ({ city_code, city_name })),
  }));

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.postcard}>
          <span className={styles.stamp} aria-hidden="true">
            ✈
          </span>
          <Avatar avatar={HERO_AVATAR} size={120} />
          <p className={styles.postcardCaption}>POSTCARD · MY TRAVEL NAME</p>
        </div>
        <h1 className={`${styles.display} ${styles.heroTitle}`}>여행가면 내 이름은?</h1>
        <p className={styles.lead} style={{ textWrap: "balance" }}>
          여행지를 고르고 내 분위기를 알려주면 그 나라 감성 이름 3개를 캐릭터와 함께 추천해드려요
        </p>
        <p className={styles.heroNote}>사진 없이도 OK · 1분이면 충분해요</p>
      </section>

      <section className={styles.section} aria-labelledby="pick-country">
        <h2 id="pick-country" className={styles.sectionTitle}>
          어디로 떠나볼까요?
        </h2>
        <p className={styles.sectionLead}>나라를 고르면 도시 목록과 현지 인사말을 볼 수 있어요.</p>
        <CountryPicker countries={countries} />
      </section>

      <section className={styles.section} aria-labelledby="how">
        <h2 id="how" className={styles.sectionTitle}>
          이렇게 진행돼요
        </h2>
        <ol className={styles.steps3}>
          <li>
            <strong>1. 여행지 고르기</strong>
            나라와 도시를 선택해요
          </li>
          <li>
            <strong>2. 내 분위기 알려주기</strong>
            닉네임, 이름 스타일, 원하는 분위기 (동행자도 함께)
          </li>
          <li>
            <strong>3. 이름 카드 받기</strong>
            마음에 드는 이름으로 여행 카드 완성
          </li>
        </ol>
        <p className={styles.callout}>
          이름의 뜻과 발음, 명소·음식 정보는 실제 정보를 바탕으로 정리했어요. &lsquo;멋짐&rsquo;,
          &lsquo;귀여움&rsquo; 같은 분위기 설명은 재미로 붙인 해석이에요. 입력한 닉네임과 선택
          내용은 서버에 저장되지 않고 브라우저 안에서만 쓰여요.
        </p>
      </section>

      <section className={styles.section}>
        <Link href="/" className={styles.crossCard}>
          <span>
            <strong>우리 얼마나 닮았을까?</strong>
            <span>사진 두 장으로 보는 닮은꼴 테스트도 해보세요</span>
          </span>
          <span className={styles.crossArrow} aria-hidden="true">
            →
          </span>
        </Link>
      </section>
    </>
  );
}
