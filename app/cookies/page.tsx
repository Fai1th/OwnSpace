import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { siteConfig } from "@/lib/config";
import styles from "@/components/legal.module.css";
export const metadata = { title: "Cookie policy" };
export default function Page() {
  return (
    <LegalShell
      title="Cookies, on your terms."
      intro="Essential storage keeps things working. Analytics and marketing are your choice."
    >
      <h2>Cookies and similar storage</h2>
      <p>
        Cookies are small values stored by your browser and sent to a website. Local storage stays
        in your browser. Ownspace uses both for the purposes below. Optional categories are off
        until you choose them, and rejecting them does not stop editing or publication.
      </p>
      <dl>
        <dt>Essential · Ownspace consent</dt>
        <dd>
          <code>ownspace-consent</code> is a first-party cookie and local-storage record containing
          your category choices, version and update time. It lasts up to 180 days. It remembers your
          choice, including rejection, rather than tracking you for advertising.
        </dd>
        <dt>Essential · Account and security</dt>
        <dd>
          Clerk uses authentication/session cookies when sign-in is configured. Their names and
          lifetimes depend on the configured authentication flow. Hosting or payment services may
          also use necessary security/session storage when you request those features. The final
          provider inventory and durations must be verified before public launch.
        </dd>
        <dt>Functional · Your editor draft</dt>
        <dd>
          The editor saves a browser draft to preserve your work. It is not an advertising
          identifier and has no application-set automatic expiry. Use Studio’s deletion controls or
          clear this site’s browser storage to remove a local copy. Clearing local storage does not
          delete a saved account or published page.
        </dd>
        <dt>Optional · Analytics</dt>
        <dd>
          With analytics consent, Ownspace counts eligible profile views. Google Analytics is{" "}
          {siteConfig.gaId ? "configured" : "not configured"}; it only loads after analytics
          consent. When enabled it may use <code>_ga</code> and related cookies to measure page use.
          Exact provider lifetimes depend on the deployed configuration and must be disclosed before
          enabling it.
        </dd>
        <dt>Optional · Marketing</dt>
        <dd>
          Meta Pixel is {siteConfig.metaPixel ? "configured" : "not configured"}. When configured
          and permitted by marketing consent, it measures advertising-related page visits and may
          set <code>_fbp</code> or <code>_fbc</code>. Exact lifetimes must be verified for the
          deployed setup. No marketing script loads before consent.
        </dd>
      </dl>
      <h2>Choose, reject or withdraw</h2>
      <p>
        Open preferences to enable categories independently or choose “Reject optional” to refuse or
        withdraw both. Consent is specific to this browser/site storage and may need to be set again
        on another device or after storage is cleared. Signing in or agreeing to the terms does not
        opt you into tracking.
      </p>
      <div className={styles.actions}>
        <CookieSettingsButton />
      </div>
      <p>
        When you withdraw, Ownspace disables optional integrations and removes accessible
        first-party tracking cookies. Withdrawal does not undo past lawful processing or
        automatically erase information a provider already received. Use{" "}
        <Link href="/privacy-choices">privacy choices</Link> to request other action. If browser
        storage is blocked, your choice may not persist across visits.
      </p>
      <h2>Global Privacy Control and browser controls</h2>
      <p>
        When a browser exposes or sends Global Privacy Control, Ownspace keeps optional analytics
        and marketing off, including when a previous preference allowed them. This control does not
        turn off necessary account/security storage. You can also block or delete cookies in browser
        settings; blocking essential storage may affect sign-in and saving your preference.
      </p>
      <h2>Links and policy updates</h2>
      <p>
        User pages link to external services rather than automatically loading social embeds.
        Visiting an external link subjects that visit to the other site’s storage practices. We will
        review this inventory when integrations change and seek the required consent before using
        new optional purposes. See the <Link href="/privacy">privacy policy</Link> for processing
        and rights information.
      </p>
    </LegalShell>
  );
}
