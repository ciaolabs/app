import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/app-config";
import { source } from "@/lib/source";

// Docs content only changes on deploy; matches the revalidate policy already
// used by the llms.txt route for the same source.
export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, SITE_URL).toString();

  const docsPages = source.getPages().map((page) => ({
    url: url(page.url),
    changeFrequency: "weekly" as const,
    priority: page.url === "/docs" ? 0.8 : 0.6,
  }));

  return [
    {
      url: url("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: url("/surveys"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...docsPages,
  ];
}
