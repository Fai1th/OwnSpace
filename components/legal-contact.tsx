import { siteConfig } from "@/lib/config";
import { legalSupportEmail } from "@/lib/legal-content";

export function LegalContact({ subject = "Ownspace policy question" }: { subject?: string }) {
  const email = legalSupportEmail();
  return (
    <>
      <p>
        <strong>{siteConfig.operator || "Operator legal identity pending"}</strong>
        <br />
        {siteConfig.address || "Business address pending"}
        <br />
        {siteConfig.jurisdiction || "Operator’s country / governing law pending"}
      </p>
      {email ? (
        <p>
          <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>{email}</a>
          <br />
          This opens your email app. Send the message there; clicking the link does not submit a
          request.
        </p>
      ) : (
        <p>
          Support email is not configured. An email request cannot be sent from this site yet.
          Account export, deletion and browser tracking choices are described on the privacy choices
          page. A working support contact must be published before launch.
        </p>
      )}
    </>
  );
}
