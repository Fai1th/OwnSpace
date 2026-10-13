import { headers } from "next/headers";
import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";
import { siteConfig } from "@/lib/config";
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Ownspace · Your corner of the internet", template: "%s · Ownspace" },
  description:
    "A home for your socials, your work, and the things you’re into. Make a personal page, give it your own look, and share it with one link.",
  icons: { icon: "/brand/mark.svg" },
  openGraph: {
    title: "Ownspace · Your corner of the internet",
    description: "Your links. Your look. Your own space.",
    images: ["/brand/social.svg"],
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
