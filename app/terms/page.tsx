import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { siteConfig } from "@/lib/config";
export const metadata = { title: "Terms of use" };
const sections = [
  { id: "agreement", title: "Agreement & accounts" },
  { id: "content", title: "Your content" },
  { id: "premium", title: "Premium & payments" },
  { id: "availability", title: "Service & termination" },
  { id: "disputes", title: "Rights & disputes" },
];
export default function Page() {
  return (
    <LegalShell
      title="Terms of use."
      intro="The agreement for your Ownspace account, editor and published page."
      sections={sections}
    >
      <h2 id="agreement">1. Your agreement with the operator</h2>
      <p>
        Ownspace is a hosted personal page builder. Your agreement is with{" "}
        {siteConfig.operator || "the Ownspace operator, whose legal identity is pending"}. These
        terms include the <Link href="/acceptable-use">acceptable use policy</Link> and{" "}
        <Link href="/refunds">payments and refunds policy</Link>. The{" "}
        <Link href="/privacy">privacy policy</Link> explains data processing; agreeing to these
        terms is not consent to optional tracking.
      </p>
      <p>
        You must be at least {siteConfig.minimumAge}, meet any higher minimum that applies where you
        live, and have legal capacity to enter this agreement. Obtain a parent or guardian’s
        agreement if required by your local law. If you act for an organization, you must be
        authorized to bind it.
      </p>
      <h3>Your account and security</h3>
      <p>
        Provide accurate required information and keep your sign-in methods secure. You are
        responsible for content you submit and activity you authorize. Contact the operator promptly
        if you suspect unauthorized access. Do not share access in a way that compromises other
        people or try to bypass account, payment or security controls.
      </p>
      <h2 id="content">2. You keep ownership of your content</h2>
      <p>
        Your text, images, profile and links remain yours or their respective owners’. You grant the
        operator a non-exclusive, worldwide, royalty-free permission to store, copy, format,
        transmit and display your content only as reasonably needed to operate, secure and deliver
        Ownspace. Publishing instructs us to make your published content publicly accessible. This
        permission does not transfer ownership or authorize unrelated advertising use of your work.
      </p>
      <p>
        The permission ends when your content is removed, except for limited backup copies, required
        legal records and processing needed to complete removal. Visitors or search engines may keep
        their own copies of previously public content. You must have the permissions needed for
        anything you publish, including other people’s names, likenesses, images and personal
        information.
      </p>
      <h3>Ownspace and third-party rights</h3>
      <p>
        The Ownspace name, branding, interface and software belong to their respective rights
        holders. Your use of the editor does not transfer those rights. Open-source components
        remain subject to their own licenses.{" "}
        <Link href="/copyright">Read about copyright and IP concerns</Link>.
      </p>
      <p>
        Pages may link to third-party websites. Their terms and privacy practices apply when you
        visit them. A link on a user page does not mean Ownspace endorses that person, website,
        product or claim. You control which optional integrations you connect and the content you
        choose to import. The editor accepts supported content blocks; arbitrary scripts, executable
        HTML and third-party embeds are not supported.
      </p>
      <h2 id="premium">3. Free pages and the Premium upgrade</h2>
      <p>
        Free and Premium features and limits are described on the{" "}
        <Link href="/pricing">pricing page</Link> and in the editor. Premium is a one-time upgrade
        for the purchasing account, with no recurring subscription. The currency, price and any
        applicable charges must be shown before you confirm payment. A marketing price does not
        override the amount you approve at checkout.
      </p>
      <p>
        When payments are enabled, Stripe handles checkout. Ownspace activates Premium after payment
        is verified, which may take time after you return from checkout. A one-time payment does not
        guarantee that the service will operate forever. Purchased features may evolve, subject to
        the terms shown at purchase and mandatory consumer protections.
      </p>
      <p>
        A verified full refund or payment dispute may remove the related Premium entitlement. A
        payment problem does not transfer ownership of your content to the operator. Billing errors,
        duplicate charges, failed activation and other purchase issues are covered by the{" "}
        <Link href="/refunds">refund policy</Link>.
      </p>
      <h2 id="availability">4. Availability, changes and ending use</h2>
      <p>
        We use reasonable efforts to provide the service, but maintenance, provider outages,
        security incidents and faults may interrupt it. We do not promise uninterrupted access, a
        particular audience or business results. Keep an independent export of content you need.
        Upload limits and supported formats are shown in the editor.
      </p>
      <p>
        You can stop using Ownspace, take a published page offline, delete a page or delete your
        account using Studio Settings. Account deletion removes account-bound access, including
        upgrades. Export first if you want a copy.{" "}
        <Link href="/privacy-choices">See the deletion and export instructions</Link>. Refund and
        statutory rights are considered separately from account deletion.
      </p>
      <p>
        We may restrict content or suspend access when reasonably needed to address a serious or
        repeated policy violation, a security risk, unlawful activity or a legal requirement. Where
        appropriate and legally permitted, we will explain the reason and provide a way to ask for
        review. Urgent risks may require action first. Enforcement should be proportionate to the
        concern and its impact.
      </p>
      <p>
        If we discontinue a paid feature or the service, we will give reasonable notice where
        practicable and provide an opportunity to export, subject to urgent legal or security
        restrictions. Any remedy owed under the purchase agreement or mandatory law remains
        available.
      </p>
      <h2 id="disputes">5. Your legal protections and complaints</h2>
      <p>
        Nothing here excludes liability for fraud, intentional misconduct, or other liability that
        cannot lawfully be limited. Mandatory warranties, consumer remedies and other non-waivable
        rights remain in effect. We do not impose a mandatory arbitration agreement, class-action
        waiver or fixed monetary liability cap in these terms.
      </p>
      {siteConfig.jurisdiction ? (
        <p>
          The laws of {siteConfig.jurisdiction} govern this agreement, subject to mandatory
          protections that apply where you live. These terms do not remove access to a court or
          authority that applicable law makes available to you.
        </p>
      ) : (
        <p>
          The operator’s country and governing-law details are pending. No country, exclusive court
          or legal venue has been selected in this draft.
        </p>
      )}
      <p>
        Contact the operator about account, purchase or policy complaints, describing the issue and
        the outcome you seek. You may also contact a competent consumer, privacy or other authority.
        We will assess rights requests and complaints under the law that applies; this policy does
        not shorten a legal deadline.
      </p>
      <h3>Changes to this agreement</h3>
      <p>
        We may update these terms to reflect service or legal changes. The version at the top
        identifies this document. We will give notice of material changes and seek renewed agreement
        where required, rather than treat optional tracking consent as agreement to a new contract.
        Changes do not retroactively remove accrued rights. If a provision cannot be enforced, the
        remaining provisions continue to apply to the extent permitted by law.
      </p>
    </LegalShell>
  );
}
