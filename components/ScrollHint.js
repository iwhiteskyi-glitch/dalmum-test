"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ScrollHint.module.css";

/**
 * 가로로 넘기는 탭 줄. 옆에 가려진 탭이 있으면 그쪽 끝을 흐리게 하고 화살표를 띄워
 * "더 있다"는 걸 보여 줍니다. 화살표를 누르면 그쪽으로 넘어갑니다.
 * bg: 탭 줄 바로 뒤 배경색(흐려지는 끝이 이 색으로 섞임), radius: 탭 줄 모서리.
 */
export default function ScrollHint({ as: Tag = "div", className, wrapClassName, bg = "var(--bg)", radius = "0", children, ...rest }) {
  const ref = useRef(null);
  const [more, setMore] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const nudge = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: "smooth" });
  };

  return (
    <div className={`${styles.wrap} ${wrapClassName || ""}`} style={{ "--hint-bg": bg, "--hint-radius": radius }}>
      <Tag ref={ref} className={className} {...rest}>
        {children}
      </Tag>
      {more.left && (
        <span className={`${styles.hint} ${styles.left}`}>
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)}>
            ‹
          </button>
        </span>
      )}
      {more.right && (
        <span className={`${styles.hint} ${styles.right}`}>
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)}>
            ›
          </button>
        </span>
      )}
    </div>
  );
}
