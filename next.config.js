/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
