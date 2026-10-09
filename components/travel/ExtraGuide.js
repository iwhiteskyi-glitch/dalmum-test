import styles from "./travel.module.css";

// 나라 데이터의 extras 항목(제목·문단·표현 묶음)을 그려 줍니다. 인사말 탭과 같은 모양을 재사용해요.
export default function ExtraGuide({ extra }) {
  return (
    <>
      <h3 className={styles.extraHeading}>{extra.heading}</h3>
      {extra.paragraphs.map((p) => (
        <p key={p} className={styles.extraText}>
          {p}
        </p>
      ))}
      {extra.groups.map((g) => (
        <div key={g.title} className={styles.extraGroup}>
          <h4 className={styles.extraGroupTitle}>{g.title}</h4>
          <ul className={styles.phraseList}>
            {g.rows.map((r) => (
              <li key={`${r.text_local}-${r.meaning_kr}`} className={styles.phraseRow}>
                <span className={styles.phraseKr}>{r.meaning_kr}</span>
                <span className={styles.phraseLocal}>
                  <span lang={g.lang_code}>{r.text_local}</span>
                  <span className={styles.phraseReading}>{r.pronunciation_kr}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {extra.footnote ? <p className={styles.phraseNote}>※ {extra.footnote}</p> : null}
    </>
  );
}
