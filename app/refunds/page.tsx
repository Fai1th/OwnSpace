import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { LegalContact } from "@/components/legal-contact";
export const metadata = { title: "Payments and refunds" };
export default function Page() {
  return (
    <LegalShell
      title="Payments & refunds."
      intro="How the one-time Premium upgrade works, and what to do when a purchase needs attention."
    >
      <h2>One payment for an account upgrade</h2>
      <p>
        Premium is a one-time purchase for the Ownspace account used at checkout. It is not an
        automatically renewing subscription. Review the <Link href="/pricing">features</Link>,
        currency, final price and any disclosed charges before approving payment. A one-time
        purchase does not promise perpetual service or make upgrades transferable to another
        account.
      </p>
      <p>
        Payments are available only when the operator has enabled checkout. Stripe processes the
        payment, and Ownspace activates the entitlement after verifying the payment result.
        Returning from checkout alone is not proof that payment succeeded.
      </p>
      <h2>Missing access, duplicate charges or billing errors</h2>
      <p>
        If a completed payment has not activated Premium, return to the purchasing account and allow
        the verification status to update. Avoid buying a second upgrade to fix a delay. Contact
        support with the purchasing email, approximate date, transaction reference if available, and
        a description of the problem. Never send full card details, a password or a sign-in code.
      </p>
      <p>
        Report duplicate or incorrect charges so they can be investigated. We will assess
        unsuccessful supply, faulty paid functionality and other purchase problems against the
        purchase terms and the consumer protections that apply. No fixed voluntary money-back period
        has been adopted in this draft.
      </p>
      <h2>Cancellation and mandatory consumer rights</h2>
      <p>
        Any statutory cancellation, withdrawal, refund, repair or other remedy available to you
        remains unaffected. Whether a digital service withdrawal period applies, or can end after
        immediate supply, depends on the applicable law and the required checkout disclosures and
        express choices. These terms alone do not waive a right or record consent to lose it. The
        operator must confirm the intended sales markets and implement any required checkout choices
        before accepting purchases.
      </p>
      <h2>What happens after a refund or dispute</h2>
      <p>
        A verified full refund may remove Premium from the purchasing account. A payment dispute may
        also affect the related entitlement while it is resolved. This does not transfer ownership
        of your content. If a remedy requires account or page changes, we will explain them where
        appropriate. Payment processing and bank posting times vary; this policy does not promise a
        specific refund arrival time.
      </p>
      <p>
        Deleting a page or account does not itself submit a refund request. Export content you want
        to keep before deletion and raise any purchase issue separately. There are no recurring
        Ownspace subscription charges to cancel under this one-time upgrade model.
      </p>
      <h2>Request help with a purchase</h2>
      <LegalContact subject="Ownspace purchase / refund request" />
      <p>
        If support is not yet configured, this draft does not offer a working purchase-support
        channel and checkout must remain unavailable. Your rights to contact a payment provider,
        competent consumer authority or court are unaffected.
      </p>
    </LegalShell>
  );
}
