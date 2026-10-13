import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { siteConfig } from "@/lib/config";
export const metadata = { title: "Privacy" };
export default function Page() {
  return (
    <LegalShell
      title="Your privacy."
      intro="What we collect, why we need it, and the choices you have."
    >
      <h2>Who is responsible</h2>
      <p>
        {siteConfig.operator || "The configured Ownspace operator"} is responsible for personal data
        processed through Ownspace. Our contact and address are below.
      </p>
      <h2>What we process</h2>
      <ul>
        <li>
          Account information supplied to our authentication provider, such as your email, account
          identifier and connected sign-in provider.
        </li>
        <li>
          The profile, links and images you choose to save, plus your draft and published versions.
        </li>
        <li>
          Payment status and transaction identifiers when you buy Premium. Stripe handles payment
          details; Ownspace does not store card numbers.
        </li>
        <li>Your cookie preferences, limited security records, and reports of abusive content.</li>
        <li>
          If you connect GitHub, a connection identifier and the public repositories you choose to
          import. Credentials are managed by Composio.
        </li>
        <li>
          Optional analytics and advertising data only when you consent and the relevant provider is
          enabled.
        </li>
      </ul>
      <h2>How we use it</h2>
      <p>
        We process account and page data to provide the service you request; payment records to
        fulfill purchases and meet accounting obligations; and limited security and moderation data
        to protect the service. Optional analytics and marketing processing relies on your consent.
        We do not sell your profile or account data.
      </p>
      <h2>What becomes public</h2>
      <p>
        Publishing makes your chosen name, bio, images and enabled links accessible to anyone with
        your page address. Public pages may be copied or shared by visitors. Draft changes are
        private until you publish again. Keep personal information you don’t want public out of your
        page.
      </p>
      <h2>Service providers and international transfers</h2>
      <p>
        Authentication uses Clerk. Payments, when enabled, use Stripe. GitHub importing, when
        enabled, uses Composio and GitHub. The operator’s hosting and database providers process
        data to run Ownspace. Google Analytics and Meta Pixel are used only if enabled and after
        optional consent. Providers may process data outside your country. The operator is
        responsible for documenting the deployed providers, applicable transfer safeguards and
        processing agreements before launch.
      </p>
      <h2>Storage and retention</h2>
      <p>
        We keep your account and page while you use the service. Deleting a page removes its active
        draft and publication. Deleting an account also requests deletion from Clerk and removes its
        GitHub connection. Financial records may be retained for the legally required period, with
        the profile association removed where possible. Hosting is provided by{" "}
        {siteConfig.hosting || "the configured hosting provider"}; storage is provided by{" "}
        {siteConfig.database || "the configured database provider"}
        {siteConfig.region && <> in {siteConfig.region}</>}. The operator must configure
        security-log retention to {siteConfig.logDays} days and backup retention to{" "}
        {siteConfig.backupDays} days. Financial records are retained for {siteConfig.financialYears}{" "}
        years where required by applicable law. Cookie preferences expire after 180 days.
      </p>
      <h2>Your choices and rights</h2>
      <p>
        You can edit or unpublish your page, export your saved data, disconnect GitHub, change
        optional cookie preferences, or delete your account in Settings. Depending on your location,
        you may also have rights to access, correct, erase, restrict or object to processing, obtain
        portable data, and complain to a relevant supervisory authority. Contact the operator to
        make a request.
      </p>
      <h2>Optional tracking</h2>
      <p>
        Analytics and marketing are off until you choose them. Rejecting optional cookies does not
        prevent you from using Ownspace. Global Privacy Control keeps optional tracking off.{" "}
        <Link href="/cookies">Read the cookie policy</Link>.
      </p>
      <h2>Age requirement</h2>
      <p>
        Ownspace is intended for users aged {siteConfig.minimumAge} or older, and any higher minimum
        required by local law. Do not create an account if you do not meet that requirement.
      </p>
      <h2>Updates</h2>
      <p>
        We update this policy when the service or its processing changes. Material changes should be
        communicated to affected account holders; the effective date identifies the current version.
      </p>
    </LegalShell>
  );
}
