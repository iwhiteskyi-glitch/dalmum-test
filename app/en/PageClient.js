"use client";

/**
 * 영문 버전 (작업 중) — /en
 * app/page.js(한국어 버전)를 그대로 복사해서 화면에 보이는 문구만 영어로 바꾼
 * 버전입니다. 로직/스타일/분석 엔진은 한국어 버전과 완전히 동일하게 공유합니다.
 *
 * 결과 화면(부위 이름/설명 문장/총평)도 lib/faceAnalysis.js의 analyzePair()에
 * locale="en"을 넘겨서 영문으로 생성합니다 (한국어 버전은 기본값 그대로라 영향
 * 없음).
 *
 * 아직 번역이 안 된 부분 (다음 단계 작업 예정):
 *  - 결과를 이미지로 저장/공유할 때 만들어지는 카드(lib/shareCard.js)는
 *    한글 그대로 나갑니다 (캔버스에 결과 텍스트를 그려 넣는 방식이라 별도
 *    영문 버전이 필요합니다).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../page.module.css";
import {
  loadModels,
  loadCropEntry,
  releaseCropEntry,
  panCropEntry,
  zoomCropEntry,
  drawCropInto,
  renderCrop,
  detectFaceBoxes,
  cropEntryForFace,
  faceThumbnail,
  detectFace,
  analyzePair,
  splitClauses,
} from "@/lib/faceAnalysis";
import { buildShareCard } from "@/lib/shareCard";
import { SITE } from "@/lib/site";
import SiteFooterEn from "@/components/SiteFooterEn";
import AdSlot from "@/components/AdSlot";

const BRAND = "Dalmum";

const CAPTIONS = [
  "Examining the eyes...",
  "Checking eyebrow shape...",
  "Scanning the nose...",
  "Comparing mouth shape...",
  "Calculating face shape...",
  "Checking feature layout...",
];
const CHECK_LABELS = ["Eyes", "Brows", "Nose", "Mouth", "Face shape", "Layout"];
const STEP_LABELS = ["01 Upload", "02 Compare", "03 Result"];

/* ------------------------------------------------------------------ *
 *  사진 업로드 + 위치/확대 조정 슬롯 (로직은 한국어 버전과 동일)
 * ------------------------------------------------------------------ */
