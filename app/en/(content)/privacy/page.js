import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Dalmum Privacy Policy — uploaded photos are never sent to or stored on a server; they are processed entirely in your browser.",
  alternates: { canonical: "/en/privacy" },
};

export default function PrivacyPageEn() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="PRIVACY"
        title="Privacy Policy"
        meta={`Effective date: ${SITE.effectiveDate}`}
      />

      <div className={styles.prose}>
        <p>
          Dalmum (the "Service") takes your privacy seriously and processes
          personal information as described below, in accordance with
          applicable law.
        </p>

        <div className={`${styles.callout} ${styles.calloutYellow}`}>
          <strong>Quick summary</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            <li>Uploaded photos are never sent to a server — they're analyzed only in your browser.</li>
            <li>Photos are not stored anywhere and disappear once you close the tab.</li>
            <li>Access logs and cookies (including for ads) are used to operate the Service.</li>
          </ul>
        </div>

        <h2>1. Handling of photos (images)</h2>
        <p>
          Photos you upload are used for face analysis <strong>only on your
          own device (in your browser)</strong>. Neither the photo file nor
          any data derived from it is sent to, stored by, logged by, or
          shared through the Service's servers. Once you leave the page or
          close the browser tab, the related data is cleared from memory. If
          you "save" a result image, that file is saved only to your own
          device.
        </p>

        <h2>2. Information collected automatically</h2>
        <p>The following information may be generated and collected automatically when you access the Service:</p>
        <ul>
          <li>Access logs: access time, browser type, device information, referrer URL, etc.</li>
          <li>Cookies and similar technologies: identifiers used for usage statistics and ad delivery</li>
        </ul>
        <p>
          This information is used solely to operate the Service reliably,
          diagnose errors, understand usage patterns, and serve ads.
        </p>

        <h2>3. Advertising and third-party services</h2>
        <p>
          The Service displays <strong>Google AdSense</strong> ads to cover
          operating costs. Google and other third-party ad providers may use
          cookies to serve personalized ads based on your prior visits.
        </p>
        <ul>
          <li>
            You can opt out of personalized ads via{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>
            .
          </li>
          <li>
            To opt out of third-party ad cookies more broadly, you can use{" "}
            <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer">
              aboutads.info
            </a>
            .
          </li>
          <li>
            See{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
              Google's Privacy Policy
            </a>{" "}
            for how Google handles data.
          </li>
        </ul>
        <p>
          The Service also uses a cloud hosting provider (e.g., Vercel) to
          host the website, and information such as your IP address may be
          recorded in that provider's server logs when you access the site.
        </p>

        <h2>4. Retention period</h2>
        <p>
          Uploaded photos are not retained, since they are never stored.
          Automatically collected access logs and statistics/ad-related data
          are retained for periods set by applicable law and each
          third-party service's own policy, after which they are deleted.
        </p>

        <h2>5. Your rights</h2>
        <p>
          You can refuse or delete cookies through your browser settings.
          Note that blocking cookies may limit some features or ad delivery.
          Inquiries or objections regarding personal information can be
          submitted via the contact details below.
        </p>

        <h2>6. Children's privacy</h2>
        <p>
          The Service is not primarily directed at children under 14 and does
          not knowingly collect personal information from children. Parents
          and guardians should ensure children do not upload photos without
          appropriate consent.
        </p>

        <h2>7. Contact for privacy inquiries</h2>
        <ul>
          <li>Email: {SITE.contactEmail}</li>
          <li>
            How to reach us: see the <Link href="/en/contact">Contact</Link> page
          </li>
        </ul>

        <h2>8. Changes to this policy</h2>
        <p>
          This Privacy Policy may be updated to reflect changes in law or the
          Service, and any changes will be announced on this page. Material
          changes will be highlighted clearly before they take effect.
        </p>
      </div>

      <Link href="/en" className={styles.backLink}>
        ← Home
      </Link>
    </article>
  );
}
