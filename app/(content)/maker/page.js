import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "만든 사람",
  description:
    "재미로봄을 만든 KN을 소개합니다. 직접 만든 앱 '맛집기록', 웹사이트 '쇼핑 피팅 매니저', 유튜브 '너머를 보다'와 블로그 등 다른 곳에서도 만나보세요.",
  path: "/maker",
});

// 운영자의 다른 채널·작품. ready: false 인 항목은 아직 화면에 보이지 않습니다.
// (예: 안드로이드 앱이 나오면 links에 추가.)
const WORKS = [
  {
    key: "app-matjip",
    kind: "앱",
    title: "맛집기록",
    desc: "다녀온 식당에서 먹은 음식을 사진·별점·한 줄 메모로 남기는 나만의 맛집 다이어리예요. 가게를 검색하면 정보가 자동으로 등록되고, 내가 기록한 맛집을 지도에서 모아볼 수 있어요.",
    meta: "무료 (앱 내 구입 있음)",
    links: [
      { label: "App Store에서 보기", href: "https://apps.apple.com/kr/app/%EB%A7%9B%EC%A7%91%EA%B8%B0%EB%A1%9D/id6814456432" },
    ],
    ready: true,
  },
  {
    key: "web-fitting",
    kind: "웹사이트",
    title: "쇼핑 피팅 매니저",
    desc: "쇼핑하다 찜한 옷 사진을 모아 AI가 내 체형 마네킹에 입혀 주는 가상 피팅 서비스예요. 여러 쇼핑몰 옷을 섞어 코디를 미리 보고, 산 옷은 내 옷으로 모아 둘 수 있어요.",
    meta: "무료로 시작 (로그인, AI 입혀보기는 코인 사용) · 재미로봄과는 별도로 운영하는 사이트예요",
    links: [{ label: "사이트 보러 가기", href: "https://www.fittingmanager.com/" }],
    ready: true,
  },
  {
    key: "blog",
    kind: "블로그",
    title: "KN님의 블로그",
    desc: "직접 만든 웹사이트와 앱의 사용법, 만들면서 생긴 이야기를 정리하는 네이버 블로그예요.",
    links: [{ label: "블로그 보러 가기", href: "https://blog.naver.com/kncho0715" }],
    ready: true,
  },
  {
    key: "youtube",
    kind: "유튜브",
    title: "너머를 보다",
    desc: "아름다운 장면 너머의 과학을 차분히 알아보는 과학 교양 채널이에요. 우주·공룡·바다·일상 속 자연현상에서 질문 하나를 찾아 그 이유를 풀어 봐요.",
    meta: "월 우주 · 수 공룡 · 금 바다 · 일 자연",
    links: [{ label: "유튜브 채널 보기", href: "https://www.youtube.com/channel/UC2sFQ9wYDxyJp9zDSFB7QNA" }],
    ready: true,
  },
];

export default function MakerPage() {
  const works = WORKS.filter((w) => w.ready);

  return (
    <article className={styles.article}>
      <PageIntro
        kicker="MAKER"
        title="만든 사람"
        lead={`${SITE.name}은 한 사람이 직접 기획하고 만드는 개인 사이트예요.`}
      />

      <div className={styles.prose}>
        <p>
          안녕하세요, {SITE.name}을 만든 <strong>KN</strong>이에요. 소소하게 웹사이트와 앱을
          만들고 있어요. {SITE.name}은 기획부터 디자인, 개발, 운영까지 혼자 하고 있는
          사이트예요.
        </p>
        <p>
          {SITE.name}을 만들면서 세 가지를 지키려고 해요. 결과는 어디까지나 재미로 볼 것,
          사진과 입력한 정보는 저장하지 않을 것, 누구나 무료로 쓸 수 있을 것. 자세한 내용은{" "}
          <Link href="/about">서비스 소개</Link>와 <Link href="/privacy">개인정보처리방침</Link>에
          적어 두었어요.
        </p>

        <h2>다른 곳에서도 만나요</h2>
      </div>

      <div className={styles.cardList}>
        {works.map((w) => (
          <section key={w.key} className={styles.workCard} aria-labelledby={`work-${w.key}`}>
            <p className={styles.readCardCorner}>{w.kind}</p>
            <h3 id={`work-${w.key}`} className={styles.readCardTitle}>
              {w.title}
            </h3>
            <p className={styles.readCardDesc}>{w.desc}</p>
            {w.meta ? <p className={styles.workMeta}>{w.meta}</p> : null}
            <div className={styles.workLinks}>
              {w.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label} ↗
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className={styles.prose}>
        <h2>의견 보내기</h2>
        <p>
          {SITE.name}에 바라는 점, 오류 제보, 함께 해보고 싶은 아이디어가 있다면{" "}
          <Link href="/contact">문의하기</Link>로 보내주세요. 보내주신 의견은 다음 코너를 만들 때
          참고할게요.
        </p>
      </div>

      <Link href="/" className={styles.backLink}>
        ← 홈으로
      </Link>
    </article>
  );
}
