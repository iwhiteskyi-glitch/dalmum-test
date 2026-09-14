import Link from "next/link";
import styles from "./site.module.css";

/** 영문(/en) 페이지 전용 푸터. SiteFooter.js의 영문판. */
const FOOTER_LINKS_EN = [
  { href: "/en/about", label: "About" },
  { href: "/en/guide", label: "Guide" },
  { href: "/en/reads", label: "Reads" },
  { href: "/en/faq", label: "FAQ" },
  { href: "/en/privacy", label: "Privacy Policy" },
  { href: "/en/terms", label: "Terms of Service" },
  { href: "/en/contact", label: "Contact" },
];

export default function SiteFooterEn() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.footerInner} aria-label="Site footer menu">
        {FOOTER_LINKS_EN.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
      <p className={styles.footerNote}>
        © {new Date().getFullYear()} Dalmum · A just-for-fun look-alike analysis
        service. Scores are based on comparing facial landmark positions for
        entertainment only, and can't be used for identity verification,
        paternity testing, or any other official purpose. Uploaded photos are
        never sent to or stored on a server — everything is analyzed in your
        browser.
      </p>
    </footer>
  );
}
