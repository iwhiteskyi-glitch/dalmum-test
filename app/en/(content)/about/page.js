import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";

export const metadata = {
  title: "About",
  description:
    "Dalmum is a just-for-fun web app that shows how similar two faces are, part by part, from two photos. Photos are never stored on a server.",
  alternates: { canonical: "/en/about" },
};

export default function AboutPageEn() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="ABOUT"
        title="What is Dalmum?"
        lead="All you need are two photos — see how alike you are, feature by feature."
      />

      <div className={styles.prose}>
        <p>
          <strong>Dalmum</strong> lets you upload your photo alongside anyone
          you want to compare (family, friends, a partner, a celebrity, even a
          pet), and analyzes how similar your faces are, part by part. You get
          an <strong>overall similarity %</strong> along with detailed scores
          for six features: <strong>eyes, eyebrows, nose, mouth, face shape,
          and feature layout</strong>.
        </p>

        <h2>How is this different from other look-alike apps?</h2>
        <p>
          Most look-alike apps have you upload one photo and match it against
          a fixed database of celebrities, or compare two photos but only show
          a single overall number. Dalmum focuses on{" "}
          <strong>comparing two photos directly</strong> and breaking the
          result down by feature, so you can see exactly where you match and
          where you don't. The goal is to spark conversations like "our eyes
          are 87% alike, but our noses aren't."
        </p>

        <h2>How does the analysis work?</h2>
        <p>
          We find 68 landmark points on each face (corners of the eyes,
          eyelids, the line of the eyebrows, the bridge and sides of the nose,
          the outline of the lips, the curve of the jaw), then align both
          faces to the same scale and angle before comparing them feature by
          feature. The overall similarity blends a summary of the whole face
          with the average of the per-feature scores. For more detail, see{" "}
          <Link href="/en/reads/how-similarity-works">
            "How Do We Judge a Look-Alike?"
          </Link>
          .
        </p>

        <div className={`${styles.callout} ${styles.calloutYellow}`}>
          <strong>Just for fun.</strong> These scores come from comparing
          landmark positions for entertainment purposes only, and can't be
          used for facial recognition, identity verification, paternity
          testing, or any other official purpose.
        </div>

        <h2>Are my photos safe?</h2>
        <p>
          Yes. All face analysis runs <strong>entirely in your browser</strong>.
          Your photos are never sent to our servers or stored anywhere. Close
          the tab, and the photo data is gone. See our{" "}
          <Link href="/en/privacy">Privacy Policy</Link> for details.
        </p>

        <h2>Is it free?</h2>
        <p>
          Yes, Dalmum is completely free with no payment features. The
          service is funded by the ads shown on the page.
        </p>

        <Link href="/en" className={styles.primaryBtn}>
          Try Dalmum
        </Link>
      </div>

      <Link href="/en" className={styles.backLink}>
        ← Home
      </Link>
    </article>
  );
}
