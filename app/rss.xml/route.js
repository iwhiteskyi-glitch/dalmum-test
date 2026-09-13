import { SITE } from "@/lib/site";
import { READS } from "@/lib/reads";

/**
 * /rss.xml — "읽을거리" 글 목록을 RSS 2.0 형식으로 제공합니다.
 * 네이버 서치어드바이저의 "RSS 제출" 기능 등, 검색엔진이 새 글을 더 빨리
 * 찾아가도록 돕는 용도입니다. (검색 등록 자체를 대신하진 않습니다.)
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const items = [...READS]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((r) => {
      const url = `${SITE.url}/reads/${r.slug}`;
      const pubDate = new Date(r.date).toUTCString();
      return `  <item>
    <title>${escapeXml(r.title)}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <description>${escapeXml(r.description)}</description>
    <pubDate>${pubDate}</pubDate>
  </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(SITE.name)} — 읽을거리</title>
  <link>${SITE.url}/reads</link>
  <description>${escapeXml(SITE.description)}</description>
  <language>ko</language>
${items}
</channel>
</rss>
`;

  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
