import Link from "next/link";
import { Navigation } from "./navigation";
import { Footer } from "./footer";
import { LegalContact } from "./legal-contact";
import { LEGAL_VERSION, legalDocuments, pendingLegalDetails } from "@/lib/legal-content";
import styles from "./legal.module.css";

export function LegalShell({
  title,
  intro,
  children,
  sections = [],
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
  sections?: readonly { id: string; title: string }[];
}) {
  const pending = pendingLegalDetails();
  return (
    <>
      <Navigation />
      <main id="main" className={`legal-page ${styles.page}`}>
        <Link href="/legal" className={styles.back}>
          Ownspace / Legal center
        </Link>
        <div className="eyebrow">YOUR SPACE. CLEAR TERMS.</div>
        <h1>{title}</h1>
        <p className="intro">{intro}</p>
        <p className={styles.version}>
          {pending.length ? "Draft version" : "Policy version"} {LEGAL_VERSION}
        </p>
        {pending.length > 0 && (
          <aside className={`notice ${styles.draft}`} aria-label="Draft policy notice">
            <strong>Draft policies · business setup pending</strong>
            <p>
              These documents describe the planned Ownspace service. They are not a finalized launch
              notice. Still to be confirmed: {pending.join(", ")}. Public accounts, publishing and
              purchases must remain unavailable until setup and policy review are complete.
            </p>
          </aside>
        )}
        {sections.length > 0 && (
          <nav className={styles.contents} aria-label="On this page">
            <strong>On this page</strong>
            <ul>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <article>{children}</article>
        <section className={styles.contact} aria-labelledby="legal-contact">
          <h2 id="legal-contact">Contact the operator</h2>
          <LegalContact />
        </section>
        <nav className={styles.related} aria-label="Legal documents">
          <strong>More from the legal center</strong>
          <ul>
            {legalDocuments.map((document) => (
              <li key={document.href}>
                <Link href={document.href}>{document.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <Footer />
    </>
  );
}
