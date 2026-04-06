import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/articles`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  let articlePages: MetadataRoute.Sitemap = [];

  try {
    const backendUrl = process.env.INTERNAL_API_URL || "http://backend:5001";
    const articlesRes = await fetch(`${backendUrl}/api/v1/articles?per_page=100`, {
      next: { revalidate: 3600 },
    });
    if (articlesRes.ok) {
      const data = await articlesRes.json();
      articlePages = (data.items || []).map((a: { slug: string; updated_at: string }) => ({
        url: `${SITE_URL}/articles/${a.slug}`,
        lastModified: new Date(a.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {}

  return [...staticPages, ...articlePages];
}
