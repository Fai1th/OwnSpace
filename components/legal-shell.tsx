import { Navigation } from "./navigation";
import { Footer } from "./footer";
import { siteConfig } from "@/lib/config";
export function LegalShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main id="main" className="legal-page">
        <div className="eyebrow">OWNSPACE · POLICIES</div>
        <h1>{title}</h1>
        <p className="intro">
          {intro}
          <br />
          Effective {siteConfig.termsDate}
        </p>
        {!siteConfig.operator && (
          <p className="notice">
            This is a local preview. The operator’s legal identity and contact details must be
            configured before public launch.
          </p>
        )}
        {children}
        <h2>Contact</h2>
        <p>
          {siteConfig.operator || "The Ownspace operator"}
          {siteConfig.address && <> · {siteConfig.address}</>}
          {siteConfig.contact && (
            <>
              <br />
              <a href={"mailto:" + siteConfig.contact}>{siteConfig.contact}</a>
            </>
          )}
        </p>
      </main>
      <Footer />
    </>
  );
}
