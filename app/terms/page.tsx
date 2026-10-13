import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { siteConfig } from "@/lib/config";
export const metadata = { title: "Terms" };
export default function Page() {
  return (
    <LegalShell
      title="Terms of use."
      intro="The agreement for using your Ownspace account and page."
    >
      <h2>Using Ownspace</h2>
      <p>
        Ownspace provides hosted personal pages and an editor. Your agreement is with{" "}
        {siteConfig.operator || "the configured Ownspace operator"}. You must be at least{" "}
        {siteConfig.minimumAge}, meet any higher local minimum, and have authority to enter this
        agreement. If local law requires a parent or guardian’s agreement, obtain it before using
        the service.
      </p>
      <h2>Your account</h2>
      <p>
        Keep account access secure and provide accurate required information. You are responsible
        for activity you authorize. Do not impersonate another person, interfere with other
        accounts, or try to bypass security or paid feature controls.
      </p>
      <h2>Your content</h2>
      <p>
        You retain ownership of content you upload. You give the operator a limited license to
        store, format and display that content as necessary to provide Ownspace, including making it
        public when you publish. You must have the rights and permissions needed for your images,
        links, names and other content. This license ends when the content is removed, except for
        necessary backups and legally required records.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not publish illegal content, child sexual abuse material, threats, targeted harassment,
        private information without permission, scams, phishing, malware, content that infringes
        intellectual property, or content that impersonates or deceives others. Do not use Ownspace
        to facilitate illegal transactions or exploit vulnerable people. We may restrict or remove
        content and accounts where necessary to protect users, comply with law or enforce these
        terms. <Link href="/report">Report a page</Link> if you believe it violates these rules.
      </p>
      <h2>Free and Premium</h2>
      <p>
        Free includes one page, four styles, up to 20 links and six image cards. Premium adds custom
        accent colors, alternate typography, grid links and removal of Ownspace branding. The price
        and currency are displayed before checkout. Premium is a one-time account upgrade, with no
        recurring subscription. “One-time” does not promise perpetual operation of the service.
        Features may evolve, but changes must respect applicable consumer rights and purchased
        entitlements.
      </p>
      <h2>Payments and refunds</h2>
      <p>
        Stripe processes payments. The checkout amount is authoritative, including any disclosed
        taxes. Premium is activated after verified payment confirmation. If a purchase is fully
        refunded or disputed, the associated paid entitlement may be withdrawn. Contact support
        about billing errors or refund requests. Statutory cancellation, refund and consumer rights
        remain unaffected. Where immediate supply of digital services requires express consent or
        acknowledgment of withdrawal rights, the operator must configure that checkout process
        before selling in the relevant market.
      </p>
      <h2>Availability and limits</h2>
      <p>
        We aim to keep Ownspace available, but maintenance, faults and provider outages may
        interrupt access. Images have upload and size limits shown in the editor. We may apply
        proportionate measures to prevent abuse. Export your content if you need an independent
        copy. We do not promise uninterrupted service, a particular number of visitors, or a
        business outcome.
      </p>
      <h2>Removing your page or account</h2>
      <p>
        You can unpublish a page, delete a page or delete your account in Settings. Account deletion
        removes access to account-bound upgrades. We may suspend accounts for serious or repeated
        violations, and provide an explanation and contact route where appropriate and legally
        permitted.
      </p>
      <h2>External links</h2>
      <p>
        User pages may link to third-party services. Those services have their own terms and privacy
        practices. A user’s link does not imply endorsement by Ownspace.
      </p>
      <h2>Liability and applicable law</h2>
      <p>
        Nothing in these terms excludes liability or rights that cannot lawfully be excluded. Any
        limitation applies only to the extent permitted by applicable law.{" "}
      </p>
      {siteConfig.jurisdiction && (
        <p>
          These terms are governed by the laws of {siteConfig.jurisdiction}, subject to any
          mandatory protections that apply where you live.
        </p>
      )}
      <h2>Changes and complaints</h2>
      <p>
        Material changes to these terms should be communicated before they take effect where
        required. Contact the operator for complaints, purchase issues or policy questions. Your
        right to contact a competent consumer authority or court is unaffected.
      </p>
    </LegalShell>
  );
}
