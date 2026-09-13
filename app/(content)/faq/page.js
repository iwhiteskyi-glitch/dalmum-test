import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "자주 묻는 질문",
  description:
    "닮음테스트에 대해 자주 묻는 질문 모음 — 결과가 정확한가요? 사진이 저장되나요? 반려동물도 되나요? 등",
  alternates: { canonical: "/faq" },
};

const FAQ = [
  {
    q: "결과가 정확한가요?",
    a: [
      "정밀한 분석이 아닙니다. 닮음테스트는 얼굴 특징점(눈·코·입·턱선 등의 위치) 몇십 개를 비교해 점수를 매기는 방식으로, 재미로 즐기기 위한 서비스입니다.",
      "같은 사람이라도 사진의 각도·표정·조명에 따라 점수가 달라질 수 있습니다. 신원 확인이나 친자 확인 등 진지한 목적으로는 절대 사용할 수 없습니다.",
    ],
  },
  {
    q: "제 사진이 서버에 저장되나요?",
    a: [
      "아니요. 얼굴 분석은 여러분의 브라우저(스마트폰·PC) 안에서만 실행됩니다. 업로드한 사진은 우리 서버로 전송되지 않으며, 어디에도 저장하지 않습니다.",
      "결과 화면을 벗어나거나 창을 닫으면 사진 데이터도 사라집니다. 자세한 내용은 개인정보처리방침을 확인하세요.",
    ],
  },
  {
    q: "연예인이나 다른 사람 사진을 올려도 되나요?",
    a: [
      "기술적으로는 가능하지만, 타인의 사진을 올려 생기는 초상권·저작권 등의 문제는 업로드한 이용자 본인의 책임입니다. 공개적으로 결과를 게시할 때는 특히 주의해 주세요. 자세한 내용은 이용약관에 안내되어 있습니다.",
    ],
  },
  {
    q: "반려동물이나 아기도 비교할 수 있나요?",
    a: [
      "얼굴로 인식되는 형태라면 시도해 볼 수 있습니다. 다만 이 서비스의 얼굴 인식은 사람의 정면 얼굴에 맞춰져 있어, 동물이나 옆모습은 '얼굴을 찾지 못했어요'라고 나올 수 있습니다.",
    ],
  },
  {
    q: "\"얼굴을 찾지 못했어요\"라고 나옵니다.",
    a: [
      "얼굴이 정면으로, 너무 작지 않게 나온 밝고 선명한 사진으로 다시 시도해 주세요. 선글라스·마스크로 눈·코·입이 가려졌거나, 고개가 많이 돌아간 사진에서 자주 발생합니다.",
    ],
  },
  {
    q: "사진에 여러 명이 같이 나왔는데 어떻게 하나요?",
    a: [
      "사진을 올리면 감지된 얼굴들이 작은 동그란 사진(썸네일)으로 나열됩니다. 그중 비교하고 싶은 사람을 누르면 그 얼굴을 기준으로 자동으로 맞춰줍니다.",
    ],
  },
  {
    q: "이용 요금이 있나요?",
    a: [
      "전부 무료입니다. 결제 기능이 없습니다. 서비스 운영비는 페이지에 표시되는 광고로 충당합니다.",
    ],
  },
  {
    q: "결과를 어떻게 저장하거나 공유하나요?",
    a: [
      "결과 화면 아래의 '저장' 버튼을 누르면 결과가 이미지 한 장으로 만들어져 내려받아집니다. '공유하기' 버튼은 메신저·SNS 공유 창을 띄웁니다(일부 브라우저에서는 이미지 저장과 링크 복사로 대체됩니다).",
    ],
  },
  {
    q: "결과가 매번 조금씩 다릅니다.",
    a: [
      "같은 사진 두 장을 그대로 다시 넣으면 결과는 동일합니다. 사진을 바꾸거나 얼굴 위치가 달라지면 점수도 달라집니다.",
    ],
  },
  {
    q: "문의는 어디로 하나요?",
    a: [`문의하기 페이지의 이메일(${SITE.contactEmail})로 연락해 주세요.`],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a.join(" ") },
    })),
  };

  return (
    <article className={styles.article}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageIntro
        kicker="FAQ"
        title="자주 묻는 질문"
        lead="가장 많이 묻는 내용을 모았습니다. 여기 없는 질문은 문의하기로 보내주세요."
      />

      <div>
        {FAQ.map((item) => (
          <div key={item.q} className={styles.qa}>
            <p className={styles.qaQ}>Q. {item.q}</p>
            <div className={styles.qaA}>
              {item.a.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Link href="/" className={styles.backLink}>
        ← 홈으로
      </Link>
    </article>
  );
}
