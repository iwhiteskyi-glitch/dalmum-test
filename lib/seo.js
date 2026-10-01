import { SITE } from "@/lib/site";

/**
 * 일반 페이지(소개·FAQ·약관·읽을거리 등)의 검색·공유 정보.
 * 최상위 레이아웃의 공유 미리보기(openGraph)는 첫 화면용이라, 그대로 두면 카톡 등에
 * 이 페이지를 보내도 첫 화면 제목·주소가 뜹니다. 그래서 페이지마다 제목·설명·주소를 지정합니다.
 * (미리보기 그림은 app/opengraph-image.png가 자동으로 붙습니다.)
 */
export function pageMetadata({ title, description, path, type = "website" }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} — ${SITE.name}`,
      description,
      url: path,
      type,
      siteName: SITE.name,
      locale: "ko_KR",
    },
  };
}
