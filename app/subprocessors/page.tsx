import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { siteConfig } from "@/lib/config";
import styles from "@/components/legal.module.css";
export const metadata = { title: "Service providers and subprocessors" };
export default function Page() {
  return (
    <LegalShell
      title="The services behind your space."
      intro="A provider register for infrastructure, account access and optional features."
    >
      <p>
        This register describes provider roles in the Ownspace implementation. An optional
        integration is used only when configured and requested or consented to as described below.
        It is not a signed data processing agreement, a claim that every provider is a subprocessor
        in every context, or proof of a provider’s compliance status.
      </p>
      <h2>Infrastructure and account services</h2>
      <section className={styles.provider}>
        <h3>Hosting · {siteConfig.hosting || "provider pending"}</h3>
        <p>
          Serves the app and public pages and handles network requests, technical/security logs and
          deployed application data. The provider’s legal entity, processing countries, contract and
          verified log/backup schedule must be confirmed for launch.
        </p>
      </section>
      <section className={styles.provider}>
        <h3>Database · {siteConfig.database || "provider pending"}</h3>
        <p>
          Hosted PostgreSQL stores saved profiles, publications, entitlement/payment references,
          connections, reports and necessary account records. Deployment region:{" "}
          {siteConfig.region || "pending"}. Backup locations, retention and transfer safeguards
          require confirmation.
        </p>
      </section>
      <section className={styles.provider}>
        <h3>Clerk · account authentication</h3>
        <p>
          {siteConfig.authEnabled
            ? "Public authentication configuration is present."
            : "Public authentication configuration is not present."}{" "}
          When enabled, Clerk processes account identifiers, sign-in/contact information, sessions
          and related security data. Ownspace links saved data to the account identifier. Clerk-held
          identity information is not all included in the Ownspace export.
        </p>
        <a href="https://clerk.com/legal/privacy">Clerk privacy information</a>
      </section>
      <h2>Optional feature providers</h2>
      <section className={styles.provider}>
        <h3>Stripe · checkout and payment handling</h3>
        <p>
          Used when payments are enabled and you purchase Premium. Processes transaction and payment
          information; Ownspace receives payment references/status and purchase entitlement
          information. Stripe may have independent responsibilities for fraud prevention and
          financial obligations.
        </p>
        <a href="https://stripe.com/privacy">Stripe privacy information</a>
      </section>
      <section className={styles.provider}>
        <h3>Composio and GitHub · repository importing</h3>
        <p>
          Used when integration is enabled and you authorize a GitHub connection. Composio manages
          the connection/authorization. Ownspace imports selected public repository information and
          keeps the connection identifier. GitHub is the source service and may act independently
          for its own account operations.
        </p>
        <a href="https://composio.dev/privacy">Composio privacy information</a> ·{" "}
        <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
          GitHub privacy information
        </a>
      </section>
      <section className={styles.provider}>
        <h3>Google Analytics · optional measurement</h3>
        <p>
          {siteConfig.gaId ? "Configured" : "Not configured"}. Loads only with analytics consent and
          without an overriding Global Privacy Control signal. May process page visits,
          browser/device information and online identifiers.
        </p>
        <a href="https://policies.google.com/privacy">Google privacy information</a>
      </section>
      <section className={styles.provider}>
        <h3>Meta Pixel · optional advertising measurement</h3>
        <p>
          {siteConfig.metaPixel ? "Configured" : "Not configured"}. Loads only with marketing
          consent and without an overriding Global Privacy Control signal. May process page visits,
          advertising identifiers and associated browser information.
        </p>
        <a href="https://www.facebook.com/privacy/policy/">Meta privacy information</a>
      </section>
      <h2>Locations, contracts and changes</h2>
      <p>
        Provider processing may take place internationally. Before launch, the operator must confirm
        the actual contracted legal entities, countries, data processing agreements and any required
        transfer safeguards, and complete the missing infrastructure details above. A provider’s
        public privacy page alone does not establish those arrangements for Ownspace.
      </p>
      <p>
        We will update this register when deployed providers or purposes change. Material privacy
        changes will be communicated as required by the applicable law or agreement. For information
        about your data or safeguards, use the published operator contact. You can manage optional
        integrations and tracking using <Link href="/privacy-choices">privacy choices</Link>.
      </p>
    </LegalShell>
  );
}
