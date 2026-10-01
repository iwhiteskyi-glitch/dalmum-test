// 확정 원고(.md) → 읽을거리 페이지(app/(content)/reads/<slug>/page.js) 변환
// 사용법: node md2page.mjs <원고.md> <slug>
// 원고 형식: "# 제목" / "설명: ..." / 본문(## 소제목, 문단, - 목록, **굵게**, [글자](/주소)) / "---" 이후는 무시
import fs from "fs";

const [, , src, slug] = process.argv;
const ROOT = "C:/Users/조기남/Desktop/얼굴비교";
const raw = fs.readFileSync(src, "utf8").replace(/\r\n/g, "\n");
const body = raw.split(/\n---\n/)[0];
const lines = body.split("\n");

const title = lines.find((l) => l.startsWith("# ")).slice(2).trim();
const desc = (lines.find((l) => l.startsWith("설명:")) || "").replace(/^설명:\s*/, "").trim();

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
const inline = (s) => {
  let out = esc(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, href) =>
    href.startsWith("/") ? `<Link href="${href}">${t}</Link>` : `<a href="${href}" target="_blank" rel="noopener noreferrer">${t}</a>`
  );
  return out;
};

const out = [];
let para = [];
let list = null;
const flushPara = () => {
  if (para.length) out.push(`      <p>\n        ${inline(para.join(" "))}\n      </p>`);
  para = [];
};
const flushList = () => {
  if (list) out.push(`      <ul>\n${list.map((li) => `        <li>${inline(li)}</li>`).join("\n")}\n      </ul>`);
  list = null;
};

for (const l of lines) {
  if (l.startsWith("# ") || l.startsWith("설명:")) continue;
  if (l.startsWith("## ")) { flushPara(); flushList(); out.push(`      <h2>${inline(l.slice(3).trim())}</h2>`); continue; }
  if (l.startsWith("### ")) { flushPara(); flushList(); out.push(`      <h3>${inline(l.slice(4).trim())}</h3>`); continue; }
  if (/^\s*[-*] /.test(l)) { flushPara(); (list ||= []).push(l.replace(/^\s*[-*] /, "").trim()); continue; }
  if (!l.trim()) { flushPara(); flushList(); continue; }
  flushList();
  para.push(l.trim());
}
flushPara(); flushList();

const usesLink = out.some((o) => o.includes("<Link "));
const page = `${usesLink ? 'import Link from "next/link";\n' : ""}import ReadArticle, { readMetadata } from "@/components/ReadArticle";

const SLUG = "${slug}";
export const metadata = readMetadata(SLUG);

export default function Page() {
  return (
    <ReadArticle slug={SLUG}>
${out.join("\n\n")}
    </ReadArticle>
  );
}
`;
const dir = `${ROOT}/app/(content)/reads/${slug}`;
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/page.js`, page);
console.log(JSON.stringify({ slug, title, desc, chars: body.length }));
