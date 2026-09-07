import type { MetadataRoute } from "next";

/**
 * Crawler policy.
 *
 * Everything here is public documentation of the tools, so crawling is allowed
 * outright — but the sitemap is what actually gets the module pages indexed,
 * and without this file nothing points at it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://ciphervault.local/sitemap.xml",
  };
}
