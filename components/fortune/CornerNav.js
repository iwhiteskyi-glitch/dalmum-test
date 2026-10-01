import Link from "next/link";
import styles from "./fortune.module.css";

// 운세 코너 안의 페이지 전환 버튼. 궁합 등 새 페이지가 생기면 여기에 추가하세요.
const PAGES = [
  { key: "today", href: "/fortune", label: "오늘의 운세" },
  { key: "saeun", href: "/fortune/saeun", label: "신년운세" },
  { key: "saju", href: "/fortune/saju", label: "내 사주" },
];

export default function CornerNav({ current }) {
  return (
    <nav className={styles.cornerNav} aria-label="운세 코너 메뉴">
      {PAGES.map((p) => (
        <Link
          key={p.key}
          href={p.href}
          className={`${styles.cornerNavItem} ${current === p.key ? styles.cornerNavOn : ""}`}
          aria-current={current === p.key ? "page" : undefined}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
