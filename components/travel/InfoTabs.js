"use client";

import { useState } from "react";
import styles from "./travel.module.css";

// 탭 내용은 서버에서 모두 그려서 넘겨받습니다. 화면에는 하나씩만 보이지만 페이지 안에는
// 전부 들어 있어서, 검색엔진은 인사말·명소·음식을 모두 읽을 수 있습니다.
export default function InfoTabs({ id, title, items }) {
  const [active, setActive] = useState(items[0].key);
  return (
    <section className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        {title}
      </h2>
      <div className={styles.tabs} role="tablist" aria-label={title}>
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            role="tab"
            id={`${id}-tab-${it.key}`}
            aria-selected={active === it.key}
            aria-controls={`${id}-panel-${it.key}`}
            className={`${styles.tab} ${active === it.key ? styles.tabOn : ""}`}
            onClick={() => setActive(it.key)}
          >
            {it.label}
          </button>
        ))}
      </div>
      {items.map((it) => (
        <div
          key={it.key}
          role="tabpanel"
          id={`${id}-panel-${it.key}`}
          aria-labelledby={`${id}-tab-${it.key}`}
          hidden={active !== it.key}
        >
          {it.content}
        </div>
      ))}
    </section>
  );
}
