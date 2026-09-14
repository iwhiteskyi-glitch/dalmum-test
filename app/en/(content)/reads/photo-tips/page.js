import Link from "next/link";
import ReadArticleEn, { readMetadataEn } from "@/components/ReadArticleEn";

const SLUG = "photo-tips";
export const metadata = readMetadataEn(SLUG);

export default function PageEn() {
  return (
    <ReadArticleEn slug={SLUG}>
      <p>
        Dalmum bases its results on where landmark points fall on the faces in
        your photos, so the photos you choose can change your score quite a
        bit. The closer your photos are to the conditions below, the more
        stable — and fair — the comparison will be.
      </p>

      <h2>1. A front-facing photo</h2>
      <p>
        A turned head makes one eye or cheek look narrower, distorting the
        actual shape. A photo taken straight-on works best. For selfies, hold
        the camera at eye level with your arm extended.
      </p>

      <h2>2. A photo where the face is large in frame</h2>
      <p>
        Like a full-body shot, a small face makes it hard to place landmarks
        accurately. Use a photo where the face takes up at least a third of
        the image height — cropping in on the face beforehand is fine too.
      </p>

      <h2>3. A bright, clear photo</h2>
      <p>
        Backlit, dark photos or blurry ones with fuzzy edges give
        inconsistent results. A sharp photo taken in natural light or a
        well-lit room works best.
      </p>

      <h2>4. A photo where the eyes, nose, and mouth are all visible</h2>
      <p>
        Sunglasses, masks, or bangs covering the face make that feature's
        score meaningless. It also helps to skip hats and glasses where
        possible.
      </p>

      <h2>5. Matching expressions between the two photos</h2>
      <p>
        If one person is grinning and the other has a neutral expression, the
        mouth and eye scores can come out low even if you actually look alike.
        Matching expressions — <strong>both neutral</strong> or{" "}
        <strong>both smiling</strong> — makes the comparison fairer.
      </p>

      <hr />

      <h2>When you'll see "We couldn't find a face"</h2>
      <ul>
        <li>The face is too small or cropped off at the edge of the frame</li>
        <li>It's a side profile, or the head is tilted far up or down</li>
        <li>The photo is too dark or blurry</li>
        <li>It's a drawing, caricature, or animal face rather than a front-facing human face</li>
        <li>Part of the face is covered by a pacifier, hand, or mask (common in baby photos)</li>
      </ul>
      <p>
        Trying a different photo that matches the tips above usually solves
        it. If you're unsure about the steps, check the{" "}
        <Link href="/en/guide">Guide</Link> page.
      </p>
    </ReadArticleEn>
  );
}
