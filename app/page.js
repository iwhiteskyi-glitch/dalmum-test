"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
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
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AdSlot from "@/components/AdSlot";
import { track } from "@vercel/analytics";

const CAPTIONS = [
  "눈 뜯어보는 중...",
  "눈썹 모양 보는 중...",
  "코 스캔중...",
  "입 모양 비교중...",
  "얼굴형 계산중...",
  "이목구비 배치 확인중...",
];
const CHECK_LABELS = ["눈", "눈썹", "코", "입", "얼굴형", "이목구비"];
const STEP_LABELS = ["01 사진 선택", "02 비교", "03 결과"];
const KOREAN_COUNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟"];

/* ------------------------------------------------------------------ *
 *  사진 업로드 + 위치/확대 조정 슬롯
 *  - 사진이 없으면: 클릭/드래그로 파일을 고르는 드롭존
 *  - 사진이 있으면: 캔버스에 그려서 드래그로 이동, 슬라이더로 확대/축소
 *    (원 가이드 안에 보이는 영역이 실제로 분석에 쓰이는 영역과 항상 동일)
 * ------------------------------------------------------------------ */
function PhotoSlot({ entry, placeholder, onPick, onChange, onClear }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const [size, setSize] = useState(220);
  const [dragOver, setDragOver] = useState(false);
  const dragRef = useRef(null); // 마우스 한 손가락(포인터) 드래그
  const touchPointsRef = useRef(new Map()); // 지금 닿아있는 손가락들
  const touchPanRef = useRef(null); // 두 손가락 드래그 시작 기준점

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
    // 터치는 손가락 하나면 화면 스크롤(위/아래 이동)로 그대로 두고,
    // 두 손가락이 됐을 때만 "위치 조정 드래그"로 받아들입니다.
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
            aria-label="사진 삭제"
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
          <div className={styles.slotHint}>사진 선택하기</div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          // 같은 파일을 다시 골라도 변경 이벤트가 발생하도록 값 초기화
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  메인 페이지
 * ------------------------------------------------------------------ */
export default function Page() {
  const [step, setStep] = useState(0); // 0 업로드+위치조정 · 1 로딩 · 2 결과
  const [me, setMe] = useState(null); // { img, url, zoom, sx, sy }
  const [target, setTarget] = useState(null);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(null); // 로딩 화면에 보여줄 두 사진 미리보기
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // 모델은 미리 받아두면 분석 시작이 빨라집니다 (실패해도 분석 때 다시 시도).
  // 단, 이 파일이 꽤 커서(약 7MB) 페이지가 뜨자마자 바로 받으면 첫 화면
  // 로딩 속도(모바일 성능 점수)를 깎아먹으므로, 브라우저가 한가할 때
  // (requestIdleCallback) 받도록 미룹니다.
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
  // 단계가 바뀔 때마다 화면 맨 위로 스크롤을 올려줍니다. 안 그러면 이전 화면에서
  // 스크롤을 내려놓은 위치가 그대로 남아, 로딩/결과 화면이 중간부터 잘려 보여요.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  // 컴포넌트가 사라질 때 이미지 objectURL 정리
  // (me/target을 최신 값으로 참조해야 하므로 ref에 항상 최신값을 담아둡니다)
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

        // 얼굴 자동 인식: 찾으면 가장 크게 나온 얼굴을 원 안에 자동으로 맞춥니다.
        // 실패하거나 못 찾아도 무시하고 기본(가운데) 위치를 그대로 씁니다 —
        // 어차피 수동으로 드래그·확대해서 맞출 수 있으니 손해볼 게 없습니다.
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
          /* 자동 인식 실패 — 기본 위치 유지 */
        }
      } catch (e) {
        setUploadError(e.message || "사진을 불러오지 못했어요.");
      }
    },
    []
  );

  /** 여러 얼굴이 감지됐을 때, 사용자가 다른 얼굴을 탭해서 선택 */
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
    // 분석 성공 여부와 무관하게 바로 만들 수 있는 미리보기라, 로딩 화면에 먼저 보여줍니다.
    const meCroppedUrl = meCanvas.toDataURL("image/jpeg", 0.9);
    const targetCroppedUrl = targetCanvas.toDataURL("image/jpeg", 0.9);
    setLoadingPreview({ me: meCroppedUrl, target: targetCroppedUrl });

    const STEP_MS = 420;
    // 체감 진행바: 0→6 로 약 2.9초에 걸쳐 이동
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
            ? "두 사진 모두에서"
            : !meDet
            ? "내 사진에서"
            : "비교 대상 사진에서";
        throw new Error(
          `${who} 얼굴을 찾지 못했어요. 원 안에 얼굴이 정면으로, 너무 작지 않게 오도록 옮기거나 확대해서 다시 시도해 주세요.`
        );
      }
      const res = analyzePair(
        { canvas: meCanvas, detection: meDet },
        { canvas: targetCanvas, detection: tgDet },
        "대상"
      );
      await minDelay;
      setResult({ ...res, meCroppedUrl, targetCroppedUrl });
      // 결과 화면부터는 잘라낸 작은 이미지만 보여주면 되니, 용량이 큰 원본 사진은
      // 바로 해제합니다. (모바일에서 메모리 부족으로 화면이 갑자기 처음으로
      // 돌아가는 문제를 줄여줍니다)
      releaseCropEntry(me);
      releaseCropEntry(target);
      setMe(null);
      setTarget(null);
      setStep(2);
      // 방문자 수 대비 "실제로 결과까지 본 사람"이 몇 명인지 보려는 용도.
      // 사진이나 개인정보는 전혀 안 담기고, 이벤트가 발생했다는 사실만 기록됩니다.
      track("result_viewed", { locale: "ko" });
    } catch (e) {
      await minDelay.catch(() => {});
      setError(
        e.message ||
          "분석 중 문제가 생겼어요. 인터넷 연결을 확인하고 다시 시도해 주세요."
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
      a.download = `닮았네_${result.overall}퍼센트.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("이미지를 만들지 못했어요. 다시 시도해 주세요.");
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
          title: "닮았네 결과",
          // 파일과 함께 공유할 때는 `url` 필드가 무시되는 경우가 많아서,
          // 링크를 text 안에 직접 넣어야 받은 사람이 눌러서 들어올 수 있어요.
          text: `우리 닮음도 ${result.overall}%! 너도 해봐 👀\n${SITE.url}`,
        });
      } else {
        try {
          await navigator.clipboard?.writeText(window.location.href);
        } catch {}
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `닮았네_${result.overall}퍼센트.png`;
        a.click();
        alert("이 브라우저는 바로 공유가 안 돼요. 링크를 복사하고 결과 이미지를 저장했어요!");
      }
    } catch (e) {
      if (e.name !== "AbortError")
        alert("공유하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  /** 사진 없이 "링크 + 짧은 문구"만 공유합니다. (위 onShare는 결과 이미지와
   *  함께 공유하는 용도라 앱에 따라 링크가 빠질 수 있는데, 이건 그런 문제 없이
   *  항상 링크가 확실히 전달돼요.) 공유창을 지원하면 바로 띄우고, PC처럼
   *  지원하지 않으면 클립보드 복사로 대체합니다. */
  const onShareLink = async () => {
    const shareText = `우리 얼마나 닮았는지 확인해봐! 👀`;
    if (navigator.share) {
      try {
        await navigator.share({ title: SITE.name, text: shareText, url: SITE.url });
        return; // 공유창에서 처리했으니 복사 안내는 필요 없음
      } catch (e) {
        if (e.name === "AbortError") return; // 사용자가 공유를 취소함
        // 그 외 실패 시 아래 클립보드 복사로 대체
      }
    }
    try {
      await navigator.clipboard.writeText(SITE.url);
    } catch {
      // 클립보드 API를 못 쓰는 아주 오래된 브라우저용 대체 방법
      const textarea = document.createElement("textarea");
      textarea.value = SITE.url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        alert(`링크를 복사하지 못했어요. 직접 복사해 주세요: ${SITE.url}`);
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
      <SiteHeader wide />

      <main className={styles.main}>
        {step > 0 && (
          <nav className={styles.stepsBar} aria-label="진행 단계">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={`${styles.step} ${i === step ? styles.stepActive : ""}`}
              >
                {label}
              </span>
            ))}
          </nav>
        )}
        {/* ---------- 0. 사진 선택 + 위치/확대 조정 ---------- */}
        {step === 0 && (
          <div className={styles.heroGrid}>
            <div className={styles.heroIntro}>
              <p className={styles.kicker}>A LITTLE LOOK-ALIKE MOMENT</p>
              <span className={styles.tagPill}>친구랑 · 연인이랑 · 닮고 싶은 사람과</span>
              <h1 className={styles.title}>{"우리,\n얼마나 닮았을까?"}</h1>
              <p className={styles.subtitle}>
                {"닮았다는 말, 진짜일까?\n사진 두 장으로 얼굴을 비교하는 무료 닮은꼴 테스트예요."}
              </p>
              <ol className={styles.miniSteps}>
                <li>01 사진 두 장</li>
                <li>02 부위별 비교</li>
                <li>03 결과 공유</li>
              </ol>
            </div>

            <div className={styles.heroPanel}>
              <h2 className={styles.panelHeading}>두 사람의 사진을 골라주세요</h2>
              <p className={styles.panelSub}>
                사진을 올리면 얼굴을 자동으로 찾아 원 안에 맞춰드려요. 잘 안 맞으면
                슬라이더로 확대하거나, 사진을 두 손가락으로 밀어서(PC는 마우스로 바로
                드래그) 위치를 옮길 수 있어요.
              </p>
              <div className={styles.grid2}>
                <div className={styles.slotWrap}>
                  <PhotoSlot
                    entry={me}
                    placeholder="내 사진"
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
                      aria-label="내 사진 확대/축소"
                    />
                  )}
                  {me?.thumbnails && (
                    <>
                      <p className={styles.faceHint}>얼굴이 여러 개 보여요 — 원하는 사람을 골라보세요</p>
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
                            <img src={src} alt={`${idx + 1}번째 얼굴`} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {me && <div className={styles.slotLabel}>내 사진</div>}
                </div>
                <div className={styles.slotWrap}>
                  <PhotoSlot
                    entry={target}
                    placeholder="비교할 사진"
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
                      aria-label="비교 대상 사진 확대/축소"
                    />
                  )}
                  {target?.thumbnails && (
                    <>
                      <p className={styles.faceHint}>얼굴이 여러 개 보여요 — 원하는 사람을 골라보세요</p>
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
                            <img src={src} alt={`${idx + 1}번째 얼굴`} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {target && <div className={styles.slotLabel}>비교할 사진</div>}
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
                  얼마나 닮았는지 보기 →
                </button>
                <p className={styles.ctaHint}>
                  {bothReady
                    ? "준비됐어요. 버튼을 눌러 시작하세요."
                    : "사진 두 장을 선택하면 시작할 수 있어요"}
                </p>
              </div>
              <p className={styles.disclaimer}>
                정밀 분석이 아닌 <strong>재미용 결과</strong>예요. 사진은 서버에 전송·저장되지
                않고 이 브라우저 안에서만 분석돼요.
              </p>
            </div>
          </div>
        )}

        {/* ---------- 1. 비교중 / 에러 ---------- */}
        {step === 1 && !error && (
          <div className={styles.loadingWrap} role="status" aria-live="polite">
            <p className={styles.kicker}>FINDING YOUR SIMILARITIES</p>
            <h2 className={styles.loadingTitle}>닮은 점을 찾고 있어요</h2>
            {loadingPreview && (
              <div className={styles.loadingAvatars}>
                <img className={styles.avatar} src={loadingPreview.me} alt="내 사진" />
                <span className={styles.times}>×</span>
                <img className={styles.avatar} src={loadingPreview.target} alt="비교할 사진" />
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
                      {done ? "✓ 비교 완료" : active ? "비교 중…" : "대기 중"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && error && (
          <div className={styles.errorBox} role="alert">
            <div className={styles.errorTitle}>비교를 완료하지 못했어요</div>
            <div className={styles.errorMsg}>{error}</div>
            <div className={styles.btnRow}>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.flex1}`}
                onClick={() => {
                  setError(null);
                  setStep(0);
                }}
              >
                사진 다시 맞추기
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.flex1}`}
                onClick={restart}
              >
                처음부터
              </button>
            </div>
          </div>
        )}

        {/* ---------- 2. 결과 ---------- */}
        {step === 2 && result && (
          <>
          <div className={styles.resultWrap}>
            <div className={styles.resultHead}>
              <h2 className={styles.resultTitle}>두 사람의 닮은 점</h2>
              <span className={styles.resultMeta}>
                사진 두 장, {KOREAN_COUNT[result.parts.length] || result.parts.length} 가지 발견
              </span>
            </div>

            <div className={styles.resultLayout}>
              <div className={styles.summaryCard}>
                <p className={styles.summaryKicker}>YOUR LOOK-ALIKE REPORT</p>
                <div className={styles.avatars}>
                  <img className={styles.avatar} src={result.meCroppedUrl} alt="내 사진" />
                  <span className={styles.times}>×</span>
                  <img
                    className={styles.avatar}
                    src={result.targetCroppedUrl}
                    alt="비교 대상"
                  />
                </div>
                <div className={styles.bigWrap}>
                  <div className={styles.bigPct}>{result.overall}%</div>
                  <div className={styles.pctLabel}>전체 닮음도</div>
                </div>
                <p className={styles.commentText}>{result.comment}</p>
                {bestPart && (
                  <div className={styles.bestPill}>
                    가장 닮은 부위 {bestPart.name} · {bestPart.score}%
                  </div>
                )}
                <div className={styles.summaryActions}>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => onShare("summary")}
                    disabled={saving}
                  >
                    {saving ? "만드는 중..." : "이 닮음, 공유하기 (요약)"}
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => onShare("detailed")}
                    disabled={saving}
                  >
                    {saving ? "만드는 중..." : "이 닮음, 공유하기 (상세)"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnHighlight}`}
                    onClick={onShareLink}
                  >
                    {linkCopied ? "링크가 복사됐어요 ✓" : "친구 초대 링크 공유하기"}
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={onSave}
                    disabled={saving}
                  >
                    결과 이미지 저장
                  </button>
                  <button type="button" className={styles.btnText} onClick={restart}>
                    다른 사진으로 비교하기
                  </button>
                </div>
                <p className={styles.summaryHint}>
                  요약은 부위별 점수만, 상세는 나/대상 설명까지 전부 담긴 긴 이미지예요.
                </p>
              </div>

              <div className={styles.detailCol}>
                <h3 className={styles.detailHeading}>어디가 닮았을까?</h3>
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
                          {p.isBest && <span className={styles.bestBadge}>가장 닮음</span>}
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
                          <span className={styles.miniLabel}>나</span>
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
                          <span className={styles.miniLabel}>대상</span>
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
              이 수치는 얼굴 특징점 위치를 비교한 <strong>재미용 결과</strong>이며, 신원
              확인이나 친자 판별 등 어떤 공식적 용도로도 쓸 수 없어요.
            </p>
          </div>
          <AdSlot slot="result-bottom" />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
