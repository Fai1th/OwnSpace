import { siteConfig } from "./config";

/** Increment when material terms change; agreement receipts use this stable version. */
export const LEGAL_VERSION = "2026-10-14";
export const legalDocuments = [
  {
    href: "/terms",
    title: "Terms of use",
    description: "Accounts, publishing, ownership and the service agreement.",
  },
  {
    href: "/privacy",
    title: "Privacy policy",
    description: "Personal information, purposes, retention and your rights.",
  },
  {
    href: "/cookies",
    title: "Cookie policy",
    description: "Browser storage, optional tracking and consent.",
  },
  {
    href: "/acceptable-use",
    title: "Acceptable use",
    description: "Content rules, reporting and fair enforcement.",
  },
  {
    href: "/refunds",
    title: "Payments & refunds",
    description: "The one-time upgrade, purchase problems and mandatory rights.",
  },
  {
    href: "/copyright",
    title: "Copyright & IP",
    description: "Ownership, infringement reports and review requests.",
  },
  {
    href: "/subprocessors",
    title: "Service providers",
    description: "Infrastructure and optional integrations that handle data.",
  },
  {
    href: "/privacy-choices",
    title: "Your privacy choices",
    description: "Tracking preferences, export, deletion and other requests.",
  },
] as const;

export function legalSupportEmail() {
  const value = siteConfig.contact.trim();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) ? value : "";
}

export function pendingLegalDetails() {
  return [
    !siteConfig.operator && "operator’s legal identity",
    !legalSupportEmail() && "support email",
    !siteConfig.address && "business address",
    !siteConfig.jurisdiction && "operator’s country / governing law",
    (!siteConfig.url.startsWith("https://") || /localhost|127\.0\.0\.1/.test(siteConfig.url)) &&
      "public domain",
    !siteConfig.hosting && "hosting provider",
    !siteConfig.database && "database provider",
    !siteConfig.region && "data location",
  ].filter((value): value is string => Boolean(value));
}
