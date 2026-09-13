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
} from "@/lib/faceAnalysis";
import { buildShareCard } from "@/lib/shareCard";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";

const CAPTIONS = [
  "눈 뜯어보는 중...",
  "눈썹 모양 보는 중...",
  "코 스캔중...",
  "입 모양 비교중...",
  "얼굴형 계산중...",
  "이목구비 배치 확인중...",
];
const CHECK_LABELS = ["눈", "눈썹", "코", "입", "얼굴형", "이목구비"];

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
  const dragRef = useRef(null);

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
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, base: entry };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const { x, y, base } = dragRef.current;
    onChange(panCropEntry(base, e.clientX - x, e.clientY - y, size));
  };
  const endDrag = () => {
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
          <svg className={styles.slotIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <div>{placeholder}</div>
          <div>
            or <span className={styles.browse}>browse files</span>
          </div>
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
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [saving, setSaving] = useState(false);

  // 모델은 미리 받아두면 분석 시작이 빨라집니다 (실패해도 분석 때 다시 시도)
  useEffect(() => {
    loadModels().catch(() => {});
  }, []);
  // 컴포넌트가 사라질 때 이미지 objectURL 정리
  useEffect(() => {
    return () => {
      releaseCropEntry(me);
      releaseCropEntry(target);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const meCanvas = renderCrop(me, 640);
      const targetCanvas = renderCrop(target, 640);

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
      const meCroppedUrl = meCanvas.toDataURL("image/jpeg", 0.9);
      const targetCroppedUrl = targetCanvas.toDataURL("image/jpeg", 0.9);
      await minDelay;
      setResult({ ...res, meCroppedUrl, targetCroppedUrl });
      setStep(2);
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
  };

  const makeCard = async () => {
    return buildShareCard(result, result.meCroppedUrl, result.targetCroppedUrl);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const { dataUrl } = await makeCard();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `닮음테스트_${result.overall}퍼센트.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("이미지를 만들지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const onShare = async () => {
    setSaving(true);
    try {
      const { blob, dataUrl } = await makeCard();
      const file = new File([blob], "dalmum-test.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "닮음테스트 결과",
          text: `우리 닮음도 ${result.overall}%! 너도 해봐 👀`,
        });
      } else {
        try {
          await navigator.clipboard?.writeText(window.location.href);
        } catch {}
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `닮음테스트_${result.overall}퍼센트.png`;
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

  const bothReady = me && target;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/">
          닮음테스트
        </a>
        <div className={styles.dots} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === step ? styles.dotActive : ""}`}
            />
          ))}
        </div>
      </header>

      <main className={styles.main}>
        {/* ---------- 0. 업로드 + 위치/확대 조정 ---------- */}
        {step === 0 && (
          <div className={styles.narrow}>
            <div>
              <h1 className={styles.title}>사진 두 장을 올려주세요</h1>
              <p className={styles.subtitle}>
                사진을 올리면 얼굴을 자동으로 찾아 원 안에 맞춰드려요. 잘 안 맞으면
                드래그·확대로 직접 조정할 수 있어요 👀
              </p>
            </div>
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
                <div className={styles.slotLabel}>내 사진</div>
              </div>
              <div className={styles.slotWrap}>
                <PhotoSlot
                  entry={target}
                  placeholder="비교 대상 사진"
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
                <div className={styles.slotLabel}>비교 대상</div>
              </div>
            </div>
            {uploadError && <p className={styles.errorMsg}>{uploadError}</p>}
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!bothReady}
              onClick={runAnalysis}
            >
              분석 시작
            </button>
            <p className={styles.disclaimer}>
              정밀 분석이 아닌 <strong>재미용 결과</strong>예요. 사진은 서버에 전송·저장되지
              않고 이 브라우저 안에서만 분석돼요.
            </p>
          </div>
        )}

        {/* ---------- 1. 로딩 / 에러 ---------- */}
        {step === 1 && !error && (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <div className={styles.caption}>
              {CAPTIONS[Math.min(loadingIdx, CAPTIONS.length - 1)]}
            </div>
            <div className={styles.checkList}>
              {CHECK_LABELS.map((label, i) => {
                const done = i < loadingIdx;
                const active = i === loadingIdx;
                return (
                  <div key={label} className={styles.checkRow}>
                    <span>{label}</span>
                    <span
                      className={`${styles.checkStatus} ${done ? styles.done : ""}`}
                    >
                      {done ? "완료 ✓" : active ? "분석중..." : "대기"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && error && (
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>분석을 완료하지 못했어요</div>
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
            <div className={styles.summaryCard}>
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
              <div className={styles.commentPill}>{result.comment}</div>
            </div>

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
                      {p.isBest ? " 🏆" : ""}
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
                    <img
                      className={styles.mini}
                      src={p.meCrop}
                      alt={p.placeholderMe}
                    />
                    <img
                      className={styles.mini}
                      src={p.targetCrop}
                      alt={p.placeholderTarget}
                    />
                  </div>
                  <div className={styles.partDesc}>
                    <div>
                      <strong>나</strong> · {p.meDesc}
                    </div>
                    <div>
                      <strong>대상</strong> · {p.targetDesc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className={styles.disclaimer}>
              이 수치는 얼굴 특징점 위치를 비교한 <strong>재미용 결과</strong>이며, 신원
              확인이나 친자 판별 등 어떤 공식적 용도로도 쓸 수 없어요.
            </p>

            <div className={`${styles.btnRow} ${styles.actionRow}`}>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.flex1}`}
                onClick={restart}
              >
                다시하기
              </button>
              <button
                className={`${styles.btn} ${styles.btnYellow} ${styles.flex1}`}
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "만드는 중..." : "저장"}
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.flex1}`}
                onClick={onShare}
                disabled={saving}
              >
                공유하기
              </button>
            </div>
          </div>
          <AdSlot slot="result-bottom" />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
