import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import styles from "@/components/site.module.css";

export const metadata = {
  title: "Guide",
  description:
    "How to use Dalmum and how to pick photos for better accuracy. Upload two photos (auto face detection) → check your results → share on social media.",
  alternates: { canonical: "/en/guide" },
};

export default function GuidePageEn() {
  return (
    <article className={styles.article}>
      <PageIntro
        kicker="GUIDE"
        title="How to use Dalmum"
        lead="It only takes two photos and 30 seconds. Follow the steps below."
      />

      <div className={styles.prose}>
        <h2>1. Upload two photos — faces are found automatically</h2>
        <p>
          On the first screen, upload <strong>your photo</strong> and the{" "}
          <strong>photo to compare</strong>. Click a box to choose a file, or
          drag and drop a photo onto it. Once uploaded,{" "}
          <strong>the face is found automatically and fitted into the dotted
          circle</strong> — most of the time you can proceed right away.
        </p>
        <p>
          If a photo has <strong>multiple people in it</strong>, every face we
          detect shows up as a small round thumbnail. Tap the one you want to
          compare, and we'll re-fit the circle to that person.
        </p>

        <h2>2. (Optional) Adjust the position yourself</h2>
        <p>
          If the automatic fit isn't quite right, you can adjust it manually.
          Zoom with the slider, and move the photo by{" "}
          <strong>dragging with your mouse on desktop</strong> or{" "}
          <strong>dragging with two fingers on mobile</strong> (one finger
          still scrolls the page normally). Uploaded the wrong photo? Remove
          it with the <strong>✕ button</strong> in the top corner and upload
          again.
        </p>
        <p>
          Once both photos are ready, the <strong>Start</strong> button
          becomes active.
        </p>

        <h2>3. Check your results</h2>
        <p>
          After a short loading screen that checks six features one by one
          (eyes, eyebrows, nose, mouth, face shape, feature layout), you'll
          see your <strong>overall similarity %</strong>, a score for each
          feature, and side-by-side cropped comparison images. The feature
          you match best gets a 🏆 badge.
        </p>

        <h2>4. Save or share</h2>
        <p>
          Tap <strong>Save</strong> below your results to download everything
          as a single image. Tap <strong>Share</strong> to send it straight to
          a messaging app or social media (on some browsers this falls back to
          saving the image and copying the link instead). Want to try again?
          Use <strong>Compare different photos</strong> to start over.
        </p>

        <hr />

        <h2>Tips for better accuracy</h2>
        <ul>
          <li>
            <strong>Use a front-facing photo.</strong> A turned head or
            profile view can make it hard to detect features correctly.
          </li>
          <li>
            <strong>Make sure the face is reasonably large</strong> in the
            frame. A tiny face in a full-body photo lowers detection accuracy.
          </li>
          <li>
            <strong>Use a bright, clear photo.</strong> Dark or blurry photos
            give inconsistent results.
          </li>
          <li>
            <strong>Avoid sunglasses or masks.</strong> If the eyes, nose, or
            mouth are covered, that feature's score becomes meaningless.
          </li>
          <li>
            <strong>Match the expressions</strong> in both photos (both
            neutral, or both smiling) for more stable mouth and eye scores.
          </li>
        </ul>

        <div className={styles.callout}>
          If you see "We couldn't find a face," try a different photo that
          matches the tips above. A clearer, more front-facing face gives
          better results.
        </div>

        <Link href="/en" className={styles.primaryBtn}>
          Try it now
        </Link>
      </div>

      <Link href="/en" className={styles.backLink}>
        ← Home
      </Link>
    </article>
  );
}
