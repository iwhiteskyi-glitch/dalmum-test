"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import styles from "@/components/fortune/fortune.module.css";
import t from "@/components/fortune/today.module.css";
import gs from "./gwansang.module.css";
import PhotoSlot from "@/components/PhotoSlot";
import {
  loadModels,
  loadCropEntry,
  releaseCropEntry,
  zoomCropEntry,
  renderCrop,
  detectFaceBoxes,
  cropEntryForFace,
  detectFace,
} from "@/lib/faceAnalysis";
import { classifyFace, PARTS, synthesisKey } from "@/lib/gwansang/classify";
import TEXTS from "@/lib/gwansang/texts.json";
import { buildGwansangCard } from "@/lib/gwansang/card";
import { shareResult, copyText } from "@/lib/fortune/shareResult";
import { encodeGwansangLink, decodeGwansangLink } from "@/lib/gwansang/resultLink";
import { SITE } from "@/lib/site";
import { keepResult, dropResult, restoreOnBack } from "@/lib/backRestore";

const CAPTIONS = [
  "눈매 보는 중...",
  "눈썹 모양 보는 중...",
  "코 스캔 중...",
  "입 모양 보는 중...",
  "턱선 보는 중...",
  "이목구비 배치 확인 중...",
];
const STEP_MS = 420;

/** 칸 번호 묶음({ eye: [a, b], ... })을 화면에 쓸 부위별 풀이로 바꿉니다. */
function resolveParts(categories) {
  return PARTS.map((part) => {
    const def = TEXTS.parts[part];
    const [a, b] = categories[part];
    return {
      part,
      label: def.label,
      hanja: def.hanja,
      about: def.about,
      dims: def.dims.map((d, i) => ({ label: d.label, steps: d.steps, at: i === 0 ? a : b })),
      ...def.combos[`${a}-${b}`],
    };
  });
}

/** 종합 보기 — 얼굴형·턱선·두 눈 사이를 묶은 18가지 중 하나. 이름표에 쓸 세 생김새도 함께. */
function resolveSynthesis(categories) {
  const f = TEXTS.synthesisFeatures;
  return {
    ...TEXTS.synthesis[synthesisKey(categories)],
    features: [f.face[categories.jaw[1]], f.jaw[categories.jaw[0]], f.eyes[categories.layout[0]]],
  };
}

const LINES = [
  ["first", "첫인상"],
  ["work", "일할 때"],
  ["people", "사람 사이에서"],
];

