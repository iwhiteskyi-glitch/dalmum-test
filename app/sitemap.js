import { SITE } from "@/lib/site";
import { READS } from "@/lib/reads";
import { READS_EN } from "@/lib/readsEn";
import { COUNTRIES, cityPath } from "@/lib/travel/data";

export default function sitemap() {
  const now = new Date();
  const staticRoutes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/guide", priority: 0.7, changeFrequency: "monthly" },
    { path: "/reads", priority: 0.6, changeFrequency: "weekly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.3, changeFrequency: "yearly" },
  ];

  // 여행 이름 섹션: 시작 페이지 + 나라 페이지 + 도시 페이지. 아래 enRoutes 복제 대상인
  // staticRoutes에는 넣지 않고 따로 관리해, /en 아래에 절대 생기지 않게 합니다
  // (EN에서는 이 기능을 안내하지 않음).
  const travelRoutes = [
    { path: "/travel", priority: 0.8, changeFrequency: "weekly" },
    ...COUNTRIES.flatMap((country) => [
      { path: `/travel/${country.code}`, priority: 0.6, changeFrequency: "monthly" },
      ...country.cities.map((city) => ({
        path: cityPath(country.code, city.city_code),
        priority: 0.5,
        changeFrequency: "monthly",
      })),
    ]),
  ];

  // 영문(/en) 페이지도 같은 구조라, 위 한국어 경로 목록 앞에 "/en"만 붙여
  // 그대로 재사용합니다. 우선순위는 한국어보다 살짝 낮춰 기본(한국어) 페이지가
  // 검색결과에서 우선되도록 합니다.
  const enRoutes = staticRoutes.map((r) => ({
    path: `/en${r.path === "/" ? "" : r.path}`,
    priority: Math.max(r.priority - 0.1, 0.1),
    changeFrequency: r.changeFrequency,
  }));

  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...enRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...travelRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...READS.map((r) => ({
      url: `${SITE.url}/reads/${r.slug}`,
      lastModified: new Date(r.date),
      changeFrequency: "monthly",
      priority: 0.5,
    })),
    ...READS_EN.map((r) => ({
      url: `${SITE.url}/en/reads/${r.slug}`,
      lastModified: new Date(r.date),
      changeFrequency: "monthly",
      priority: 0.4,
    })),
  ];
}
