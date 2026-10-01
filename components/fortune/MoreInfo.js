import styles from "./fortune.module.css";

/**
 * 결과 아래 "더 알아보기" 영역. 결과 카드와 다른 바탕색으로 묶고,
 * 안의 설명은 제목만 보이게 접어 둡니다. 접힌 글도 HTML에 그대로 들어 있어
 * 검색엔진·심사에서는 다 읽힙니다.
 */
export function MoreInfo({ title, lead, children }) {
  return (
    <section className={styles.more} aria-labelledby="more-title">
      <p className={styles.moreKicker}>더 알아보기</p>
      <h2 id="more-title" className={styles.moreTitle}>
        {title}
      </h2>
      {lead && <p className={styles.moreLead}>{lead}</p>}
      <div className={styles.folds}>{children}</div>
    </section>
  );
}

/** 접었다 펼치는 항목 하나 */
export function Fold({ title, hint, children }) {
  return (
    <details className={styles.fold}>
      <summary>
        <h3 className={styles.foldTitle}>{title}</h3>
        {hint && <span className={styles.foldHint}>{hint}</span>}
      </summary>
      <div className={styles.foldBody}>{children}</div>
    </details>
  );
}
