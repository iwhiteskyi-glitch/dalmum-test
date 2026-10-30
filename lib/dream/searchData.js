// 검색 색인에 쓰는 글만 pages.json에서 뽑습니다 — 상황별 풀이 제목과 자주 묻는 질문(본문은 안 보냄).
// 서버 컴포넌트에서 불러 클라이언트에 prop으로 넘기면, 브라우저는 300KB짜리 pages.json 없이 검색할 수 있어요.
import PAGES from "./pages.json";

export function dreamSearchTitles() {
  return Object.fromEntries(
    Object.entries(PAGES).map(([id, p]) => [
      id,
      {
        searchName: p.searchName,
        situations: p.situations.map((s) => s.title),
        faq: (p.faq || []).map((f) => f.q),
      },
    ])
  );
}
