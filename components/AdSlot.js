"use client";

import { useEffect, useRef } from "react";
import styles from "./AdSlot.module.css";
import { ADS } from "@/lib/site";

/**
 * 광고 자리. AdSense 게시자 ID와 슬롯 ID가 모두 설정된 경우에만 실제 광고를 띄우고,
 * 그 전까지는 레이아웃이 밀리지 않도록 같은 높이의 자리표시만 보여줍니다.
 * 콘텐츠와 버튼에서 충분히 떨어진 위치에만 배치하세요. (오클릭 유도 금지)
 */
export default function AdSlot({ slot }) {
  const pushed = useRef(false);
  const client = ADS.client;
  const slotId = ADS.slots[slot] || "";
  const live = Boolean(client && slotId);

  useEffect(() => {
    if (!live || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* 스크립트 로드 전이면 무시 (로드 후 자동 처리됨) */
    }
  }, [live]);

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <p className={styles.label}>광고</p>
        {live ? (
          <ins
            className={`adsbygoogle ${styles.ins}`}
            style={{ display: "block" }}
            data-ad-client={client}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div className={styles.placeholder}>광고 영역 (AdSense 승인 후 표시)</div>
        )}
      </div>
    </div>
  );
}
