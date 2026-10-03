import Link from "next/link";
import ds from "./dream.module.css";
import { dreamIndex } from "@/lib/dream/pages";

/**
 * 상세 페이지가 있는 꿈을 카테고리별로 모은 목록(검색엔진이 따라갈 수 있는 링크).
 * 위의 상징 선택 칩과 겹쳐 화면만 길어져서 접어 두고, 접힌 링크도 HTML에는 그대로 있습니다.
 */
export default function DreamIndex({ current, title = "꿈 해몽 모아보기" }) {
  const groups = dreamIndex();
  if (groups.length === 0) return null;
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <details className={ds.indexFold}>
      <summary>
        <h2 className={ds.indexFoldTitle}>{title}</h2>
        <span className={ds.indexFoldHint}>상황별 풀이가 있는 꿈 {total}개</span>
      </summary>
      <div className={ds.indexFoldBody}>
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
      </div>
    </details>
  );
}
