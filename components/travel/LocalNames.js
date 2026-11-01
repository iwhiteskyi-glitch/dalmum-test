import styles from "./travel.module.css";

/**
 * 도시 이름을 현지어·영어로 어떻게 쓰는지 보여 주는 작은 상자.
 * 데이터: lib/travel/data/<나라>.json 의 city.local_name = { names: [{ lang, text, read? }], note? }
 * ("유후인 일본어로", "나트랑 영어로" 같은 검색에 바로 답하려고 둠, 2026-11)
 */
export default function LocalNames({ cityName, local }) {
  if (!local?.names?.length) return null;
  return (
    <section className={styles.localNames} aria-labelledby="local-names-title">
      <h2 id="local-names-title" className={styles.localNamesTitle}>
        {cityName}, 현지어로는?
      </h2>
      <dl className={styles.localNamesList}>
        {local.names.map((n) => (
          <div key={n.lang + n.text} className={styles.localNamesRow}>
            <dt>{n.lang}</dt>
            <dd>
              <span className={styles.localNamesText}>{n.text}</span>
              {n.read && <span className={styles.localNamesRead}>{n.read}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {local.note && <p className={styles.localNamesNote}>{local.note}</p>}
    </section>
  );
}

/** 검색 결과 설명에 넣을 짧은 글: "유후인 현지어 표기: 일본어 由布院(ゆふいん) · 영어 Yufuin." */
export function localNamesSentence(cityName, local) {
  if (!local?.names?.length) return "";
  const parts = local.names.map((n) => `${n.lang} ${n.text}${n.read && !/[가-힣]/.test(n.read) ? `(${n.read})` : ""}`);
  return `${cityName} 현지어 표기: ${parts.join(" · ")}.`;
}
