import type { MetadataRoute } from "next";

import { PUBLIC_PATHS, SITE_URL } from "@/features/landing/site-constants";

function priorityFor(path: (typeof PUBLIC_PATHS)[number]): number {
  if (path === "/landing") return 1;
  if (path === "/landing/calculadora") return 0.9;
  return 0.6;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const updatedAt = new Date("2026-07-16T00:00:00-03:00");

  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: updatedAt,
    changeFrequency: path.includes("/guias/") ? "monthly" : "weekly",
    priority: priorityFor(path),
  }));
}
