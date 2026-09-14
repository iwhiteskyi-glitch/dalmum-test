import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: "Questions about Dalmum, bug reports, or privacy requests — reach us by email.",
  alternates: { canonical: "/en/contact" },
};

export default function ContactPageEn() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="CONTACT"
        title="Contact"
        lead="For questions about the service, bug reports, or privacy requests, please email us below."
      />

      <div className={styles.prose}>
        <h2>Email</h2>
        <p>
          <a href={`mailto:${SITE.contactEmail}`} style={{ fontSize: 18 }}>
            {SITE.contactEmail}
          </a>
        </p>
        <p>
          We usually reply within 2-3 days. Including the following helps us
          respond faster:
        </p>
        <ul>
          <li>What happened (e.g., "the Save button didn't work on the results screen")</li>
          <li>Your device and browser (e.g., iPhone Safari, Windows Chrome)</li>
          <li>A screenshot, if possible</li>
        </ul>

        <div className={styles.callout}>
          Please <strong>don't attach any face photos</strong> to your message.
          We don't store photos, and we don't need the original image to
          investigate an issue.
        </div>

        <h2>Common questions</h2>
        <p>
          Before reaching out, check the <Link href="/en/faq">FAQ</Link> —
          most questions are already answered there.
        </p>
      </div>

      <Link href="/en" className={styles.backLink}>
        ← Home
      </Link>
    </article>
  );
}
