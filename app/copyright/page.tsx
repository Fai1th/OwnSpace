import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { LegalContact } from "@/components/legal-contact";
export const metadata = { title: "Copyright and intellectual property" };
export default function Page() {
  return (
    <LegalShell
      title="Respect the work behind it."
      intro="Ownership, permission and a practical route to report intellectual property concerns."
    >
      <h2>Your work stays yours</h2>
      <p>
        Publishing on Ownspace does not transfer your copyright. You give the operator the limited
        permission needed to host and display content, as explained in the{" "}
        <Link href="/terms">terms</Link>. Upload only work you own, have licensed or otherwise have
        a legal right to use. Other people’s rights, open-source licenses and permitted legal
        exceptions still apply.
      </p>
      <h2>Report suspected infringement</h2>
      <p>
        If you are a rights holder or authorized representative, send the operator enough
        information to identify the issue. For a general report, the{" "}
        <Link href="/report">report form</Link> can record a page concern, but it is not represented
        as a complete statutory copyright notice or counter-notice process.
      </p>
      <ul>
        <li>
          Your name, contact information and whether you own the rights or represent the owner.
        </li>
        <li>
          A description of the protected work or trademark and a reference that identifies it.
        </li>
        <li>The exact Ownspace page address and the specific image, text or link at issue.</li>
        <li>
          Why you believe the use is unauthorized, taking account of any license or legal exception
          you know about.
        </li>
        <li>
          The action requested and information that helps us check the claim. Include a signature
          and any statements required by the legal process that applies to your notice.
        </li>
      </ul>
      <p>
        Send only necessary personal information. We may need to share relevant allegations and
        contact details with the affected uploader or appropriate authorities where needed for
        review or a required legal process. Knowingly false or abusive reports can harm others and
        may have legal consequences.
      </p>
      <LegalContact subject="Ownspace copyright / IP concern" />
      <h2>Review and response</h2>
      <p>
        We may seek clarification, restrict disputed content or notify the uploader, depending on
        the information and applicable law. Where permitted, an uploader can explain permission,
        ownership, mistaken identification or a legal exception and request review using the
        published support contact. A general request for review is not automatically a statutory
        counter-notification.
      </p>
      <p>
        Repeated or serious infringement can lead to account restrictions or termination under the
        acceptable use policy. We do not promise that every claim results in removal, or that every
        challenge results in reinstatement.
      </p>
      <h2>Jurisdiction-specific procedures are pending</h2>
      <p>
        The operator’s country has not been finalized. This page does not claim a registered U.S.
        DMCA agent, safe-harbor qualification or a jurisdiction-specific notice/counter-notice
        deadline. Before launch, the operator must determine which procedures, agent registrations,
        notice elements, appeal rights and response timelines apply and publish the appropriate
        details.
      </p>
      <p>
        See the{" "}
        <a href="https://www.copyright.gov/512/">U.S. Copyright Office’s Section 512 resources</a>{" "}
        for the official U.S. framework. Whether it applies to a particular service depends on facts
        and legal requirements; this reference is not a claim that Ownspace qualifies.
      </p>
    </LegalShell>
  );
}
