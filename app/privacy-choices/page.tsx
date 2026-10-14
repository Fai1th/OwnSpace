import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { LegalContact } from "@/components/legal-contact";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import styles from "@/components/legal.module.css";
export const metadata = { title: "Your privacy choices" };
export default function Page() {
  return (
    <LegalShell
      title="Your data. Your next step."
      intro="Practical controls for visitors and account holders, plus a route for other privacy requests."
    >
      <h2>Reject or withdraw optional tracking</h2>
      <p>
        You do not need an account. Open cookie choices and select “Reject optional” to turn off
        both analytics and marketing, or save categories independently. This is also how you
        withdraw earlier consent to advertising measurements. Global Privacy Control keeps both
        optional categories off.
      </p>
      <div className={styles.actions}>
        <CookieSettingsButton />
      </div>
      <p>
        This choice applies to this browser’s site storage. Repeat it on other devices if needed. It
        does not erase records already received by a provider.{" "}
        <Link href="/cookies">Read the cookie policy</Link> for storage and withdrawal details. This
        control is available regardless of whether a local law calls an optional advertising use a
        sale, sharing or targeted advertising.
      </p>
      <h2>Export saved Ownspace account data</h2>
      <p>
        Sign in to the account that owns the page, then download the saved data export. It includes
        information held by Ownspace for your account; it is not a complete export of independent
        provider records, full payment-card information or every Clerk identity record. Use the
        request route below for additional access or portable data you are entitled to receive.
      </p>
      <div className={styles.actions}>
        <a className="button secondary small" href="/api/export">
          Download saved Ownspace data
        </a>
        <Link className="button secondary small" href="/studio">
          Open Studio
        </Link>
      </div>
      <p>
        The download requires an active authenticated account and configured account service. If you
        are signed out, open Studio and sign in first. In the local demo, Studio Settings → “Export
        draft” downloads only the current browser draft.
      </p>
      <h2>Edit, unpublish or delete</h2>
      <ol>
        <li>
          Open <Link href="/studio">Studio</Link> and choose <strong>Settings</strong>.
        </li>
        <li>
          Use <strong>Take page offline</strong> to remove a publication while keeping its saved
          draft.
        </li>
        <li>
          Export first if you want to keep content. Under <strong>Delete your space</strong>, type{" "}
          <strong>DELETE</strong> and choose <strong>Delete page</strong> or{" "}
          <strong>Delete account and page</strong>.
        </li>
      </ol>
      <p>
        Page deletion removes the saved profile/publication and related connection. Account deletion
        also requests removal of your Clerk sign-in and removes account-bound access, including
        upgrades. Necessary financial, dispute or legal records may remain. Provider backups follow
        their verified retention schedules; deletion cannot recall copies visitors or search engines
        have made.
      </p>
      <p>
        For a browser-only demo draft, use Studio’s delete control or clear this site’s browser
        storage. Clearing browser storage alone does not remove an online account or public page.
        Deletion does not automatically submit a refund request; see{" "}
        <Link href="/refunds">payments and refunds</Link>.
      </p>
      <h2>Disconnect an integration or correct information</h2>
      <p>
        Edit your profile in Studio and publish again to update the public version. Manage sign-in
        identity details through the account controls. Disconnect GitHub in Studio’s connection
        panel; remove previously imported content separately if you no longer want it on your page.
        Revoking a connection does not delete the source GitHub account.
      </p>
      <h2>Other requests, objections and appeals</h2>
      <p>
        Depending on applicable law, you may request access, correction, erasure, portable data,
        restriction, an objection to processing, an opt-out or review of a previous decision. Tell
        the operator which account or page is involved, what you want to happen and how to contact
        you. Authorized agents should explain their authority. We may ask for proportionate
        verification before exposing or changing account information.
      </p>
      <p>
        Do not send passwords, payment-card numbers or unsolicited identity documents. If you cannot
        access an account, explain that rather than creating a new one to obtain someone else’s
        data. Applicable request deadlines and rights to contact a privacy authority remain in
        effect. No account is required merely to ask about your rights.
      </p>
      <LegalContact subject="Ownspace privacy rights request" />
      <p>
        No privacy request form is submitted by this page. If the support address is pending, the
        operator must establish a working request route before launch. The self-service options
        above remain the routes for configured accounts and browser choices.
      </p>
      <h2>Content published by someone else</h2>
      <p>
        Use <Link href="/report">Report a page</Link> for exposed personal information,
        impersonation or other content concerns. Include the exact page and the affected content,
        while limiting additional personal information. The report route is separate from an
        account-data request.
      </p>
    </LegalShell>
  );
}
