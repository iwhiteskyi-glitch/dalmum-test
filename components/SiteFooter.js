import Link from "next/link";
import styles from "./site.module.css";
import BrandLogo from "./BrandLogo";
import { FOOTER_LINKS, SITE } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <BrandLogo size={22} />
        <strong>{SITE.name}</strong>
        <span>{SITE.shortDesc}</span>
      </div>
      <nav className={styles.footerInner} aria-label="사이트 하단 메뉴">
        {FOOTER_LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
      <p className={styles.footerNote}>
        © {new Date().getFullYear()} {SITE.name}. 모든 결과는 재미로 보는 콘텐츠이며 정확성을
        보장하지 않고, 신원 확인·친자 판별 등 어떤 공식적 용도로도 쓸 수 없습니다. 업로드한
        사진과 입력한 정보는 서버로 전송·저장되지 않고 브라우저 안에서만 처리됩니다.
      </p>
    </footer>
  );
}
