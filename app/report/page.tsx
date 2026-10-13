import { LegalShell } from "@/components/legal-shell";
import { ReportForm } from "@/components/report-form";
export const metadata = { title: "Report a page", robots: { index: false } };
export default function Page() {
  return (
    <LegalShell
      title="Something not right?"
      intro="Tell us about a page that may violate the rules."
    >
      <p>
        Include enough detail to help review the concern. For copyright notices, include information
        identifying your work and the content at issue. For emergencies or immediate danger, contact
        the appropriate local authorities.
      </p>
      <ReportForm />
    </LegalShell>
  );
}
