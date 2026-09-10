import type { MetadataRoute } from "next";

import {
  PUBLIC_PATHS,
  PUBLIC_PAGE_UPDATED,
  SITE_URL,
} from "@/features/landing/site-constants";

function priorityFor(path: (typeof PUBLIC_PATHS)[number]): number {
  if (path === "/") return 1;
  if (path === "/landing/calculadora") return 0.9;
  return 0.6;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(`${PUBLIC_PAGE_UPDATED[path]}T00:00:00-03:00`),
    changeFrequency: path.includes("/guias/") ? "monthly" : "weekly",
    priority: priorityFor(path),
  }));
}
