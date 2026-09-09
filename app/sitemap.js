import { SITE } from "@/lib/site";
import { READS } from "@/lib/reads";

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

  return [
    ...staticRoutes.map((r) => ({
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
