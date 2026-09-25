import styles from "./travel.module.css";

export default function Phrases({ country }) {
  const notes = country.phrases.filter((p) => p.note).map((p) => p.note);
  return (
    <>
      <ul className={styles.phraseList}>
        {country.phrases.map((p) => (
          <li key={p.meaning_kr} className={styles.phraseRow}>
            <span className={styles.phraseKr}>{p.meaning_kr}</span>
            <span className={styles.phraseLocal}>
              <span lang={country.lang_code}>{p.text_local}</span>
              <span className={styles.phraseReading}>{p.pronunciation_kr}</span>
            </span>
          </li>
        ))}
      </ul>
      {notes.map((n) => (
        <p key={n} className={styles.phraseNote}>
          ※ {n}
        </p>
      ))}
    </>
  );
}
