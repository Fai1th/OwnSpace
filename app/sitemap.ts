import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { isLaunchBlocked } from "@/lib/deployment";
export default function sitemap(): MetadataRoute.Sitemap {
  if (isLaunchBlocked()) return [];
  return [
    "",
    "/pricing",
    "/legal",
    "/privacy",
    "/terms",
    "/cookies",
    "/acceptable-use",
    "/refunds",
    "/copyright",
    "/subprocessors",
    "/privacy-choices",
  ].map((path) => ({
    url: siteConfig.url + path,
  }));
}
