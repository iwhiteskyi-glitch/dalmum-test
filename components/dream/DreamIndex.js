import Link from "next/link";
import styles from "@/components/fortune/fortune.module.css";
import ds from "./dream.module.css";
import { dreamIndex } from "@/lib/dream/pages";

/** 상세 페이지가 있는 꿈을 카테고리별로 모은 목록(검색엔진이 따라갈 수 있는 링크) */
export default function DreamIndex({ current, title = "꿈 해몽 모아보기" }) {
  const groups = dreamIndex();
  if (groups.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="dream-index">
      <h2 id="dream-index" className={styles.sectionTitle}>
        {title}
      </h2>
      {groups.map((g) => (
        <div key={g.id} className={ds.indexGroup}>
          <h3 className={ds.indexGroupTitle}>{g.label}</h3>
          <ul className={ds.indexList}>
            {g.items.map((it) => (
              <li key={it.id}>
                <Link href={it.href} aria-current={it.id === current ? "page" : undefined}>
                  {it.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
