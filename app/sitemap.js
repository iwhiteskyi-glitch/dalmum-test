import { SITE } from "@/lib/site";
import { READS } from "@/lib/reads";
import { COUNTRIES, cityPath } from "@/lib/travel/data";
import { ILGAN_SLUGS, ilganHref } from "@/lib/fortune/ilgan";

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

  const cornerRoutes = [
    { path: "/face", priority: 0.9, changeFrequency: "weekly" },
    { path: "/maker", priority: 0.4, changeFrequency: "monthly" },
  ];

  // 운세 코너: 오늘의 운세·내 사주 + 일간 10종 소개 페이지. 매일 바뀌는 "오늘의 운세"는
  // changeFrequency를 daily로 둡니다.
  const fortuneRoutes = [
    { path: "/fortune", priority: 0.9, changeFrequency: "daily" },
    { path: "/fortune/saeun", priority: 0.85, changeFrequency: "monthly" },
    { path: "/fortune/saju", priority: 0.8, changeFrequency: "weekly" },
    ...ILGAN_SLUGS.map((_, i) => ({
      path: ilganHref(i),
      priority: 0.5,
      changeFrequency: "monthly",
    })),
  ];

  // 궁합 코너: 사주 엔진을 재사용하는 네 번째 코너.
  const gunghapRoutes = [{ path: "/gunghap", priority: 0.85, changeFrequency: "weekly" }];

  // 관상 코너: 닮은꼴의 얼굴 인식 엔진을 재사용하는 다섯 번째 코너.
  const gwansangRoutes = [{ path: "/gwansang", priority: 0.85, changeFrequency: "weekly" }];

  // 꿈해몽 코너: 사진·생년월일 없이 상징 선택만으로 보는 여섯 번째 코너.
  const dreamRoutes = [{ path: "/dream", priority: 0.85, changeFrequency: "weekly" }];

  // 여행 이름 섹션: 시작 페이지 + 나라 페이지 + 도시 페이지.
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

  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...cornerRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...fortuneRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...gunghapRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...gwansangRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...dreamRoutes.map((r) => ({
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
  ];
}
