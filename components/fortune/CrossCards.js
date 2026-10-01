import Link from "next/link";
import styles from "./fortune.module.css";

// 운세 코너 페이지 아래쪽: 다른 코너로 가는 카드
export default function CrossCards() {
  return (
    <section className={styles.section}>
      <Link href="/face" className={styles.crossCard} style={{ background: "var(--c-face-soft)" }}>
        <span>
          <strong>우리 얼마나 닮았을까?</strong>
          <span>사진 두 장으로 보는 닮은꼴 테스트도 해보세요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>
      <Link href="/travel" className={styles.crossCard} style={{ background: "var(--c-travel-soft)" }}>
        <span>
          <strong>여행 가면 내 이름은?</strong>
          <span>여행지를 고르면 현지 감성 이름 카드를 만들어 드려요</span>
        </span>
        <span className={styles.crossArrow} aria-hidden="true">
          →
        </span>
      </Link>
    </section>
  );
}
