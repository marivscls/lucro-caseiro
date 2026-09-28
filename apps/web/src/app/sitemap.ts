import type { MetadataRoute } from "next";

import {
  PUBLIC_PATHS,
  PUBLIC_PAGE_UPDATED,
  SITE_URL,
} from "@/features/landing/site-constants";
import { SOLUTIONS } from "@/features/landing/solution-content";

const SOLUTION_SLUGS = Object.keys(SOLUTIONS);

function priorityFor(path: (typeof PUBLIC_PATHS)[number]): number {
  if (path === "/") return 1;
  if (path === "/landing/calculadora") return 0.9;
  if (!path.includes("/guias/") && SOLUTION_SLUGS.some((slug) => path.endsWith(slug)))
    return 0.8;
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