function PhotoSlot({ entry, placeholder, onPick, onChange, onClear }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const [size, setSize] = useState(220);
  const [dragOver, setDragOver] = useState(false);
  const dragRef = useRef(null);
  const touchPointsRef = useRef(new Map());
  const touchPanRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setSize(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!entry) return;
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCropInto(ctx, entry, size);
  }, [entry, size]);

  const handleFiles = (files) => {
    const file = files && files[0];
    if (file && file.type.startsWith("image/")) onPick(file);
  };

  const onPointerDown = (e) => {
    if (!entry) return;
    if (e.pointerType === "touch") {
      touchPointsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPointsRef.current.size === 2) {
        for (const id of touchPointsRef.current.keys()) {
          try {
            e.currentTarget.setPointerCapture(id);
          } catch {}
        }
        const pts = [...touchPointsRef.current.values()];
        touchPanRef.current = {
          x0: (pts[0].x + pts[1].x) / 2,
          y0: (pts[0].y + pts[1].y) / 2,
          base: entry,
        };
      }
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, base: entry };
  };
  const onPointerMove = (e) => {
    if (e.pointerType === "touch") {
      if (!touchPointsRef.current.has(e.pointerId)) return;
      touchPointsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPanRef.current && touchPointsRef.current.size >= 2) {
        e.preventDefault();
        const pts = [...touchPointsRef.current.values()];
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        const { x0, y0, base } = touchPanRef.current;
        onChange(panCropEntry(base, cx - x0, cy - y0, size));
      }
      return;
    }
    if (!dragRef.current) return;
    const { x, y, base } = dragRef.current;
    onChange(panCropEntry(base, e.clientX - x, e.clientY - y, size));
  };
  const endDrag = (e) => {
    if (e?.pointerType === "touch") {
      touchPointsRef.current.delete(e.pointerId);
      if (touchPointsRef.current.size < 2) touchPanRef.current = null;
      return;
    }
    dragRef.current = null;
  };

  return (
    <div
      ref={wrapRef}
      className={`${styles.cropFrame} ${entry ? styles.cropFrameFilled : ""}`}
    >
      {entry ? (
        <>
          <canvas
            ref={canvasRef}
            className={styles.cropCanvas}
            style={{ width: size, height: size }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
          <div className={styles.cropGuide} />
          <button
            type="button"
            className={styles.removeBtn}
            aria-label="Remove photo"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            ✕
          </button>
        </>
      ) : (
        <div
          className={`${styles.slot} ${dragOver ? styles.slotDrag : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <span className={styles.slotPlus} aria-hidden="true">
            +
          </span>
          <div className={styles.slotTitle}>{placeholder}</div>
          <div className={styles.slotHint}>Choose a photo</div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  메인 페이지 (영문)
 * ------------------------------------------------------------------ */
export default function Page() {
  const [step, setStep] = useState(0);
  const [me, setMe] = useState(null);
  const [target, setTarget] = useState(null);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb) => setTimeout(cb, 1500);
    const cancelIdle =
      typeof window.cancelIdleCallback === "function"
        ? window.cancelIdleCallback
        : clearTimeout;
    const id = idle(() => {
      loadModels().catch(() => {});
    });
    return () => cancelIdle(id);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  const meRef = useRef(null);
  const targetRef = useRef(null);
  useEffect(() => {
    meRef.current = me;
  }, [me]);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    return () => {
      releaseCropEntry(meRef.current);
      releaseCropEntry(targetRef.current);
    };
  }, []);

  const pickPhoto = useCallback(
    (which) => async (file) => {
      const setFn = which === "me" ? setMe : setTarget;
      try {
        setUploadError(null);
        const entry = await loadCropEntry(file);
        setFn((prev) => {
          releaseCropEntry(prev);
          return entry;
        });

        try {
          await loadModels();
          const faces = await detectFaceBoxes(entry.img);
          if (faces.length > 0) {
            const fitted = cropEntryForFace(entry, faces[0]);
            const thumbnails =
              faces.length > 1 ? faces.map((f) => faceThumbnail(entry.img, f)) : null;
            setFn((prev) =>
              prev === entry
                ? { ...fitted, faces, selectedFaceIdx: 0, thumbnails }
                : prev
            );
          }
        } catch {
          /* face auto-detect failed — keep default position */
        }
      } catch (e) {
        setUploadError(e.message || "Couldn't load the photo.");
      }
    },
    []
  );

  const selectFace = (which, idx) => {
    const setFn = which === "me" ? setMe : setTarget;
    setFn((prev) => {
      if (!prev?.faces?.[idx]) return prev;
      return {
        ...cropEntryForFace(prev, prev.faces[idx]),
        faces: prev.faces,
        selectedFaceIdx: idx,
      };
    });
  };

  const clearPhoto = (which) => {
    if (which === "me") {
      setMe((prev) => {
        releaseCropEntry(prev);
        return null;
      });
    } else {
      setTarget((prev) => {
        releaseCropEntry(prev);
        return null;
      });
    }
  };

  const runAnalysis = useCallback(async () => {
    setError(null);
    setResult(null);
    setStep(1);
    setLoadingIdx(0);

    const meCanvas = renderCrop(me, 640);
    const targetCanvas = renderCrop(target, 640);
    const meCroppedUrl = meCanvas.toDataURL("image/jpeg", 0.9);
    const targetCroppedUrl = targetCanvas.toDataURL("image/jpeg", 0.9);
    setLoadingPreview({ me: meCroppedUrl, target: targetCroppedUrl });

    const STEP_MS = 420;
    const minDelay = new Promise((resolve) => {
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        setLoadingIdx(i);
        if (i >= CHECK_LABELS.length) {
          clearInterval(timer);
          setTimeout(resolve, 400);
        }
      }, STEP_MS);
    });

    try {
      await loadModels();
      const [meDet, tgDet] = await Promise.all([
        detectFace(meCanvas),
        detectFace(targetCanvas),
      ]);
      if (!meDet || !tgDet) {
        const who =
          !meDet && !tgDet
            ? "in either photo"
            : !meDet
            ? "in your photo"
            : "in the comparison photo";
        throw new Error(
          `We couldn't find a face ${who}. Try repositioning or zooming so the face is centered, facing forward, and not too small, then try again.`
        );
      }
      const res = analyzePair(
        { canvas: meCanvas, detection: meDet },
        { canvas: targetCanvas, detection: tgDet },
        "Their",
        "en"
      );
      await minDelay;
      setResult({ ...res, meCroppedUrl, targetCroppedUrl });
      releaseCropEntry(me);
      releaseCropEntry(target);
      setMe(null);
      setTarget(null);
      setStep(2);
    } catch (e) {
      await minDelay.catch(() => {});
      setError(
        e.message ||
          "Something went wrong during analysis. Please check your connection and try again."
      );
    }
  }, [me, target]);

  const restart = () => {
    releaseCropEntry(me);
    releaseCropEntry(target);
    setMe(null);
    setTarget(null);
    setStep(0);
    setResult(null);
    setError(null);
    setUploadError(null);
    setLoadingIdx(0);
    setLoadingPreview(null);
  };

  const makeCard = async (variant = "summary") => {
    return buildShareCard(result, result.meCroppedUrl, result.targetCroppedUrl, variant);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const { dataUrl } = await makeCard();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `dalmum_${result.overall}percent.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Couldn't create the image. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onShare = async (variant = "summary") => {
    setSaving(true);
    try {
      const { blob, dataUrl } = await makeCard(variant);
      const file = new File([blob], "dalmum-test.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Dalmum result",
          text: `We're ${result.overall}% alike! Try it yourself 👀\n${SITE.url}`,
        });
      } else {
        try {
          await navigator.clipboard?.writeText(window.location.href);
        } catch {}
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `dalmum_${result.overall}percent.png`;
        a.click();
        alert("This browser can't share directly. We copied the link and saved the result image for you!");
      }
    } catch (e) {
      if (e.name !== "AbortError") alert("Couldn't share. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onShareLink = async () => {
    const shareText = `Check out how alike we are! 👀`;
    if (navigator.share) {
      try {
        await navigator.share({ title: BRAND, text: shareText, url: SITE.url });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(SITE.url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = SITE.url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        alert(`Couldn't copy the link. Please copy it manually: ${SITE.url}`);
      }
      textarea.remove();
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const bothReady = me && target;
  const bestPart = result?.parts.find((p) => p.isBest);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/en">
          <img
            src="/logo.png"
            alt=""
            width={26}
            height={15}
            className={styles.brandLogo}
          />
          {BRAND}
        </a>
        <nav className={styles.steps} aria-label="Progress steps">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={`${styles.step} ${i === step ? styles.stepActive : ""}`}
            >
              {label}
            </span>
          ))}
        </nav>
      </header>

      <main className={styles.main}>
        {/* ---------- 0. Upload + position/zoom ---------- */}
        {step === 0 && (
          <div className={styles.heroGrid}>
            <div className={styles.heroIntro}>
              <p className={styles.kicker}>A LITTLE LOOK-ALIKE MOMENT</p>
              <span className={styles.tagPill}>
                Friends, partners, anyone you're curious about
              </span>
              <h1 className={styles.title}>{"How much\ndo we look alike?"}</h1>
              <p className={styles.subtitle}>
                {
                  "They say you look alike — is it true?\nA free look-alike test that compares two photos, feature by feature."
                }
              </p>
              <ol className={styles.miniSteps}>
                <li>01 Two photos</li>
                <li>02 Feature-by-feature</li>
                <li>03 Share results</li>
              </ol>
            </div>

            <div className={styles.heroPanel}>
              <h2 className={styles.panelHeading}>Choose two photos to compare</h2>
              <p className={styles.panelSub}>
                Upload photos and we'll automatically find the faces and fit them
                into the circles. If it's off, zoom with the slider, or drag with
                two fingers (or your mouse on desktop) to reposition.
              </p>
              <div className={styles.grid2}>
                <div className={styles.slotWrap}>
                  <PhotoSlot
                    entry={me}
                    placeholder="My photo"
                    onPick={pickPhoto("me")}
                    onChange={setMe}
                    onClear={() => clearPhoto("me")}
                  />
                  {me && (
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.01"
                      value={me.zoom}
                      onChange={(e) => setMe(zoomCropEntry(me, Number(e.target.value)))}
                      className={styles.zoomSlider}
                      aria-label="Zoom my photo"
                    />
                  )}
                  {me?.thumbnails && (
                    <>
                      <p className={styles.faceHint}>
                        We found multiple faces — pick the one you want
                      </p>
                      <div className={styles.faceThumbRow}>
                        {me.thumbnails.map((src, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`${styles.faceThumb} ${
                              idx === me.selectedFaceIdx ? styles.faceThumbActive : ""
                            }`}
                            onClick={() => selectFace("me", idx)}
                          >
                            <img src={src} alt={`Face ${idx + 1}`} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {me && <div className={styles.slotLabel}>My photo</div>}
                </div>
                <div className={styles.slotWrap}>
                  <PhotoSlot
                    entry={target}
                    placeholder="Photo to compare"
                    onPick={pickPhoto("target")}
                    onChange={setTarget}
                    onClear={() => clearPhoto("target")}
                  />
                  {target && (
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.01"
                      value={target.zoom}
                      onChange={(e) => setTarget(zoomCropEntry(target, Number(e.target.value)))}
                      className={styles.zoomSlider}
                      aria-label="Zoom comparison photo"
                    />
                  )}
                  {target?.thumbnails && (
                    <>
                      <p className={styles.faceHint}>
                        We found multiple faces — pick the one you want
                      </p>
                      <div className={styles.faceThumbRow}>
                        {target.thumbnails.map((src, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`${styles.faceThumb} ${
                              idx === target.selectedFaceIdx ? styles.faceThumbActive : ""
                            }`}
                            onClick={() => selectFace("target", idx)}
                          >
                            <img src={src} alt={`Face ${idx + 1}`} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {target && <div className={styles.slotLabel}>Photo to compare</div>}
                </div>
              </div>
              {uploadError && <p className={styles.errorMsg} role="alert">{uploadError}</p>}
              <div className={styles.ctaRow}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={!bothReady}
                  onClick={runAnalysis}
                  style={{ width: "100%" }}
                >
                  See how alike we are →
                </button>
                <p className={styles.ctaHint}>
                  {bothReady
                    ? "Ready! Tap the button to start."
                    : "Choose two photos to get started"}
                </p>
              </div>
              <p className={styles.disclaimer}>
                This isn't a precise analysis — it's just for fun.{" "}
                <strong>Your photos are never sent to or stored on any server</strong>;
                everything is analyzed right here in your browser.
              </p>
            </div>
          </div>
        )}

        {/* ---------- 1. Comparing / error ---------- */}
        {step === 1 && !error && (
          <div className={styles.loadingWrap} role="status" aria-live="polite">
            <p className={styles.kicker}>FINDING YOUR SIMILARITIES</p>
            <h2 className={styles.loadingTitle}>Finding your similarities</h2>
            {loadingPreview && (
              <div className={styles.loadingAvatars}>
                <img className={styles.avatar} src={loadingPreview.me} alt="My photo" />
                <span className={styles.times}>×</span>
                <img className={styles.avatar} src={loadingPreview.target} alt="Comparison photo" />
              </div>
            )}
            <p className={styles.loadingCaption}>
              {CAPTIONS[Math.min(loadingIdx, CAPTIONS.length - 1)]}
            </p>
            <div className={styles.checkList}>
              {CHECK_LABELS.map((label, i) => {
                const done = i < loadingIdx;
                const active = i === loadingIdx;
                return (
                  <div key={label} className={styles.checkRow}>
                    <span>{label}</span>
                    <span
                      className={`${styles.checkStatus} ${done ? styles.done : ""} ${
                        active ? styles.active : ""
                      }`}
                    >
                      {done ? "✓ Done" : active ? "Comparing…" : "Waiting"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && error && (
          <div className={styles.errorBox} role="alert">
            <div className={styles.errorTitle}>We couldn't finish the comparison</div>
            <div className={styles.errorMsg}>{error}</div>
            <div className={styles.btnRow}>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.flex1}`}
                onClick={() => {
                  setError(null);
                  setStep(0);
                }}
              >
                Adjust photos again
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.flex1}`}
                onClick={restart}
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {/* ---------- 2. Result ---------- */}
        {step === 2 && result && (
          <>
          <div className={styles.resultWrap}>
            <div className={styles.resultHead}>
              <h2 className={styles.resultTitle}>Your similarities</h2>
              <span className={styles.resultMeta}>
                Two photos, {result.parts.length} traits compared
              </span>
            </div>

            <div className={styles.resultLayout}>
              <div className={styles.summaryCard}>
                <p className={styles.summaryKicker}>YOUR LOOK-ALIKE REPORT</p>
                <div className={styles.avatars}>
                  <img className={styles.avatar} src={result.meCroppedUrl} alt="My photo" />
                  <span className={styles.times}>×</span>
                  <img
                    className={styles.avatar}
                    src={result.targetCroppedUrl}
                    alt="Comparison"
                  />
                </div>
                <div className={styles.bigWrap}>
                  <div className={styles.bigPct}>{result.overall}%</div>
                  <div className={styles.pctLabel}>Overall similarity</div>
                </div>
                <p className={styles.commentText}>{result.comment}</p>
                {bestPart && (
                  <div className={styles.bestPill}>
                    Most alike: {bestPart.name} · {bestPart.score}%
                  </div>
                )}
                <div className={styles.summaryActions}>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => onShare("summary")}
                    disabled={saving}
                  >
                    {saving ? "Creating..." : "Share this match (summary)"}
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => onShare("detailed")}
                    disabled={saving}
                  >
                    {saving ? "Creating..." : "Share this match (detailed)"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnHighlight}`}
                    onClick={onShareLink}
                  >
                    {linkCopied ? "Link copied ✓" : "Share invite link"}
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={onSave}
                    disabled={saving}
                  >
                    Save result image
                  </button>
                  <button type="button" className={styles.btnText} onClick={restart}>
                    Compare different photos
                  </button>
                </div>
                <p className={styles.summaryHint}>
                  Summary includes just the scores; Detailed includes the full
                  descriptions for both photos.
                </p>
              </div>

              <div className={styles.detailCol}>
                <h3 className={styles.detailHeading}>Where do you match?</h3>
                <div className={styles.partsGrid}>
                  {result.parts.map((p) => (
                    <div
                      key={p.key}
                      className={`${styles.partCard} ${
                        p.isBest ? styles.partCardBest : ""
                      }`}
                    >
                      <div className={styles.partHead}>
                        <span className={styles.partName}>
                          {p.name}
                          {p.isBest && <span className={styles.bestBadge}>Best match</span>}
                        </span>
                        <span className={styles.partScore}>{p.score}%</span>
                      </div>
                      <div className={styles.track}>
                        <div
                          className={styles.fill}
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                      <div className={styles.miniGrid}>
                        <div className={`${styles.miniItem} ${styles.miniItemMe}`}>
                          <img className={styles.mini} src={p.meCrop} alt={p.placeholderMe} />
                          <span className={styles.miniLabel}>Me</span>
                          <ul className={styles.miniDesc}>
                            {splitClauses(p.meDesc).map((clause, i) => (
                              <li key={i}>{clause}</li>
                            ))}
                          </ul>
                        </div>
                        <div className={`${styles.miniItem} ${styles.miniItemTarget}`}>
                          <img
                            className={styles.mini}
                            src={p.targetCrop}
                            alt={p.placeholderTarget}
                          />
                          <span className={styles.miniLabel}>Them</span>
                          <ul className={styles.miniDesc}>
                            {splitClauses(p.targetDesc).map((clause, i) => (
                              <li key={i}>{clause}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className={styles.disclaimer}>
              These numbers come from comparing facial landmark positions,{" "}
              <strong>for fun only</strong> — they can't be used for identity
              verification, paternity testing, or any other official purpose.
            </p>
          </div>
          <AdSlot slot="result-bottom" locale="en" />
          </>
        )}
      </main>

      <SiteFooterEn />
    </div>
  );
}
