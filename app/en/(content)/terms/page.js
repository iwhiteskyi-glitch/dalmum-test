import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Terms of Service",
  description:
    "Dalmum Terms of Service — the Service is for entertainment purposes and does not guarantee the accuracy of its results. Uploading someone else's photo is the user's own responsibility.",
  alternates: { canonical: "/en/terms" },
};

const SECTIONS_EN = [
  {
    h: "Article 1 (Purpose)",
    p: [
      `These Terms govern the conditions and procedures for using ${SITE.name} (the "Service"), and the rights, obligations, and responsibilities of users and the Service operator.`,
    ],
  },
  {
    h: "Article 2 (Nature of the Service)",
    p: [
      "The Service compares facial features from two images uploaded by the user and displays per-feature and overall similarity as percentages.",
      "All scores and text provided by the Service are for entertainment purposes only and carry no scientific, medical, or legal accuracy. Users must not use the results as a basis for identity verification, paternity determination, hiring or evaluation decisions, or any other official or substantive judgment.",
    ],
  },
  {
    h: "Article 3 (Fees)",
    p: [
      "The Service is provided free of charge. There is no paid payment feature; operating costs are covered by ads displayed on the page.",
    ],
  },
  {
    h: "Article 4 (Image uploads and user responsibility)",
    p: [
      "Users may only upload images they have a lawful right to use.",
      "Any legal liability arising from uploading another person's photo (including public figures such as celebrities) or from publishing/distributing the result — including portrait rights, copyright, defamation, or privacy violations — rests solely with the user who uploaded or posted it.",
      "The Service does not provide its own database of any specific individual's photos and does not verify the source or rights of any uploaded image.",
    ],
  },
  {
    h: "Article 5 (Prohibited conduct)",
    p: ["Users must not do any of the following:"],
    list: [
      "Upload images that infringe on others' rights or violate applicable law",
      "Use the Service inappropriately involving minors, or for sexual, violent, or hateful purposes",
      "Use automated means to place excessive load on the Service or interfere with its normal operation",
      "Copy, modify, or commercially redistribute the Service's source code or components without authorization",
    ],
  },
  {
    h: "Article 6 (Disclaimer)",
    p: [
      "The Service does not guarantee the accuracy or reliability of its results and is not liable for any damages arising from decisions or actions users take based on trusting those results.",
      "The Service is not liable for interruptions caused by events beyond the operator's reasonable control, including natural disasters, power outages, hosting or network failures, or issues with third-party services (such as ads).",
      "The Service may change or discontinue all or part of itself after prior notice.",
    ],
  },
  {
    h: "Article 7 (Advertising)",
    p: [
      "The Service may display third-party ads, including Google AdSense, within its pages. Any transaction regarding products or services in ad areas occurs between the user and the advertiser, and the Service bears no responsibility for such transactions.",
    ],
  },
  {
    h: "Article 8 (Intellectual property)",
    p: [
      "Rights to the Service's design, text, and logic belong to the Service operator. Rights to images uploaded by users belong to the user (or the original rights holder), and the Service does not store or otherwise use them separately.",
    ],
  },
  {
    h: "Article 9 (Protection of personal information)",
    p: [
      "Matters concerning the handling of users' personal information are governed by a separate Privacy Policy. Uploaded photos are never sent to or stored on a server and are processed only in the user's browser.",
    ],
  },
  {
    h: "Article 10 (Changes to these Terms and governing law)",
    p: [
      "These Terms may be changed within the bounds of applicable law, and any changes will be announced on this page. Changed Terms take effect from the time they are announced.",
      "These Terms and the use of the Service are governed by the laws of the Republic of Korea, and any disputes shall be brought before a court of competent jurisdiction under the Civil Procedure Act.",
    ],
  },
];

export default function TermsPageEn() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="TERMS"
        title="Terms of Service"
        meta={`Effective date: ${SITE.effectiveDate}`}
      />

      <div className={styles.prose}>
        <div className={`${styles.callout} ${styles.calloutYellow}`}>
          <strong>Please note.</strong> Results from this Service are{" "}
          <strong>for entertainment purposes only</strong> and accuracy is not
          guaranteed. Any issues from uploading someone else's photo are the
          uploader's own responsibility.
        </div>

        {SECTIONS_EN.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            {s.list ? (
              <ul>
                {s.list.map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <Link href="/en" className={styles.backLink}>
        ← Home
      </Link>
    </article>
  );
}
