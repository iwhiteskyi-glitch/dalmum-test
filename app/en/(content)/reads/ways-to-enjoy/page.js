import Link from "next/link";
import ReadArticleEn, { readMetadataEn } from "@/components/ReadArticleEn";

const SLUG = "ways-to-enjoy";
export const metadata = readMetadataEn(SLUG);

export default function PageEn() {
  return (
    <ReadArticleEn slug={SLUG}>
      <p>
        Dalmum doesn't care who — or what — you compare. It doesn't even need
        to be a person, and an unlikely pairing is fine too. Unexpected
        results are actually the most fun. Here are some combinations people
        try a lot.
      </p>

      <h2>Family look-alike test</h2>
      <ul>
        <li>
          <strong>Parent vs. child</strong> — See who takes after whom with
          eye, nose, and mouth scores. A great conversation starter when the
          whole family takes turns over the holidays.
        </li>
        <li>
          <strong>Siblings</strong> — Comparing childhood photos to now is fun
          too.
        </li>
        <li>
          <strong>You as a kid vs. you now</strong> — See how much has stayed
          the same, and what's changed.
        </li>
      </ul>

      <h2>Couple look-alike test</h2>
      <ul>
        <li>
          <strong>Couples</strong> — Put the saying "couples start to look
          alike" to the test with an actual score.
        </li>
        <li>
          <strong>Friends</strong> — Check the real score against a friend
          you're often told you look alike with.
        </li>
      </ul>

      <h2>Combinations just for fun</h2>
      <ul>
        <li>
          <strong>You vs. a celebrity look-alike</strong> — Compare yourself
          to a celebrity you're often said to resemble. (If you post the
          result publicly, remember that image rights are your own
          responsibility — see our{" "}
          <Link href="/en/terms">Terms of Service</Link>.)
        </li>
        <li>
          <strong>Pet look-alike test</strong> — Compare yourself with your
          pet. Face detection may or may not work, but when it does, the
          result is hilarious.
        </li>
        <li>
          <strong>Couple → imagining a future kid</strong> — Compare two
          people and imagine which features a future child might inherit.
        </li>
      </ul>

      <hr />

      <h2>Tips for sharing your result</h2>
      <ul>
        <li>
          The <strong>Save</strong> button on the results screen creates a
          single image with your overall % and every feature score — great
          for posting straight to your story or feed.
        </li>
        <li>
          The <strong>Share</strong> button sends it directly through a
          messaging app. Send it to a friend with "you try it too" and it
          tends to spread naturally.
        </li>
        <li>
          Calling out your best-matching feature (🏆) in the caption tends to
          get a good reaction — e.g., "our eyes are 91% alike lol."
        </li>
      </ul>

      <p>
        Before you pick your photos, check{" "}
        <Link href="/en/reads/photo-tips">how to pick a good photo</Link> for
        better results.
      </p>
    </ReadArticleEn>
  );
}
