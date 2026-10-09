/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 옛 주소(dalmum.com)로 들어온 사람을 새 주소(www.jaemirobom.com)로 영구 이동(308)시킵니다.
  // - dalmum.com 첫 화면은 원래 닮은꼴 테스트였으므로 /face 로 보냅니다.
  // - 나머지(/guide, /travel/japan 등)는 같은 경로로 보냅니다.
  // 검색엔진도 이 "영구 이동"을 보고 옛 주소의 검색 정보를 새 주소로 옮겨 줍니다.
  async redirects() {
    const OLD_HOST = [{ type: "host", value: "(www\\.)?dalmum\\.com" }];
    return [
      { source: "/", has: OLD_HOST, destination: "https://www.jaemirobom.com/face", permanent: true },
      { source: "/:path*", has: OLD_HOST, destination: "https://www.jaemirobom.com/:path*", permanent: true },
      // 예전 영어판(/en, /en/…)은 없앴어요. 검색엔진에 남은 옛 주소는 같은 내용의 한국어 페이지로 보내요
      // (/en 첫 화면은 영어 닮은꼴 테스트였으므로 /face 로).
      { source: "/en", destination: "/face", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ];
  },
  // 얼굴 분석은 100% 브라우저에서 실행됩니다. 사진은 서버로 전송되지 않습니다.
  webpack: (config) => {
    // @vladmandic/face-api 안의 Node.js용 동적 require 경고는 브라우저 사용과 무관하므로 숨깁니다.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /@vladmandic[\\/]face-api/ },
    ];
    return config;
  },
};

module.exports = nextConfig;
