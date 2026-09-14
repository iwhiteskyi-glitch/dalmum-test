import Link from "next/link";
import ReadArticleEn, { readMetadataEn } from "@/components/ReadArticleEn";

const SLUG = "how-similarity-works";
export const metadata = readMetadataEn(SLUG);

export default function PageEn() {
  return (
    <ReadArticleEn slug={SLUG}>
      <p>
        "Looking alike" feels different to everyone, and it's hard to put into
        words. So how does a computer turn that into a number like "your eyes
        are 82% alike"? Here's how Dalmum does it, in plain language.
      </p>

      <h2>Step 1: Find the "dots" on each face</h2>
      <p>
        First, we locate points at fixed positions on the face in the photo:
        the corners of the eyes, the top and bottom of the eyelids, the line
        of the eyebrows, the bridge and sides of the nose, the outline of the
        lips, the curve of the jaw — 68 points in total. These are called{" "}
        <strong>landmarks</strong>. Essentially, a face's shape can be
        summarized by where these points fall.
      </p>

      <h2>Step 2: Align both faces to the same size and angle</h2>
      <p>
        Every photo has a different face size, and heads are often tilted
        slightly. Comparing photos as-is would compare "how the photo was
        taken" rather than "how alike the faces are." So we scale both faces
        using the distance between the eyes as a reference, and rotate them so
        the line between the eyes is level — aligning both faces to{" "}
        <strong>the same conditions</strong>.
      </p>

      <h2>Step 3: Compare each feature</h2>
      <p>
        The aligned points are grouped by feature, and each feature's shape is
        turned into numbers. For the eyes, that might be width, height, and
        whether the outer corners tilt up or down. Comparing the same measure
        between two faces gives a high score for a small difference and a low
        score for a big one. This is how the six categories — eyes, eyebrows,
        nose, mouth, face shape, and feature layout — are calculated.
      </p>

      <h2>Step 4: Calculate the overall similarity</h2>
      <p>
        The overall score blends two things: the distance between two
        "fingerprint-like" summaries of the whole face (closer means more
        alike), and the average of the per-feature scores you just saw. These
        are combined into a single percentage.
      </p>

      <hr />

      <h2>So, should I trust this number?</h2>
      <p>
        <strong>Treat it as fun only.</strong> Since this method only looks at
        a few dozen points, it can't capture things like a shared "vibe" that
        people notice. Scores also shift with expression and angle, even for
        the same person. Places where faces are actually used to verify
        identity (security access, ID checks, etc.) use far more sophisticated
        and validated technology — an entirely different domain from a
        look-alike test.
      </p>
      <p>
        For more consistent results, check out{" "}
        <Link href="/en/reads/photo-tips">how to pick a good photo</Link>.
      </p>
    </ReadArticleEn>
  );
}
