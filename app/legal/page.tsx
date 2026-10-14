import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { legalDocuments } from "@/lib/legal-content";
import styles from "@/components/legal.module.css";
export const metadata = { title: "Legal center" };
export default function Page() {
  return (
    <LegalShell
      title="A clear place for the details."
      intro="Your content, your account and your choices. Find the policies that explain how Ownspace works."
    >
      <h2>Start here</h2>
      <p>
        The terms cover your agreement with the operator. The privacy and cookie policies explain
        data use. The remaining pages cover specific rules and practical ways to get help.
      </p>
      <ul className={styles.cards}>
        {legalDocuments.map((document) => (
          <li key={document.href}>
            <Link href={document.href}>{document.title}</Link>
            <p>{document.description}</p>
          </li>
        ))}
      </ul>
      <h2>Need to take action?</h2>
      <p>
        <Link href="/privacy-choices">Manage privacy choices</Link> for export, deletion and
        tracking preferences. Use <Link href="/report">Report a page</Link> for content concerns.
        Copyright notices have a separate <Link href="/copyright">information checklist</Link>.
      </p>
      <h2>About these documents</h2>
      <p>
        These are original policies tailored to Ownspace. TermsFeed and Termly’s public guidance
        informed the topics considered; neither company generated, approved or certified these
        documents. Final details depend on the operator, markets served and deployed providers.
      </p>
    </LegalShell>
  );
}