export default function GwansangView() {
  const [shared, setShared] = useState(null);
  const resultRef = useRef(null);

  // 주소 끝에 친구가 보낸 관상 결과가 담겨 있으면, 사진을 올리지 않아도 그 결과부터 보여줍니다.
  useEffect(() => {
    const got = decodeGwansangLink(window.location.hash);
    if (!got) return;
    setShared(got);
    track("gwansang_shared_link_opened");
  }, []);

  function onResult() {
    setShared(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    track("gwansang_result_viewed");
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <>
      {shared && (
        <>
          <p className={styles.sharedNote}>
            친구가 보낸 <b>관상</b> 결과예요. 아래에서 내 관상도 바로 볼 수 있어요.
          </p>
          <div className={styles.result}>
            <div className={t.zone}>
              <p className={t.zoneLabel}>친구가 보낸 관상 결과</p>
              <GwansangResult categories={shared} snapshot />
            </div>
          </div>
          <p className={styles.sectionDivider}>내 관상 보기</p>
        </>
      )}
      <UploadFlow onResult={onResult} resultRef={resultRef} />
    </>
  );
}

/** 사진 업로드 → 위치 조정 → 분석 → 결과까지의 전체 흐름. */
function UploadFlow({ onResult, resultRef }) {
  // 결과 아래 링크로 다른 페이지에 갔다가 뒤로 오면 보던 결과를 다시 보여 줍니다. 사진은 이
  // 탭의 메모리에만 있고(저장·전송 없음), 새로고침하거나 창을 닫으면 사라져요.
  const [back] = useState(() => restoreOnBack("gwansang"));
  const [step, setStep] = useState(back ? 2 : 0); // 0 업로드 · 1 분석 중 · 2 결과
  const [entry, setEntry] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [error, setError] = useState(null);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [result, setResult] = useState(back); // { categories, photoUrl }

  const entryRef = useRef(null);
  useEffect(() => {
    entryRef.current = entry;
  }, [entry]);
  useEffect(() => {
    return () => releaseCropEntry(entryRef.current);
  }, []);
  // 단계가 바뀔 때만 맨 위로 올립니다(뒤로 가기로 돌아온 첫 화면은 보던 위치 그대로).
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [step]);

  // 모델은 브라우저가 한가할 때 미리 받아 둡니다(실패해도 분석 시점에 다시 시도).
  useEffect(() => {
    const idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback : (cb) => setTimeout(cb, 1500);
    const id = idle(() => {
      loadModels().catch(() => {});
    });
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  const pickPhoto = useCallback(async (file) => {
    try {
      setUploadError(null);
      const next = await loadCropEntry(file);
      setEntry((prev) => {
        releaseCropEntry(prev);
        return next;
      });
      try {
        await loadModels();
        const faces = await detectFaceBoxes(next.img);
        if (faces.length > 0) {
          const fitted = cropEntryForFace(next, faces[0]);
          setEntry((prev) => (prev === next ? { ...fitted, faces, selectedFaceIdx: 0 } : prev));
        }
      } catch {
        /* 자동 인식 실패 — 기본 위치 유지, 수동으로 맞출 수 있어요 */
      }
    } catch (e) {
      setUploadError(e.message || "사진을 불러오지 못했어요.");
    }
  }, []);

  const clearPhoto = () => {
    setEntry((prev) => {
      releaseCropEntry(prev);
      return null;
    });
  };

  const runAnalysis = useCallback(async () => {
    setError(null);
    setResult(null);
    setStep(1);
    setLoadingIdx(0);

    const canvas = renderCrop(entry, 640);
    const photoUrl = canvas.toDataURL("image/jpeg", 0.92);

    const minDelay = new Promise((resolve) => {
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        setLoadingIdx(i);
        if (i >= CAPTIONS.length) {
          clearInterval(timer);
          setTimeout(resolve, 300);
        }
      }, STEP_MS);
    });

    try {
      await loadModels();
      const detection = await detectFace(canvas);
      if (!detection) {
        throw new Error("사진에서 얼굴을 찾지 못했어요. 원 안에 얼굴이 정면으로, 너무 작지 않게 오도록 옮기거나 확대해서 다시 시도해 주세요.");
      }
      const categories = classifyFace(detection);
      await minDelay;
      setResult({ categories, photoUrl });
      keepResult("gwansang", { categories, photoUrl });
      releaseCropEntry(entry);
      setEntry(null);
      setStep(2);
      track("gwansang_analyzed");
      onResult();
    } catch (e) {
      await minDelay.catch(() => {});
      setError(e.message || "분석 중 문제가 생겼어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
      setStep(0);
    }
  }, [entry, onResult]);

  if (step === 1) {
    return (
      <div className={gs.loadingWrap}>
        <div className={gs.spinner} aria-hidden="true" />
        <p className={gs.loadingCaption}>{CAPTIONS[Math.min(loadingIdx, CAPTIONS.length - 1)]}</p>
      </div>
    );
  }

  if (step === 2 && result) {
    return (
      <div ref={resultRef} className={styles.result}>
        <div className={t.zone}>
          <p className={t.zoneLabel}>내 관상 결과</p>
          <GwansangResult categories={result.categories} photoUrl={result.photoUrl} />
        </div>
        <p className={gs.zoomRow} style={{ textAlign: "center", marginTop: 20 }}>
          <button
            type="button"
            className={styles.ghostSm}
            onClick={() => {
              setResult(null);
              setStep(0);
              dropResult("gwansang");
            }}
          >
            다른 사진으로 다시 보기
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className={gs.uploadWrap}>
        <PhotoSlot
          entry={entry}
          placeholder="내 사진"
          onPick={pickPhoto}
          onChange={setEntry}
          onClear={clearPhoto}
          styles={gs}
        />
        {entry && (
          <div className={gs.zoomRow}>
            <input
              type="range"
              min="1"
              max="4"
              step="0.05"
              value={entry.zoom}
              onChange={(e) => setEntry(zoomCropEntry(entry, Number(e.target.value)))}
              className={gs.zoomSlider}
              aria-label="확대/축소"
            />
          </div>
        )}
      </div>
      {uploadError && (
        <p className={styles.error} role="alert">
          {uploadError}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="button" className={styles.cta} disabled={!entry} onClick={runAnalysis}>
        내 관상 보기
      </button>
      <p className={styles.small} style={{ textAlign: "center", marginTop: 10 }}>
        사진은 이 브라우저 안에서만 분석되고, 서버로 전송되거나 저장되지 않아요.
      </p>
    </div>
  );
}

/**
 * snapshot: 친구가 보낸 링크로 보는 결과 — 사진·공유 버튼을 빼고 풀이만 보여줍니다.
 * (링크에는 사진이 담기지 않으므로 받은 사람 화면에는 애초에 사진이 없어요.)
 */
function GwansangResult({ categories, photoUrl, snapshot = false }) {
  const [hint, setHint] = useState("");
  const [card, setCard] = useState(null);

  const parts = resolveParts(categories);
  const syn = resolveSynthesis(categories);
  const cardKey = encodeGwansangLink(categories);

  useEffect(() => {
    if (snapshot) return;
    let cancelled = false;
    setCard(null);
    (async () => {
      let photo = null;
      if (photoUrl) {
        photo = new Image();
        photo.src = photoUrl;
        try {
          await photo.decode();
        } catch {
          photo = null;
        }
      }
      if (cancelled) return;
      const img = await buildGwansangCard({
        photo,
        synthesis: syn,
        lines: LINES.map(([key, label]) => ({ label, text: syn[key] })),
        parts: parts.map((p) => ({ label: p.label, name: p.name, text: p.text })),
      });
      if (!cancelled) setCard(img);
    })().catch(() => {
      /* 카드를 못 그리면 글로만 공유해요 */
    });
    return () => {
      cancelled = true;
    };
    // 나머지 값은 모두 cardKey에서 정해집니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, snapshot]);

  const url = `${SITE.url}/gwansang${cardKey}`;

  async function share() {
    // 메신저에서 한눈에 읽히도록 묶음마다 [제목]을 달고 빈 줄로 나눠요.
    const head = `내 관상: "${syn.title}"\n${syn.features.join(" · ")}`;
    const shortText = `${head}\n\n${syn.text}`;
    const fullText = [
      head,
      syn.text,
      LINES.map(([key, label]) => `- ${label}: ${syn[key]}`).join("\n"),
      ...parts.map((p) => `[${p.label} · ${p.name}]\n${p.text}`),
      TEXTS.disclaimer,
      "— 재미로봄 관상",
    ].join("\n\n");
    setHint("");
    try {
      const r = await shareResult({
        blob: card?.blob,
        fileName: "jaemirobom-gwansang.png",
        title: "재미로봄 관상",
        shortText,
        fullText,
        url,
      });
      track("gwansang_shared", { mode: r.mode });
      if (r.mode === "files") {
        setHint(
          r.linkCopied
            ? "링크도 복사해 뒀어요. 사진만 전달됐으면 대화창에 붙여넣어 주세요."
            : "사진만 전달됐으면 '링크 복사' 버튼을 눌러 주소도 함께 보내 주세요."
        );
      } else if (r.mode === "copied") {
        setHint("공유 글과 링크를 복사했어요. 붙여넣어 보내 주세요.");
      }
    } catch (e) {
      if (e.name !== "AbortError") setHint("공유하지 못했어요. '링크 복사' 버튼을 이용해 주세요.");
    }
  }

  async function copyLink() {
    setHint((await copyText(url)) ? "링크를 복사했어요." : "링크를 복사하지 못했어요.");
  }

  return (
    <>
      <section className={`${t.panel} ${gs.panel}`} aria-labelledby="gwansang-title">
        <p className={t.date}>{TEXTS.resultLead}</p>
        <div className={gs.hero}>
          {!snapshot && photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="분석에 쓴 사진" className={gs.heroPhoto} />
          )}
          <div className={gs.heroSide}>
            <p className={t.god}>얼굴 전체로 보면</p>
            <h2 id="gwansang-title" className={t.title}>
              {syn.title}
            </h2>
            <p className={gs.features}>{syn.features.join(" · ")}</p>
          </div>
        </div>
        <div className={t.personal}>
          <p className={t.personalText}>{syn.text}</p>
        </div>
        <dl className={gs.lines}>
          {LINES.map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{syn[key]}</dd>
            </div>
          ))}
        </dl>
        <p className={gs.leadNote}>{TEXTS.synthesisLead} 부위마다 따로 본 풀이는 아래에 이어져요.</p>
        <ul className={gs.chips} aria-label="부위별 한 줄 요약">
          {parts.map((p) => (
            <li key={p.part}>
              <a href={`#gw-${p.part}`}>
                <small>{p.label}</small>
                {p.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {parts.map((p) => (
        <section
          key={p.part}
          id={`gw-${p.part}`}
          className={`${t.card} ${gs.part} ${gs[`c_${p.part}`]}`}
          aria-labelledby={`gw-${p.part}-title`}
        >
          <h2 id={`gw-${p.part}-title`} className={t.cardTitle}>
            {p.label}
            <span className={gs.hanja} aria-hidden="true">
              {p.hanja}
            </span>
          </h2>
          <p className={t.cardLead}>{p.about}</p>
          <div className={gs.meters}>
            {p.dims.map((d) => (
              <div key={d.label} className={gs.meter}>
                <span className={gs.meterLabel}>{d.label}</span>
                <ol className={gs.steps} aria-label={`${d.label}: ${d.steps[d.at]}`}>
                  {d.steps.map((s, i) => (
                    <li key={s} className={i === d.at ? gs.stepOn : undefined} aria-hidden="true">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <p className={gs.partName}>{p.name}</p>
          <p className={gs.para}>{p.text}</p>
        </section>
      ))}

      {!snapshot && (
        <section className={`${t.card} ${gs.cShare}`} aria-labelledby="gwansang-share-title">
          <h2 id="gwansang-share-title" className={t.cardTitle}>
            결과 보내기
          </h2>
          <p className={t.cardLead}>
            링크에는 사진이 아니라 칸 번호(예: 눈매 세 칸 중 몇 번째)만 담겨서, 원래 사진을 되돌릴 수 없어요. 다만
            &lsquo;친구에게 알려주기&rsquo;로 만드는 이미지 카드에는 분석에 쓴 사진이 들어가요.
          </p>
          <div className={styles.shareRow}>
            <button type="button" className={styles.cta} onClick={share}>
              친구에게 알려주기
            </button>
            <button type="button" className={styles.ghostSm} onClick={copyLink}>
              링크 복사
            </button>
          </div>
          {hint && <p className={styles.shareHint}>{hint}</p>}
        </section>
      )}

      <p className={gs.disclaimer}>{TEXTS.disclaimer}</p>
    </>
  );
}
