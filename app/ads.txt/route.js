import { ADS } from "@/lib/site";

/**
 * /ads.txt — AdSense가 요구하는 판매자 인증 파일.
 * 게시자 ID(NEXT_PUBLIC_ADSENSE_CLIENT)가 설정되면 자동으로 올바른 내용을 제공합니다.
 */
export function GET() {
  if (!ADS.client) {
    return new Response("Not found", { status: 404 });
  }
  const pub = ADS.client.replace(/^ca-/, ""); // "ca-pub-123..." → "pub-123..."
  const body = `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
