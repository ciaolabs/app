import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/app-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/app/",
        "/api/",
        "/sign-in",
        "/callback",
        "/dashboard",
        // Legacy redirect stubs (see next.config.ts's /chat -> /app redirect
        // for the same pattern) and the interactive, per-draft survey forms —
        // none of these are content pages worth crawling.
        "/survey",
        "/personalitysurvey",
        "/surveys/personality",
        "/surveys/values-beliefs",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
