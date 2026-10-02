"use client";

import { useEffect, useRef, useState } from "react";
import { drawCropInto, panCropEntry } from "@/lib/faceAnalysis";

/**
 * 사진 업로드 + 위치/확대 조정 슬롯.
 * - 사진이 없으면: 클릭/드래그로 파일을 고르는 드롭존
 * - 사진이 있으면: 캔버스에 그려서 드래그로 이동, 슬라이더로 확대/축소
 *   (원 가이드 안에 보이는 영역이 실제로 분석에 쓰이는 영역과 항상 동일)
 *
 * 닮은꼴 테스트(app/face/page.js)에서 쓰던 컴포넌트를 그대로 옮겨왔습니다
 * (로직은 전혀 바꾸지 않았어요). 코너마다 색이 다르므로, 쓸 CSS 모듈을
 * `styles` prop으로 받아 그 모듈의 클래스 이름(cropFrame·slot·slotPlus 등)을
 * 그대로 사용합니다 — 각 코너는 같은 이름의 클래스를 자기 색으로 정의하면 됩니다.
 */
export default function PhotoSlot({ entry, placeholder, onPick, onChange, onClear, styles }) {
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
    <div ref={wrapRef} className={`${styles.cropFrame} ${entry ? styles.cropFrameFilled : ""}`}>
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
