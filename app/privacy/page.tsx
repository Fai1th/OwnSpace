import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { siteConfig } from "@/lib/config";
export const metadata = { title: "Privacy policy" };
const sections = [
  { id: "scope", title: "Who & what" },
  { id: "information", title: "Information & purposes" },
  { id: "sharing", title: "Sharing & providers" },
  { id: "retention", title: "Storage & security" },
  { id: "rights", title: "Your rights" },
];
export default function Page() {
  return (
    <LegalShell
      title="Your privacy."
      intro="What Ownspace processes, why it is needed and the choices available to you."
      sections={sections}
    >
      <h2 id="scope">1. Who is responsible and what this covers</h2>
      <p>
        {siteConfig.operator || "The Ownspace operator (legal identity pending)"} is responsible for
        personal information processed to run Ownspace. This policy covers visitors, account holders
        and people who contact or report content to us. Contact details appear below. Third-party
        websites linked from profiles have their own policies. A page owner is responsible for the
        content and personal information they choose to publish.
      </p>
      <h2 id="information">2. Information and purposes</h2>
      <dl>
        <dt>Account and authentication</dt>
        <dd>
          When you sign up or sign in through Clerk, account identifiers, your email and the sign-in
          information you provide are processed to create, secure and manage access. A connected
          sign-in provider may supply information you authorize it to share. Ownspace uses your
          account identifier to associate saved pages and purchases with you. When you accept the
          terms and confirm eligibility, Ownspace records the terms version and acceptance time to
          document that agreement; this is separate from optional tracking consent.
        </dd>
        <dt>Drafts, published pages and uploads</dt>
        <dd>
          We store the content you save, including profile text, links, images, layout and
          draft/published versions, to provide the builder and hosting. Browser storage can hold an
          editor draft. Publishing makes your chosen profile content available to visitors; saving a
          draft alone does not publish it.
        </dd>
        <dt>Purchases</dt>
        <dd>
          When enabled, Stripe processes payment details. Ownspace stores transaction references,
          payment status and account entitlement to activate purchases, handle refunds and disputes,
          and keep necessary financial records. Ownspace does not store full payment-card numbers.
        </dd>
        <dt>Optional connections</dt>
        <dd>
          If you choose GitHub importing, Composio manages the authorized connection. Ownspace uses
          a connection identifier and the public repository information you choose to import.
          Connecting is optional. You can disconnect in Studio; this does not undo content already
          imported or delete your GitHub account.
        </dd>
        <dt>Security, reports and support</dt>
        <dd>
          Service requests expose technical information such as IP address and browser/request
          details to the hosting infrastructure. Limited security and rate-limit records help
          prevent misuse. Reports contain the page identifier, reason and details you submit.
          Support correspondence contains what you send. We use these to investigate issues,
          moderate content, respond and meet applicable obligations. Do not include passwords or
          full payment-card details in reports.
        </dd>
        <dt>Optional measurements</dt>
        <dd>
          With analytics consent, Ownspace can increment a published page’s view count. Configured
          Google Analytics may process page visits, device/browser information and identifiers.
          Configured Meta Pixel may process page visits and advertising identifiers with marketing
          consent. Both categories start off. See the <Link href="/cookies">cookie policy</Link> for
          choices and storage details.
        </dd>
      </dl>
      <h3>Processing grounds where required</h3>
      <p>
        Where the applicable law requires a legal basis, the intended grounds are performing the
        account or purchase agreement for requested services; complying with applicable legal
        obligations for required records; legitimate interests in proportionate security, fraud
        prevention and resolving concerns, balanced against your rights; and consent for optional
        analytics and marketing. The operator must confirm the applicable grounds for its location
        and target markets before launch. Optional tracking consent is separate from account or
        terms acceptance.
      </p>
      <h2 id="sharing">3. Public information, sharing and providers</h2>
      <p>
        When you publish, anyone with the address can view your selected public content. Visitors
        and search engines may copy, index or redistribute it. Unpublishing stops Ownspace serving
        that publication but cannot remove copies held elsewhere. Avoid publishing sensitive
        information about yourself or others.
      </p>
      <p>
        We use providers to authenticate users, run infrastructure and, when enabled, process
        payments or connections. See the{" "}
        <Link href="/subprocessors">service provider register</Link> for their roles and the
        deployment details still pending. Providers receive information needed for their role; a
        payment provider may also process information for its own fraud prevention or legal
        responsibilities.
      </p>
      <p>
        We may disclose information when legally required, to address fraud or a safety/security
        concern, or to establish, exercise or defend legal rights. A business transfer may involve
        necessary records, subject to applicable privacy protections and notice requirements.
        Ownspace does not sell profile or account data for money. Optional advertising integrations
        may be treated as sharing or targeted advertising under some laws; you can keep them off or
        withdraw consent in <Link href="/privacy-choices">privacy choices</Link>.
      </p>
      <h3>International processing</h3>
      <p>
        Providers may process information outside your country. The deployed hosting/database
        locations, provider agreements and any required transfer safeguards must be confirmed by the
        operator before launch. We do not claim that a particular transfer mechanism or
        certification covers an unconfirmed deployment. Contact the operator for the safeguards
        applicable to your information.
      </p>
      <h2 id="retention">4. Storage, retention and security</h2>
      <p>
        Saved account and page information is kept while needed to provide your account. Deleting a
        page removes its active draft and publication. Account deletion also requests deletion of
        the Clerk identity and the connected GitHub integration. Payment, dispute, security and
        legal records may need to remain for a separate, justified period; they should be limited to
        what is necessary and separated from your profile where possible.
      </p>
      <p>
        Backup and infrastructure-log deletion follow the deployed providers’ verified schedules.
        Those schedules and the financial-record retention period are pending operator confirmation;
        application configuration values alone do not prove provider deletion. We do not promise
        immediate erasure from backups. Browser consent choices expire after up to 180 days; browser
        drafts remain until you remove them or clear site storage.
      </p>
      <p>
        We use access controls, authenticated account actions and validation to protect information.
        No internet service can guarantee absolute security. Keep your sign-in methods secure and
        use the published support contact for suspected account compromise. If applicable law
        requires breach notification, the operator must provide it.
      </p>
      <h2 id="rights">5. Choices, requests and complaints</h2>
      <p>
        You can edit content, unpublish, export saved Ownspace account data, disconnect GitHub,
        delete an account and change optional tracking choices.{" "}
        <Link href="/privacy-choices">
          Open privacy choices for the actual controls and instructions
        </Link>
        . Exported Ownspace data does not include every record held independently by Clerk, Stripe
        or another provider.
      </p>
      <p>
        Depending on the law that applies, you may have rights to access, correct or erase
        information, receive portable data, restrict processing, object to certain uses, withdraw
        consent, opt out of sale/sharing or targeted advertising, appeal a decision, or complain to
        a competent privacy authority. These rights can have lawful limits. We may need
        proportionate verification or authorization before disclosing or deleting information; do
        not send identity documents unless a secure, necessary process is arranged. Requests will be
        handled within applicable legal deadlines without retaliation for exercising protected
        rights.
      </p>
      <p>
        Ownspace does not use profile content to make automated decisions with legal or similarly
        significant effects. Automated validation, rate limits and security checks protect the
        service; contact the operator if a restriction needs review.
      </p>
      <h3>Age and updates</h3>
      <p>
        Ownspace is intended for people aged {siteConfig.minimumAge} or older, subject to any higher
        local minimum. Contact the operator if you believe an ineligible child’s information has
        been provided so it can be assessed and removed where appropriate.
      </p>
      <p>
        We will update this policy when processing changes. The version above identifies this text;
        material changes will be communicated as required, and new optional purposes will require
        the appropriate choice before activation.
      </p>
    </LegalShell>
  );
}
