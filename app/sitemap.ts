import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/pricing", "/privacy", "/terms", "/cookies"].map((path) => ({
    url: siteConfig.url + path,
  }));
}
