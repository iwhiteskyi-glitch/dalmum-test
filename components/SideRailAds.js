"use client";

import { useEffect, useState } from "react";
import styles from "./SideRailAds.module.css";
import { ADS } from "@/lib/site";

/**
 * PC 양옆 세로 광고. 본문 양옆 빈 공간이 광고를 넣고도 남을 만큼 넓을 때만 그리고,
 * 모바일·좁은 화면에서는 광고를 아예 불러오지 않습니다(숨긴 광고를 불러오면 정책 위반이라서).
 * 화면에 붙어서 따라오지만 본문과는 겹치지 않아요. 게시자 ID와 "side" 슬롯 ID가 모두
 * 있어야 켜지고, 그 전에는 아무것도 그리지 않습니다.
 */
const GAP = 24; // 본문·화면 끝과 광고 사이 여백
const SIZES = [
  { w: 300, h: 600 },
  { w: 160, h: 600 },
];
const LABEL_H = 22;

function measure() {
  // 헤더 안쪽 폭이 그 페이지 본문 폭과 같아요(닮은꼴 1120px, 나머지 920px).
  // 허브처럼 본문이 조금 더 넓은 페이지도 있어서 40px 여유를 더 둡니다.
  const anchor = document.querySelector("[data-content-width]");
  const content = (anchor ? anchor.getBoundingClientRect().width : 920) + 40;
  const vw = document.documentElement.clientWidth;
  const side = (vw - content) / 2 - GAP * 2;
  const header = document.querySelector("header");
  const top = Math.round((header ? header.getBoundingClientRect().height : 0) + GAP);
  const size = SIZES.find((s) => s.w <= side);
  if (!size || window.innerHeight < top + LABEL_H + size.h + GAP) return null;
  return { ...size, top, offset: Math.round(content / 2 + GAP) };
}

export default function SideRailAds() {
  const live = Boolean(ADS.client && ADS.slots.side);
  const [rail, setRail] = useState(null);

  useEffect(() => {
    if (!live) return;
    let timer;
    const update = () => setRail(measure());
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(update, 300);
    };
    update();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [live]);

  if (!live || !rail) return null;
  // 크기가 바뀌면 key가 달라져 광고를 새로 불러와요(이미 채워진 광고 칸은 크기를 바꿀 수 없어서).
  return (
    <>
      <Rail key={`l${rail.w}`} side="left" rail={rail} />
      <Rail key={`r${rail.w}`} side="right" rail={rail} />
    </>
  );
}

function Rail({ side, rail }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* 스크립트 로드 전이면 무시 (로드 후 자동 처리됨) */
    }
  }, []);

  const pos = side === "left" ? { right: `calc(50% + ${rail.offset}px)` } : { left: `calc(50% + ${rail.offset}px)` };
  return (
    <aside className={styles.rail} style={{ top: rail.top, width: rail.w, ...pos }} aria-label="광고">
      <p className={styles.label}>광고</p>
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: rail.w, height: rail.h }}
        data-ad-client={ADS.client}
        data-ad-slot={ADS.slots.side}
      />
    </aside>
  );
}
