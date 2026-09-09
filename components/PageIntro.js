import styles from "./site.module.css";

export default function PageIntro({ kicker, title, lead, meta }) {
  return (
    <>
      {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
      <h1 className={styles.pageTitle}>{title}</h1>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {meta ? <p className={styles.meta}>{meta}</p> : null}
    </>
  );
}
