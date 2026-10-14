# Ownspace legal research and launch decisions

Research date: 2026-10-14. Policy version: `2026-10-14` (`lib/legal-content.ts`).

## Purpose and limits

The user asked to build out the legal material based on TermsFeed and Termly. Their public guidance was reviewed to select topics, then original Ownspace-specific text was written. No proprietary generator output, downloadable template text or vendor policy was copied. No vendor signup, paid service or certification was used. These sources do not establish that Ownspace is legally compliant. Final application depends on the operator, actual processing and markets served.

## Guidance reviewed

- [TermsFeed: SaaS terms guide](https://www.termsfeed.com/blog/sample-saas-terms-conditions-template/): informed the coverage checklist for accounts, user content permissions, third-party links, service availability, payments, ending access and visible agreement links. Ownspace is a one-time upgrade product, so recurring-subscription language was not adopted.
- [TermsFeed: privacy guide](https://www.termsfeed.com/blog/sample-privacy-policy-template/): informed the information/purpose/provider/choice structure and visible contact information. Claims about processing were checked against the application rather than inferred from the template.
- [Termly: privacy guide](https://termly.io/resources/templates/privacy-policy-template/): informed separate discussion of public content, retention, requests, children and optional tracking. No blanket claim of GDPR/CCPA applicability or completeness was adopted.
- [Termly: terms guide](https://termly.io/resources/templates/terms-and-conditions-template/): informed the terms/acceptable-use/payment structure and the need to tailor contract terms. No mandatory arbitration, class-action waiver, invented venue or default liability cap was copied.

## Official references reviewed

- [ICO: cookies and similar technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/): supports clear purpose disclosures and an active choice for non-essential storage. The page notes pending guidance updates; this implementation keeps optional categories off regardless of whether a future/local exemption might be available. It is not a determination that UK law applies.
- [European Commission: information for individuals](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en): used as an official rights reference. Rights are described conditionally, with applicable deadlines preserved instead of invented universal deadlines.
- [U.S. Copyright Office: Section 512 resources](https://www.copyright.gov/512/): a U.S. notice-and-takedown framework requires more than a generic report form. No DMCA agent, registration, safe harbor or statutory counter-notice process is claimed. Operator/country decisions must precede jurisdiction-specific procedures.
- [Clerk privacy information](https://clerk.com/legal/privacy): distinguishes customer end-user data governed by customer arrangements from Clerk's own processing. Ownspace requests go to the operator; public policy links do not substitute for a DPA or confirm a processing location.
- [Stripe privacy information](https://stripe.com/privacy): payment providers may have their own roles and legal responsibilities. We describe only application-held payment references/status, not storage of complete card details.
- [Composio privacy information](https://composio.dev/privacy), [GitHub privacy information](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement): supporting references for optional connections. Ownspace's actual public-repository import and connection cleanup were checked against the code.
- [Google privacy information](https://policies.google.com/privacy): linked for the optional configured analytics provider. This is not an assertion of actual deployment settings, cookie lifetimes or a transfer safeguard.
- [Meta privacy link](https://www.facebook.com/privacy/policy/): redirected to login in the research tool; no unseen terms were used as evidence. It remains the provider's standard privacy destination. Deployment-specific pixel settings and lifetimes remain pending verification.

## Code-backed decisions

- `components/cookie-consent.tsx`, `lib/consent.ts` and `lib/browser-consent.ts` implement separate analytics/marketing choices, up to 180-day consent storage, cookie/local-storage fallback, cross-tab sync, Global Privacy Control and withdrawal cleanup. The legal choices page opens the existing panel and tells visitors to choose **Reject optional** to withdraw.
- `app/api/export/route.ts` is the authenticated Ownspace export route. The label is **saved Ownspace account data**, not a promise to export every Clerk/Stripe/provider record. The root integration extends the export to application-held account records without exposing OAuth secrets.
- `components/studio-editor.tsx`, `app/api/account/route.ts` and `lib/account-cleanup.ts` supply profile/account deletion, provider cleanup, local draft export/deletion and GitHub disconnection. Legal pages link to Studio and name the actual Settings actions. No extra destructive action is attached to a policy link.
- `app/api/report/route.ts` stores reports for moderation. A report is not represented as a complete statutory copyright notice or an emergency channel. Copyright reporting has a separate information checklist.
- Provider names, operator name/address, support email, jurisdiction, public domain and data location come from `siteConfig`. Missing values trigger an explicit draft notice even on a hosted preview. No page calls every unconfigured deployment a local preview.
- Contact links are `mailto:` only when a syntactically valid support address is configured. Copy explains that the message must be sent in the email app. No privacy/refund form pretends to deliver a request.
- The policy version is explicit and shared with the root's agreement gate. Terms acceptance and optional tracking consent are separate purposes.

## Facts still needed before a real launch

1. Actual contracting operator identity, country, business/service address, support email and HTTPS domain. Confirm which business details must be displayed in the operator's jurisdiction.
2. Sales countries, customer eligibility/age, legal basis applicability, required consumer disclosures, tax treatment, withdrawal/early-supply choices, and any voluntary refund offering. No fixed money-back window or worldwide waiver is invented.
3. Contracted hosting/database entities and all processing/backup countries; current provider inventory, DPAs, relevant transfers/safeguards and request contacts. Configuration alone does not prove those arrangements.
4. Verified security-log, backup, financial, moderation and rights-request retention schedules, deletion jobs, provider access controls and incident process. The old policy's numeric config defaults were removed as unverified operational promises.
5. Cookie audit for the actual Clerk/Stripe/hosting setup and optional GA/Meta setup, including exact names, purposes and lifetimes before enabling those integrations. Public app IDs are not proof of consent or correct provider settings.
6. A monitored working request/support channel, moderation/review process and any required jurisdiction-specific copyright agent, notice, counter-notice, appeal or response process. The general report feature alone does not supply these.
7. Review the completed policies against the final operation and applicable law. Archive versions and communicate material updates; acceptance receipts are handled by the root integration.

Public service launch is blocked separately by runtime/deployment readiness. These pages are inspectable draft material, not authorization to collect public accounts or accept payments before the missing facts are settled.
