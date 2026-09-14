import PageClient from "./PageClient";

/**
 * 이 파일은 서버 컴포넌트로 남겨서 metadata를 내보내는 용도로만 씁니다.
 * 실제 화면(업로드/분석/결과) 로직은 PageClient.js(클라이언트 컴포넌트)에 있습니다.
 * ("use client" 컴포넌트는 metadata를 직접 내보낼 수 없어서 이렇게 분리했습니다.)
 *
 * title에 absolute를 써서 상위 레이아웃(app/en/layout.js, 루트 layout.js)의
 * title 템플릿이 겹쳐 붙지 않고 이 문구 그대로 나오게 합니다.
 */
export const metadata = {
  title: { absolute: "Dalmum — How much do you look alike?" },
  description:
    "Compare two photos and see how similar your eyes, nose, mouth, and face shape are — a free, just-for-fun look-alike test. Photos are never uploaded or stored.",
  alternates: { canonical: "/en" },
};

export default function Page() {
  return <PageClient />;
}
