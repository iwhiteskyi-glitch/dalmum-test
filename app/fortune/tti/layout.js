// 띠별 운세는 애드센스 심사가 끝날 때까지 비공개예요(검색엔진에 노출하지 않음).
// 공개할 때 이 robots 설정을 지우고 sitemap·운세 코너 메뉴에 등록하세요.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function TtiLayout({ children }) {
  return children;
}
