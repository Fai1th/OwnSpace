import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
export const metadata = { title: "Acceptable use" };
export default function Page() {
  return (
    <LegalShell
      title="A space that respects others."
      intro="Rules for profiles, links, uploads, integrations and use of the service."
    >
      <h2>Publish responsibly</h2>
      <p>
        This policy is part of the <Link href="/terms">terms of use</Link>. It applies to public
        content, drafts, linked destinations and attempts to use Ownspace’s systems. You remain
        responsible for your content and for any permissions needed to publish it.
      </p>
      <ul>
        <li>
          Do not publish or facilitate illegal activity, child sexual abuse or exploitation,
          non-consensual intimate imagery, human trafficking or material that exploits vulnerable
          people.
        </li>
        <li>
          Do not make credible threats, encourage violence, target people with harassment, or
          publish private information without authorization. Do not use hate or dehumanizing abuse
          to attack people based on protected characteristics.
        </li>
        <li>
          Do not impersonate another person or organization, misrepresent affiliation, run scams,
          conduct phishing, or mislead people into giving up money, credentials or personal
          information.
        </li>
        <li>
          Do not distribute malware, dangerous downloads, stolen credentials or instructions
          intended to compromise systems. Links must not conceal a malicious destination.
        </li>
        <li>
          Do not infringe copyright, trademark, publicity or privacy rights. Importing a repository
          or linking a website does not give you permission to copy its content or branding.
        </li>
        <li>
          Do not use the service for spam, deceptive traffic generation or other abusive promotion,
          including activity that evades a prior restriction.
        </li>
      </ul>
      <h2>Protect the service</h2>
      <p>
        Do not bypass authentication, entitlements, rate limits, content validation or other
        safeguards; access someone else’s account or unpublished content; disrupt infrastructure; or
        overload the service. The editor supports bounded content blocks. Attempts to inject
        executable scripts, arbitrary HTML, malicious URLs or unsupported embeds are prohibited.
      </p>
      <p>
        If you find a security issue, stop when you have enough information to describe it. Do not
        access unrelated data or disrupt other users. Report it privately to the operator’s
        published support contact with reproduction details and avoid posting secrets publicly.
      </p>
      <h2>Reports and enforcement</h2>
      <p>
        <Link href="/report">Report a page</Link> with its handle, the specific content or link and
        why it is concerning. Copyright owners can use the{" "}
        <Link href="/copyright">copyright reporting checklist</Link>. Reports are not emergency
        services; for immediate danger, contact the appropriate local authorities.
      </p>
      <p>
        We assess available information and may request context, restrict a link, take content
        offline, suspend publishing or close an account. The response should reflect severity,
        evidence, repetition and risks to people. Urgent risks and legal requirements may require
        immediate action. Where appropriate and legally permitted, affected account holders receive
        an explanation and a way to ask for review.
      </p>
      <h2>Ask for a review</h2>
      <p>
        Use the published support contact, identify the affected page or account, and explain why
        you think the decision was mistaken. Include relevant permissions or corrections. Do not
        create another account to evade a restriction. A report or appeal does not guarantee removal
        or reinstatement, and mandatory legal remedies remain available.
      </p>
    </LegalShell>
  );
}
