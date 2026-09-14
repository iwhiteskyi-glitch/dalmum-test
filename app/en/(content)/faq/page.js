import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Dalmum — Is it accurate? Are photos stored? Can I compare pets? and more.",
  alternates: { canonical: "/en/faq" },
};

const FAQ_EN = [
  {
    q: "Is the result accurate?",
    a: [
      "It's not a precise analysis. Dalmum scores similarity by comparing a few dozen facial landmark points (positions of the eyes, nose, mouth, jawline, etc.) — it's meant to be fun, not scientific.",
      "Even for the same person, scores can vary with angle, expression, and lighting. It should never be used for serious purposes like identity verification or paternity testing.",
    ],
  },
  {
    q: "Are my photos stored on a server?",
    a: [
      "No. Face analysis runs entirely inside your browser (phone or PC). Uploaded photos are never sent to our servers and are never stored anywhere.",
      "The photo data disappears once you leave the results screen or close the tab. See our Privacy Policy for details.",
    ],
  },
  {
    q: "Can I upload a photo of a celebrity or someone else?",
    a: [
      "Technically yes, but any issues around image rights or copyright from uploading someone else's photo are the uploader's own responsibility. Please be especially careful if you post the result publicly. See our Terms of Service for details.",
    ],
  },
  {
    q: "Can I compare pets or babies?",
    a: [
      "You can try it if the subject is detected as a face. That said, our face detection is tuned for front-facing human faces, so animals or side profiles may show \"We couldn't find a face.\"",
    ],
  },
  {
    q: "It says \"We couldn't find a face.\"",
    a: [
      "Try again with a bright, clear, front-facing photo where the face isn't too small. This usually happens when sunglasses or a mask cover the eyes/nose/mouth, or when the head is turned significantly.",
    ],
  },
  {
    q: "My photo has multiple people in it — what do I do?",
    a: [
      "Once uploaded, every face we detect appears as a small round thumbnail. Tap the person you want to compare, and we'll automatically fit the circle to that face.",
    ],
  },
  {
    q: "Is there a fee to use it?",
    a: [
      "It's completely free. There's no payment feature at all. The service is funded by the ads shown on the page.",
    ],
  },
  {
    q: "How do I save or share my result?",
    a: [
      "Tap the \"Save\" button below your results to download everything as a single image. \"Share\" opens your messaging/social share sheet (on some browsers this falls back to saving the image and copying the link instead).",
    ],
  },
  {
    q: "My results are slightly different each time.",
    a: [
      "Re-running the exact same two photos gives the same result. Scores change if you swap photos or the face position changes.",
    ],
  },
  {
    q: "How do I contact you?",
    a: [`Please reach out via the email on the Contact page (${SITE.contactEmail}).`],
  },
];

export default function FaqPageEn() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_EN.map((item) => ({
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
        title="Frequently Asked Questions"
        lead="The most common questions, in one place. Don't see yours? Reach out via Contact."
      />

      <div>
        {FAQ_EN.map((item) => (
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

      <Link href="/en" className={styles.backLink}>
        ← Home
      </Link>
    </article>
  );
}
