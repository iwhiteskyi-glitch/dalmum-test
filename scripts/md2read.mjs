// 확정 원고(마크다운)를 읽을거리 페이지(app/(content)/reads/<slug>/page.js)로 바꿔요.
// 실행: node scripts/md2read.mjs docs/reads/확정/<slug>.md [...]
// 원고 형식: "# 제목" / "설명: …" / "코너: …" / 본문(## 소제목, 문단, - 목록, **굵게**, [글자](주소)) / "---" 아래는 출처 메모(페이지에 안 넣음)
// 출력: 페이지 파일을 쓰고, lib/reads.js에 넣을 항목을 화면에 찍어요(목록 맨 위에 직접 붙여 넣기).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

// JSX 글자 안에서 문제가 되는 기호를 바꾸고, 굵게·링크를 태그로 바꿔요.
function inline(text) {
  const esc = (s) => s.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = "";
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m; (m = re.exec(text)); last = re.lastIndex) {
    out += esc(text.slice(last, m.index));
    if (m[1] != null) out += `<strong>${inline(m[1])}</strong>`;
    else if (m[3].startsWith("/")) out += `<Link href="${m[3]}">${esc(m[2])}</Link>`;
    else out += `<a href="${m[3]}" target="_blank" rel="noopener noreferrer">${esc(m[2])}</a>`;
  }
  return out + esc(text.slice(last));
}

function convert(path) {
  const slug = basename(path, ".md");
  const lines = readFileSync(path, "utf8").replace(/\r/g, "").split("\n");
  let title = "", description = "", corner = "";
  const body = [];
  for (const line of lines) {
    if (/^---\s*$/.test(line)) break; // 출처 메모부터는 페이지에 안 넣어요
    if (!title && line.startsWith("# ")) title = line.slice(2).trim();
    else if (!description && line.startsWith("설명:")) description = line.slice(3).trim();
    else if (!corner && line.startsWith("코너:")) corner = line.slice(3).trim();
    else body.push(line);
  }
  if (!title || !description || !corner) throw new Error(`${slug}: 제목·설명·코너 줄이 필요해요`);

  const blocks = [];
  let para = [], list = [];
  const flush = () => {
    if (para.length) blocks.push(`      <p>\n        ${inline(para.join(" "))}\n      </p>`);
    if (list.length) blocks.push(`      <ul>\n${list.map((l) => `        <li>${inline(l)}</li>`).join("\n")}\n      </ul>`);
    para = [];
    list = [];
  };
  for (const raw of body) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith("## ")) {
      flush();
      blocks.push(`      <h2>${inline(line.slice(3).trim())}</h2>`);
    } else if (/^[-*] /.test(line)) {
      if (para.length) flush();
      list.push(line.slice(2).trim());
    } else {
      if (list.length) flush();
      para.push(line);
    }
  }
  flush();

  const usesLink = blocks.some((b) => b.includes("<Link "));
  const page = `${usesLink ? 'import Link from "next/link";\n' : ""}import ReadArticle, { readMetadata } from "@/components/ReadArticle";

const SLUG = "${slug}";
export const metadata = readMetadata(SLUG);

export default function Page() {
  return (
    <ReadArticle slug={SLUG}>
${blocks.join("\n\n")}
    </ReadArticle>
  );
}
`;
  const dir = join(ROOT, "app", "(content)", "reads", slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "page.js"), page);
  const chars = body.join("").replace(/^#+ /gm, "").length;
  console.log(`  {
    slug: "${slug}",
    title: ${JSON.stringify(title)},
    description:
      ${JSON.stringify(description)},
    date: "${today}",
    corner: "${corner}",
  },`);
  console.error(`✓ ${slug} (${chars}자, 블록 ${blocks.length}개)`);
}

for (const p of process.argv.slice(2)) convert(p);
