import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { isLaunchBlocked } from "@/lib/deployment";
export default function robots(): MetadataRoute.Robots {
  if (isLaunchBlocked()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/editor", "/studio", "/api/", "/sign-in", "/sign-up", "/examples/"],
    },
    sitemap: siteConfig.url + "/sitemap.xml",
  };
}
