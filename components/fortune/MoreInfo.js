import styles from "./fortune.module.css";

/**
 * 결과 아래 "더 알아보기" 영역. 결과 카드와 다른 바탕색으로 묶고,
 * 안의 설명은 제목만 보이게 접어 둡니다. 접힌 글도 HTML에 그대로 들어 있어
 * 검색엔진·심사에서는 다 읽힙니다.
 */
export function MoreInfo({ title, lead, children }) {
  return (
    <>
      {/* 결과(또는 입력 화면)와 참고 글이 섞여 보이지 않도록, 상자 위에 경계를 글로 분명히 표시해요 */}
      <div className={styles.moreDivider} role="separator">
        <span>여기부터는 참고 정보예요</span>
      </div>
      <section className={styles.more} aria-labelledby="more-title">
      <p className={styles.moreKicker}>더 알아보기</p>
      <h2 id="more-title" className={styles.moreTitle}>
        {title}
      </h2>
      {lead && <p className={styles.moreLead}>{lead}</p>}
        <div className={styles.folds}>{children}</div>
      </section>
    </>
  );
}

/** 접었다 펼치는 항목 하나. open을 주면 처음부터 펼쳐 둬요(각 페이지의 첫 항목). */
export function Fold({ title, hint, open = false, children }) {
  return (
    <details className={styles.fold} open={open}>
      <summary>
        <h3 className={styles.foldTitle}>{title}</h3>
        {hint && <span className={styles.foldHint}>{hint}</span>}
      </summary>
      <div className={styles.foldBody}>{children}</div>
    </details>
  );
}
