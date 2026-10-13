import { LegalShell } from "@/components/legal-shell";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
export const metadata = { title: "Cookies" };
export default function Page() {
  return (
    <LegalShell
      title="Cookies, on your terms."
      intro="Essential storage keeps things working. Everything else is your choice."
    >
      <h2>Essential storage</h2>
      <p>
        We store your cookie choice as ownspace-consent in a first-party cookie and browser storage
        for up to 180 days. Authentication cookies from Clerk, when configured, support sign-in and
        security. A local editor draft is stored in your browser when you try the editor without an
        account. Essential storage is not used for advertising.
      </p>
      <h2>Analytics</h2>
      <p>
        Off by default. If you accept analytics, Ownspace may count a limited page view and, if
        enabled by the operator, load Google Analytics. Google may set _ga or related cookies
        according to the configured retention. Analytics help understand use of the service.
        Rejected visitors are not included in Ownspace’s consented page-view counter.
      </p>
      <h2>Marketing</h2>
      <p>
        Off by default. If you accept marketing and Meta Pixel is configured, it can measure
        advertising and set cookies such as _fbp or _fbc. No marketing script is loaded before
        consent. Rejecting marketing does not affect page editing or publication.
      </p>
      <h2>Changing your mind</h2>
      <p>
        Accept or reject optional categories independently. Reopen preferences from any footer or
        your account Settings. On withdrawal, Ownspace disables the optional integration and removes
        accessible first-party tracking cookies. Withdrawal does not erase data already received by
        a provider; contact the operator to exercise applicable deletion rights.
      </p>
      <CookieSettingsButton />
      <h2>Global Privacy Control</h2>
      <p>
        When your browser sends or exposes Global Privacy Control, optional analytics and marketing
        stay off even if a previous choice allowed them.
      </p>
      <h2>External links</h2>
      <p>
        Opening a link on a published profile takes you to a separate service. Its cookie policy
        applies there. Ownspace does not load social embeds on your profile automatically.
      </p>
    </LegalShell>
  );
}
