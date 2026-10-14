import { headers } from "next/headers";
import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";
import { siteConfig } from "@/lib/config";
import { isLaunchBlocked } from "@/lib/deployment";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : siteConfig.url),
  ),
  robots: isLaunchBlocked() ? { index: false, follow: false } : undefined,
  title: { default: "Ownspace · Build your own website", template: "%s · Ownspace" },
  description:
    "Build a website with a visual editor. Arrange content, choose backgrounds and styles, and publish your work, business or project.",
  icons: { icon: "/brand/mark-transparent.png" },
  openGraph: {
    title: "Ownspace · Build your own website",
    description: "A visual website builder with flexible components, backgrounds and publishing.",
    images: ["/brand/logo-dark.png"],
  },
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gpcHeader = (await headers()).get("sec-gpc") === "1";
  return (
    <html lang="en" data-theme="dark">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Providers>
          {children}
          <CookieConsent gpcHeader={gpcHeader} />
        </Providers>
      </body>
    </html>
  );
}
