"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import {
  loadModels,
  fileToCanvas,
  detectFace,
  analyzePair,
} from "@/lib/faceAnalysis";
import { buildShareCard } from "@/lib/shareCard";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";

const CAPTIONS = [
  "눈 뜯어보는 중...",
  "코 스캔중...",
  "입 모양 비교중...",
  "얼굴형 계산중...",
];
const CHECK_LABELS = ["눈", "코", "입", "얼굴형"];

/* ------------------------------------------------------------------ *
 *  이미지 업로드 슬롯
 * ------------------------------------------------------------------ */
function ImageSlot({ value, onFile, placeholder, circle = false, guide = false }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (files) => {
    const file = files && files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  const slot = (
    <div
      className={[
        styles.slot,
        circle ? styles.slotCircle : "",
        value ? styles.slotFilled : "",
        drag ? styles.slotDrag : "",
      ].join(" ")}
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
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      {value ? (
        <>
          <img className={styles.slotImg} src={value} alt={placeholder} />
          <span className={styles.changeHint}>다른 사진으로 바꾸기</span>
        </>
      ) : (
        <>
          <svg className={styles.slotIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <div>{placeholder}</div>
          <div>
            or <span className={styles.browse}>browse files</span>
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );

  if (guide) {
    return (
      <div className={styles.cropFrame}>
        {slot}
        <div className={styles.cropGuide} />
      </div>
    );
  }
  return slot;
}

/* ------------------------------------------------------------------ *
 *  메인 페이지
 * ------------------------------------------------------------------ */
export default function Page() {
  const [step, setStep] = useState(0); // 0 업로드 · 1 위치맞추기 · 2 로딩 · 3 결과
  const [me, setMe] = useState(null); // { previewUrl, canvas }
  const [target, setTarget] = useState(null);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const urlsRef = useRef([]);

  // 모델은 미리 받아두면 분석 시작이 빨라집니다 (실패해도 분석 때 다시 시도)
  useEffect(() => {
    loadModels().catch(() => {});
    return () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const setPhoto = useCallback((which) => async (file) => {
    try {
      const canvas = await fileToCanvas(file);
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current.push(previewUrl);
      const entry = { previewUrl, canvas };
      if (which === "me") setMe(entry);
      else setTarget(entry);
    } catch (e) {
      setError(e.message || "사진을 불러오지 못했어요.");
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    setError(null);
    setResult(null);
    setStep(2);
    setLoadingIdx(0);

    // 체감 진행바: 0→4 로 약 2.9초에 걸쳐 이동
    const minDelay = new Promise((resolve) => {
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        setLoadingIdx(i);
        if (i >= 4) {
          clearInterval(timer);
          setTimeout(resolve, 450);
        }
      }, 620);
    });

    try {
      await loadModels();
      const [meDet, tgDet] = await Promise.all([
        detectFace(me.canvas),
        detectFace(target.canvas),
      ]);
      if (!meDet || !tgDet) {
        const who =
          !meDet && !tgDet
            ? "두 사진 모두에서"
            : !meDet
            ? "내 사진에서"
            : "비교 대상 사진에서";
        throw new Error(
          `${who} 얼굴을 찾지 못했어요. 얼굴이 정면으로, 너무 작지 않게 나온 사진으로 다시 시도해 주세요.`
        );
      }
      const res = analyzePair(
        { canvas: me.canvas, detection: meDet },
        { canvas: target.canvas, detection: tgDet },
        "대상"
      );
      await minDelay;
      setResult(res);
      setStep(3);
    } catch (e) {
      await minDelay.catch(() => {});
      setError(
        e.message ||
          "분석 중 문제가 생겼어요. 인터넷 연결을 확인하고 다시 시도해 주세요."
      );
    }
  }, [me, target]);

  const restart = () => {
    setStep(0);
    setResult(null);
    setError(null);
    setLoadingIdx(0);
  };

  const makeCard = async () => {
    return buildShareCard(result, me.previewUrl, target.previewUrl);
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
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === step ? styles.dotActive : ""}`}
            />
          ))}
        </div>
      </header>

      <main className={styles.main}>
        {/* ---------- 0. 업로드 ---------- */}
        {step === 0 && (
          <div className={styles.narrow}>
            <div>
              <h1 className={styles.title}>사진 두 장을 올려주세요</h1>
              <p className={styles.subtitle}>누구랑 닮았는지 확인해봐요 👀</p>
            </div>
            <div className={styles.grid2}>
              <div className={styles.slotWrap}>
                <ImageSlot
                  value={me?.previewUrl}
                  onFile={setPhoto("me")}
                  placeholder="내 사진"
                />
                <div className={styles.slotLabel}>내 사진</div>
              </div>
              <div className={styles.slotWrap}>
                <ImageSlot
                  value={target?.previewUrl}
                  onFile={setPhoto("target")}
                  placeholder="비교 대상 사진"
                />
                <div className={styles.slotLabel}>비교 대상</div>
              </div>
            </div>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!bothReady}
              onClick={() => setStep(1)}
            >
              다음
            </button>
            <p className={styles.disclaimer}>
              정밀 분석이 아닌 <strong>재미용 결과</strong>예요. 사진은 서버에 전송·저장되지
              않고 이 브라우저 안에서만 분석돼요.
            </p>
          </div>
        )}

        {/* ---------- 1. 얼굴 위치 맞추기 ---------- */}
        {step === 1 && (
          <div className={styles.narrow}>
            <div>
              <h1 className={styles.title}>얼굴 위치를 맞춰주세요</h1>
              <p className={styles.subtitle}>동그라미 안에 얼굴이 딱 맞게요</p>
            </div>
            <div className={styles.grid2}>
              <div className={styles.slotWrap}>
                <ImageSlot
                  value={me?.previewUrl}
                  onFile={setPhoto("me")}
                  placeholder="내 사진"
                  guide
                />
                <div className={styles.slotLabel}>내 사진</div>
              </div>
              <div className={styles.slotWrap}>
                <ImageSlot
                  value={target?.previewUrl}
                  onFile={setPhoto("target")}
                  placeholder="비교 대상 사진"
                  guide
                />
                <div className={styles.slotLabel}>비교 대상</div>
              </div>
            </div>
            <div className={styles.btnRow}>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.flex1}`}
                onClick={() => setStep(0)}
              >
                뒤로
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.flex2}`}
                onClick={runAnalysis}
              >
                분석 시작
              </button>
            </div>
          </div>
        )}

        {/* ---------- 2. 로딩 / 에러 ---------- */}
        {step === 2 && !error && (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <div className={styles.caption}>
              {CAPTIONS[Math.min(loadingIdx, 3)]}
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

        {step === 2 && error && (
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>분석을 완료하지 못했어요</div>
            <div className={styles.errorMsg}>{error}</div>
            <div className={styles.btnRow}>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.flex1}`}
                onClick={() => {
                  setError(null);
                  setStep(1);
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

        {/* ---------- 3. 결과 ---------- */}
        {step === 3 && result && (
          <>
          <div className={styles.resultWrap}>
            <div className={styles.summaryCard}>
              <div className={styles.avatars}>
                <img className={styles.avatar} src={me.previewUrl} alt="내 사진" />
                <span className={styles.times}>×</span>
                <img
                  className={styles.avatar}
                  src={target.previewUrl}
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
