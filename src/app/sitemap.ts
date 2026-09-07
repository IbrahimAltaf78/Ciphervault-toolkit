import type { MetadataRoute } from "next";

const BASE = "https://ciphervault.local";

/**
 * Sitemap.
 *
 * Listed by hand rather than crawled from the filesystem, because the list is
 * a decision: the six hubs and the landing page are the pages worth surfacing,
 * while the individual tool routes are variations of their hub and would only
 * dilute it.
 */
const ROUTES = [
  { path: "", priority: 1 },
  { path: "/cryptography", priority: 0.9 },
  { path: "/stego", priority: 0.9 },
  { path: "/steganalysis", priority: 0.9 },
  { path: "/text-hiding", priority: 0.8 },
  { path: "/encoding", priority: 0.8 },
  { path: "/watermark", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${BASE}${route.path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: route.priority,
  }));
}
