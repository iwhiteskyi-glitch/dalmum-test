import Link from "next/link";
import styles from "./site.module.css";
import { FOOTER_LINKS, SITE } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.footerInner} aria-label="사이트 하단 메뉴">
        {FOOTER_LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
      <p className={styles.footerNote}>
        © {new Date().getFullYear()} {SITE.name} · 재미로 보는 닮은꼴 분석 서비스. 부위별
        수치는 얼굴 특징점 위치를 비교한 재미용 결과이며 신원 확인·친자 판별 등 어떤
        공식적 용도로도 쓸 수 없습니다. 업로드한 사진은 서버로 전송·저장되지 않고
        브라우저 안에서만 분석됩니다.
      </p>
    </footer>
  );
}
