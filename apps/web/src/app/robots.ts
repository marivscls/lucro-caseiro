import type { MetadataRoute } from "next";

import { SITE_URL } from "@/features/landing/site-constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/landing",
      disallow: ["/", "/login", "/ai", "/calendar", "/documents"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
